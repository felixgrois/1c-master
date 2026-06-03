import React from 'react';
import { X, HelpCircle, Check, BookOpen, Volume2, Sparkles, ShieldAlert } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1250] bg-white flex flex-col h-screen w-screen animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-sky-600 via-indigo-650 to-indigo-750 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-6 h-6" />
          <h2 className="text-xl font-black uppercase tracking-wider">Инструкция по использованию 1С-Мастер</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto px-6 md:px-12 py-10 space-y-10 custom-scrollbar max-w-4xl mx-auto w-full">
        
        <div className="p-6 bg-sky-50 rounded-[28px] border border-sky-100/60 shadow-xs">
          <p className="text-sm font-semibold text-sky-800 leading-relaxed">
            Добро пожаловать в инновационный тренажер и базу знаний по 1С! Ознакомьтесь с основными компонентами нашей системы для максимально быстрого и надежного получения профессиональных ИТ-навыков.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-sky-650">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-wider">1. Персонаж Макс и чат</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Макс — ваш харизматичный цифровой эксперт по 1С. Он отображается в нижнем углу экрана, дает детальные подсказки при обучении, в реальном времени анализирует ваши ответы в ИИ-тренере и поддерживает вежливый диалог в режиме «ИИ Консультант». Вы можете переключать его эмоциональные реакции, нажимая на аватар наставника в чате или при прохождении практики.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-sky-650">
            <Volume2 className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-wider">2. Настройки звука и озвучки</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Голосовое сопровождение и интерактивные звуковые эффекты ИИ по умолчанию активны. Если вы временно выбрали режим «Не могу слушать» при первоначальном входе, вы всегда можете беспрепятственно включить аудио-сопровождение обратно:
          </p>
          <ul className="space-y-3 pl-12">
            <li className="flex items-start space-x-2 text-xs font-semibold text-gray-500">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span>Откройте меню настройки профиля, найдите переключатель звука и активируйте статус «Звук: ВКЛЮЧЕН».</span>
            </li>
            <li className="flex items-start space-x-2 text-xs font-semibold text-gray-500">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <span>Предоставьте браузеру права на автоматическое воспроизведение звуков. На мобильных устройствах отключите беззвучный режим (Silent Mode).</span>
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-sky-650">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-wider">3. Оценка навыков и ИИ-Адаптивность</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Интерактивная шкала сложности автоматически подстраивается под ваши текущие успехи и процент правильных решений. Запустите комплексное Профессиональное тестирование (доступно по быстрой кнопке в главном меню) для прохождения адаптивного теста из 15 разноплановых практических кейсов. Это точечно откалибрует ваш уровень опыта от Начинающего до экспертного Специалиста-Разработчика!
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-sky-650">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-black uppercase text-sm tracking-wider">4. Профессиональная Админка</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Опытные пользователи и преподаватели могут включить полноценный «Режим администратора» в своем профиле, чтобы открыть секретную вкладку «АДМИНКА». Она дает полный контроль:
          </p>
          <ul className="space-y-3 pl-12">
            <li className="flex items-start space-x-2 text-xs font-semibold text-gray-500">
              <Check className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Свободно редактировать текущий список интерактивных вопросов в базе.</span>
            </li>
            <li className="flex items-start space-x-2 text-xs font-semibold text-gray-500">
              <Check className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Настраивать статьи базы знаний для тонких ИИ-модулей Макса.</span>
            </li>
            <li className="flex items-start space-x-2 text-xs font-semibold text-gray-500">
              <Check className="w-4 h-4 text-orange-500 shrink-0" />
              <span>В один клик генерировать с помощью ИИ новые тесты по выбранным конфигурациям или специфическим регистрам сведений в 1С.</span>
            </li>
          </ul>
        </section>

      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-150 shrink-0 text-center flex justify-center shadow-inner">
        <button
          onClick={onClose}
          className="w-full max-w-xl py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all cursor-pointer shadow-lg shadow-sky-600/10 active:scale-98"
        >
          ПОНЯТНО, СПАСИБО ЗА РАЗЪЯСНЕНИЯ!
        </button>
      </div>

    </div>
  );
};

export default InstructionsModal;
