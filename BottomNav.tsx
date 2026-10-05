import React from 'react';
import { Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

export const BottomNav: React.FC = () => {
  const isKeyboardOpen = useVirtualKeyboard();
  const { 
    activeTab,
    isRadialDialOpen, 
    setIsRadialDialOpen
  } = useApp();

  // Hide the bottom button completely when student is in Fullscreen AI Chat (طلب المستخدم)
  if (activeTab === 'aiChat') {
    return null;
  }

  return (
    <nav 
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 select-none transition-all duration-300 ${
        isKeyboardOpen 
          ? 'translate-y-28 opacity-0 pointer-events-none' 
          : 'translate-y-0 opacity-100 pointer-events-auto'
      }`}
      dir="rtl"
      aria-label="قرص التنقل السريع بين الصفحات"
    >
      {/* Floating Center Button Capsule */}
      <button
        onClick={() => setIsRadialDialOpen(!isRadialDialOpen)}
        className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border backdrop-blur-2xl transition-all duration-200 active:scale-95 shadow-2xl group ${
          isRadialDialOpen
            ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white border-indigo-400/60 shadow-indigo-950/80 ring-2 ring-indigo-500/40'
            : 'bg-[#0c1017]/95 hover:bg-slate-900 text-slate-200 hover:text-white border-slate-750 hover:border-indigo-500/50 shadow-slate-950/80'
        }`}
        aria-label="فتح قرص تصفح الصفحات"
        title="تصفح كافة صفحات المنصة الـ 14"
      >
        {/* Glowing Compass Icon */}
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl border transition-all duration-200 ${
          isRadialDialOpen
            ? 'bg-white/20 border-white/30 text-white'
            : 'bg-slate-850 border-slate-750 text-indigo-400 group-hover:border-indigo-400/50'
        }`}>
          <Compass className={`w-5 h-5 transition-transform duration-300 ${
            isRadialDialOpen ? 'rotate-180' : 'group-hover:rotate-45'
          }`} />

          {/* Live pulse indicator dot */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        {/* Title */}
        <span className="text-xs font-black tracking-tight whitespace-nowrap">
          قرص الصفحات
        </span>
      </button>
    </nav>
  );
};
