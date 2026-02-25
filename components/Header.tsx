
import React from 'react';
import { Heart, Coins, Flame, User } from 'lucide-react';

interface HeaderProps {
  hearts: number;
  coins: number;
  streak: number;
  xp: number;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ hearts, coins, streak, xp, onProfileClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4 md:space-x-8">
        <div className="flex items-center space-x-1.5" title="Жизни">
          <Heart className="w-5 h-5 text-sky-600 fill-sky-600" />
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
      
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Опыт (XP)</span>
          <span className="font-black text-sky-600 leading-none">{xp}</span>
        </div>
        <button 
          onClick={onProfileClick}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-200"
        >
          <User className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </header>
  );
};

export default Header;
