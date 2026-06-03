import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Mail, Lock, Loader2, Sparkles, LogIn, UserPlus, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
  onGuestMode: () => void;
  onShowPrivacy: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onGuestMode, onShowPrivacy }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(true);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);

  const translateError = (err: any) => {
    const message = err.message || '';
    if (message.includes('Invalid login credentials')) return 'Неверный email или пароль';
    if (message.includes('Email not confirmed')) return 'Email не подтвержден. Пожалуйста, проверьте почту';
    if (message.includes('Password should be at least 6 characters')) return 'Пароль должен быть не менее 6 символов';
    if (message.includes('User already registered')) return 'Пользователь с таким email уже существует';
    if (message.includes('Signup disabled')) return 'Регистрация временно отключена';
    return message || 'Произошла ошибка';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !agreedToPrivacy) {
      setShowPrivacyWarning(true);
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else {
        if (!displayName.trim()) throw new Error('Пожалуйста, введите ваше имя');
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              display_name: displayName
            }
          }
        });
        if (error) throw error;
        setShowSuccess(true);
      }
    } catch (err: any) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  if (showPrivacyWarning) {
    return (
      <div className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Доступ ограничен</h2>
          <p className="text-gray-500 font-bold leading-relaxed mb-8">
            К сожалению, без согласия с политикой конфиденциальности работа в приложении невозможна.
          </p>
          <button
            onClick={() => setShowPrivacyWarning(false)}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all transform active:scale-95"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Почти готово!</h2>
          <p className="text-gray-500 font-bold leading-relaxed mb-8">
            Мы отправили письмо для подтверждения на <span className="text-sky-600">{email}</span>. 
            Пожалуйста, перейдите по ссылке в письме, чтобы активировать аккаунт.
          </p>
          <button
            onClick={() => {
              setShowSuccess(false);
              setIsLogin(true);
            }}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all transform active:scale-95"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1050] bg-transparent flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3">
            <Sparkles className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">1С Мастер</h1>
          {!isSupabaseConfigured && (
            <div className="mt-2.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-xl inline-block border border-amber-200">
              Режим офлайн • Используйте гостевой вход
            </div>
          )}
          <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">
            {isLogin ? 'С возвращением!' : 'Создать аккаунт'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Имя пользователя</label>
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  placeholder="Как вас называть?"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                placeholder="example@mail.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-4">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-sky-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="flex items-start space-x-3 px-2 py-2">
              <input
                type="checkbox"
                id="privacy"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="privacy" className="text-[10px] font-bold text-gray-500 leading-tight cursor-pointer">
                Я согласен с <button type="button" onClick={onShowPrivacy} className="text-sky-600 hover:underline">политикой конфиденциальности</button> и обработкой персональных данных
              </label>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-sky-200 transition-all transform active:scale-95 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                <span>{isLogin ? 'Войти' : 'Зарегистрироваться'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col space-y-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-gray-400 hover:text-sky-600 font-black text-[10px] uppercase tracking-widest transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[8px] uppercase font-black">
              <span className="bg-white px-2 text-gray-300 tracking-widest">ИЛИ</span>
            </div>
          </div>

          <button
            onClick={onGuestMode}
            className="text-sky-600 hover:text-sky-700 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
          >
            <span>Войти в гостевой режим</span>
          </button>
        </div>
      </div>
    </div>
  );
};
