import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import MaxAvatar from './MaxAvatar';
import StudentAvatar from './StudentAvatar';

interface CharacterAvatarProps {
  isVisible: boolean;
  isSpeaking?: boolean;
  message?: string | null;
  position?: 'left' | 'right';
  hasSidebar?: boolean;
  contentWidth?: string;
  type?: 'max' | 'student';
  bubbleText?: string | null;
  isConsultant?: boolean;
  reactionType?: 'SUCCESS' | 'FAILURE' | 'NEUTRAL';
  isInline?: boolean;
  zIndex?: number;
}

const bubbleAudioMap: Record<string, string> = {
  "Выбери свою специализацию в 1С, чтобы настроить программу!": "/audio/select_specialization.mp3",
  "Начали! Удачи!": "/audio/let_is_start.mp3",
  "Привет! Я Макс, твой проводник в мире 1С. Давайте разберемся, какие вопросы у вас возникли сегодня!": "/audio/consultant_intro.mp3",
  "Здесь ты можешь задать мне любой вопрос, связанный с 1С: от нюансов разработки до советов по использованию конфигураций и рекомендаций по продвинутым курсам для углубления ваших знаний.": "/audio/consultant_help.mp3",
  "Привет! Будем учиться вместе. Я помогу тебе освоить эту тему!": "/audio/lesson_intro.mp3",
  "Последний вопрос! Поднажми!": "/audio/last_question.mp3",
  "Выбирай тему ниже, чтобы проверить свои навыки разработки и учета в 1С!": "/audio/choose_topic_test.mp3",
  "Привет! Будем учиться вместе. Выбирай тему и урок ниже!": "/audio/choose_lesson_intro.mp3"
};

const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ 
  isVisible, 
  isSpeaking, 
  message,
  position = 'left',
  hasSidebar = false,
  contentWidth = '48rem',
  type = 'max',
  bubbleText,
  isConsultant = false,
  reactionType = 'NEUTRAL',
  isInline = false,
  zIndex
}) => {
  const isLeft = position === 'left';
  const [screenSize, setScreenSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [localIsSpeaking, setLocalIsSpeaking] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const handleResize = () => setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    if (!soundEnabled || !bubbleText) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setLocalIsSpeaking(false);
      return;
    }

    let audioPath: string | null = null;
    const trimmed = bubbleText.trim();
    
    if (bubbleAudioMap[trimmed]) {
      audioPath = bubbleAudioMap[trimmed];
    } else if (trimmed.startsWith("Привет! Пройдём тестирование по разделу")) {
      audioPath = "/audio/intro_test.mp3";
    }

    if (audioPath) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setLocalIsSpeaking(true);
      const audio = new Audio(audioPath);
      audioRef.current = audio;
      
      audio.onended = () => {
        setLocalIsSpeaking(false);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setLocalIsSpeaking(false);
        audioRef.current = null;
      };

      audio.play().catch(err => {
        console.warn("Could not play bubble audio file (it might not be created yet):", err);
        setLocalIsSpeaking(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setLocalIsSpeaking(false);
    };
  }, [bubbleText]);

  if (!isVisible) return null;

  const activeSpeaking = isSpeaking || localIsSpeaking;

  // Custom Inline rendering
  if (isInline) {
    return (
      <div className="relative w-full h-full flex items-end justify-center overflow-hidden rounded-3xl bg-transparent">
        {/* Soft atmospheric background glow */}
        <motion.div
          animate={activeSpeaking ? { 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.35, 0.15]
          } : {
            scale: 1,
            opacity: 0.1
          }}
          transition={activeSpeaking ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 }}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-4/5 ${type === 'max' ? 'bg-sky-400' : 'bg-indigo-400'} blur-[24px] rounded-full z-0`}
        />
        
        {/* Main avatar with beautiful contour-blurred edges on all sides */}
        <div 
          style={{
            maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 95%)',
          }}
          className="relative w-full h-full flex items-end z-10"
        >
          {type === 'max' ? (
            <MaxAvatar 
              isSpeaking={activeSpeaking} 
              reactionType={reactionType}
              isInline={true}
              className="w-full h-full transition-all duration-700" 
            />
          ) : (
            <StudentAvatar 
              className="w-full h-full transition-all duration-700" 
            />
          )}
        </div>
      </div>
    );
  }

  const isConsultantMode = isConsultant;
  const isMobile = screenSize.width < 1024;

  // Sidebar parameters
  const sidebarWidthVal = (hasSidebar && !isConsultantMode && !isMobile) ? 256 : 0;
  
  const contentWidthPx = contentWidth.endsWith('rem') 
    ? parseFloat(contentWidth) * 16 
    : contentWidth.endsWith('px') 
      ? parseFloat(contentWidth) 
      : 768;

  // Available lateral space
  const maxGapSpace = (screenSize.width - sidebarWidthVal - contentWidthPx) / 2;

  // Check if screen is too narrow: we display it as a responsive, gorgeous floating assistant in the corner!
  const isFloatingWidget = maxGapSpace < 100 || isMobile;

  let avatarWidth = 240;
  let leftPosition = 16;
  let bottomPosition = 0;

  if (isFloatingWidget) {
    avatarWidth = isMobile ? 130 : 180;
    leftPosition = isMobile ? 12 : sidebarWidthVal + 12;
  } else {
    // Occupy the full space from side-menu (sidebarWidthVal) to the beginning of content text block!
    avatarWidth = maxGapSpace;
    leftPosition = sidebarWidthVal;
  }

  // Soft fade transitions on edges to simulate premium glass blur transparency with high compatibility
  const borderFadeStyle = {
    maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 95%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 95%)',
  };

  return (
    <div
      className="fixed flex items-end pointer-events-none transition-all duration-300"
      style={isFloatingWidget ? {
        width: `${avatarWidth}px`,
        height: isMobile ? '180px' : '230px',
        left: isLeft ? `${leftPosition}px` : 'auto',
        right: isLeft ? 'auto' : '16px',
        bottom: isMobile ? '12px' : '24px',
        top: 'auto',
        zIndex: zIndex || (isConsultantMode ? 71 : 30)
      } : { 
        width: `${avatarWidth}px`,
        left: isLeft ? `${leftPosition}px` : 'auto',
        right: isLeft ? 'auto' : '16px',
        top: '0px',
        bottom: '0px',
        paddingTop: isConsultantMode ? '0' : '5rem',
        paddingBottom: '2.5rem',
        zIndex: zIndex || (isConsultantMode ? 71 : 30),
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div className="relative flex items-end h-full w-full">
        {/* Speech Bubble - Compact representation when floating */}
        <AnimatePresence>
          {bubbleText && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className={`absolute left-1/2 -translate-x-1/2 z-50 pointer-events-auto
                ${isFloatingWidget ? 'bottom-[95%] w-[180px] sm:w-[210px]' : 'bottom-[75%] w-[240px] sm:w-[260px] md:w-[280px]'}
              `}
            >
              <div className="bg-white p-3 rounded-[20px] shadow-[0_15px_40px_rgba(30,41,59,0.18)] border-2 border-sky-100 relative">
                {/* Arrow pointing to avatar */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-sky-100 rotate-45" />
                <p className="text-[10px] font-black text-slate-800 leading-relaxed text-center whitespace-normal break-words uppercase tracking-tight">
                  {bubbleText}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient background glow - Always on but intensified when speaking */}
        <motion.div
          animate={activeSpeaking ? { 
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.3, 0.12]
          } : {
            scale: 1,
            opacity: 0.05
          }}
          transition={activeSpeaking ? { 
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut"
          } : { duration: 0.5 }}
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-48 ${type === 'max' ? 'bg-sky-400' : 'bg-indigo-400'} blur-[50px] rounded-full z-0`}
        />
        
        {/* Main Character Avatar Layer with smooth gradient edge-feathering */}
        <motion.div 
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 90 }}
          style={borderFadeStyle}
          className="relative h-full w-full flex items-end transition-all duration-300 z-10"
        >
          {type === 'max' ? (
            <MaxAvatar 
              isSpeaking={activeSpeaking} 
              reactionType={reactionType}
              isInline={isFloatingWidget}
              className="w-full h-full transition-all duration-700" 
            />
          ) : (
            <StudentAvatar 
              className="w-full h-full transition-all duration-700" 
            />
          )}
          
          {/* Speaking volume spectrum indicator */}
          {activeSpeaking && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1 z-1a">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [6, 18, 6],
                    backgroundColor: [type === 'max' ? '#38bdf8' : '#6366f1', type === 'max' ? '#818cf8' : '#818cf8', type === 'max' ? '#38bdf8' : '#6366f1']
                  }}
                  transition={{ 
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.08
                  }}
                  className={`w-1 rounded-full shadow-[0_0_8px_${type === 'max' ? 'rgba(56,189,248,0.4)' : 'rgba(99,102,241,0.4)'}]`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CharacterAvatar;
