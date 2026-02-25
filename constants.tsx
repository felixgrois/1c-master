
import React from 'react';
import { UserRole, UserSpecialization } from './types';
import { Code, Calculator, TrendingUp, LayoutGrid, Server, BookText, Briefcase, Store, Factory, Settings2, ShieldCheck } from 'lucide-react';
import { INITIAL_LESSONS } from './data/lessons';

export { INITIAL_LESSONS };

export const OneCLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`${className} bg-[#FFD200] rounded-xl flex items-center justify-center shadow-sm border border-yellow-400 overflow-hidden shrink-0`}>
    <span className="text-[#CC0000] font-[900] text-xl tracking-tighter select-none">1С</span>
  </div>
);

export const ROLE_DATA = {
  [UserRole.DEVELOPER]: {
    color: 'bg-[#FFD200]',
    textColor: 'text-black',
    icon: <Code className="w-6 h-6" />,
    description: 'Разработка конфигураций, запросы и бизнес-логика.'
  },
  [UserRole.ACCOUNTANT]: {
    color: 'bg-[#0ea5e9]',
    textColor: 'text-white',
    icon: <Calculator className="w-6 h-6" />,
    description: 'Бухгалтерский учет, отчетность и ТСД.'
  },
  [UserRole.SALES]: {
    color: 'bg-blue-600',
    textColor: 'text-white',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'CRM, анализ продаж и работа с клиентами.'
  },
  [UserRole.ADMINISTRATOR]: {
    color: 'bg-purple-600',
    textColor: 'text-white',
    icon: <ShieldCheck className="w-6 h-6" />,
    description: 'Установка, настройка серверов, обновление и резервное копирование.'
  }
};

export const SPECIALIZATION_DATA = {
  [UserSpecialization.COMMON]: { icon: <LayoutGrid className="w-4 h-4" /> },
  [UserSpecialization.ACC]: { icon: <BookText className="w-4 h-4" /> },
  [UserSpecialization.UNF]: { icon: <Briefcase className="w-4 h-4" /> },
  [UserSpecialization.UT]: { icon: <Store className="w-4 h-4" /> },
  [UserSpecialization.KA]: { icon: <Settings2 className="w-4 h-4" /> },
  [UserSpecialization.ERP]: { icon: <Factory className="w-4 h-4" /> },
};
