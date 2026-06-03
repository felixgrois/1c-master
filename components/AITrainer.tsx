
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Send, Loader2, BrainCircuit, MessageSquare, Trophy, AlertCircle, RefreshCw, CheckCircle2, X, Database, Check, Volume2, Square } from 'lucide-react';
import { UserRole, UserSpecialization, KBItem } from '../types';
import { SPEC_LABELS } from '../constants';
import { generateBusinessSituation, evaluateSituationResponse, EvaluationResult, getIdealSolution, generateSpeech } from '../services/geminiService';
import { pcmToWav } from '../services/utils';
import { motion, AnimatePresence } from 'motion/react';
import VoiceSpectrum from './VoiceSpectrum';
import MicrophonePermissionButton from './MicrophonePermissionButton';
import MarkdownRenderer from './MarkdownRenderer';
import CharacterAvatar from './CharacterAvatar';

interface AITrainerProps {
  role?: UserRole;
  specialization?: UserSpecialization;
  kbItems: KBItem[];
  userDifficulty?: number;
  onComplete: (xp: number, difficultyReached?: number) => void;
  onClose: () => void;
  isGuest?: boolean;
  guestSituations?: number;
  onSituationGenerated?: () => void;
  isAdmin?: boolean;
  onUpdateKB?: (updatedKB: KBItem[] | ((prev: KBItem[]) => KBItem[])) => void;
}

const AITrainer: React.FC<AITrainerProps> = ({ 
  role, 
  specialization, 
  kbItems, 
  userDifficulty = 1,
  onComplete, 
  onClose,
  isGuest = false,
  guestSituations = 0,
  onSituationGenerated,
  isAdmin = false,
  onUpdateKB
}) => {
  const [situation, setSituation] = useState<string | null>(null);
  const [gradation, setGradation] = useState<'Developer' | 'User'>('Developer');
  const [selectedSolution, setSelectedSolution] = useState<UserSpecialization>(specialization || UserSpecialization.DEVELOPER);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(userDifficulty);
  const [isAdaptive, setIsAdaptive] = useState(true);
  const [userResponse, setUserResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGettingSolution, setIsGettingSolution] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showMicPrompt, setShowMicPrompt] = useState(false);

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    setMicError(null);
    const confirmed = localStorage.getItem('microphone_permission_confirmed') === 'true';
    if (!confirmed) {
      setShowMicPrompt(true);
    } else {
      startListening();
    }
  };

  const handleConfirmMic = () => {
    setShowMicPrompt(false);
    localStorage.setItem('microphone_permission_confirmed', 'true');
    startListening();
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editedExplanation, setEditedExplanation] = useState('');
  const [isSavingToKB, setIsSavingToKB] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isIntroSpeaking, setIsIntroSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [reactionType, setReactionType] = useState<'SUCCESS' | 'FAILURE' | 'NEUTRAL'>('NEUTRAL');
  const [situationAudio, setSituationAudio] = useState<string | null>(null);
  const [explanationAudio, setExplanationAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRequestCount = useRef(0);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const phrases = [
    "Сейчас подберу интересную ситуацию...",
    "Давайте посмотрим, какой кейс вам достанется...",
    "Минутку, готовлю задание...",
    "Сейчас придумаю что-нибудь интересное...",
    "Одну секунду, формирую бизнес-ситуацию..."
  ];

  const stopSpeaking = () => {
    speechRequestCount.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsIntroSpeaking(false);
  };

  const startListening = () => {
    if (isListening) return;
    setMicError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Ваш браузер не поддерживает голосовой ввод.");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setUserResponse(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'aborted') {
            console.log("Speech recognition aborted");
          } else if (event.error === 'not-allowed') {
            setMicError("Доступ к микрофону запрещен. Пожалуйста, разрешите доступ в настройках браузера (иконка замочка в адресной строке) и обновите страницу.");
          } else if (event.error === 'no-speech') {
            console.log("No speech detected");
          } else if (event.error === 'network') {
            setMicError("Ошибка сети при распознавании речи. Пожалуйста, проверьте интернет-соединение или попробуйте еще раз позже.");
          } else {
            console.error("Speech recognition error", event.error);
            setMicError(`Ошибка микрофона: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      })
      .catch((err: any) => {
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes('Requested device not found')) {
          setMicError("Микрофон не обнаружен. Пожалуйста, подключите устройство ввода.");
        } else if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          setMicError("Доступ к микрофону запрещен. Нажмите на иконку замочка в адресной строке (слева от URL) и переключите 'Микрофон' в положение 'Разрешить'. Если Вы в режиме предпросмотра, используйте кнопку 'Open in new tab' в углу экрана.");
        } else {
          console.error("Microphone access error:", err);
          setMicError("Произошла ошибка при доступе к микрофону.");
        }
      });
  };

  const handleGenerateSituation = async () => {
    if (isGuest && guestSituations >= 5) {
      setError('Вы достигли лимита в 5 ситуаций для гостевого режима. Пожалуйста, зарегистрируйтесь для неограниченного доступа.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setEvaluation(null);
    setUserResponse('');
    setIsEditing(false);
    setSaveSuccess(false);
    setSituationAudio(null);
    setExplanationAudio(null);
    setReactionType('NEUTRAL');
    try {
      const finalSpec = gradation === 'User' ? selectedSolution : specialization;
      const difficultyToUse = isAdaptive ? userDifficulty : selectedDifficulty;
      const newSituation = await generateBusinessSituation(role, finalSpec, gradation, difficultyToUse, kbItems);
      setSituation(newSituation);
      if (onSituationGenerated) onSituationGenerated();
      
    } catch (err: any) {
      setError(err?.message || 'Не удалось сгенерировать ситуацию. Попробуйте еще раз.');
    } finally {
      setIsGenerating(false);
      // Stop the intro message after generation is done
      setTimeout(() => setIsIntroSpeaking(false), 2000);
    }
  };

  const handleEvaluate = async () => {
    if (!situation || !userResponse.trim()) return;

    setIsEvaluating(true);
    setError(null);
    setIsEditing(false);
    setSaveSuccess(false);
    setExplanationAudio(null);
    try {
      const finalSpec = gradation === 'User' ? selectedSolution : specialization;
      const result = await evaluateSituationResponse(situation, userResponse, role, finalSpec);
      setEvaluation(result);
      setEditedExplanation(result.explanation);
      setReactionType(result.isExcellent ? 'SUCCESS' : 'FAILURE');
      
      if (result.isExcellent) {
        onComplete(100, isAdaptive ? Math.min(5, userDifficulty + 1) : selectedDifficulty);
      } else if (result.score > 50) {
        onComplete(50, isAdaptive ? userDifficulty : selectedDifficulty);
      } else {
        onComplete(10, isAdaptive ? Math.max(1, userDifficulty - 1) : selectedDifficulty);
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось оценить ответ. Попробуйте еще раз.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGetSolution = async () => {
    if (!situation) return;

    setIsGettingSolution(true);
    setError(null);
    setIsEditing(false);
    setSaveSuccess(false);
    setExplanationAudio(null);
    try {
      const finalSpec = gradation === 'User' ? selectedSolution : specialization;
      const result = await getIdealSolution(situation, role, finalSpec);
      setEvaluation(result);
      setEditedExplanation(result.explanation);

      // No XP for just asking for solution
    } catch (err: any) {
      setError(err?.message || 'Не удалось получить решение. Попробуйте еще раз.');
    } finally {
      setIsGettingSolution(false);
    }
  };

  const handleSaveToKB = async () => {
    if (!situation || !onUpdateKB) return;
    
    setIsSavingToKB(true);
    try {
      const newItem: KBItem = {
        id: `case-${Date.now()}`,
        title: `Кейс: ${situation.substring(0, 40)}...`,
        content: `### Бизнес-ситуация\n\n${situation}\n\n### Рекомендуемое решение\n\n${editedExplanation}`,
        tags: ['кейс', gradation.toLowerCase()],
        created_at: new Date().toISOString()
      };
      
      onUpdateKB(prev => [newItem, ...prev]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Не удалось сохранить в базу знаний.');
    } finally {
      setIsSavingToKB(false);
    }
  };

  return (
    <>
      {/* Desktop side fixed avatar */}
      <div className="hidden lg:block">
        <CharacterAvatar 
          isVisible={true} 
          isSpeaking={isSpeaking}
          type="max"
          position="left"
          hasSidebar={true}
          contentWidth="56rem"
          reactionType={reactionType}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Compact, elegant assistance banner for mobile & tablet (avoiding floating overlaps) */}
        <div className="block lg:hidden w-full bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-3.5 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-white border border-sky-200">
              <CharacterAvatar
                isVisible={true}
                isSpeaking={isSpeaking}
                type="max"
                isInline={true}
                reactionType={reactionType}
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-800 leading-normal uppercase tracking-tight">
                {isSpeaking 
                  ? "Я озвучиваю ситуацию и твой ответ! Слушай меня внимательно."
                  : (situation 
                    ? "Изучи ситуацию ниже и дай свой развернутый ответ устно или письменно!" 
                    : "Привет! Я твой наставник Макс. Давай порепетируем решение реальных бизнес-кейсов в 1С!")
                }
              </p>
            </div>
          </div>
        </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ИИ бизнес-тренер</h1>
            <p className="text-gray-500">Ролевая игра: отработка бизнес-ситуаций</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!situation && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setIsAdaptive(true)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      isAdaptive ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Адаптивно
                  </button>
                  <button
                    onClick={() => setIsAdaptive(false)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      !isAdaptive ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Вручную
                  </button>
                </div>

                {!isAdaptive && (
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(parseInt(e.target.value))}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-white border border-gray-200 text-gray-600 focus:border-indigo-500 transition-all"
                  >
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>Сложность {d}</option>
                    ))}
                  </select>
                )}

                {gradation === 'User' && (
                  <select
                    value={selectedSolution}
                    onChange={(e) => setSelectedSolution(e.target.value as UserSpecialization)}
                    className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase bg-white border border-gray-200 text-gray-600 focus:border-indigo-500 focus:ring-0 transition-all"
                  >
                    {Array.from(new Set(Object.values(UserSpecialization))).map((spec) => (
                      <option key={spec} value={spec}>
                        {SPEC_LABELS[spec] || spec}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setGradation('Developer')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      gradation === 'Developer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    ИТ-специалист
                  </button>
                  <button
                    onClick={() => setGradation('User')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      gradation === 'User' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Пользователь
                  </button>
                </div>
              </div>
              <button
                onClick={handleGenerateSituation}
                disabled={isGenerating || (isGuest && guestSituations >= 5)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGuest && guestSituations >= 5 ? 'Лимит исчерпан' : 'Сгенерировать ситуацию'}
              </button>
            </div>
          )}
          <button 
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase hover:bg-gray-200 transition-all border border-gray-200"
          >
            <span>На главную</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {situation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none z-0">
                <MessageSquare className="w-24 h-24" />
              </div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Бизнес-ситуация
                </h2>
              </div>
              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
                <MarkdownRenderer content={situation} />
              </div>
            </div>

            {!evaluation && (
              <div className="space-y-4">
                {micError && (
                  <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start space-x-3 animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-red-800">{micError}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 text-[10px] font-black text-red-600 uppercase underline hover:text-red-700 transition-colors"
                      >
                        Обновить страницу
                      </button>
                    </div>
                    <button onClick={() => setMicError(null)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Ваш ответ</label>
                  <div className="flex items-center space-x-3">
                    <VoiceSpectrum isListening={isListening} />
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Опишите ваши действия в этой ситуации..."
                    className="w-full h-48 p-6 bg-white border-2 border-gray-100 rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all resize-none text-gray-700 text-lg shadow-sm"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <button
                      onClick={handleMicClick}
                      className={`p-3 rounded-full transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={isListening ? "Слушаю..." : "Голосовой ввод"}
                    >
                      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating || isGettingSolution || !userResponse.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-100"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Оцениваем...
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        Оценить ответ
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleGetSolution}
                    disabled={isEvaluating || isGettingSolution}
                    className="px-6 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50"
                  >
                    {isGettingSolution ? <Loader2 className="w-6 h-6 animate-spin" /> : "Не знаю решения"}
                  </button>
                  <button
                    onClick={handleGenerateSituation}
                    disabled={isEvaluating || isGenerating || isGettingSolution}
                    className="p-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl hover:bg-gray-50 transition-all"
                    title="Другая ситуация"
                  >
                    <RefreshCw className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {evaluation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className={`p-8 rounded-3xl border-2 ${
                  evaluation.isExcellent ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        evaluation.score > 0 
                          ? (evaluation.isExcellent ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {evaluation.score > 0 
                          ? (evaluation.isExcellent ? <Trophy className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />)
                          : <BrainCircuit className="w-8 h-8" />
                        }
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-wider opacity-60 mb-1">
                          {evaluation.score > 0 ? "Оценка тренера" : "Совет тренера"}
                        </div>
                        {evaluation.score > 0 && <div className="text-3xl font-black">{evaluation.score}/100</div>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">Реакция тренера:</h3>
                      <div className="text-lg italic text-gray-700">
                        <MarkdownRenderer content={`"${evaluation.reaction}"`} />
                      </div>
                    </div>
                    
                    <div className="p-6 bg-white/50 rounded-2xl border border-white relative group">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-900">Как следовало поступить:</h3>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <button
                              onClick={() => setIsEditing(!isEditing)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                            >
                              {isEditing ? 'Отмена' : 'Редактировать'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-700 leading-relaxed">
                        {isEditing ? (
                          <textarea
                            value={editedExplanation}
                            onChange={(e) => setEditedExplanation(e.target.value)}
                            className="w-full h-48 p-4 bg-white border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all resize-none text-gray-700"
                          />
                        ) : (
                          <MarkdownRenderer content={editedExplanation} />
                        )}
                      </div>
                      
                      {isAdmin && isEditing && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              setEvaluation(prev => prev ? { ...prev, explanation: editedExplanation } : null);
                              setIsEditing(false);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-indigo-700 transition-all"
                          >
                            Применить изменения
                          </button>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveToKB}
                          disabled={isSavingToKB}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all ${
                            saveSuccess 
                              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                              : 'bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          {isSavingToKB ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : saveSuccess ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Database className="w-4 h-4" />
                          )}
                          {saveSuccess ? 'Сохранено в БЗ' : 'Сохранить в базу знаний'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleGenerateSituation}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl"
                >
                  Следующая ситуация
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Модал подтверждения микрофона на русском языке */}
    <AnimatePresence>
      {showMicPrompt && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[32px] max-w-sm w-full p-6 text-center shadow-2xl border border-sky-100 space-y-4"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100">
              <Mic className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Доступ к микрофону</h3>
            <p className="text-xs font-bold text-gray-500 leading-relaxed">
              Разрешить приложению доступ к микрофону для голосового ввода? Это позволит вам общаться с Максом голосом. Громкая связь будет включена при записи.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmMic}
                className="flex-grow py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-500 transition-colors uppercase tracking-wider shadow-lg shadow-indigo-100 cursor-pointer"
              >
                Разрешить
              </button>
              <button
                onClick={() => setShowMicPrompt(false)}
                className="flex-grow py-3 bg-gray-150 text-gray-600 hover:bg-gray-200 transition-colors rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default AITrainer;
