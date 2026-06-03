import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { UserRole, UserSpecialization, UserProgress, Lesson, SkillLevel, KBItem } from './types';
import { ROLE_DATA, SPECIALIZATION_DATA, INITIAL_LESSONS, OneCLogo } from './constants';
import LessonScreen from './components/LessonScreen';
import AdminPanel from './components/AdminPanel';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Auth } from './components/Auth';
import PrivacyPolicy from './components/PrivacyPolicy';
import SplashScreen from './components/SplashScreen';
import ConsultantMode from './components/ConsultantMode';
import AITrainer from './components/AITrainer';
import { InitialTesting } from './components/InitialTesting';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { InstructionsModal } from './components/InstructionsModal';
import { AboutUsModal } from './components/AboutUsModal';
import CharacterAvatar from './components/CharacterAvatar';

// Добавлен Sparkles, MessageSquare в список импортов, а также Loader2, Upload
import { Trophy, Book, Users, ShoppingBag, Settings, ChevronRight, Zap, Crown, Star, Heart, Coins, BrainCircuit, ShieldCheck, Lock, Layers, BarChart, Bell, Info, X, Check, Sparkles, Loader2, MessageSquare, HelpCircle, Upload } from 'lucide-react';

const normalizeUserRole = (role: any): UserRole => {
  if (!role) return UserRole.DEVELOPER;
  const r = String(role).trim().toUpperCase();
  if (r === 'DEVELOPER' || r === 'DEVELOPER_1C' || r === 'РАЗРАБОТЧИК') {
    return UserRole.DEVELOPER;
  }
  if (r === 'ACCOUNTANT' || r === 'BUHGALTER' || r === 'БУХГАЛТЕР') {
    return UserRole.ACCOUNTANT;
  }
  if (r === 'SALES' || r === 'MANAGER' || r === 'МЕНЕДЖЕР' || r === 'МЕНЕДЖЕР ПО ПРОДАЖАМ') {
    return UserRole.SALES;
  }
  if (r === 'ADMINISTRATOR' || r === 'ADMIN' || r === 'АДМИНИСТРАТОР 1С' || r === 'АДМИНИСТРАТОР') {
    return UserRole.ADMINISTRATOR;
  }
  if (r === 'USER' || r === 'ПОЛЬЗОВАТЕЛЬ') {
    return UserRole.USER;
  }
  for (const val of Object.values(UserRole)) {
    if (String(val).toUpperCase() === r) {
      return val as UserRole;
    }
  }
  return UserRole.DEVELOPER;
};

const normalizeSpecialization = (spec: any, role: UserRole): UserSpecialization => {
  if (!spec) {
    if (role === UserRole.DEVELOPER) return UserSpecialization.COMMON;
    if (role === UserRole.ACCOUNTANT) return UserSpecialization.ACC;
    if (role === UserRole.SALES) return UserSpecialization.UNF;
    if (role === UserRole.ADMINISTRATOR) return UserSpecialization.ADMIN;
    return UserSpecialization.COMMON;
  }
  
  const s = String(spec).trim().toUpperCase();
  
  if (s === 'DEVELOPER' || s === 'COMMON' || s === 'ОБЩАЯ') {
    return UserSpecialization.COMMON;
  }
  if (s === 'ACC' || s === 'ACCOUNTANT' || s === '1С:БУХГАЛТЕРИЯ') {
    return UserSpecialization.ACC;
  }
  if (s === 'UNF' || s === 'MANAGER' || s === '1С:УНФ') {
    return UserSpecialization.UNF;
  }
  if (s === 'UT' || s === '1С:УПРАВЛЕНИЕ ТОРГОВЛЕЙ') {
    return UserSpecialization.UT;
  }
  if (s === 'KA' || s === '1С:КОМПЛЕКСНАЯ АВТОМАТИЗАЦИЯ') {
    return UserSpecialization.KA;
  }
  if (s === 'ERP' || s === '1С:ERP') {
    return UserSpecialization.ERP;
  }
  if (s === 'ADMIN' || s === 'ADMIN_1C' || s === 'АДМИНИСТРИРОВАНИЕ 1С') {
    return UserSpecialization.ADMIN;
  }
  
  for (const val of Object.values(UserSpecialization)) {
    if (String(val).toUpperCase() === s) {
      return val as UserSpecialization;
    }
  }
  
  if (role === UserRole.DEVELOPER) return UserSpecialization.COMMON;
  if (role === UserRole.ACCOUNTANT) return UserSpecialization.ACC;
  return UserSpecialization.COMMON;
};

const fetchWithRetry = async (url: string, options?: RequestInit, maxRetries = 3, delayMs = 1500): Promise<Response> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      // If response is not ok (e.g., 502/503 from backend rebuilding), count as retryable error
      throw new Error(`Server returned ${response.status}`);
    } catch (err) {
      lastError = err;
      console.warn(`Fetch to ${url} failed (attempt ${i + 1}/${maxRetries}):`, err);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  
  // Состояния для вступительного режима
  const [soundChoiceMade, setSoundChoiceMade] = useState(() => {
    return localStorage.getItem('sound_enabled') !== null;
  });
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem('splash_finished') !== 'true';
    } catch (e) {
      return true;
    }
  });
  const [showInitialTesting, setShowInitialTesting] = useState(false);
  
  // Состояние Базы Знаний
  const [kbItems, setKbItems] = useState<KBItem[]>([]);
  const [kbSections, setKbSections] = useState<any[]>([]);
  const [selectedSectionForTest, setSelectedSectionForTest] = useState<any | null>(null);

  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const cached = localStorage.getItem('user_progress');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.avatarUrl) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Ошибка извлечения кэшированного прогресса:", e);
    }
    return {
      xp: 1250,
      coins: 450,
      hearts: 5,
      streak: 7,
      level: 1, // По умолчанию начинаем с 1 уровня
      role: UserRole.DEVELOPER,
      specialization: UserSpecialization.COMMON,
      aiDifficulty: 5,
      isAdmin: false,
      avatarUrl: "/StudentFace.png"
    };
  });

  // Автоматическое сохранение изменений прогресса в локальный кэш
  useEffect(() => {
    try {
      localStorage.setItem('user_progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Ошибка записи прогресса в кэш:', e);
    }
  }, [progress]);

  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [view, setView] = useState<'home' | 'leaderboard' | 'shop' | 'profile' | 'admin' | 'consultant' | 'trainer' | 'skills_check'>('home');
  const [toast, setToast] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  // Сброс состояния, очистка токенов и полный перезапуск приложения
  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured) {
        // Быстрый выход с ограничением времени во избежание зависания в песочнице iframe
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 500))
        ]).catch(() => {});
      }
    } catch (err) {
      console.error("Ошибка при выходе из Supabase:", err);
    } finally {
      // Полная надежная очистка хранилищ данных для сброса всех сессий и токенов
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        console.error("Ошибка при очистке хранилища:", storageErr);
      }
      
      setSession(null);
      setIsGuest(false);
      setView('home');
      setToast("Выход из аккаунта выполняется...");
      
      // Сброс прогресса
      setProgress({
        xp: 1250,
        coins: 450,
        hearts: 5,
        streak: 7,
        level: 1,
        role: UserRole.DEVELOPER,
        specialization: UserSpecialization.COMMON,
        aiDifficulty: 5,
        isAdmin: false,
        avatarUrl: "/StudentFace.png"
      });
      
      // Полный перезапуск приложения для возвращения на экран авторизации
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // 1. Инициализация и отслеживание сессии авторизации Supabase
  const fetchingProfileUserId = React.useRef<string | null>(null);


  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    // Предохранительный таймаут: максимум 3.5 секунды во избежание бесконечной загрузки
    const authTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Авторизация Supabase превысила лимит времени. Снятие блокировки экрана.');
        setAuthLoading(false);
      }
    }, 3500);

    // Слушаем изменения авторизации.
    // Supabase вызывает этот коллбек сразу после подписки с текущей сессией (event = INITIAL_SESSION).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      console.log('Событие авторизации Supabase:', event, 'Сессия:', !!newSession);

      if (newSession) {
        setAuthLoading(true); // Защищаем от преждевременной перезаписи профиля
        setSession(newSession);
        await fetchProfile(newSession.user.id, newSession);
        clearTimeout(authTimeout);
      } else {
        setSession(null);
        setIsGuest(false);
        
        // Попытаемся извлечь из кэша перед тем как сбрасывать в дефолты во избежание затирания кастомного аватара!
        let loadedFromCache = false;
        try {
          const cached = localStorage.getItem('user_progress');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object' && parsed.avatarUrl) {
              setProgress(parsed);
              loadedFromCache = true;
            }
          }
        } catch (e) {
          console.warn("Ошибка извлечения кэшированного прогресса в onAuthStateChange:", e);
        }

        if (!loadedFromCache) {
          setProgress({
            xp: 1250,
            coins: 450,
            hearts: 5,
            streak: 7,
            level: 1,
            role: UserRole.DEVELOPER,
            specialization: UserSpecialization.COMMON,
            aiDifficulty: 5,
            isAdmin: false,
            avatarUrl: "/StudentFace.png"
          });
        }
        setAuthLoading(false);
        clearTimeout(authTimeout);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  // 2. Запрос профиля из базы данных Supabase
  const fetchProfile = async (userId: string, currentSession: any) => {
    if (fetchingProfileUserId.current === userId) {
      console.log('Запрос профиля уже выполняется для пользователя:', userId);
      return;
    }

    try {
      fetchingProfileUserId.current = userId;
      setAuthLoading(true);

      const timeoutPromise = new Promise<{ data: null, error: { message: string, code: string } }>((_, reject) =>
        setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), 3200)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      let result: any;
      try {
        result = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (raceErr: any) {
        if (raceErr.message === 'SUPABASE_TIMEOUT') {
          console.warn("Таймаут запроса профиля из Supabase. Используем дефолтные значения.");
          result = { data: null, error: { code: 'PGRST116', message: 'Request timed out' } };
        } else {
          throw raceErr;
        }
      }

      const { data: profile, error } = result;

      if (error) {
        if (error.code === 'PGRST116') {
          // Профиль не найден - автоматически создаем начальный
          const email = currentSession?.user?.email;
          const defaultDisplayName = email ? email.split('@')[0] : 'Специалист 1С';
          
          // Определяем, является ли пользователь суперадмином/админом по умолчанию по переданным почтам
          const isDefaultAdmin = email === 'felixgr@yandex.ru' || email === 'remcomarketplace@gmail.com';

          const newProfile = {
            id: userId,
            display_name: defaultDisplayName,
            xp: 1250,
            coins: 450,
            hearts: 5,
            streak: 7,
            level: 1,
            role: UserRole.DEVELOPER,
            specialization: UserSpecialization.COMMON,
            calculated_difficulty: 5,
            is_admin: isDefaultAdmin,
            is_superadmin: isDefaultAdmin,
            avatar_url: "/StudentFace.png"
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);

          if (insertError) {
            console.error('Ошибка при создании профиля в Supabase:', insertError);
          }

          setProgress({
            xp: 1250,
            coins: 450,
            hearts: 5,
            streak: 7,
            level: 1,
            role: UserRole.DEVELOPER,
            specialization: UserSpecialization.COMMON,
            aiDifficulty: 5,
            isAdmin: isDefaultAdmin,
            avatarUrl: "/StudentFace.png",
            name: defaultDisplayName
          });
        } else {
          console.error('Ошибка базы данных при получении профиля:', error);
          // В случае сетевой ошибки или ошибки прав инициализируем дефолтный профиль во избежание зависания
          const email = currentSession?.user?.email;
          const isDefaultAdmin = email === 'felixgr@yandex.ru' || email === 'remcomarketplace@gmail.com';
          setProgress({
            xp: 1250,
            coins: 450,
            hearts: 5,
            streak: 7,
            level: 1,
            role: UserRole.DEVELOPER,
            specialization: UserSpecialization.COMMON,
            aiDifficulty: 5,
            isAdmin: isDefaultAdmin,
            avatarUrl: "/StudentFace.png",
            name: email ? email.split('@')[0] : 'Специалист 1С'
          });
        }
      } else if (profile) {
        // Профиль найден - заполняем state
        const email = currentSession?.user?.email;
        // Перепроверяем админские права для указанных в запросе суперадминов
        const isSuperAdminUser = profile.is_superadmin || profile.is_admin || email === 'felixgr@yandex.ru' || email === 'remcomarketplace@gmail.com';

        setProgress({
          xp: profile.xp !== undefined ? profile.xp : 1250,
          coins: profile.coins !== undefined ? profile.coins : 450,
          hearts: profile.hearts !== undefined ? profile.hearts : 5,
          streak: profile.streak !== undefined ? profile.streak : 7,
          level: profile.level !== undefined ? profile.level : 1,
          role: (profile.role as UserRole) || UserRole.DEVELOPER,
          specialization: (profile.specialization as UserSpecialization) || UserSpecialization.COMMON,
          aiDifficulty: profile.calculated_difficulty ? Math.round(Number(profile.calculated_difficulty)) : 5,
          isAdmin: isSuperAdminUser,
          avatarUrl: profile.avatar_url || "/StudentFace.png",
          name: profile.display_name || email?.split('@')[0] || 'Специалист 1С'
        });
      }
    } catch (e) {
      console.error('Исключительная ошибка при загрузке профиля из Supabase:', e);
    } finally {
      fetchingProfileUserId.current = null;
      setAuthLoading(false);
    }
  };

  // 3. Автоматическое сохранение изменений прогресса в Supabase
  const saveProgressToSupabase = async (updatedProgress: UserProgress) => {
    if (!isSupabaseConfigured || !session?.user) return;

    try {
      const email = session.user.email;
      const isDefaultAdmin = email === 'felixgr@yandex.ru' || email === 'remcomarketplace@gmail.com';
      
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          display_name: updatedProgress.name || session.user.email?.split('@')[0] || 'Специалист 1С',
          xp: updatedProgress.xp,
          coins: updatedProgress.coins,
          hearts: updatedProgress.hearts,
          streak: updatedProgress.streak,
          level: updatedProgress.level,
          role: updatedProgress.role,
          specialization: updatedProgress.specialization,
          calculated_difficulty: updatedProgress.aiDifficulty,
          is_admin: updatedProgress.isAdmin || isDefaultAdmin,
          is_superadmin: isDefaultAdmin,
          avatar_url: updatedProgress.avatarUrl || "/StudentFace.png",
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.error('Error saving progress to Supabase:', e);
    }
  };

  // Эффект на отслеживание изменений прогресса для синхронизации
  useEffect(() => {
    if (!isSupabaseConfigured || authLoading || !session?.user) return;
    
    // Используем дебаунс или просто вызываем сохранение
    const timeoutId = setTimeout(() => {
      saveProgressToSupabase(progress);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [progress, authLoading, session]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Загрузка базы знаний для Консультанта и ИИ-Тренера
  useEffect(() => {
    const loadKb = async () => {
      try {
        const resp = await fetchWithRetry('/api/kb');
        if (resp.ok) {
          const contentType = resp.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await resp.json();
            if (Array.isArray(data)) {
              setKbItems(data);
            }
          } else {
            console.warn("Получен не-JSON ответ от /api/kb.");
          }
        }
      } catch (err) {
        console.error("Ошибка при загрузке базы знаний:", err);
      }
    };
    loadKb();
  }, []);

  // Загрузка Разделов Базы Знаний
  useEffect(() => {
    const loadKbSections = async () => {
      try {
        const resp = await fetchWithRetry('/api/kb_sections');
        if (resp.ok) {
          const contentType = resp.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await resp.json();
            if (Array.isArray(data)) {
              setKbSections(data);
            }
          } else {
            console.warn("Получен не-JSON ответ от /api/kb_sections.");
          }
        }
      } catch (err) {
        console.error("Ошибка при загрузке разделов базы знаний:", err);
      }
    };
    loadKbSections();
  }, [view]); // reload when view switches

  const lessonsLoadedRef = React.useRef(false);

  // Загрузка уроков из API
  useEffect(() => {
    const loadLessons = async () => {
      try {
        const resp = await fetchWithRetry('/api/lessons');
        if (resp.ok) {
          const contentType = resp.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              const normalized = data.map((l: any) => {
                const rule_role = normalizeUserRole(l.role);
                const rule_spec = normalizeSpecialization(l.specialization, rule_role);
                return {
                  ...l,
                  role: rule_role,
                  specialization: rule_spec
                };
              });
              setLessons(normalized);
            }
          } else {
            console.warn("Получен не-JSON ответ от /api/lessons.");
          }
        }
      } catch (err) {
        console.error("Ошибка при загрузке уроков:", err);
      } finally {
        lessonsLoadedRef.current = true;
      }
    };
    loadLessons();
  }, []);

  // Автоматическое сохранение уроков при их изменении в админке
  useEffect(() => {
    if (!lessonsLoadedRef.current) {
      return;
    }
    const saveLessons = async () => {
      try {
        await fetch('/api/lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lessons)
        });
      } catch (err) {
        console.error("Ошибка при авто-сохранении уроков:", err);
      }
    };
    saveLessons();
  }, [lessons]);


  const handleRoleChange = (role: UserRole) => {
    setProgress(prev => ({ ...prev, role }));
  };

  const handleSpecializationChange = (specialization: UserSpecialization) => {
    if (specialization !== UserSpecialization.COMMON) {
      setToast("Будет реализовано в следующих версиях. Подписывайтесь на уведомления об обновлениях");
      return;
    }
    setProgress(prev => ({ ...prev, specialization }));
  };

  const handleLevelChange = (level: number) => {
    setProgress(prev => ({ ...prev, level }));
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setProgress(prev => ({ ...prev, aiDifficulty: value }));
  };

  const toggleAdmin = () => {
    setProgress(prev => ({ ...prev, isAdmin: !prev.isAdmin }));
    if (view === 'admin') setView('home');
  };

  const handleLessonFinish = (xp: number, coins: number, heartChange: number) => {
    setProgress(prev => ({
      ...prev,
      xp: prev.xp + xp,
      coins: prev.coins + coins,
      hearts: Math.max(0, prev.hearts + heartChange),
      streak: prev.streak + 1
    }));
    setActiveLesson(null);
    setView('home');
  };

  const currentFilteredLessons = lessons.filter(l => 
    l.role === progress.role && 
    l.specialization === progress.specialization &&
    l.level === progress.level
  );

  const PricingModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={() => setShowPricing(false)}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-[900] text-gray-900 mb-2 uppercase tracking-tight">Выберите свой план</h2>
            <p className="text-gray-500 font-bold">Инвестируйте в свои знания платформы 1С</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                name: 'Минимальный', 
                price: '99', 
                ai: '100 запросов к ИИ/мес', 
                features: ['Без рекламы', 'Базовые уроки', 'Поддержка 24/7'],
                color: 'sky'
              },
              { 
                name: 'Оптимальный', 
                price: '199', 
                ai: '500 запросов к ИИ/мес', 
                features: ['Без рекламы', 'Все спецкурсы', 'Приоритетный ИИ'],
                color: 'purple',
                popular: true
              },
              { 
                name: 'Корпоративный', 
                price: '299', 
                ai: 'Безлимитный ИИ', 
                features: ['Без рекламы', 'Командный доступ', 'Личный куратор'],
                color: 'orange'
              }
            ].map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative p-8 rounded-[32px] border-2 transition-all hover:scale-[1.02] flex flex-col h-full
                  ${plan.popular ? 'border-sky-500 bg-sky-50/30' : 'border-gray-100 bg-white'}
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Популярный
                  </div>
                )}
                <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline space-x-1 mb-6">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 font-bold text-sm">руб/мес</span>
                </div>
                
                <div className="flex-grow space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-xs font-black text-gray-700">{plan.ai}</span>
                  </div>
                  {plan.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setToast("Подписка будет реализована в следующих версиях")}
                  className={`w-full py-4 rounded-2xl font-black text-xs transition-all
                    ${plan.popular ? 'bg-sky-600 text-white shadow-lg' : 'bg-gray-900 text-white'}
                  `}
                >
                  ВЫБРАТЬ ПЛАН
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center space-x-3">
            <Info className="w-5 h-5 text-orange-600 shrink-0" />
            <p className="text-[10px] font-black text-orange-800 uppercase leading-tight">
              Внимание: Система оплаты и подписка будут реализованы в следующих версиях приложения.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // 1. Сначала спрашиваем настройки звука, если это первый запуск
  if (!soundChoiceMade) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-900 to-sky-950 opacity-90" />
        
        <div className="relative z-10 max-w-sm w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl flex flex-col items-center animate-in zoom-in duration-500">
          <div className="p-4 bg-white/10 rounded-3xl border border-white/10 mb-6">
            <span className="text-4xl">🎓</span>
          </div>
          
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">1С-МАСТЕР</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8 leading-relaxed">
            Интерактивный тренажер для специалистов 1С
          </p>

          <div className="space-y-3 w-full">
            <button
              onClick={() => {
                localStorage.setItem('sound_enabled', 'true');
                setSoundChoiceMade(true);
              }}
              className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black text-xs hover:bg-sky-500 shadow-xl shadow-sky-955/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
            >
              🚀 ЗАПУСТИТЬ СО ЗВУКОМ
            </button>
            <button
              onClick={() => {
                localStorage.setItem('sound_enabled', 'false');
                setSoundChoiceMade(true);
              }}
              className="w-full py-4 border-2 border-white/10 text-gray-300 rounded-2xl font-black text-xs hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
            >
              🔇 НЕ МОГУ СЛУШАТЬ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Показываем полноценный SplashScreen с видеороликом, пока видео проигрывается
  // ИЛИ пока загружаются данные. Это гарантирует непрерывную плавную заставку без разрывов и двойных экранов загрузки!
  const isSplashFinished = () => {
    try {
      return sessionStorage.getItem('splash_finished') === 'true';
    } catch (e) {
      return false;
    }
  };

  if (showSplash || (isSupabaseConfigured && authLoading && !isSplashFinished())) {
    return (
      <SplashScreen 
        loadingText="Загрузка данных..." 
        onFinished={() => {
          try {
            sessionStorage.setItem('splash_finished', 'true');
          } catch (e) {}
          setShowSplash(false);
        }} 
      />
    );
  }

  // 3. Если запущено проф-тестирование
  if (showInitialTesting) {
    return (
      <InitialTesting 
        availableExercises={lessons.flatMap(l => l.exercises)}
        onCancel={() => setShowInitialTesting(false)}
        onComplete={(skillLevel, difficulty, spec) => {
          setProgress(prev => ({
            ...prev,
            aiDifficulty: Math.round(difficulty),
            specialization: spec,
            level: skillLevel === SkillLevel.BEGINNER ? 1 
                 : skillLevel === SkillLevel.INTERMEDIATE ? 3 
                 : skillLevel === SkillLevel.ADVANCED ? 4 
                 : 5
          }));
          setShowInitialTesting(false);
          setToast(`Вы определили ваш уровень сложности! Назначен уровень сложности ${Math.round(difficulty)}/10, специализация: ${spec}`);
        }}
      />
    );
  }

  if (!session && !isGuest) {
    return (
      <>
        {showPrivacyPolicy && (
          <PrivacyPolicy 
            onAccept={() => {
              setShowPrivacyPolicy(false);
              localStorage.setItem('privacy_agreed', 'true');
            }} 
            onClose={() => setShowPrivacyPolicy(false)}
            showClose={true}
          />
        )}
        <Auth 
          onAuthSuccess={() => {
            // Успешный вход обрабатывается подпиской onAuthStateChange
          }}
          onGuestMode={() => {
            setIsGuest(true);
          }}
          onShowPrivacy={() => {
            setShowPrivacyPolicy(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pl-64">
      {showPricing && <PricingModal />}
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-start space-x-3 border border-white/10">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">{toast}</p>
          </div>
        </div>
      )}

      <Header 
        xp={progress.xp}
        coins={progress.coins}
        hearts={progress.hearts}
        streak={progress.streak}
        onProfileClick={() => setView('profile')}
        avatarUrl={progress.avatarUrl}
        currentView={view}
        onViewChange={(newView) => setView(newView)}
        onSkillsCheckClick={() => setView('skills_check')}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex-col py-8 px-4 z-40 shadow-sm">
        <div className="flex items-center px-4 mb-10 space-x-3">
          <OneCLogo className="w-9 h-9" />
          <span className="text-xl font-black text-gray-900 tracking-tight">1С-МАСТЕР</span>
        </div>

        <nav className="flex-grow space-y-1">
          {[
            { id: 'home', icon: Book, label: 'ОБУЧЕНИЕ' },
            { id: 'consultant', icon: MessageSquare, label: 'ИИ КОНСУЛЬТАНТ' },
            { id: 'trainer', icon: BrainCircuit, label: 'ИИ-ТРЕНЕР' },
            { id: 'skills_check', icon: Sparkles, label: 'ПРОВЕРКА НАВЫКОВ' },
            { id: 'leaderboard', icon: Trophy, label: 'ЛИДЕРЫ' },
            { id: 'shop', icon: ShoppingBag, label: 'МАГАЗИН' },
            { id: 'profile', icon: Users, label: 'ПРОФИЛЬ' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl font-black text-xs transition-all
                ${view === item.id ? 'bg-sky-50 text-black border border-sky-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
          
          {progress.isAdmin && (
            <button
              onClick={() => setView('admin')}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-2xl font-black text-xs transition-all
                ${view === 'admin' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}
              `}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>АДМИНКА</span>
            </button>
          )}
        </nav>

        <div className="mt-auto space-y-3.5 pt-4 border-t border-gray-50">
          <div className="flex items-center justify-between px-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <button 
              onClick={() => setShowAboutUsModal(true)}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              О нас
            </button>
            <span className="text-gray-200">•</span>
            <button 
              onClick={() => setShowInstructionsModal(true)}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              Инструкция
            </button>
            <span className="text-gray-200">•</span>
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              Приватность
            </button>
          </div>

          <div 
            onClick={() => setShowPricing(true)}
            className="p-4 bg-sky-50 rounded-2xl border border-sky-100 cursor-pointer hover:bg-sky-100 transition-colors group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Crown className="text-sky-600 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-black text-sky-600 text-xs">PREMIUM</span>
            </div>
            <p className="text-[10px] text-sky-800 font-bold uppercase leading-tight">Без рекламы, безлимит жизней и ИИ-помощник</p>
          </div>
        </div>
      </aside>

      <main className="flex-grow max-w-3xl mx-auto w-full p-4 md:p-8">
        {view !== 'home' && (
          <div className="mb-6 flex items-center justify-between bg-white px-5 py-4 rounded-[24px] border border-gray-100 shadow-sm animate-in slide-in-from-top-4 duration-300">
            <button
              onClick={() => {
                setSelectedSectionForTest(null);
                setView('home');
              }}
              className="flex items-center space-x-2 text-gray-500 hover:text-sky-600 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer group"
              id="unified-home-button"
            >
              <Book className="w-4 h-4 text-gray-400 group-hover:text-sky-600 group-hover:-translate-x-0.5 transition-all" />
              <span>Вернуться к обучению</span>
            </button>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
              {view === 'consultant' && 'ИИ Консультант'}
              {view === 'trainer' && 'ИИ-Тренер'}
              {view === 'skills_check' && (selectedSectionForTest ? `Проверка навыков: ${selectedSectionForTest.title}` : 'Проверка навыков')}
              {view === 'leaderboard' && 'Таблица лидеров'}
              {view === 'profile' && 'Профиль специалиста'}
              {view === 'shop' && 'Магазин'}
              {view === 'admin' && 'Панель администратора'}
            </span>
          </div>
        )}

        {view === 'consultant' && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 min-h-[600px] flex flex-col relative z-20 animate-in slide-in-from-bottom-4 duration-500">
            <ConsultantMode 
              kbItems={kbItems} 
              onClose={() => setView('home')} 
              isGuest={isGuest}
              onUpdateKb={(newItem) => {
                setKbItems(prev => {
                  const idx = prev.findIndex(i => i.id === newItem.id);
                  if (idx !== -1) {
                    const next = [...prev];
                    next[idx] = newItem;
                    return next;
                  }
                  return [newItem, ...prev];
                });
              }}
            />
          </div>
        )}

        {view === 'trainer' && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 min-h-[600px] flex flex-col relative z-20 animate-in slide-in-from-bottom-4 duration-500">
            <AITrainer 
              role={progress.role}
              specialization={progress.specialization}
              kbItems={kbItems}
              userDifficulty={progress.aiDifficulty}
              onComplete={(xp, difficultyReached) => {
                setProgress(prev => {
                  const nextXp = prev.xp + xp;
                  const nextDifficulty = difficultyReached !== undefined ? difficultyReached : prev.aiDifficulty;
                  return {
                    ...prev,
                    xp: nextXp,
                    aiDifficulty: nextDifficulty
                  };
                });
                setToast(`Поздравляем! Получено +${xp} XP в ИИ-тренере!`);
              }}
              onClose={() => setView('home')}
              isGuest={isGuest}
              isAdmin={progress.isAdmin}
              onUpdateKB={setKbItems}
            />
          </div>
        )}

        {view === 'skills_check' && (
          <>
            {!selectedSectionForTest && (
              <div className="hidden lg:block">
                <CharacterAvatar 
                  isVisible={true} 
                  isSpeaking={false}
                  type="max"
                  position="left"
                  hasSidebar={true}
                  contentWidth="48rem"
                  bubbleText="Выбирай тему ниже, чтобы проверить свои навыки разработки и учета в 1С!"
                />
              </div>
            )}
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {selectedSectionForTest ? (
              <div className="bg-white rounded-3xl p-2 md:p-6 shadow-sm border border-gray-100 min-h-[500px]">
                <InitialTesting 
                  availableExercises={lessons.flatMap(l => l.exercises)}
                  sectionId={selectedSectionForTest.id}
                  sectionTitle={selectedSectionForTest.title}
                  hasSidebar={true}
                  onCancel={() => setSelectedSectionForTest(null)}
                  onComplete={(skillLevel, difficulty, spec) => {
                    setProgress(prev => {
                      const nextXp = prev.xp + 100; // Награда 100 XP
                      return {
                        ...prev,
                        xp: nextXp,
                        aiDifficulty: Math.round(difficulty)
                      };
                    });
                    setSelectedSectionForTest(null);
                    setToast(`Вы успешно прошли тестирование по разделу "${selectedSectionForTest.title}"! Сложность ИИ адаптирована.`);
                    setView('home');
                  }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Вводная от Макса */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 rounded-[32px] p-6 text-white border border-white/5 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 rounded-2xl shrink-0 border border-white/10 shadow-inner overflow-hidden">
                    <CharacterAvatar isVisible={true} isInline={true} type="max" />
                  </div>
                  <div className="text-center md:text-left space-y-1.5 flex-grow">
                    <p className="text-[#00c5ff] text-[10px] font-black uppercase tracking-widest leading-none">Раздел от Макса</p>
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight">Проверка навыков</h2>
                    <p className="text-[11px] font-bold text-sky-200 leading-relaxed uppercase">
                      "Привет! Я подготовил для тебя тематическое тестирование по ключевым подсистемам и разделам 1С. Выбирай интересующую тему ниже, проверь себя и прокачай свои показатели!"
                    </p>
                  </div>
                </div>

                {/* Общий тест */}
                <div 
                  onClick={() => setShowInitialTesting(true)}
                  className="bg-sky-650 hover:bg-sky-700 text-white rounded-3xl p-6 shadow-lg shadow-sky-100/30 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between group border border-sky-500/20"
                >
                  <div className="space-y-1.5 pr-4 flex-grow">
                     <span className="bg-white/20 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block">ОСНОВНОЙ ТЕСТ</span>
                     <h3 className="text-base font-black uppercase tracking-tight">Полное адаптивное тестирование уровня</h3>
                     <p className="text-[11px] text-sky-100 font-bold leading-tight uppercase">Определяет ваш уровень от Начинающего до Эксперта по всем темам 1С (15 вопросов)</p>
                  </div>
                  <div className="bg-white/10 group-hover:bg-white/20 p-3 rounded-xl ml-3 transition-colors shrink-0">
                     <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  </div>
                </div>

                {/* Список разделов */}
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block">Тематические тесты по разделам</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {kbSections.filter(sec => sec.is_published !== false).map(sec => {
                    const count = lessons.flatMap(l => l.exercises).filter(ex => {
                      const exSec = ex.kb_section_id || '';
                      if (sec.id === 'sec-1775157038826' || sec.id === 'sec-1777285813550') return exSec === 'platform';
                      if (sec.id === 'sec-1777403118453' || sec.id === 'sec-1775157080995') return exSec === 'dev';
                      if (sec.id === 'sec-1775458168759') return exSec === 'acc';
                      if (sec.id === 'sec-1777484345191') {
                        const lowerQ = (ex.question || '').toLowerCase();
                        const lowerE = (ex.explanation || '').toLowerCase();
                        return (exSec === 'dev' || exSec === 'platform') && (ex.id?.includes('d3') || ex.id?.includes('l6') || ex.id === 'd2-9' || lowerQ.includes('запрос') || lowerQ.includes('выбрать') || lowerE.includes('временн'));
                      }
                      if (sec.id === 'sec-1777484635095') {
                        const lowerQ = (ex.question || '').toLowerCase();
                        return exSec === 'dev' && (ex.id?.includes('d4') || lowerQ.includes('форм'));
                      }
                      if (sec.id === 'sec-1777484947088') {
                        const lowerQ = (ex.question || '').toLowerCase();
                        return exSec === 'dev' && (ex.id?.includes('d5') || lowerQ.includes('запис') || lowerQ.includes('регистр') || lowerQ.includes('транзак'));
                      }
                      return exSec === sec.id;
                    }).length;
                    
                    return (
                      <div 
                        key={sec.id}
                        className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-sky-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 h-[180px]"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">Тема</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${count > 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                              {count > 0 ? `${count} вопр.` : 'Скоро'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-gray-800 line-clamp-2 leading-snug uppercase tracking-tight">{sec.title}</h4>
                        </div>

                        <button
                          disabled={count === 0}
                          onClick={() => setSelectedSectionForTest(sec)}
                          className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all
                            ${count > 0 
                              ? 'bg-gray-900 text-white hover:bg-black hover:shadow-md shadow-xs active:scale-95 cursor-pointer' 
                              : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'}`}
                        >
                          {count > 0 ? 'Начать тест' : 'В разработке'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          </>
        )}

        {view === 'home' && (
          <>
            {/* Desktop side fixed avatar */}
            <div className="hidden lg:block">
              <CharacterAvatar 
                isVisible={true} 
                isSpeaking={false}
                type="max"
                position="left"
                hasSidebar={true}
                contentWidth="48rem"
                bubbleText="Привет! Будем учиться вместе. Выбирай тему и урок ниже!"
              />
            </div>
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Compact greeting banner for mobile/tablet screens */}
              <div className="block lg:hidden w-full bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-3xl p-4 shadow-xs animate-in fade-in duration-300">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-white border border-sky-200">
                    <CharacterAvatar
                      isVisible={true}
                      isSpeaking={false}
                      type="max"
                      isInline={true}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-800 leading-normal uppercase tracking-tight">
                      Привет! Я Макс – твой проводник в 1С. Будем учиться вместе! Выбирай тему и первый урок ниже!
                    </p>
                  </div>
                </div>
              </div>
            {/* Группа выбора специализации */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                   <Layers className="w-4 h-4 text-sky-600" />
                   <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Специализация</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(Object.values(UserSpecialization))).map(spec => {
                  const specData = SPECIALIZATION_DATA[spec] || { icon: <Layers className="w-4 h-4" /> };
                  return (
                    <button
                      key={spec}
                      onClick={() => handleSpecializationChange(spec)}
                      className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all
                        ${progress.specialization === spec ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                        ${spec !== UserSpecialization.COMMON ? 'opacity-70' : ''}
                      `}
                    >
                      {specData.icon}
                      <span>{spec}</span>
                      {spec !== UserSpecialization.COMMON && (
                        <span className="absolute -top-1 -right-1 bg-gray-200 text-gray-500 text-[7px] px-1 rounded-sm">
                          СКОРО
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Группа выбора роли */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Роль</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(Object.values(UserRole))).map(role => {
                  const roleData = ROLE_DATA[role] || { color: 'bg-gray-100', textColor: 'text-gray-900', icon: <Users className="w-6 h-6" /> };
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all
                        ${progress.role === role ? `${roleData.color} ${roleData.textColor} shadow-md` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                      `}
                    >
                      {roleData.icon}
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Группа выбора уровня */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                   <BarChart className="w-4 h-4 text-sky-600" />
                   <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Уровень обучения</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => handleLevelChange(lvl)}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-lg transition-all
                      ${progress.level === lvl ? 'bg-sky-600 text-white shadow-lg scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                    `}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-gradient-to-br from-sky-500 to-sky-700 p-6 rounded-3xl text-white shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black">Цель дня</h2>
                  <p className="opacity-80 font-bold text-sm">Собери 100 XP для серии!</p>
                </div>
                <Zap className="w-10 h-10 text-[#FFD200] fill-[#FFD200]" />
              </div>
              <div className="bg-black/20 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#FFD200] h-full w-[65%]" />
              </div>
            </section>

            {/* Карточка проф-тестирования для определения уровня */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <BrainCircuit className="w-36 h-36" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-sky-300">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span>Профессиональный тест</span>
                </div>
                <h3 className="text-xl font-black leading-tight tracking-tight uppercase">Определи свой уровень в 1С</h3>
                <p className="text-xs text-slate-300 font-bold leading-relaxed max-w-md">
                  Пройди адаптивный тест из 15 вопросов. Макс проанализирует твои ответы и настроит твою траекторию сложности, уровень и специализацию!
                </p>
                <button
                  onClick={() => setShowInitialTesting(true)}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-sky-955/20"
                >
                  🚀 Запустить тестирование
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Карта обучения</h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {progress.specialization} / {progress.role} / Уровень {progress.level}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {currentFilteredLessons.length > 0 ? (
                  currentFilteredLessons.map((lesson, idx) => {
                    const currentRoleData = ROLE_DATA[progress.role] || { color: 'bg-gray-100', textColor: 'text-gray-900' };
                    return (
                      <div
                        key={lesson.id}
                        className="group bg-white p-5 rounded-3xl shadow-sm border-2 border-transparent hover:border-[#FFD200] transition-all cursor-pointer flex items-center justify-between"
                        onClick={() => setActiveLesson(lesson)}
                      >
                        <div className="flex items-center space-x-5">
                          <div className={`w-14 h-14 rounded-2xl ${currentRoleData.color} flex items-center justify-center ${currentRoleData.textColor} shadow-md transition-transform group-hover:scale-105`}>
                            <Star className="w-7 h-7 fill-current" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase">Урок {idx + 1}</span>
                            <h4 className="text-lg font-black text-gray-900 leading-tight">{lesson.title}</h4>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-black" />
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center flex flex-col items-center space-y-3">
                    <Book className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-400 font-bold text-sm">Уроков для этой комбинации пока нет.<br/>Создайте их в админ-панели!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}

        {view === 'admin' && progress.isAdmin && (
          <AdminPanel lessons={lessons} onUpdateLessons={setLessons} aiDifficulty={progress.aiDifficulty} />
        )}

        {view === 'leaderboard' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black mb-6 text-gray-900 uppercase">Рейтинг Мастеров</h2>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
              {[
                { name: 'Алексей_1С', xp: 45200, role: 'Разработчик', avatar: 'https://i.pravatar.cc/100?u=1' },
                { name: 'Елена_Бух', xp: 41000, role: 'Бухгалтер', avatar: 'https://i.pravatar.cc/100?u=2' },
                { name: 'Дмитрий_Т', xp: 38500, role: 'Разработчик', avatar: 'https://i.pravatar.cc/100?u=3' },
              ].map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <span className={`w-6 text-center font-black ${idx < 3 ? 'text-yellow-600' : 'text-gray-300'}`}>
                      {idx + 1}
                    </span>
                    <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-gray-50" />
                    <div>
                      <p className="font-black text-gray-900 text-sm">{user.name}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-sky-600 text-sm">{user.xp.toLocaleString()}</span>
                    <span className="text-[8px] font-black text-gray-300 uppercase">XP Всего</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden transform rotate-3">
                  <img 
                    src={progress.avatarUrl || "/StudentFace.png"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://i.pravatar.cc/128?u=1c_master_fallback";
                    }}
                  />
                </div>
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="absolute -bottom-2 -right-2 bg-sky-600 hover:bg-sky-500 text-white p-2.5 rounded-xl shadow-lg transition-colors cursor-pointer animate-pulse"
                  title="Настройки профиля"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {progress.name || session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Специалист 1С'}
                </h2>
                {session?.user?.email && (
                  <p className="text-xs font-bold text-gray-500 mt-1 mb-2 leading-none">{session.user.email}</p>
                )}
                {isGuest && (
                  <p className="text-xs font-bold text-orange-500 mt-1 mb-2 leading-none">В гостевом режиме</p>
                )}
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mt-2">{progress.role} • Уровень {progress.level}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                  <p className="text-xl font-black text-gray-900">{progress.streak}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase">Дней подряд</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                  <p className="text-xl font-black text-gray-900">{progress.xp}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase">Опыт (XP)</p>
                </div>
              </div>

              {/* Выбор аватара */}
              <div className="w-full space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">Выбрать свой аватар</span>
                <div className="flex justify-center items-center gap-3 flex-wrap">
                  {[
                    { id: 'student', url: '/StudentFace.png', label: 'Студент' },
                    { id: 'max_neutral', url: '/max_avatar-1.png', label: 'Макс' },
                    { id: 'buh', url: 'https://i.pravatar.cc/100?u=buh_1c', label: 'Бухгалтер' },
                    { id: 'dev', url: 'https://i.pravatar.cc/100?u=dev_1c', label: 'Разработчик' }
                  ].map(av => (
                    <button
                      key={av.id}
                      onClick={() => {
                        const updated = { ...progress, avatarUrl: av.url };
                        setProgress(updated);
                        saveProgressToSupabase(updated);
                        setToast(`Вы установили аватар "${av.label}"`);
                      }}
                      type="button"
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer
                        ${progress.avatarUrl === av.url ? 'border-sky-600 shadow-md scale-105' : 'border-gray-200 opacity-60'}
                      `}
                    >
                      <img src={av.url} className="w-full h-full object-cover" alt={av.label} />
                    </button>
                  ))}

                  {/* Кнопка загрузки своего аватара прямо на вкладке Профиль */}
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-avatar-file-input"
                    className="hidden"
                    onChange={(e) => {
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
                            setProgress(updated);
                            saveProgressToSupabase(updated);
                            setToast("Аватар успешно загружен и установлен!");
                          }
                        };
                        reader.onerror = () => {
                          setToast("Ошибка при чтении файла");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="profile-avatar-file-input"
                    className="w-12 h-12 rounded-full border-2 border-dashed border-sky-400 hover:border-sky-600 bg-sky-50 text-sky-650 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer transition-all"
                    title="Загрузить свой аватар"
                  >
                    <Upload className="w-5 h-5" />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
               <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-black text-gray-900 text-sm uppercase">Настройка сложности ИИ</h3>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={progress.aiDifficulty}
                    onChange={handleDifficultyChange}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                    <span>Легко</span>
                    <span className="text-purple-600">Сложность {progress.aiDifficulty}</span>
                    <span>Мастер</span>
                  </div>
               </div>

               <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${progress.isAdmin ? 'bg-orange-100' : 'bg-gray-100'} p-2 rounded-lg transition-colors`}>
                      <ShieldCheck className={`w-5 h-5 ${progress.isAdmin ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm uppercase">Режим администратора</h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Доступ к редактированию вопросов</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleAdmin}
                    className={`w-12 h-6 rounded-full transition-all relative ${progress.isAdmin ? 'bg-orange-600' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${progress.isAdmin ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>

               {/* Дополнительные документы для удобства на мобильных */}
               <div className="pt-6 border-t border-gray-50 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setShowAboutUsModal(true)}
                    className="p-3 text-center border border-gray-100 rounded-2xl hover:bg-gray-50 flex flex-col items-center justify-center space-y-1 transition-colors group cursor-pointer"
                  >
                    <Users className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
                    <span className="text-[10px] font-black uppercase text-gray-650 group-hover:text-black leading-tight">О нас</span>
                  </button>
                  <button
                    onClick={() => setShowInstructionsModal(true)}
                    className="p-3 text-center border border-gray-100 rounded-2xl hover:bg-gray-50 flex flex-col items-center justify-center space-y-1 transition-colors group cursor-pointer"
                  >
                    <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
                    <span className="text-[10px] font-black uppercase text-gray-650 group-hover:text-black leading-tight">Инструкция</span>
                  </button>
                  <button
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="p-3 text-center border border-gray-100 rounded-2xl hover:bg-gray-50 flex flex-col items-center justify-center space-y-1 transition-colors group cursor-pointer"
                  >
                    <Lock className="w-5 h-5 text-gray-400 group-hover:text-sky-600" />
                    <span className="text-[10px] font-black uppercase text-gray-650 group-hover:text-black leading-tight">Приватность</span>
                  </button>
               </div>
            </div>
            
            {isGuest ? (
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black text-sm hover:bg-sky-700 shadow-xl shadow-sky-100 transition-all uppercase tracking-wider"
              >
                ВОЙТИ ИЛИ ЗАРЕГИСТРИРОВАТЬСЯ
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="w-full py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-sm hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 transition-all uppercase tracking-wider"
              >
                ВЫЙТИ ИЗ АККАУНТА
              </button>
            )}
          </div>
        )}

        {view === 'shop' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4">
              <Heart className="w-12 h-12 text-sky-600 fill-sky-600" />
              <h4 className="font-black text-lg">Восстановить жизни</h4>
              <button className="w-full py-3 bg-black text-white rounded-2xl font-black flex items-center justify-center space-x-2 text-sm">
                <Coins className="w-4 h-4 fill-[#FFD200] text-[#FFD200]" />
                <span>450</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-2 py-2.5 flex justify-around items-center z-40 shadow-lg">
        {[
          { id: 'home', icon: Book },
          { id: 'consultant', icon: MessageSquare },
          { id: 'trainer', icon: BrainCircuit },
          { id: 'skills_check', icon: Sparkles },
          { id: 'leaderboard', icon: Trophy },
          { id: 'shop', icon: ShoppingBag },
          { id: 'profile', icon: Users }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`p-3 rounded-2xl transition-all ${view === item.id ? 'bg-sky-50 text-black' : 'text-gray-300'}`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
        {progress.isAdmin && (
           <button
            onClick={() => setView('admin')}
            className={`p-3 rounded-2xl transition-all ${view === 'admin' ? 'bg-orange-50 text-orange-600' : 'text-gray-300'}`}
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
        )}
      </nav>

      {activeLesson && (
        <LessonScreen 
          lesson={activeLesson} 
          aiDifficulty={progress.aiDifficulty}
          onFinish={handleLessonFinish}
          onExit={() => setActiveLesson(null)}
        />
      )}

      {/* Модальное окно настроек профиля (шестеренка) */}
      <ProfileSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        progress={progress}
        onUpdateProgress={(updated) => {
          setProgress(updated);
          saveProgressToSupabase(updated);
        }}
        session={session}
        isSupabaseConfigured={isSupabaseConfigured}
        isGuest={isGuest}
        onShowPrivacy={() => {
          setShowPrivacyPolicy(true);
        }}
        onShowInstructions={() => {
          setShowInstructionsModal(true);
        }}
        onShowAboutUs={() => {
          setShowAboutUsModal(true);
        }}
        onLogout={handleLogout}
        setToast={setToast}
      />

      {/* Полноценная политика конфиденциальности */}
      {showPrivacyPolicy && (
        <PrivacyPolicy 
          onAccept={() => {
            setShowPrivacyPolicy(false);
            localStorage.setItem('privacy_agreed', 'true');
          }} 
          onClose={() => setShowPrivacyPolicy(false)}
          showClose={true}
        />
      )}

      {/* Интерактивная инструкция использования */}
      <InstructionsModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />

      {/* Описание проекта О нас */}
      <AboutUsModal
        isOpen={showAboutUsModal}
        onClose={() => setShowAboutUsModal(false)}
      />
    </div>
  );
};

export default App;