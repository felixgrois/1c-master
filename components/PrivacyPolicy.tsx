import React from 'react';
import { ShieldCheck, X, Check, Lock, FileText, UserCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  onAccept: () => void;
  onClose?: () => void;
  showClose?: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onAccept, onClose, showClose = false }) => {
  return (
    <div className="fixed inset-0 z-[1250] bg-white flex flex-col h-screen w-screen animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-indigo-650 to-indigo-850 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Политика конфиденциальности</h2>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider opacity-80">Обработка и безопасность персональных данных</p>
          </div>
        </div>
        {showClose && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto px-6 md:px-12 py-10 space-y-10 custom-scrollbar max-w-4xl mx-auto w-full">
        
        <div className="p-6 bg-indigo-50/60 rounded-[28px] border border-indigo-100/40">
          <p className="text-xs font-semibold text-indigo-900 leading-relaxed">
            Внимание! Администрация «1С-Мастер» с глубоким уважением относится к конфиденциальности ваших данных. Мы используем надежные стандарты шифрования данных и никогда не передаем информацию третьим лицам.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-indigo-650">
            <FileText className="w-5 h-5" />
            <h3 className="font-black uppercase text-xs tracking-widest">1. Общие положения</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. №152-ФЗ «О персональных данных» и определяет порядок обработки личной информации обучающихся и меры по обеспечению абсолютной безопасности, предпринимаемые Администрацией образовательной платформы «1С-Мастер».
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-indigo-650">
            <UserCheck className="w-5 h-5" />
            <h3 className="font-black uppercase text-xs tracking-widest">2. Собираемые данные для персонализации</h3>
          </div>
          <ul className="space-y-3 pl-12 font-semibold">
            {[
              'Адрес электронной почты владельца (для надежной авторизации и авторизационных писем)',
              'Имя или выбранный в настройках псевдоним',
              'Собственные и предустановленные аватары',
              'Данные о ежедневном прогрессе обучения: ХР, очки опыта, уровень, история правильных решений',
              'Голосовые сэмплы (распознаются локально средствами Web Speech API и браузера без отправки на третьи сервера)',
              'Технические анонимные маркеры (IP-адрес, тип вашего браузера, основные файлы cookie для стабильности сессии)'
            ].map((item, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-indigo-650">
            <Lock className="w-5 h-5" />
            <h3 className="font-black uppercase text-xs tracking-widest">3. Цели и регламент обработки</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Мы собираем и обрабатываем данные исключительно с целью обеспечения бесперебойной службы нашего сервиса: аккуратного автосохранения пройденных тем, синхронизации накопленного опыта на нескольких устройствах, функционирования ИИ-сопровождения, калибровки динамической сложности и оперативной поддержки авторами.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center space-x-3 text-indigo-650">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-black uppercase text-xs tracking-widest">4. Безопасность и хранение данных</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold pl-8">
            Безопасность персональных пользовательских сведений надежно защищена серверами Supabase с протоколами безопасного шифрования SSL/TLS. Мы гарантируем, что ваши регистрационные данные и история обучения останутся приватными.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-150 shrink-0 flex flex-col space-y-4 shadow-inner">
        <div className="flex items-start space-x-4 max-w-4xl mx-auto w-full">
          <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0">
            <Check className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xs text-gray-500 font-bold leading-normal">
            Принятием Лицензионного Соглашения и продолжением обучения вы подтверждаете согласие с Политикой конфиденциальности «1С-Мастер» и правилами обработки персональных данных в соответствии с ФЗ РФ №152.
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto">
          <button 
            onClick={onAccept}
            className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 cursor-pointer active:scale-98"
          >
            ПРИНЯТЬ И ПРОДОЛЖИТЬ ОБУЧЕНИЕ
          </button>
        </div>
      </div>

    </div>
  );
};

export default PrivacyPolicy;
