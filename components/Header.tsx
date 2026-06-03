import React from 'react';
import { Heart, Coins, Flame, User, Book, MessageSquare, BrainCircuit, Sparkles, Settings } from 'lucide-react';

interface HeaderProps {
  hearts: number;
  coins: number;
  streak: number;
  xp: number;
  onProfileClick: () => void;
  avatarUrl?: string;
  currentView?: string;
  onViewChange?: (view: any) => void;
  onSkillsCheckClick?: () => void;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  hearts, 
  coins, 
  streak, 
  xp, 
  onProfileClick, 
  avatarUrl,
  currentView,
  onViewChange,
  onSkillsCheckClick,
  onSettingsClick
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4 md:space-x-8">
        <div className="flex items-center space-x-1.5" title="Жизни">
          <Heart className="w-5 h-5 text-sky-600 fill-sky-600 animate-pulse" />
          <span className="font-bold text-gray-800">{hearts}</span>
        </div>
        <div className="flex items-center space-x-1.5" title="Монеты">
          <Coins className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-gray-800">{coins}</span>
        </div>
        <div className="flex items-center space-x-1.5" title="Ударный режим">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <span className="font-bold text-gray-800">{streak}</span>
        </div>
      </div>

      {/* Горизонтальное меню навигации в шапке */}
      <div className="hidden md:flex items-center space-x-1 bg-gray-50 p-1 rounded-2xl border border-gray-100">
        <button
          onClick={() => onViewChange?.('home')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center space-x-2
            ${currentView === 'home' ? 'bg-white text-sky-600 shadow-sm border border-gray-100/30' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Book className="w-4 h-4" />
          <span>ОБУЧЕНИЕ</span>
        </button>
        <button
          onClick={() => onViewChange?.('consultant')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center space-x-2
            ${currentView === 'consultant' ? 'bg-white text-sky-600 shadow-sm border border-gray-100/30' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>ИИ КОНСУЛЬТАНТ</span>
        </button>
        <button
          onClick={() => onViewChange?.('trainer')}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center space-x-2
            ${currentView === 'trainer' ? 'bg-white text-sky-600 shadow-sm border border-gray-100/30' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>ИИ-ТРЕНЕР</span>
        </button>
        <button
          onClick={() => onSkillsCheckClick?.()}
          className="px-4 py-2 rounded-xl font-black text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-all flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4 text-sky-600 fill-sky-200 animate-pulse" />
          <span>ПРОВЕРКА НАВЫКОВ</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Опыт (XP)</span>
          <span className="font-black text-sky-600 tracking-tight text-sm mt-0.5">{xp}</span>
        </div>
        
        {/* Кнопка настроек (шестеренка) */}
        <button 
          onClick={onSettingsClick}
          className="p-2 text-gray-400 hover:text-sky-600 bg-gray-50 hover:bg-sky-50 rounded-xl transition-all cursor-pointer border border-gray-100"
          title="Настройки профиля"
          id="header-settings-button"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button 
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 border-2 border-gray-100 hover:border-sky-200 transition-all overflow-hidden cursor-pointer"
        >
          <img 
            src={avatarUrl || "/StudentFace.png"} 
            alt="Аватар профиля" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // Fallback if image fails
              (e.currentTarget as HTMLImageElement).src = "https://i.pravatar.cc/100?u=1c_master_avatar";
            }}
          />
        </button>
      </div>
    </header>
  );
};

export default Header;