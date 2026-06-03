
import React, { useState, useRef } from 'react';
import { KBItem } from '../types';
import { searchKnowledgeBase, searchExpertAi, chatWithMax, generateSpeech, localKeywordSearch } from '../services/geminiService';
import { pcmToWav } from '../services/utils';
import { OneCLogo } from '../constants';
import { MessageSquare, Send, X, Phone, Mail, CheckCircle2, Loader2, Headset, Info, Mic, MicOff, Eraser, Database, Brain, Volume2, Square, AlertCircle, Home } from 'lucide-react';
import VoiceSpectrum from './VoiceSpectrum';
import MicrophonePermissionButton from './MicrophonePermissionButton';
import MarkdownRenderer from './MarkdownRenderer';
import CharacterAvatar from './CharacterAvatar';
import { motion, AnimatePresence } from 'motion/react';

interface ConsultantModeProps {
  kbItems: KBItem[];
  onClose: () => void;
  hasActiveLesson?: boolean;
  isGuest?: boolean;
  guestQuestions?: number;
  onQuestionAsked?: () => void;
  onUpdateKb?: (newItem: KBItem) => void;
}

const ConsultantMode: React.FC<ConsultantModeProps> = ({ 
  kbItems, 
  onClose, 
  hasActiveLesson = false,
  isGuest = false,
  guestQuestions = 0,
  onQuestionAsked,
  onUpdateKb
}) => {
  React.useEffect(() => {
    console.log("ConsultantMode: kbItems changed, length:", kbItems.length);
  }, [kbItems]);

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({ email: '', phone: '' });
  const [isSent, setIsSent] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState('');
  const [isSavingToKb, setIsSavingToKb] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [answerSource, setAnswerSource] = useState<'local' | 'ai' | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isSearching]);

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isIntroSpeaking, setIsIntroSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<string | null>(null);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRequestCount = useRef(0);

  // Очистка при размонтировании
  React.useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Громкое приветствие Макса при входе
  React.useEffect(() => {
    const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    if (soundEnabled) {
      setIsIntroSpeaking(true);
    }
  }, []);

  const phrases = [
    "Сейчас подумаю...",
    "Интересно, давайте посмотрим...",
    "Одну секунду, ищу информацию...",
    "Хорошо, сейчас разберемся...",
    "Минутку, загляну в базу знаний..."
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

    // Request permission explicitly if needed
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(prev => prev ? `${prev} ${transcript}` : transcript);
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

  const [lastSavedItemId, setLastSavedItemId] = useState<string | null>(null);

  const autoSaveToKb = async (q: string, a: string, source: 'its' | 'ai') => {
    // Check for similarity to avoid duplicates in "Cached Queries"
    const isSimilar = (q1: string, q2: string) => {
      const words1 = q1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const words2 = q2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (words1.length === 0 || words2.length === 0) return q1.toLowerCase() === q2.toLowerCase();
      
      const common = words1.filter(w => words2.includes(w));
      const similarity = common.length / Math.max(words1.length, words2.length);
      return similarity > 0.7; // 70% overlap of significant words
    };

    const alreadyExists = kbItems.some(item => 
      isSimilar(item.title, q)
    );

    if (alreadyExists) {
      console.log("Similar query already exists in cache, skipping auto-save.");
      return;
    }

    const itemId = `cached_${Date.now()}`;
    setLastSavedItemId(itemId);
    setIsAutoSaving(true);
    
    const newItem: KBItem = {
      id: itemId,
      title: q.length > 50 ? q.substring(0, 47) + '...' : q,
      content: a,
      tags: ['Кэшированный запрос', 'ИИ'],
      source: 'Кэшированные запросы',
      created_at: new Date().toISOString()
    };

    try {
      // We need the latest kbItems here, but we use the prop kbItems
      const currentKb = [...kbItems, newItem];
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentKb)
      });

      if (res.ok && onUpdateKb) {
        onUpdateKb(newItem);
        // We don't set success here to avoid confusing with manual save
      }
    } catch (error) {
      // Silently fail for auto-save to avoid confusing the user
      // The error "Failed to fetch" usually means the server is restarting or network is blipping
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactData.email && !contactData.phone) {
      alert("Пожалуйста, укажите хотя бы один способ связи.");
      return;
    }
    
    try {
      // In a real app, this would send an email or save to a "leads" collection
      console.log("Sending contact request:", { query, contactData });
      alert("Ваш запрос отправлен! Консультант свяжется с вами в ближайшее время.");
      setShowContactForm(false);
      setContactData({ email: '', phone: '' });
    } catch (error) {
      alert("Ошибка при отправке запроса. Попробуйте позже.");
    }
  };

  const handleClear = () => {
    setQuery('');
    setAnswer(null);
    setCachedAudio(null);
    stopSpeaking();
    setAnswerSource(null);
    setIsSearching(false);
    setShowContactForm(false);
  };

  const handleClearChat = () => {
    handleClear();
    setMessages([]);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    stopSpeaking(); 
    
    if (isGuest && guestQuestions >= 5) {
      setAnswer("Вы достигли лимита в 5 вопросов для гостевого режима. Пожалуйста, зарегистрируйтесь для неограниченного доступа.");
      return;
    }

    const currentQuery = query.trim();
    const newUserMessage = { role: 'user' as const, content: currentQuery };
    
    // Важно: Сохраняем текущую историю до добавления нового сообщения для передачи в ИИ
    const historyForAi = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      content: m.content
    }));
    historyForAi.push({ role: 'user', content: currentQuery });

    setMessages(prev => [...prev, newUserMessage]);
    setQuery('');

    const askText = phrases[Math.floor(Math.random() * phrases.length)];
    setIsIntroSpeaking(true);

    setIsSearching(true);
    setAnswer(null);
    setShowContactForm(false);
    setLastSavedItemId(null);
    
    try {
      // Если это не первый вопрос (есть история), сразу идем в контекстный ИИ
      if (messages.length > 0) {
        const expertResult = await chatWithMax(historyForAi);
        
        if (expertResult) {
          setAnswer(expertResult);
          setEditedAnswer(expertResult);
          setAnswerSource('ai');
          setMessages(prev => [...prev, { role: 'assistant', content: expertResult }]);
          if (onQuestionAsked) onQuestionAsked();
          
          await autoSaveToKb(currentQuery, expertResult, 'ai');
        } else {
          const fallbackMsg = "Извините, возникла проблема с получением ответа. Попробуйте еще раз.";
          setAnswer(fallbackMsg);
          setMessages(prev => [...prev, { role: 'assistant', content: fallbackMsg }]);
        }
        return;
      }

      // Если это первый вопрос, пробуем локальный поиск для скорости
      // 1. Local search
      const fastMatch = localKeywordSearch(currentQuery, kbItems);
      
      if (fastMatch) {
        setAnswer(fastMatch);
        setEditedAnswer(fastMatch);
        setAnswerSource('local');
        setMessages(prev => [...prev, { role: 'assistant', content: fastMatch }]);
        if (onQuestionAsked) onQuestionAsked();
        
        return;
      }

      // 2. Intelligent search in local KB
      const result = await searchKnowledgeBase(currentQuery, kbItems);
      if (result) {
        setAnswer(result);
        setEditedAnswer(result);
        setAnswerSource('local');
        setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        if (onQuestionAsked) onQuestionAsked();
      } else {
        // 3. Fallback to AI if no KB match for first question
        const expertResult = await chatWithMax(historyForAi);
        
        if (expertResult) {
          setAnswer(expertResult);
          setEditedAnswer(expertResult);
          setAnswerSource('ai');
          setMessages(prev => [...prev, { role: 'assistant', content: expertResult }]);
          if (onQuestionAsked) onQuestionAsked();
          
          await autoSaveToKb(currentQuery, expertResult, 'ai');
        } else {
          const fallbackMsg = "Спасибо за вопрос! К сожалению, в данный момент у меня нет точного ответа. Я передам ваш запрос специалистам.";
          setAnswer(fallbackMsg);
          setAnswerSource(null);
          setMessages(prev => [...prev, { role: 'assistant', content: fallbackMsg }]);
          setShowContactForm(true);
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Произошла ошибка при поиске. Попробуйте позже.";
      setAnswer(errorMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsSearching(false);
      setTimeout(() => setIsIntroSpeaking(false), 2000);
    }
  };

  const handleSaveToKb = async () => {
    if (!editedAnswer || !query) return;
    
    // Check for similarity to avoid duplicates in "Cached Queries"
    const isSimilar = (q1: string, q2: string) => {
      const words1 = q1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const words2 = q2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (words1.length === 0 || words2.length === 0) return q1.toLowerCase() === q2.toLowerCase();
      
      const common = words1.filter(w => words2.includes(w));
      const similarity = common.length / Math.max(words1.length, words2.length);
      return similarity > 0.7; // 70% overlap of significant words
    };

    const alreadyExists = kbItems.some(item => 
      isSimilar(item.title, query) && item.id !== lastSavedItemId
    );

    if (alreadyExists) {
      alert("Похожий запрос уже есть в базе знаний (Кэш).");
      return;
    }

    setIsSavingToKb(true);
    setSaveStatus('saving');
    
    try {
      let currentKb = [...kbItems];
      let newItem: KBItem;

      if (lastSavedItemId) {
        // Update existing auto-saved item
        const index = currentKb.findIndex(item => item.id === lastSavedItemId);
        if (index !== -1) {
          newItem = {
            ...currentKb[index],
            content: editedAnswer,
            tags: ['Кэшированный запрос', 'Скорректировано'],
            source: 'Кэшированные запросы',
            created_at: new Date().toISOString()
          };
          currentKb[index] = newItem;
        } else {
          // Fallback if not found for some reason
          newItem = {
            id: lastSavedItemId,
            title: query.length > 50 ? query.substring(0, 47) + '...' : query,
            content: editedAnswer,
            tags: ['Кэшированный запрос', 'Скорректировано'],
            source: 'Кэшированные запросы',
            created_at: new Date().toISOString()
          };
          currentKb.push(newItem);
        }
      } else {
        // Create new item
        newItem = {
          id: `cached_${Date.now()}`,
          title: query.length > 50 ? query.substring(0, 47) + '...' : query,
          content: editedAnswer,
          tags: ['Кэшированный запрос', '1С'],
          source: 'Кэшированные запросы',
          created_at: new Date().toISOString()
        };
        currentKb.push(newItem);
      }

      // Save to local API (which saves to kb.json)
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentKb)
      });

      if (!res.ok) throw new Error("Failed to save to local KB");

      // Update global state
      if (onUpdateKb) onUpdateKb(newItem);
      
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving to KB:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSavingToKb(false);
    }
  };

  if (isSent) {
    return (
      <div className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Спасибо за вопрос, отправляю в поддержку</h2>
        <p className="text-gray-500 font-bold">Наши консультанты свяжутся с вами в ближайшее время.</p>
        <button 
          onClick={onClose}
          className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm"
        >
          ЗАКРЫТЬ
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop side fixed avatar */}
      <div className="hidden lg:block">
        <CharacterAvatar 
          isVisible={true} 
          isSpeaking={isSpeaking || isIntroSpeaking}
          type="max"
          position="left"
          isConsultant={true}
          contentWidth="48rem"
          zIndex={71}
          bubbleText={isIntroSpeaking ? "Привет! Я Макс, твой проводник в мире 1С. Давайте разберемся, какие вопросы у вас возникли сегодня!" : (!answer && !isSearching ? "Здесь ты можешь задать мне любой вопрос, связанный с 1С: от нюансов разработки до советов по использованию конфигураций и рекомендаций по продвинутым курсам для углубления ваших знаний." : null)}
        />
      </div>

      <div className="fixed inset-0 z-[70] bg-gray-50 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
        <header className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div 
              onClick={onClose}
              className="flex items-center space-x-3 cursor-pointer select-none group"
              title="На главную"
            >
              <OneCLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
              <div className="hidden sm:block h-8 w-px bg-gray-100 mx-1" />
            </div>
            <div className="bg-sky-50 p-2 rounded-xl">
              <Headset className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Ваш консультант 1С</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Интеллектуальный поиск по базе знаний</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-black text-[10px] uppercase hover:bg-sky-50 hover:text-sky-600 transition-all border border-gray-200 hover:border-sky-200"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">На главную</span>
            </button>
            {hasActiveLesson && (
              <button 
                onClick={onClose}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-orange-700 transition-all shadow-md"
              >
                <span>Назад, к урокам</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
          {/* Compact, elegant welcome assistance banner for mobile & tablet */}
          <div className="block lg:hidden w-full bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-4 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-white border border-sky-200">
                <CharacterAvatar
                  isVisible={true}
                  isSpeaking={isSpeaking || isIntroSpeaking}
                  type="max"
                  isInline={true}
                />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-800 leading-normal uppercase tracking-tight">
                  {isIntroSpeaking 
                    ? "Привет! Я твой наставник Макс. Давайте разберемся, какие вопросы у вас возникли сегодня по 1С!" 
                    : (!answer && !isSearching 
                      ? "Привет! Задайте мне любой вопрос по 1С. Я помогу вам разобраться в коде, функциях или конфигурациях!" 
                      : "Анализирую ваш вопрос... Даю экспертные рекомендации!")
                  }
                </p>
              </div>
            </div>
          </div>
        {kbItems.length === 0 && (
          <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[32px] text-center space-y-3 animate-in fade-in duration-500">
            <Database className="w-10 h-10 text-amber-300 mx-auto" />
            <h3 className="text-lg font-black text-amber-900 uppercase">База знаний пуста</h3>
            <p className="text-sm font-bold text-amber-800/70">
              Консультант пока не может отвечать на вопросы, так как в базе знаний нет данных. 
              Пожалуйста, добавьте информацию в админ-панели.
            </p>
          </div>
        )}

        {/* Чат-история */}
        {messages.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {messages.map((msg, idx) => {
              const isLatestAssistant = msg.role === 'assistant' && idx === messages.length - 1;
              
              return (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-sky-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    {isLatestAssistant && isEditing ? (
                      <div className="space-y-4 min-w-[300px]">
                        <textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          className="w-full h-48 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold text-sm focus:border-sky-500 outline-none transition-all resize-none text-gray-800"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveToKb}
                            disabled={isSavingToKb}
                            className="flex-1 py-2 bg-sky-600 text-white rounded-lg font-black text-[10px] uppercase flex items-center justify-center space-x-2 hover:bg-sky-700 transition-all disabled:opacity-50 shadow-sm"
                          >
                            {saveStatus === 'saving' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Database className="w-3 h-3" />
                            )}
                            <span>{saveStatus === 'success' ? 'СОХРАНЕНО' : 'СОХРАНИТЬ'}</span>
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-black text-[10px] uppercase hover:bg-gray-200 transition-all"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-inherit leading-relaxed font-bold">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 border-t border-gray-50 pt-2">
                      <div className={`text-[8px] uppercase font-black opacity-50 ${msg.role === 'user' ? 'text-white' : 'text-gray-400'}`}>
                        {msg.role === 'user' ? 'Вы' : 'Макс'}
                      </div>
                      
                      {isLatestAssistant && !isEditing && (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-sky-600 p-1 rounded-md hover:bg-sky-50 transition-colors"
                            title="Редактировать и сохранить в базу"
                          >
                            <Eraser className="w-3 h-3" />
                          </button>
                          {!lastSavedItemId && (
                            <button
                              onClick={handleSaveToKb}
                              className="text-gray-400 hover:text-green-600 p-1 rounded-md hover:bg-green-50 transition-colors"
                              title="Добавить в базу знаний"
                            >
                              <Database className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
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
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Введите ваш вопрос</label>
            <div className="flex items-center space-x-3">
              <VoiceSpectrum isListening={isListening} />
            </div>
          </div>
            <div className="space-y-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Например: Как создать новый элемент справочника программно?"
                className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-sky-500 rounded-2xl font-bold text-gray-800 transition-all outline-none min-h-[120px] resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {query && !isSearching && (
                    <button
                      onClick={handleClearChat}
                      className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-500 rounded-xl hover:text-red-600 hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                      title="Очистить весь диалог"
                    >
                      <Eraser className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">Очистить чат</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMicClick}
                    disabled={isSearching}
                    className={`p-3 rounded-xl shadow-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title={isListening ? "Слушаю..." : "Голосовой ввод"}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !query.trim() || (isGuest && guestQuestions >= 5)}
                    className="flex items-center space-x-2 px-6 py-3 bg-sky-600 text-white rounded-xl shadow-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-xs uppercase"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isGuest && guestQuestions >= 5 ? 'Лимит' : 'Спросить'}</span>
                  </button>
                </div>
              </div>
            </div>
            {isSearching && (
              <div className="flex items-center justify-center space-x-3 py-2 animate-pulse">
                <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                <span className="text-xs font-black text-sky-600 uppercase tracking-widest">
                  Минутку, готовлю ответ...
                </span>
              </div>
            )}
        </div>


        {showContactForm && (
          <div className="bg-orange-50 p-8 rounded-[32px] border-2 border-orange-100 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-3 rounded-2xl">
                <Info className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-orange-900 uppercase leading-tight">Нужна помощь эксперта?</h3>
                <p className="text-sm font-bold text-orange-800/70 mt-1">
                  Оставьте свои контакты, и мы отправим ваш вопрос консультанту поддержки.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-800 uppercase ml-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  <input
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    placeholder="example@mail.ru"
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-transparent focus:border-orange-400 rounded-xl font-bold text-sm outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-800 uppercase ml-2">Телефон</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-transparent focus:border-orange-400 rounded-xl font-bold text-sm outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSendContact}
                className="flex-grow py-4 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all"
              >
                ОТПРАВИТЬ
              </button>
              <button
                onClick={() => setShowContactForm(false)}
                className="px-8 py-4 bg-white text-orange-800 border-2 border-orange-100 rounded-2xl font-black text-xs hover:bg-orange-100 transition-all"
              >
                НЕ СЕЙЧАС
              </button>
            </div>
          </div>
        )}
      </div>
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
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mx-auto border border-sky-100">
              <Mic className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Доступ к микрофону</h3>
            <p className="text-xs font-bold text-gray-500 leading-relaxed">
              Разрешить приложению доступ к микрофону для голосового ввода? Это позволит вам общаться с Максом голосом. Громкая связь будет включена при записи.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmMic}
                className="flex-grow py-3 bg-sky-600 text-white rounded-2xl font-black text-xs hover:bg-sky-500 transition-colors uppercase tracking-wider shadow-lg shadow-sky-100 cursor-pointer"
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

export default ConsultantMode;
