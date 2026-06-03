import React, { useState, useEffect } from 'react';
import { UserRole, UserSpecialization, SkillLevel, Exercise, ExerciseType } from '../types';
import { Sparkles, ArrowRight, BrainCircuit, Users, CheckCircle2, ChevronRight, Star, Trophy, Award, Target, Zap, Wrench, Calculator, TrendingUp, Settings2, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CharacterAvatar from './CharacterAvatar';
import MarkdownRenderer from './MarkdownRenderer';

interface InitialTestingProps {
  onComplete: (skillLevel: SkillLevel, calculatedDifficulty: number, specialization: UserSpecialization) => void;
  onCancel: () => void;
  availableExercises: Exercise[]; // For mock testing if no AI available
  sectionId?: string;
  sectionTitle?: string;
  hasSidebar?: boolean;
}

export const InitialTesting: React.FC<InitialTestingProps> = ({ 
  onComplete, 
  onCancel, 
  availableExercises,
  sectionId,
  sectionTitle,
  hasSidebar = false
}) => {
  const [step, setStep] = useState<'intro' | 'specialization' | 'testing' | 'result'>(
    sectionId ? 'testing' : 'intro'
  );
  const [specialization, setSpecialization] = useState<UserSpecialization | null>(
    sectionId ? UserSpecialization.COMMON : null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(3); // Start with medium
  const [answers, setAnswers] = useState<{ isCorrect: boolean, difficulty: number }[]>([]);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [testExercises, setTestExercises] = useState<Exercise[]>([]);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const exMatchesSection = (ex: Exercise, secId: string) => {
    const exSec = ex.kb_section_id || '';
    if (secId === 'sec-1775157038826' || secId === 'sec-1777285813550') return exSec === 'platform';
    if (secId === 'sec-1777403118453' || secId === 'sec-1775157080995') return exSec === 'dev';
    if (secId === 'sec-1775458168759') return exSec === 'acc';
    if (secId === 'sec-1777484345191') {
      const lowerQ = (ex.question || '').toLowerCase();
      const lowerE = (ex.explanation || '').toLowerCase();
      return (exSec === 'dev' || exSec === 'platform') && (ex.id?.includes('d3') || ex.id?.includes('l6') || ex.id === 'd2-9' || lowerQ.includes('запрос') || lowerQ.includes('выбрать') || lowerE.includes('временн'));
    }
    if (secId === 'sec-1777484635095') {
      const lowerQ = (ex.question || '').toLowerCase();
      return exSec === 'dev' && (ex.id?.includes('d4') || lowerQ.includes('форм'));
    }
    if (secId === 'sec-1777484947088') {
      const lowerQ = (ex.question || '').toLowerCase();
      return exSec === 'dev' && (ex.id?.includes('d5') || lowerQ.includes('запис') || lowerQ.includes('регистр') || lowerQ.includes('транзак'));
    }
    return exSec === secId;
  };

  const filteredCount = sectionId ? availableExercises.filter(ex => exMatchesSection(ex, sectionId)).length : 0;
  const QUESTION_COUNT = sectionId ? Math.min(5, filteredCount) : 15;

  const pickNextExercise = (spec: UserSpecialization, difficulty: number, excludeIds: string[]) => {
    // Strictly filter from knowledge base - NO HALLUCINATIONS
    const candidates = availableExercises.filter(ex => {
      if (excludeIds.includes(ex.id)) return false;
      if (sectionId) {
        return exMatchesSection(ex, sectionId);
      }
      return !!ex.kb_section_id && (ex.specialization === undefined || ex.specialization === spec || ex.specialization === UserSpecialization.COMMON);
    });

    if (candidates.length === 0) return null;

    // Find closest to target difficulty (medium start is 3)
    return candidates.sort((a, b) => {
      const diffA = Math.abs((a.difficulty || 3) - difficulty);
      const diffB = Math.abs((b.difficulty || 3) - difficulty);
      return diffA - diffB;
    })[0];
  };

  useEffect(() => {
    if (step === 'testing' && specialization && testExercises.length === 0) {
      const firstEx = pickNextExercise(specialization, 3, []);
      if (firstEx) {
        setTestExercises([firstEx]);
        setPickedIds([firstEx.id]);
      }
    }
  }, [step, specialization]);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    
    const exercise = testExercises[currentQuestionIndex];
    if (!exercise) return;
    const correct = Array.isArray(exercise.correctAnswer) 
      ? exercise.correctAnswer.includes(option) 
      : exercise.correctAnswer === option;
    
    setIsCorrect(correct);
    setIsAnswered(true);
    
    setAnswers(prev => [...prev, { isCorrect: correct, difficulty: currentDifficulty }]);

    // Adaptive difficulty logic strictly per request:
    // With a correct answer, the difficulty level of the next question should increase
    // With an incorrect answer, the difficulty level should remain the same
    // With two or more incorrect answers, the difficulty level should decrease
    if (correct) {
      setCurrentDifficulty(prev => Math.min(5, prev + 0.5));
    } else {
      const nextIncorrectCount = incorrectCount + 1;
      setIncorrectCount(nextIncorrectCount);
      if (nextIncorrectCount >= 2) {
        setCurrentDifficulty(prev => Math.max(1, prev - 0.5));
      }
      // If first incorrect (newIncorrectCount == 1), difficulty remains same
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTION_COUNT - 1) {
      // Pick next exercise adaptively
      const nextEx = pickNextExercise(specialization!, currentDifficulty, pickedIds);
      
      if (nextEx) {
        setTestExercises(prev => [...prev, nextEx]);
        setPickedIds(prev => [...prev, nextEx.id]);
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        // No more exercises in KB - finish early with what we have
        setStep('result');
      }
    } else {
      setStep('result');
    }
  };

  const calculateResults = () => {
    const correctAnswers = answers.filter(a => a.isCorrect);
    const correctCount = correctAnswers.length;
    
    if (answers.length === 0) return { skill: SkillLevel.BEGINNER, difficulty: 1 };

    // Final grade weighted by difficulty of correct answers
    const sumCorrectDifficulty = correctAnswers.reduce((acc, curr) => acc + curr.difficulty, 0);
    
    // We factor in the "progression" (where the user ended up) and the weighted success
    let finalDifficulty = correctCount > 0 
      ? sumCorrectDifficulty / correctCount 
      : 1.0;

    // Weighting with current final difficulty to reward/punish based on adaptability
    finalDifficulty = (finalDifficulty * 0.6) + (currentDifficulty * 0.4);
    
    finalDifficulty = Math.max(1, Math.min(5, finalDifficulty));

    // Thresholds for SkillLevel based on weight (Russian localizations from types.ts)
    let skill: SkillLevel = SkillLevel.BEGINNER;
    if (finalDifficulty >= 4.5 && correctCount >= (answers.length * 0.6)) skill = SkillLevel.EXPERT;
    else if (finalDifficulty >= 3.2 && correctCount >= (answers.length * 0.4)) skill = SkillLevel.ADVANCED;
    else if (finalDifficulty >= 2.0 && correctCount >= (answers.length * 0.2)) skill = SkillLevel.INTERMEDIATE;
    else skill = SkillLevel.BEGINNER;

    return { skill, difficulty: finalDifficulty };
  };

  const finishTesting = () => {
    const { skill, difficulty } = calculateResults();
    if (specialization) {
      onComplete(skill, difficulty, specialization);
    }
  };

  const getShortExplanation = (text: string) => {
    if (!text) return "";
    const sentenceEnd = text.match(/[.!?]/);
    const index = sentenceEnd?.index ?? -1;
    if (index === -1) return text.length > 60 ? text.substring(0, 60) + "..." : text;
    return text.substring(0, index + 1);
  };

  const currentExercise = testExercises[currentQuestionIndex];

  return (
    <>
      {/* Desktop side avatar: zIndex-51 ensures visibility over other overlays */}
      <div className="hidden lg:block">
        <CharacterAvatar 
          isVisible={step === 'intro' || step === 'specialization' || step === 'testing'} 
          isSpeaking={false}
          type="max"
          position="left"
          hasSidebar={hasSidebar}
          contentWidth="48rem"
          zIndex={51}
          bubbleText={step === 'intro' ? "Привет! Пройдём тестирование по разделу " + (sectionTitle || "1С") + ", чтобы оценить твои навыки!" : (step === 'specialization' ? "Выбери свою специализацию в 1С, чтобы настроить программу!" : (currentQuestionIndex === 0 ? "Начали! Удачи!" : null))}
        />
      </div>

      <div className="max-w-3xl mx-auto py-10 px-4 h-full flex flex-col relative">
      {/* Top Navigation Bar with Home button */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <button 
          onClick={onCancel}
          className="flex items-center space-x-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 px-4 py-2 rounded-2xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer border border-gray-100 bg-white shadow-xs"
          id="testing-home-button"
        >
          <Home className="w-4 h-4 text-gray-500" />
          <span>Домой</span>
        </button>
        <div className="text-gray-400 font-extrabold text-[10px] uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
          {sectionId ? `Раздел: ${sectionTitle}` : 'Оценка уровня 1С'}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-sky-200 blur-2xl opacity-20 rounded-full animate-pulse" />
              <div className="relative bg-white p-4 lg:p-6 rounded-[2.5rem] shadow-2xl border border-sky-100 mb-6">
                <div className="hidden lg:block">
                  <Target className="w-16 h-16 text-sky-600 mx-auto" />
                </div>
                <div className="block lg:hidden w-24 h-24 overflow-hidden rounded-3xl bg-slate-50 border border-slate-100">
                  <CharacterAvatar isVisible={true} isInline={true} type="max" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                ПРОВЕРЬТЕ СВОЙ УРОВЕНЬ<br/>КОМПЕТЕНЦИЙ
              </h1>
              <p className="text-gray-500 font-bold text-sm uppercase tracking-wide max-w-sm mx-auto leading-relaxed">
                ПРОЙДИТЕ БЫСТРЫЙ ТЕСТ, ЧТОБЫ МЫ МОГЛИ ПОДОБРАТЬ ДЛЯ ВАС ИДЕАЛЬНУЮ ПРОГРАММУ ОБУЧЕНИЯ.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 text-left max-w-sm mx-auto">
              {[
                { icon: BrainCircuit, text: 'АДАПТИВНАЯ СЛОЖНОСТЬ' },
                { icon: Zap, text: 'ПЕРСОНАЛЬНЫЙ ТРЕК ОБУЧЕНИЯ' },
                { icon: Award, text: 'ОЦЕНКА УРОВНЯ ОТ BEGINNER ДО EXPERT' }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <item.icon className="w-5 h-5 text-sky-600" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('specialization')}
              className="w-full bg-sky-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-sky-100 hover:bg-sky-700 active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <span>НАЧАТЬ ТЕСТИРОВАНИЕ</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 'specialization' && (
          <motion.div 
            key="specialization"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-gray-900 uppercase">КТО ВЫ?</h2>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">ВЫБЕРИТЕ ВАШУ ОСНОВНУЮ СПЕЦИАЛИЗАЦИЮ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSpecialization(UserSpecialization.DEVELOPER)}
                className={`group p-6 rounded-3xl border-2 transition-all flex items-center justify-between
                  ${specialization === UserSpecialization.DEVELOPER ? 'border-sky-600 bg-sky-50' : 'border-gray-100 bg-white hover:border-sky-200'}
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl transition-all ${specialization === UserSpecialization.DEVELOPER ? 'bg-sky-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-sky-50 group-hover:text-sky-600'}`}>
                    <Wrench className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-900 text-sm uppercase">РАЗРАБОТЧИК</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">ПРОГРАММИРОВАНИЕ И МЕТАДАННЫЕ</p>
                  </div>
                </div>
                {specialization === UserSpecialization.DEVELOPER && <CheckCircle2 className="w-6 h-6 text-sky-600" />}
              </button>

              <button
                onClick={() => setSpecialization(UserSpecialization.ACCOUNTANT)}
                className={`group p-6 rounded-3xl border-2 transition-all flex items-center justify-between
                  ${specialization === UserSpecialization.ACCOUNTANT ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white hover:border-indigo-200'}
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl transition-all ${specialization === UserSpecialization.ACCOUNTANT ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                    <Calculator className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-900 text-sm uppercase">БУХГАЛТЕР</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">УЧЕТ, ДОКУМЕНТЫ И ОТЧЕТНОСТЬ</p>
                  </div>
                </div>
                {specialization === UserSpecialization.ACCOUNTANT && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
              </button>

              <button
                onClick={() => setSpecialization(UserSpecialization.MANAGER)}
                className={`group p-6 rounded-3xl border-2 transition-all flex items-center justify-between
                  ${specialization === UserSpecialization.MANAGER ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 bg-white hover:border-emerald-200'}
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl transition-all ${specialization === UserSpecialization.MANAGER ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-900 text-sm uppercase">МЕНЕДЖЕР</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">ПРОДАЖИ, CRM И УПРАВЛЕНИЕ</p>
                  </div>
                </div>
                {specialization === UserSpecialization.MANAGER && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </button>

              <button
                onClick={() => setSpecialization(UserSpecialization.ADMIN_1C)}
                className={`group p-6 rounded-3xl border-2 transition-all flex items-center justify-between
                  ${specialization === UserSpecialization.ADMIN_1C ? 'border-orange-600 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}
                `}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-4 rounded-2xl transition-all ${specialization === UserSpecialization.ADMIN_1C ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
                    <Settings2 className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-900 text-sm uppercase">АДМИНИСТРАТОР 1С</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">СЕРВЕРА, БАЗЫ И ОБНОВЛЕНИЯ</p>
                  </div>
                </div>
                {specialization === UserSpecialization.ADMIN_1C && <CheckCircle2 className="w-6 h-6 text-orange-600" />}
              </button>
            </div>

            <button
              disabled={!specialization}
              onClick={() => setStep('testing')}
              className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-3
                ${specialization 
                  ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-100 active:scale-95' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span>ПЕРЕЙТИ К ТЕСТАМ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {step === 'testing' && currentExercise && (
          <motion.div 
            key={`question-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-grow flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i < currentQuestionIndex ? 'w-4 bg-sky-600' : 
                      i === currentQuestionIndex ? 'w-8 bg-sky-600' : 'w-4 bg-gray-100'
                    }`} 
                  />
                ))}
              </div>
              <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  СЛОЖНОСТЬ: {currentDifficulty}/5
                </span>
              </div>
            </div>

            <div className="flex-grow space-y-6">
              {/* Compact, elegant assistance banner for mobile & tablet (avoiding floating overlaps) */}
              <div className="block lg:hidden w-full bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-3 shadow-xs animate-in fade-in duration-300">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-white border border-sky-200">
                    <CharacterAvatar
                      isVisible={true}
                      isSpeaking={false}
                      type="max"
                      isInline={true}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                      {currentQuestionIndex === 0 
                        ? "Привет! Я твой наставник Макс. Начнем наш адаптивный тест!" 
                        : (currentQuestionIndex === QUESTION_COUNT - 1 
                          ? "Финальный вопрос тестирования! Поднажми, ты отлично справляешься!" 
                          : "Следующее задание! Анализирую твои ответы...")
                      }
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-black text-gray-900 leading-tight">
                {currentExercise.question}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {currentExercise.options?.map((option, i) => {
                  const isSelected = selectedOption === option;
                  const showWrong = isAnswered && isSelected && !isCorrect;
                  const showCorrect = isAnswered && (
                    (Array.isArray(currentExercise.correctAnswer) 
                      ? currentExercise.correctAnswer.includes(option) 
                      : currentExercise.correctAnswer === option)
                  );

                  return (
                    <button
                      key={i}
                      disabled={isAnswered}
                      onClick={() => handleOptionSelect(option)}
                      className={`p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all
                        ${isSelected ? 'scale-[0.98]' : ''}
                        ${!isAnswered ? 'border-gray-100 hover:border-sky-200' : ''}
                        ${showCorrect ? 'border-green-500 bg-green-50 text-green-700' : ''}
                        ${showWrong ? 'border-red-500 bg-red-50 text-red-700' : ''}
                        ${isAnswered && !isSelected && !showCorrect ? 'opacity-40 border-gray-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                         <span>{option}</span>
                         {showCorrect && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                         {showWrong && <X className="w-5 h-5 flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>{isCorrect ? 'ВЕРНО!' : 'ОШИБКА'}</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs font-bold leading-relaxed opacity-80 flex-grow pr-4">
                      <MarkdownRenderer content={
                        isCorrect 
                          ? `Отличный ответ! ${getShortExplanation(currentExercise.explanation)}`
                          : `Правильный ответ: ${Array.isArray(currentExercise.correctAnswer) ? currentExercise.correctAnswer.join(', ') : currentExercise.correctAnswer}. ${getShortExplanation(currentExercise.explanation)}`
                      } />
                    </div>
                    {currentExercise.explanation && (
                      <button 
                        onClick={() => setShowExplanation(true)}
                        className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-500 px-5 py-2.5 rounded-2xl text-gray-900 shadow-lg shadow-yellow-200/50 transition-all active:scale-95 flex items-center gap-2 group animate-bounce-subtle"
                      >
                        <BrainCircuit className="w-5 h-5" />
                        <span className="text-[11px] font-black uppercase tracking-tight">Макс, объясни подробно!</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {showExplanation && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowExplanation(false)}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden" 
                  onClick={e => e.stopPropagation()}
                >
                  <div className="bg-sky-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative flex items-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-3xl p-1 shadow-lg flex-shrink-0 overflow-hidden">
                         <CharacterAvatar isVisible={true} isInline={true} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">МАКС ОБЪЯСНЯЕТ</h3>
                        <p className="text-sky-100 text-[10px] font-bold uppercase tracking-widest opacity-80">ПОДРОБНЫЙ ТЕХНИЧЕСКИЙ РАЗБОР</p>
                      </div>
                      <button 
                        onClick={() => setShowExplanation(false)}
                        className="absolute top-0 right-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="text-sm text-gray-700 font-medium leading-relaxed mb-8 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar-stylish">
                      <MarkdownRenderer content={currentExercise.explanation} />
                    </div>
                    <button 
                      onClick={() => setShowExplanation(false)}
                      className="w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all active:scale-[0.98]"
                    >
                      ВСЁ ПОНЯТНО, ИДЕМ ДАЛЬШЕ!
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {isAnswered && (
              <button
                onClick={handleNext}
                className="mt-8 w-full bg-gray-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center space-x-3"
              >
                <span>{currentQuestionIndex === QUESTION_COUNT - 1 ? 'УЗНАТЬ РЕЗУЛЬТАТ' : 'СЛЕДУЮЩИЙ ВОПРОС'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-4"
          >
            <div className="relative inline-block">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto drop-shadow-xl" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-yellow-200 rounded-full scale-150 opacity-30"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-gray-900 uppercase leading-none">ТЕСТ ЗАВЕРШЕН</h2>
              <div className="inline-flex items-center px-6 py-2 bg-sky-100 rounded-full">
                <span className="text-sky-700 font-black text-sm uppercase tracking-widest">
                  МАСТЕРСТВО: {calculateResults().skill}
                </span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 max-w-sm mx-auto">
              <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                <span>ПРОГРЕСС</span>
                <span className="text-sky-600">{answers.filter(a => a.isCorrect).length}/{QUESTION_COUNT} ВЕРНО</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(answers.filter(a => a.isCorrect).length / QUESTION_COUNT) * 100}%` }}
                  className="h-full bg-sky-500"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                МЫ ОПРЕДЕЛИЛИ ВАШ ПОКАЗАТЕЛЬ МАСТЕРСТВА КАК <span className="text-gray-900">{calculateResults().difficulty.toFixed(1)}/5.0</span>. ТЕПЕРЬ ВСЕ ЗАДАНИЯ БУДУТ АДАПТИРОВАНЫ ПОД ВАС.
              </p>
            </div>

            <button
              onClick={finishTesting}
              className="w-full bg-sky-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all flex items-center justify-center space-x-3"
            >
              <span>ПЕРЕЙТИ В ПАНЕЛЬ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};
