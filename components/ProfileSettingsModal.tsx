import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, LogOut, Check, Upload, HelpCircle, Volume2, VolumeX, Save, Users } from 'lucide-react';
import { UserProgress } from '../types';
import { supabase } from '../services/supabase';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  session: any;
  isSupabaseConfigured: boolean;
  isGuest: boolean;
  onShowPrivacy: () => void;
  onShowInstructions: () => void;
  onShowAboutUs: () => void;
  onLogout: () => void;
  setToast: (msg: string | null) => void;
}

const PREDEFINED_AVATARS = [
  { id: 'student', url: '/StudentFace.png', label: 'Студент' },
  { id: 'max_neutral', url: '/max_avatar-1.png', label: 'Макс' },
  { id: 'buh', url: 'https://i.pravatar.cc/100?u=buh_1c', label: 'Бухгалтер' },
  { id: 'dev', url: 'https://i.pravatar.cc/100?u=dev_1c', label: 'Разработчик' }
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  progress,
  onUpdateProgress,
  session,
  isSupabaseConfigured,
  isGuest,
  onShowPrivacy,
  onShowInstructions,
  onShowAboutUs,
  onLogout,
  setToast
}) => {
  const initialName = progress.name ||
                      session?.user?.user_metadata?.display_name || 
                      session?.user?.email?.split('@')[0] || 
                      progress.role || 
                      'Специалист 1С';
                      
  const [displayName, setDisplayName] = useState(initialName);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sound_enabled') !== 'false'; // true by default
  });
  const [savingName, setSavingName] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setToast("Размер файла не должен превышать 2 МБ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = { ...progress, avatarUrl: reader.result };
        onUpdateProgress(updated);
        setToast("Аватар успешно загружен и установлен!");
      }
    };
    reader.onerror = () => {
      setToast("Ошибка при чтении файла");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  useEffect(() => {
    setDisplayName(initialName);
  }, [session, progress.role, progress.name]);

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      setToast("Имя не может быть пустым");
      return;
    }
    setSavingName(true);
    try {
      if (isSupabaseConfigured && session?.user) {
        const { error } = await supabase.auth.updateUser({
          data: { display_name: displayName.trim() }
        });
        if (error) throw error;
      }
      onUpdateProgress({ ...progress, name: displayName.trim() });
      setToast("Имя профиля успешно сохранено!");
    } catch (err: any) {
      console.error(err);
      setToast("Ошибка при сохранении имени в Supabase: " + (err.message || err));
    } finally {
      setSavingName(false);
    }
  };

  const handleSoundToggle = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('sound_enabled', String(nextState));
    setToast(nextState ? "Звуковые эффекты включены" : "Звуковые эффекты выключены");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast("Размер файла не должен превышать 2 МБ");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const updated = { ...progress, avatarUrl: reader.result };
          onUpdateProgress(updated);
          setToast("Аватар успешно загружен и установлен!");
        }
      };
      reader.onerror = () => {
        setToast("Ошибка при чтении файла");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPredefined = (url: string, label: string) => {
    const updated = { ...progress, avatarUrl: url };
    onUpdateProgress(updated);
    setToast(`Установлен готовый аватар "${label}"`);
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white flex flex-col h-screen w-screen animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-sky-600 to-indigo-650 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-black uppercase tracking-wider">Настройки профиля</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Centered Scrollable Content */}
      <div className="flex-grow overflow-y-auto px-6 md:px-12 py-8 space-y-8 custom-scrollbar max-w-3xl mx-auto w-full">
        
        {/* Username Section */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Имя пользователя</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-grow border border-gray-200 px-4 py-3.5 rounded-2xl text-sm font-bold bg-gray-50 text-gray-850 outline-none focus:border-sky-500 transition-colors uppercase tracking-wider"
              placeholder="ВВЕДИТЕ ИМЯ"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 rounded-2xl flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingName ? '...' : <Save className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sound choice Section */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Звук в приложении</span>
            <p className="text-xs font-bold text-slate-500 leading-none">Озвучка вопросов и звуковые эффекты</p>
          </div>
          <button
            onClick={handleSoundToggle}
            className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center space-x-2.5 cursor-pointer
              ${soundEnabled ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
          >
            {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            <span>{soundEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}</span>
          </button>
        </div>

        {/* Avatar Section */}
        <div className="pt-6 border-t border-gray-100 space-y-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Настройка аватара</span>
          
          {/* Current Avatar & Drag-and-Drop Area */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[28px] p-8 text-center transition-all flex flex-col items-center justify-center space-y-4
              ${isDragging ? 'border-sky-500 bg-sky-50/80 scale-[1.01]' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'}
            `}
          >
            <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
              <img 
                src={progress.avatarUrl || "/StudentFace.png"} 
                alt="Текущий аватар" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Перетащите сюда файл своей фотографии</p>
              <p className="text-[10px] font-bold text-gray-400">или нажмите кнопку ниже, чтобы загрузить собственный аватар:</p>
            </div>

            {/* Upload Button */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                id="modal-avatar-file-input"
                className="hidden"
              />
              <label
                htmlFor="modal-avatar-file-input"
                className="px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-lg shadow-sky-100 transition-all active:scale-95"
              >
                <Upload className="w-4.5 h-4.5" />
                <span>ВЫБРАТЬ ИЗОБРАЖЕНИЕ</span>
              </label>
            </div>
          </div>

          {/* Predefined Avatars Picker */}
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Или выберите готового персонажа</p>
            <div className="flex flex-wrap items-center gap-4">
              {PREDEFINED_AVATARS.map(av => (
                <button
                  key={av.id}
                  onClick={() => handleSelectPredefined(av.url, av.label)}
                  className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer
                    ${progress.avatarUrl === av.url ? 'border-sky-600 shadow-xl scale-105 opacity-100' : 'border-gray-200 opacity-60'}
                  `}
                  title={av.label}
                >
                  <img src={av.url} className="w-full h-full object-cover" alt={av.label} />
                </button>
              ))}
            </div>
          </div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Поддерживается загрузка изображений PNG, JPG до 2 МБ</p>
        </div>

        {/* Documents Section */}
        <div className="pt-6 border-t border-gray-100 space-y-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Информация и соглашения</span>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onShowAboutUs}
              className="p-3 text-center border border-gray-100 rounded-2xl hover:bg-gray-50 flex flex-col items-center justify-center space-y-1.5 transition-colors group cursor-pointer"
            >
              <Users className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
              <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-black leading-tight">О нас</span>
            </button>
            <button
              onClick={onShowInstructions}
              className="p-3 text-center border border-gray-100 rounded-2xl hover:bg-gray-50 flex flex-col items-center justify-center space-y-1.5 transition-colors group cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
              <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-black leading-tight">Инструкция</span>
            </button>
            <button
              onClick={onShowPrivacy}
              className="p-3 text-center border border-gray-100 rounded-2xl hover:bg-gray-50 flex flex-col items-center justify-center space-y-1.5 transition-colors group cursor-pointer"
            >
              <Lock className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
              <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-black leading-tight">Приватность</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer with Logout */}
      <div className="p-6 bg-gray-50 border-t border-gray-150 shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-center shadow-inner">
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="w-full sm:w-auto px-8 py-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>{isGuest ? 'ВЫЙТИ ИЗ РЕЖИМА ГОСТЯ' : 'ВЫЙТИ ИЗ АККАУНТА'}</span>
        </button>
        
        <button
          onClick={onClose}
          className="w-full sm:flex-grow max-w-lg py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center cursor-pointer transition-all active:scale-95"
        >
          ЗАКРЫТЬ НАСТРОЙКИ
        </button>
      </div>

    </div>
  );
};
