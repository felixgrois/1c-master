
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { UserRole, UserSpecialization, UserProgress, Lesson } from './types';
import { ROLE_DATA, SPECIALIZATION_DATA, INITIAL_LESSONS, OneCLogo } from './constants';
import LessonScreen from './components/LessonScreen';
import AdminPanel from './components/AdminPanel';
// Добавлен Sparkles в список импортов
import { Trophy, Book, Users, ShoppingBag, Settings, ChevronRight, Zap, Crown, Star, Heart, Coins, BrainCircuit, ShieldCheck, Lock, Layers, BarChart, Bell, Info, X, Check, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress>({
    xp: 1250,
    coins: 450,
    hearts: 5,
    streak: 7,
    level: 1, // По умолчанию начинаем с 1 уровня
    role: UserRole.DEVELOPER,
    specialization: UserSpecialization.COMMON,
    aiDifficulty: 5,
    isAdmin: false
  });

  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [view, setView] = useState<'home' | 'leaderboard' | 'shop' | 'profile' | 'admin'>('home');
  const [toast, setToast] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      />

      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex-col py-8 px-4 z-40 shadow-sm">
        <div className="flex items-center px-4 mb-10 space-x-3">
          <OneCLogo className="w-9 h-9" />
          <span className="text-xl font-black text-gray-900 tracking-tight">1С-МАСТЕР</span>
        </div>

        <nav className="flex-grow space-y-1">
          {[
            { id: 'home', icon: Book, label: 'ОБУЧЕНИЕ' },
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

        <div 
          onClick={() => setShowPricing(true)}
          className="p-4 bg-sky-50 rounded-2xl border border-sky-100 mt-auto cursor-pointer hover:bg-sky-100 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="text-sky-600 w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-black text-sky-600 text-xs">PREMIUM</span>
          </div>
          <p className="text-[10px] text-sky-800 font-bold uppercase leading-tight">Без рекламы, безлимит жизней и ИИ-помощник</p>
        </div>
      </aside>

      <main className="flex-grow max-w-3xl mx-auto w-full p-4 md:p-8">
        {view === 'home' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Группа выбора специализации */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                   <Layers className="w-4 h-4 text-sky-600" />
                   <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Специализация</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(UserSpecialization).map(spec => (
                  <button
                    key={spec}
                    onClick={() => handleSpecializationChange(spec)}
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all
                      ${progress.specialization === spec ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                      ${spec !== UserSpecialization.COMMON ? 'opacity-70' : ''}
                    `}
                  >
                    {SPECIALIZATION_DATA[spec].icon}
                    <span>{spec}</span>
                    {spec !== UserSpecialization.COMMON && (
                      <span className="absolute -top-1 -right-1 bg-gray-200 text-gray-500 text-[7px] px-1 rounded-sm">
                        СКОРО
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Группа выбора роли */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Роль</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(UserRole).map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all
                      ${progress.role === role ? `${ROLE_DATA[role].color} ${ROLE_DATA[role].textColor} shadow-md` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                    `}
                  >
                    {ROLE_DATA[role].icon}
                    <span>{role}</span>
                  </button>
                ))}
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
                {[1, 2, 3, 4, 5].map(lvl => (
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

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Карта обучения</h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {progress.specialization} / {progress.role} / Уровень {progress.level}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {currentFilteredLessons.length > 0 ? (
                  currentFilteredLessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="group bg-white p-5 rounded-3xl shadow-sm border-2 border-transparent hover:border-[#FFD200] transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => setActiveLesson(lesson)}
                    >
                      <div className="flex items-center space-x-5">
                        <div className={`w-14 h-14 rounded-2xl ${ROLE_DATA[progress.role].color} flex items-center justify-center ${ROLE_DATA[progress.role].textColor} shadow-md transition-transform group-hover:scale-105`}>
                          <Star className="w-7 h-7 fill-current" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-gray-400 uppercase">Урок {idx + 1}</span>
                          <h4 className="text-lg font-black text-gray-900 leading-tight">{lesson.title}</h4>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-black" />
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center flex flex-col items-center space-y-3">
                    <Book className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-400 font-bold text-sm">Уроков для этой комбинации пока нет.<br/>Создайте их в админ-панели!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  <img src="https://i.pravatar.cc/128?u=main" alt="Profile" />
                </div>
                <button className="absolute -bottom-2 -right-2 bg-sky-600 text-white p-2.5 rounded-xl shadow-lg">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-gray-900 leading-tight">Специалист 1С</h2>
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mt-1">{progress.role} • Уровень {progress.level}</p>
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
            </div>
            
            <button className="w-full py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-sm hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 transition-all">
              ВЫЙТИ ИЗ АККАУНТА
            </button>
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
          { id: 'leaderboard', icon: Trophy },
          { id: 'shop', icon: ShoppingBag },
          { id: 'profile', icon: Users }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`p-3 rounded-2xl transition-all ${view === item.id ? 'bg-sky-50 text-black' : 'text-gray-300'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
        {progress.isAdmin && (
           <button
            onClick={() => setView('admin')}
            className={`p-3 rounded-2xl transition-all ${view === 'admin' ? 'bg-orange-50 text-orange-600' : 'text-gray-300'}`}
          >
            <ShieldCheck className="w-6 h-6" />
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
    </div>
  );
};

export default App;
