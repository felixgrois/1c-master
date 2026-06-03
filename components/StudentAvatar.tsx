import React from 'react';

interface StudentAvatarProps {
  className?: string;
}

const StudentAvatar: React.FC<StudentAvatarProps> = ({ className }) => {
  return (
    <div className={`relative ${className} flex items-end justify-center overflow-hidden bg-[#0A0F1D] rounded-3xl border border-sky-950/50 shadow-2xl`}>
      <svg 
        viewBox="0 0 800 1200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full object-contain"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132A" />
            <stop offset="50%" stopColor="#050B18" />
            <stop offset="100%" stopColor="#00040A" />
          </linearGradient>
          
          <radialGradient id="portalGlow" cx="50%" cy="45%" r="40%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#1E1B4B" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#050B18" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="staffGlow" cx="47%" cy="45%" r="20%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="30%" stopColor="#0284C7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="bookGlow" cx="65%" cy="56%" r="15%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D97706" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="wizardRobe" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="wizardSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEE2E2" />
            <stop offset="100%" stopColor="#FCA5A5" />
          </linearGradient>

          <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="whiteboardBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>

          <linearGradient id="holoScreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </linearGradient>

          {/* Filters for Glow and Shadows */}
          <filter id="neonBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="magicSparks" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. BACKGROUND CANVAS */}
        <rect width="800" height="1200" fill="url(#bgGrad)" />

        {/* Ambient Magic Circle / Cyber Portal behind Wizard Max */}
        <circle cx="400" cy="520" r="300" fill="url(#portalGlow)" />
        <circle cx="400" cy="520" r="240" stroke="#0EA5E9" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="10 15" />
        <circle cx="400" cy="520" r="230" stroke="#38BDF8" strokeOpacity="0.12" strokeWidth="4" />
        
        {/* Floating background circuit traces and magical spark symbols */}
        <g stroke="#0EA5E9" strokeOpacity="0.15" strokeWidth="1.5" strokeLinecap="round">
          <path d="M 100,200 L 150,230 L 150,300 M 150,230 L 250,230" />
          <path d="M 700,200 L 650,230 L 650,280" />
          <circle cx="250" cy="230" r="4" fill="#0EA5E9" fillOpacity="0.3" />
          <circle cx="100" cy="200" r="3" fill="#0EA5E9" fillOpacity="0.3" />
          
          {/* SQL formulas floating */}
          <text x="120" y="360" fill="#38BDF8" fillOpacity="0.4" fontFamily="monospace" fontSize="13">SELECT * FROM kb_items</text>
          <text x="120" y="380" fill="#38BDF8" fillOpacity="0.4" fontFamily="monospace" fontSize="13">WHERE active = true;</text>
          <path d="M 120,395 L 300,395" strokeDasharray="3 3" />
        </g>

        {/* 1C background watermark */}
        <g transform="translate(620, 100) scale(1.3)" opacity="0.35">
          <rect width="112" height="42" rx="8" fill="#E2E8F0" fillOpacity="0.06" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1" />
          <text x="12" y="28" fill="#F1F5F9" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" letterSpacing="0.05em">1C:Enterprise</text>
        </g>

        {/* 2. BACKGROUND HOLOGRAPHIC PANELS (LEFT) */}
        <g transform="translate(40, 240)" filter="url(#neonBlueGlow)">
          {/* Cyber Dashboard 1 */}
          <rect width="200" height="150" rx="12" fill="url(#holoScreen)" stroke="#06B6D4" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="15" y1="25" x2="185" y2="25" stroke="#06B6D4" strokeOpacity="0.3" strokeWidth="1" />
          <rect x="15" y="10" width="40" height="6" rx="3" fill="#06B6D4" fillOpacity="0.6" />
          
          {/* Floating charts */}
          <rect x="20" y="45" width="22" height="80" rx="3" fill="#06B6D4" fillOpacity="0.3" />
          <rect x="20" y="75" width="22" height="50" rx="3" fill="#3B82F6" fillOpacity="0.7" />
          
          <rect x="52" y="45" width="22" height="80" rx="3" fill="#06B6D4" fillOpacity="0.3" />
          <rect x="52" y="60" width="22" height="65" rx="3" fill="#3B82F6" fillOpacity="0.7" />
          
          <rect x="84" y="45" width="22" height="80" rx="3" fill="#06B6D4" fillOpacity="0.3" />
          <rect x="84" y="95" width="22" height="30" rx="3" fill="#3B82F6" fillOpacity="0.7" />

          <circle cx="150" cy="85" r="25" stroke="#3B82F6" strokeWidth="6" strokeDasharray="110 50" fill="none" />
          <circle cx="150" cy="85" r="25" stroke="#06B6D4" strokeWidth="6" strokeDasharray="30 130" fill="none" />
          <text x="135" y="89" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">82%</text>
        </g>

        {/* Dashboard 2 (lower left) */}
        <g transform="translate(30, 420)" filter="url(#neonBlueGlow)">
          <rect width="180" height="180" rx="12" fill="url(#holoScreen)" stroke="#0EA5E9" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="15" y1="25" x2="165" y2="25" stroke="#0EA5E9" strokeOpacity="0.3" strokeWidth="1" />
          
          {/* Database nodes graphics */}
          <g transform="translate(25, 45)" stroke="#0EA5E9" strokeWidth="1.5" fill="none">
            {/* Folder 1 */}
            <rect x="0" y="0" width="35" height="24" rx="4" strokeWidth="1.5" />
            <path d="M 0,6 L 15,6 L 18,2 L 35,2 L 35,6" x="0" />
            {/* Database Stack */}
            <ellipse cx="110" cy="15" rx="16" ry="6" stroke="#06B6D4" />
            <path d="M 94,15 L 94,25 A 16,6 0 0 0 126,25 L 126,15" stroke="#06B6D4" />
            <path d="M 94,25 L 94,35 A 16,6 0 0 0 126,35 L 126,25" stroke="#06B6D4" />
            <text x="2" y="38" fill="#06B6D4" fillOpacity="0.8" fontSize="10" stroke="none" fontFamily="sans-serif">БАЗА ДАННЫХ</text>
            <path d="M 35,12 L 94,15" strokeDasharray="3 3"/>
          </g>

          {/* Interactive node path */}
          <path d="M 40,110 L 140,110 L 140,145" stroke="#0EA5E9" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          <rect x="25" y="145" width="45" height="18" rx="4" fill="#0EA5E9" fillOpacity="0.2" />
          <text x="31" y="157" fill="#60A5FA" fontSize="8" fontWeight="bold">ВЫБОРКА</text>
          
          <rect x="115" y="145" width="50" height="18" rx="4" fill="#0ea5e9" fillOpacity="0.4" />
          <text x="120" y="157" fill="#FFFFFF" fontSize="8" fontWeight="bold">РЕЗУЛЬТАТ</text>
        </g>


        {/* 3. FLIPCHART WHITEBOARD ON THE RIGHT */}
        <g transform="translate(560, 420)">
          {/* Metal Leg stand */}
          <line x1="40" y1="180" x2="10" y2="350" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
          <line x1="120" y1="180" x2="150" y2="350" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
          <line x1="80" y1="150" x2="80" y2="340" stroke="#475569" strokeWidth="4" />
          
          {/* Main Board Base */}
          <rect x="0" y="0" width="160" height="220" rx="6" fill="#1E293B" />
          <rect x="4" y="4" width="152" height="212" rx="4" fill="url(#whiteboardBg)" stroke="#CBD5E1" strokeWidth="2" />
          
          {/* Top Clamp Bar / Logo */}
          <rect x="0" y="0" width="160" height="24" rx="2" fill="#E2E8F0" />
          <circle cx="15" cy="12" r="4" fill="#64748B" />
          <circle cx="145" cy="12" r="4" fill="#64748B" />
          
          {/* 1C Logo on Whiteboard */}
          <g transform="translate(112, 5) scale(0.35)">
            <rect width="64" height="26" rx="4" fill="#F97316" />
            <text x="13" y="18" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="13">1C</text>
          </g>

          {/* Whiteboard content: flowchart "АЛГОРИТМ: 1С" */}
          <text x="12" y="42" fill="#0F172A" fontFamily="sans-serif" fontWeight="900" fontSize="11" letterSpacing="0.05em">АЛГОРИТМ: 1С</text>
          
          {/* Flow Diagram */}
          {/* Block 1 (ДАННЫЕ) */}
          <rect x="15" y="55" width="55" height="16" rx="3" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1" />
          <text x="21" y="66" fill="#1E40AF" fontFamily="sans-serif" fontWeight="bold" fontSize="7">ДАННЫЕ</text>
          
          {/* Arrow */}
          <path d="M 42,71 L 42,83" stroke="#475569" strokeWidth="1" fill="none" />
          <polygon points="42,85 39,81 45,81" fill="#475569" />

          {/* Block 2 (ОБРАБОТКА) */}
          <rect x="15" y="86" width="65" height="16" rx="3" fill="#FFFBEB" stroke="#D97706" strokeWidth="1" strokeDasharray="3 1" />
          <text x="20" y="97" fill="#854D0E" fontFamily="sans-serif" fontWeight="bold" fontSize="7">ОБРАБОТКА</text>

          {/* Arrow */}
          <path d="M 47,102 L 47,114" stroke="#475569" strokeWidth="1" fill="none" />
          <polygon points="47,116 44,112 50,112" fill="#475569" />

          {/* Block 3 (БД) */}
          <rect x="20" y="117" width="55" height="16" rx="3" fill="#ECFDF5" stroke="#059669" strokeWidth="1" />
          <text x="26" y="128" fill="#065F46" fontFamily="sans-serif" fontWeight="bold" fontSize="7">БАЗА ДАННЫХ</text>
          
          {/* Side loop */}
          <path d="M 80,94 L 115,94 L 115,63 L 70,63" stroke="#DC2626" strokeWidth="1" fill="none" strokeDasharray="2 2" />
          <polygon points="70,63 74,60 74,66" fill="#DC2626" />
          <text x="110" y="80" fill="#DC2626" fontFamily="sans-serif" fontWeight="bold" fontSize="6">ПОПЫТКА</text>

          {/* Miniature charts */}
          <line x1="15" y1="160" x2="145" y2="160" stroke="#94A3B8" strokeWidth="1" />
          <path d="M 15,185 L 45,170 L 75,180 L 105,165 L 135,175" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="105" cy="165" r="2.5" fill="#EF4444" />
        </g>


        {/* 4. TUTOR WIZARD MAX (CENTRAL CHARACTER) */}
        {/* Wizard Robe Back & Body */}
        <g transform="translate(320, 320)">
          {/* Robe Shadows */}
          <path d="M 30,130 Q -50,300 -10,380 L 170,380 Q 210,300 130,130 Z" fill="#0F172A" />

          {/* Robe Main */}
          <path d="M 35,130 C -25,240 0,330 20,380 L 140,380 C 160,330 185,240 125,130 Z" fill="url(#wizardRobe)" stroke="#1D4ED8" strokeWidth="2" />
          
          {/* Magical circuit decorations on Robe */}
          <path d="M 50,180 L 35,260 L 55,300 M 35,260 L 10,280" stroke="#00F2FE" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
          <circle cx="55" cy="300" r="3" fill="#00F2FE" filter="url(#neonBlueGlow)" />
          <circle cx="10" cy="280" r="3" fill="#00F2FE" filter="url(#neonBlueGlow)" />

          <path d="M 110,180 L 125,260 L 105,300 M 125,260 L 150,280" stroke="#00F2FE" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
          <circle cx="105" cy="300" r="3" fill="#00F2FE" filter="url(#neonBlueGlow)" />
          <circle cx="150" cy="280" r="3" fill="#00F2FE" filter="url(#neonBlueGlow)" />

          {/* Gold Collar Belt */}
          <path d="M 55,135 Q 80,150 105,135 L 100,165 Q 80,180 60,165 Z" fill="url(#goldMetal)" />
          <circle cx="80" cy="162" r="4" fill="#EF4444" />

          {/* Neck */}
          <rect x="68" y="105" width="24" height="25" fill="url(#wizardSkin)" />

          {/* Head & Face */}
          <rect x="45" y="45" width="70" height="70" rx="20" fill="url(#wizardSkin)" />
          
          {/* Beard - stylish brown beard as described */}
          <path d="M 45,85 C 45,130 115,130 115,85 L 105,75 Q 80,110 55,75 Z" fill="#6B4F3F" />
          <path d="M 60,86 Q 80,98 100,86 Q 80,91 60,86" fill="#4A3326" /> {/* Mouth inside */}

          {/* Eyes & Smart Modern Glasses */}
          {/* Eyes */}
          <circle cx="62" cy="72" r="4" fill="#0B1329" />
          <circle cx="98" cy="72" r="4" fill="#0B1329" />
          {/* Eyebrows */}
          <path d="M 54,63 Q 63,58 70,64" stroke="#4A3326" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M 106,63 Q 97,58 90,64" stroke="#4A3326" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Glasses Frame - black, stylish, round */}
          <circle cx="62" cy="72" r="14" stroke="#1E293B" strokeWidth="2" fill="none" />
          <circle cx="98" cy="72" r="14" stroke="#1E293B" strokeWidth="2" fill="none" strokeOpacity="1" />
          <line x1="76" y1="72" x2="84" y2="72" stroke="#1E293B" strokeWidth="2.5" />
          {/* Reflection on glasses */}
          <path d="M 53,67 A 10,10 0 0 1 65,65" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />

          {/* Cute Nose */}
          <path d="M 80,72 Q 83,78 78,81" stroke="#F87171" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Smile */}
          <path d="M 72,89 Q 80,95 88,89" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Hair peaking out */}
          <path d="M 45,55 Q 35,40 50,32 Q 80,25 110,32 Q 125,40 115,55 Z" fill="#6B4F3F" />

          {/* Wizard Pointy Hat with Stars and "1C" Emblem */}
          <g transform="translate(10, -55)">
            {/* Brim */}
            <ellipse cx="70" cy="100" rx="65" ry="12" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="2" />
            
            {/* Crown cone */}
            <path d="M 15,95 C 10,95 40,40 45,10 C 47,-10 60,-5 80,15 C 100,35 120,95 125,95 Z" fill="url(#wizardRobe)" stroke="#1D4ED8" strokeWidth="2" />
            
            {/* Gold stars and circles indicators on hat */}
            <circle cx="50" cy="55" r="3" fill="#FBBF24" />
            <polygon points="80,45 82,50 87,50 83,53 85,58 80,55 75,58 77,53 73,50 78,50" fill="#FBBF24" />
            <polygon points="45,75 46,78 49,78 47,80 48,83 45,81 42,83 43,80 41,78 44,78" fill="#FBBF24" />

            {/* Glowing 1C logo emblazoned on wizard hat */}
            <g transform="translate(56, 68) scale(0.4)">
              <rect width="68" height="28" rx="6" fill="#F97316" filter="url(#neonBlueGlow)" />
              <text x="14" y="20" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="16" letterSpacing="0.05em">1С</text>
            </g>
          </g>

          {/* Left Sleeve & Hand Holding floating magical Book */}
          <g transform="translate(110, 110)">
            {/* Hanging sleeve */}
            <path d="M 0,15 C 30,15 65,35 70,60 L 50,75 C 30,45 10,40 0,40 Z" fill="url(#wizardRobe)" stroke="#1D4ED8" strokeWidth="1.5" />
            {/* Hand */}
            <circle cx="70" cy="62" r="9" fill="url(#wizardSkin)" />
            
            {/* Magical Book floating */}
            <g transform="translate(45, -15)">
              <rect x="0" y="0" width="75" height="55" rx="4" fill="#B45309" stroke="#78350F" />
              {/* Pages */}
              <path d="M 5,5 Q 37.5,15 70,5 L 70,50 Q 37.5,60 5,50 Z" fill="#FFFBEB" />
              <line x1="37.5" y1="10" x2="37.5" y2="52" stroke="#D97706" strokeWidth="2" />
              {/* Text lines indicator */}
              <line x1="12" y1="18" x2="30" y2="20" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="28" x2="32" y2="30" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="38" x2="28" y2="40" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />

              <line x1="43" y1="20" x2="63" y2="18" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="43" y1="30" x2="61" y2="28" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="43" y1="40" x2="63" y2="38" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />

              {/* Glowing magic lines rising from book */}
              <path d="M 25,10 Q 30,-25 15,-40" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeDasharray="3 3" filter="url(#magicSparks)" />
              <path d="M 50,10 Q 45,-25 55,-45" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeDasharray="3 3" filter="url(#magicSparks)" />
              <polygon points="15,-40 12,-36 18,-36" fill="#F59E0B" />
              <circle cx="55" cy="-45" r="3" fill="#F59E0B" />
            </g>
          </g>

          {/* Right Arm & Magical Staff topped with glowing '1С' Glyphs */}
          <g transform="translate(-40, 110)">
            {/* Sleeve */}
            <path d="M 60,15 C 30,15 -10,35 -15,60 L 5,75 C 25,45 45,40 60,40 Z" fill="url(#wizardRobe)" stroke="#1D4ED8" strokeWidth="1.5" />
            {/* Hand */}
            <circle cx="-10" cy="62" r="9" fill="url(#wizardSkin)" />

            {/* Magic Staff */}
            <g transform="translate(-25, -230)">
              {/* Wooden Staff shaft */}
              <rect x="11" y="0" width="8" height="520" rx="4" fill="url(#goldMetal)" />
              
              {/* Staff Prongs holder */}
              <path d="M -2,40 Q 15,90 32,40 C 25,25 5,25 -2,40 Z" fill="url(#goldMetal)" />
              <path d="M 5,22 Q 15,-10 25,22 Z" fill="#D97706" />

              {/* Large Magical Cyan Glowing Sphere */}
              <circle cx="15" cy="15" r="38" fill="url(#staffGlow)" filter="url(#magicSparks)" />
              <circle cx="15" cy="15" r="28" fill="#FFFFFF" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="2" />
              
              {/* 1С symbols inside glowing sphere representing master developer status */}
              <g transform="translate(-6, -1) scale(0.6)">
                <rect width="70" height="30" rx="6" fill="#EA580C" />
                <text x="14" y="21" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="950" fontSize="18" letterSpacing="0.05em">1С</text>
              </g>

              {/* Magical Sparkles emanating */}
              <circle cx="-15" cy="-10" r="3" fill="#FFFFFF" />
              <circle cx="45" cy="-5" r="2" fill="#38BDF8" />
              <circle cx="15" cy="-35" r="4" fill="#38BDF8" />
            </g>
          </g>
        </g>


        {/* 5. STUDENT & COMPUTER RUNNING 1С CONFIGURATOR (FOREGROUND COPT/CLOSEUP) */}
        <g transform="translate(180, 720)">
          {/* Work table boundary */}
          <rect x="-80" y="280" stroke="#334155" strokeWidth="3" fill="#1E293B" width="600" height="150" />
          
          {/* LAPTOP COMPUTER AND ITS EMITTED CYBER-GLOW */}
          <g transform="translate(80, 110)">
            {/* Screen Back Support */}
            <rect x="15" y="0" width="220" height="150" rx="8" fill="#475569" stroke="#64748B" strokeWidth="2" />
            
            {/* Glowing Screen Container */}
            <rect x="22" y="8" width="206" height="134" rx="4" fill="#0B1329" />
            <rect x="22" y="8" width="206" height="134" rx="4" fill="#0284C7" fillOpacity="0.1" stroke="#00F2FE" strokeWidth="1.5" filter="url(#neonBlueGlow)" />
            
            {/* Left sidebar tree elements of 1C Configurator */}
            <rect x="26" y="14" width="45" height="122" fill="#1E293B" fillOpacity="0.8" rx="2" />
            <text x="30" y="24" fill="#94A3B8" fontSize="7" fontWeight="bold">Конфигурация</text>
            <path d="M 30,34 L 55,34 M 30,44 L 60,44 M 30,54 L 50,54" stroke="#64748B" strokeWidth="1" />
            {/* Green node dots */}
            <circle cx="34" cy="68" r="2" fill="#10B981" />
            <circle cx="34" cy="78" r="2" fill="#10B981" />
            <circle cx="34" cy="88" r="2" fill="#3B82F6" />

            {/* Central Code Window with realistic 1C script text */}
            <rect x="75" y="14" width="148" height="122" fill="#0F172A" rx="2" />
            <text x="80" y="25" fill="#38BDF8" fontFamily="monospace" fontSize="7" fontWeight="bold">Процедура ПриЗапуске()</text>
            <text x="90" y="37" fill="#F59E0B" fontFamily="monospace" fontSize="6.5">  Макс = СоздатьЗапрос();</text>
            <text x="90" y="47" fill="#10B981" fontFamily="monospace" fontSize="6.5">  // Инициализация обучения</text>
            <text x="90" y="57" fill="#FFFFFF" fontFamily="monospace" fontSize="6.5">  ЗапуститьСистему(Параметры);</text>
            <text x="80" y="69" fill="#38BDF8" fontFamily="monospace" fontSize="7" fontWeight="bold">КонецПроцедуры</text>

            <rect x="90" y="80" width="120" height="42" rx="3" fill="#1E293B" />
            <text x="94" y="92" fill="#E2E8F0" fontSize="6" fontWeight="bold">Синхронизация с Supabase...</text>
            {/* Mini Progress bar */}
            <rect x="94" y="98" width="112" height="5" rx="2.5" fill="#334155" />
            <rect x="94" y="98" width="85" height="5" rx="2.5" fill="#10B981" />
            <text x="94" y="112" fill="#10B981" fontSize="6" fontWeight="bold">УСПЕШНО | БАЗА ЗНАНИЙ АКТИВНА</text>

            {/* Laptop Base Body */}
            <path d="M 0,150 L 250,150 L 270,165 L -20,165 Z" fill="#64748B" stroke="#475569" strokeWidth="2" />
            {/* Keyboard Grid */}
            <rect x="15" y="152" width="220" height="8" fill="#334155" rx="1" />
            {/* Trackpad */}
            <rect x="110" y="160" width="30" height="4" fill="#475569" rx="1" />
          </g>

          {/* THE STUDENT (Brown Hair, Back View with neon 1C branded shirt) */}
          <g transform="translate(80, 180)">
            {/* Hips & Legs boundary */}
            <path d="M 25,220 C 10,240 -35,320 -35,340 L 155,340 C 155,320 110,240 95,220 Z" fill="#0F172A" />

            {/* Student Shoulders & Torso */}
            <path d="M -15,140 C -35,210 -15,240 10,260 L 110,260 C 135,240 155,210 135,140 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
            
            {/* Neon cyan brand logo of "1C" printed grandly on the back of the student's shirt */}
            <g transform="translate(30, 175)">
              <rect width="60" height="32" rx="6" fill="none" stroke="#22D3EE" strokeWidth="2" strokeDasharray="3 2" filter="url(#neonBlueGlow)" />
              <text x="14" y="22" fill="#22D3EE" fontFamily="sans-serif" fontWeight="950" fontSize="16" letterSpacing="0.05em" filter="url(#neonBlueGlow)">1С</text>
            </g>

            {/* Neck */}
            <rect x="44" y="90" width="32" height="30" fill="#FCA5A5" />

            {/* Head Silhouette back */}
            <rect x="25" y="15" width="70" height="80" rx="35" fill="#DDB8A6" />
            {/* Stylish brown haircut */}
            <path d="M 20,40 C 15,10 50,-5 80,-2 C 100,2 105,25 95,50 C 90,40 85,38 75,38 C 65,38 60,42 55,42 C 45,42 35,35 20,40 Z" fill="#4A3326" />
            <path d="M 22,40 L 22,65 Q 25,60 30,68 Q 30,50 35,45" fill="#4A3326" stroke="#331F14" strokeWidth="1" />
            <path d="M 98,40 L 98,65 Q 95,60 90,68 Q 90,50 85,45" fill="#4A3326" stroke="#331F14" strokeWidth="1" />
          </g>
        </g>

        {/* Outer glowing border frames */}
        <rect x="15" y="15" width="770" height="1170" rx="20" stroke="#38BDF8" strokeOpacity="0.15" strokeWidth="2" pointerEvents="none" />
        <rect x="20" y="20" width="760" height="1160" rx="16" stroke="#0E5A8E" strokeOpacity="0.08" strokeWidth="4" pointerEvents="none" />
      </svg>
    </div>
  );
};

export default StudentAvatar;
export { StudentAvatar };

