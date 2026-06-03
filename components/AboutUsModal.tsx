import React, { useState, useRef, useEffect } from 'react';
import { X, Users, Heart, Target, Star, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import MaxAvatar from './MaxAvatar';
import { browserSpeak } from '../services/utils';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AudioTrack {
  id: string;
  title: string;
  description: string;
  text: string;
  fileUrl: string;
}

const TRACKS: AudioTrack[] = [
  {
    id: 'intro',
    title: 'Приветственное слово Макса',
    description: 'Ознакомительный рассказ о возможностях платформы',
    text: 'Привет! Я Макс, твой личный проводник в мире один-эс. Я создан, чтобы провести тебя сквозь тернии разработки, администрирования и бухгалтерского учета простым, технологичным и интерактивным языком! Давайте учиться вместе!',
    fileUrl: '/audio/consultant_intro.mp3'
  },
  {
    id: 'consultant',
    title: 'О работе ИИ-Консультанта',
    description: 'Как использовать режим бесконечных вопросов и ответов',
    text: 'Здесь ты можешь задать мне любой вопрос, связанный с один-эс: от нюансов разработки до советов по использованию конфигураций и рекомендаций по продвинутым курсам для углубления ваших знаний.',
    fileUrl: '/audio/consultant_help.mp3'
  },
  {
    id: 'lessons',
    title: 'Гид по интерактивным урокам',
    description: 'Как правильно проходить курсы в базе знаний',
    text: 'Привет! Будем учиться вместе. Выбирай интересующую тебя тему и урок ниже! Мы разберем теорию, а потом закрепим её на интерактивных практических кейсах.',
    fileUrl: '/audio/choose_lesson_intro.mp3'
  },
  {
    id: 'testing',
    title: 'Адаптивное тестирование',
    description: 'Как программа подстраивает уровень сложности',
    text: 'Выбирай тему ниже, чтобы проверить свои навыки разработки и учета в один-эс! Адаптивные тесты точечно откалибруют твои знания.',
    fileUrl: '/audio/choose_topic_test.mp3'
  }
];

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<'audio' | 'tts' | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [fakeProgress, setFakeProgress] = useState(0);

  // Clean playbacks on unmount or close
  const stopAllPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTrackId(null);
    setPlaybackMode(null);
    setFakeProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, []);

  // Update progress bar animation
  useEffect(() => {
    if (isPlaying) {
      let start = Date.now();
      const track = TRACKS.find(t => t.id === currentTrackId);
      const duration = track ? (track.text.length * 75) : 10000; // rough estimation in ms for fallback

      const step = () => {
        if (!isPlaying) return;
        
        let elapsed = Date.now() - start;
        if (playbackMode === 'audio' && audioRef.current) {
          const current = audioRef.current.currentTime;
          const total = audioRef.current.duration || 1;
          setFakeProgress((current / total) * 100);
          if (audioRef.current.ended) {
            stopAllPlayback();
            return;
          }
        } else {
          // TTS estimation
          const progressVal = Math.min((elapsed / duration) * 100, 100);
          setFakeProgress(progressVal);
          if (progressVal >= 100) {
            stopAllPlayback();
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(step);
      };
      animationFrameRef.current = requestAnimationFrame(step);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTrackId, playbackMode]);

  const toggleTrack = (track: AudioTrack) => {
    if (currentTrackId === track.id && isPlaying) {
      // Pause
      stopAllPlayback();
      return;
    }

    // Stop current
    stopAllPlayback();

    const playWithAudio = () => {
      const audio = new Audio(track.fileUrl);
      audioRef.current = audio;
      audio.muted = isMuted;
      setPlaybackMode('audio');
      setCurrentTrackId(track.id);
      setIsPlaying(true);

      audio.play().catch(err => {
        console.warn("Static file play failed, falling back to TTS:", err);
        playWithTTS();
      });

      audio.onended = () => {
        stopAllPlayback();
      };
    };

    const playWithTTS = () => {
      setPlaybackMode('tts');
      setCurrentTrackId(track.id);
      setIsPlaying(true);
      browserSpeak(track.text);
    };

    // Try starting with audio file, falls back to TTS
    playWithAudio();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    if (nextMuted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (playbackMode === 'tts') {
        setIsPlaying(false);
      }
    } else {
      if (playbackMode === 'tts' && currentTrackId) {
        const track = TRACKS.find(t => t.id === currentTrackId);
        if (track) {
          browserSpeak(track.text);
          setIsPlaying(true);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1250] bg-white flex flex-col h-screen w-screen animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-sky-600 via-sky-650 to-indigo-650 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6" />
          <h2 className="text-xl font-black uppercase tracking-wider">О проекте 1С-Мастер</h2>
        </div>
        <button 
          onClick={() => {
            stopAllPlayback();
            onClose();
          }} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Full-screen content section */}
      <div className="flex-grow overflow-y-auto px-6 md:px-12 py-8 space-y-10 custom-scrollbar max-w-5xl mx-auto w-full">
        
        {/* Hero Row with Max avatar and quick pitch */}
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-sky-50/60 rounded-[32px] border border-sky-100 shadow-sm">
          <div className="w-28 h-28 shrink-0 rounded-3xl overflow-hidden bg-[#0A0F1D] flex items-center justify-center shadow-lg">
            <MaxAvatar className="w-28 h-28" />
          </div>
          <div className="text-center md:text-left space-y-3">
            <span className="bg-sky-100 text-sky-700 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Твой проводник в 1C</span>
            <h3 className="font-black text-gray-950 text-2xl leading-none uppercase">Аудио-гид &amp; Цифровой наставник Макс</h3>
            <p className="text-sm font-semibold text-gray-600 leading-relaxed max-w-2xl">
              Привет! Я Макс, твой личный наставник. Я помогу тебе освоить платформу 1С:Предприятие!
              Ниже ты можешь послушать интерактивное голосовое приветствие и подробнее узнать о возможностях нашей геймифицированной экосистемы.
            </p>
          </div>
        </div>

        {/* HIGH-FIDELITY AUDIO PLAYER SECTION */}
        <section className="bg-slate-900 text-white p-6 md:p-8 rounded-[36px] shadow-xl space-y-6 relative overflow-hidden">
          {/* Wave Background logic when playing */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end justify-center">
            {isPlaying && (
              <div className="flex gap-1 items-end w-full px-8 h-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-sky-400 flex-1 rounded-t-sm"
                    style={{
                      height: `${Math.random() * 100}%`,
                      transition: 'height 150ms ease-in-out'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-sky-400 tracking-widest">Аудио-визитка Макса</h4>
              <p className="text-lg font-black text-white uppercase">Голосовое сопровождение и интерактивные инструкции</p>
            </div>

            {/* Global player controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMute}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer flex items-center space-x-2 border border-white/5"
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
                <span className="text-[10px] font-black uppercase tracking-wider">{isMuted ? 'Звук выкл.' : 'Звук вкл.'}</span>
              </button>

              {isPlaying && (
                <button
                  onClick={stopAllPlayback}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all cursor-pointer font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20"
                >
                  ОСТАНОВИТЬ
                </button>
              )}
            </div>
          </div>

          {/* Audio Playlist */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRACKS.map(track => {
              const active = currentTrackId === track.id;
              return (
                <div 
                  key={track.id}
                  onClick={() => toggleTrack(track)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4
                    ${active 
                      ? 'bg-sky-950/60 border-sky-450 shadow-inner' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-sky-400 animate-ping' : 'bg-white/20'}`} />
                        <h5 className="font-black uppercase text-xs tracking-tight text-white">{track.title}</h5>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold">{track.description}</p>
                    </div>

                    <button
                      className={`p-2.5 rounded-2xl transition-all shrink-0
                        ${active && isPlaying 
                          ? 'bg-red-500 text-white' 
                          : 'bg-sky-500 text-slate-900 group-hover:bg-sky-400'
                        }
                      `}
                    >
                      {active && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                  </div>

                  {active && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <p className="text-[11px] font-medium text-slate-300 leading-normal italic">
                        &ldquo;{track.text}&rdquo;
                      </p>
                      
                      {/* Fake track progress */}
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-400 rounded-full transition-all duration-300" 
                          style={{ width: `${fakeProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black text-sky-400 uppercase tracking-widest">
                        <span>{playbackMode === 'tts' ? 'ИИ СИНТЕЗ ГОЛОСА Max-TTS' : 'Оригинальный аудиофайл'}</span>
                        <span>{Math.round(fakeProgress)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Core Vision */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-150 rounded-[28px] space-y-4 shadow-xs bg-white">
            <div className="bg-sky-50 text-sky-600 w-12 h-12 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-gray-900 uppercase">Наша глобальная цель</h4>
            <p className="text-sm font-semibold text-gray-500 leading-relaxed">
              Создать комплексную, увлекательную, интерактивную и геймифицированную среду для быстрого освоения механизмов запросов, администрирования баз данных и программирования в СУБД 1С без сухих и непонятных лекций.
            </p>
          </div>

          <div className="p-6 border border-gray-150 rounded-[28px] space-y-4 shadow-xs bg-white">
            <div className="bg-pink-50 text-pink-650 w-12 h-12 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-gray-900 uppercase">С заботой о каждом ученике</h4>
            <p className="text-sm font-semibold text-gray-500 leading-relaxed">
              Мы бережно сохраняем твой прогресс обучения с синхронизацией в облачной базе Supabase, начисляем опыт XP за верные ответы и помогаем восстанавливать жизни, чтобы каждый шаг давал порцию вдохновения!
            </p>
          </div>
        </section>

        {/* Key Advantages */}
        <section className="space-y-6 bg-gray-50/50 p-8 rounded-[32px] border border-gray-100">
          <div className="flex items-center space-x-3 text-sky-600">
            <Star className="w-6 h-6" />
            <h3 className="font-black uppercase text-base tracking-widest">Особенности 1С-Мастер</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-2">
            {[
              { title: "Адаптивное ИИ-Тестирование", text: "Адаптивные тесты оценивают ваши навыки по 10-балльной шкале и интерактивно настраивают сложность программы." },
              { title: "Умный ИИ Консультант", text: "Прямой диалог с наставником Максом по любым конфигурациям, синтаксису и запросам в реальном времени." },
              { title: "Мощная база знаний", text: "Комплексные уроки от основ бухучета до сложной оптимизации СУБД запросов и программирования." }
            ].map((item, i) => (
              <li key={i} className="flex flex-col space-y-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <p className="text-xs font-black text-gray-950 uppercase tracking-tight">{item.title}</p>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Video Presentation Section */}
        <section className="space-y-4 bg-slate-50 p-6 md:p-8 rounded-[32px] border border-slate-200">
          <div className="flex items-center space-x-3 text-sky-600">
            <Play className="w-5 h-5 fill-current" />
            <h3 className="font-black uppercase text-sm tracking-widest">Видео-презентация нашей платформы</h3>
          </div>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-2xl">
            Посмотрите короткую видео-презентацию о нашей платформе, её возможностях и интерактивном симуляторе под руководством Макса!
          </p>
          <div className="relative aspect-video max-w-3xl mx-auto w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-xl">
            <video 
              src="/max_avatar.mp4" 
              controls 
              className="w-full h-full object-cover"
              poster="/max_avatar.png"
              playsInline
            />
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-150 shrink-0 text-center flex justify-center shadow-inner">
        <button
          onClick={() => {
            stopAllPlayback();
            onClose();
          }}
          className="w-full max-w-xl py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all cursor-pointer shadow-lg shadow-sky-600/10 active:scale-98"
        >
          ОТЛИЧНО, ВПЕРЕД К ОБУЧЕНИЮ!
        </button>
      </div>

    </div>
  );
};

export default AboutUsModal;
