import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  CalendarCheck, 
  BookOpen, 
  FileText, 
  Award, 
  Wrench, 
  Layers, 
  GitFork, 
  Tv, 
  Timer, 
  Trophy, 
  Share2, 
  User, 
  Compass,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';
import { sound } from '../services/sound';

export interface DialItem {
  tab: NavTab;
  title: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

export const DIAL_PAGES: DialItem[] = [
  { tab: 'home', title: 'الرئيسية', category: 'غرفة القيادة', icon: Home, color: 'text-indigo-400' },
  { tab: 'plan', title: 'الخطة', category: 'مسار المنهاج', icon: CalendarCheck, color: 'text-violet-400' },
  { tab: 'curriculum', title: 'المنهاج', category: 'فهرس الكتب', icon: BookOpen, color: 'text-sky-400' },
  { tab: 'aiChat', title: 'المعلم الذكي', category: 'ذكاء المنهاج 2026', icon: Sparkles, color: 'text-indigo-300' },
  { tab: 'timer', title: 'المؤقت', category: 'جلسات التركيز', icon: Timer, color: 'text-cyan-400' },
  { tab: 'writtenExams', title: 'الامتحانات', category: 'النماذج الوزارية', icon: FileText, color: 'text-emerald-400' },
  { tab: 'mistakeBank', title: 'بنك الهفوات', category: 'تصفير الثغرات', icon: Award, color: 'text-amber-400' },
  { tab: 'tools', title: 'المختبر', category: '11 أداة علمية', icon: Wrench, color: 'text-indigo-300' },
  { tab: 'flashcards', title: 'البطاقات', category: 'استرجاع نشط 3D', icon: Layers, color: 'text-purple-400' },
  { tab: 'mindmaps', title: 'الخرائط', category: 'مخططات مفاهيمية', icon: GitFork, color: 'text-amber-300' },
  { tab: 'youtube', title: 'اليوتيوب', category: 'مشاهدة معزولة', icon: Tv, color: 'text-rose-400' },
  { tab: 'challenge', title: 'المتصدرين', category: 'سلسلة الالتزام', icon: Trophy, color: 'text-amber-400' },
  { tab: 'community', title: 'المكتبة', category: 'نوطات ومراجع', icon: Share2, color: 'text-teal-400' },
  { tab: 'profile', title: 'الملف', category: 'بيانات الحساب', icon: User, color: 'text-slate-300' }
];

export const RadialDialNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isRadialDialOpen, 
    setIsRadialDialOpen
  } = useApp();
  
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Drag tracking refs
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startPointerXRef = useRef(0);
  const startPointerYRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const startRotationAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);

  const totalItems = DIAL_PAGES.length;
  const anglePerItem = 360 / totalItems; // ~27.69 degrees

  // Radius for the arc inside the dome (118px on mobile, 130px on desktop)
  const radius = typeof window !== 'undefined' && window.innerWidth >= 640 ? 130 : 118;
  const centerBottomOffset = 18; // px from bottom of dome

  // Active index
  const activeIndex = DIAL_PAGES.findIndex(p => p.tab === activeTab || (activeTab === 'dashboard' && p.tab === 'home'));
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Auto-center active tab at apex when dial opens (no spammy toast!)
  useEffect(() => {
    if (isRadialDialOpen) {
      setRotationAngle(-safeActiveIndex * anglePerItem);
    }
  }, [isRadialDialOpen, safeActiveIndex, anglePerItem]);

  // Handle keyboard Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRadialDialOpen) setIsRadialDialOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRadialDialOpen, setIsRadialDialOpen]);

  // Navigate to tab
  const handleSelectTab = useCallback((tab: NavTab) => {
    sound.playTick();
    setActiveTab(tab);
    setIsRadialDialOpen(false);
  }, [setActiveTab, setIsRadialDialOpen]);

  // Direct swipe tracking on the pages container (div الصفحات)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startPointerXRef.current = e.clientX;
    startPointerYRef.current = e.clientY;
    lastPointerXRef.current = e.clientX;
    startRotationAngleRef.current = rotationAngle;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setIsDragging(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const totalDx = e.clientX - startPointerXRef.current;
    const totalDy = e.clientY - startPointerYRef.current;
    const moveDist = Math.hypot(totalDx, totalDy);

    if (moveDist > 6) {
      hasMovedRef.current = true;
    }

    // Velocity tracking for inertial flick
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 8) {
      const stepDx = e.clientX - lastPointerXRef.current;
      velocityRef.current = stepDx / dt;
      lastPointerXRef.current = e.clientX;
      lastTimeRef.current = now;
    }

    // Drag sensitivity: 1px movement ≈ (180 / (π * radius)) degrees
    const degPerPx = 180 / (Math.PI * radius);
    const newAngle = startRotationAngleRef.current + totalDx * degPerPx;
    setRotationAngle(newAngle);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    // Snap to nearest page item with subtle inertial boost if flicked
    setRotationAngle(prev => {
      let target = prev;
      if (Math.abs(velocityRef.current) > 0.45) {
        const steps = Math.min(2, Math.max(1, Math.round(Math.abs(velocityRef.current) * 1.5)));
        const direction = velocityRef.current > 0 ? 1 : -1;
        target += direction * (steps * anglePerItem);
      }
      const nearestStep = Math.round(target / anglePerItem);
      return nearestStep * anglePerItem;
    });

    if (hasMovedRef.current) {
      sound.playTick();
    }
  };

  // Mouse wheel rotation support
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    sound.playTick();
    setRotationAngle(prev => {
      const direction = delta > 0 ? -1 : 1;
      const nearestStep = Math.round(prev / anglePerItem) + direction;
      return nearestStep * anglePerItem;
    });
  };

  return (
    <>
      {/* Floating Center Trigger Button (Visible on Desktop / Tablets) */}
      <aside 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto hidden md:block"
        aria-label="قائمة التنقل الدائرية"
      >
        <button
          onClick={() => {
            sound.playTick();
            setIsRadialDialOpen(!isRadialDialOpen);
          }}
          className={`group relative flex items-center gap-2.5 px-4 py-2 rounded-full shadow-xl transition-all duration-300 active:scale-95 border backdrop-blur-xl ${
            isRadialDialOpen 
              ? 'bg-slate-800 text-white border-slate-600 ring-2 ring-indigo-500/40' 
              : 'bg-[#101622]/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600'
          }`}
          aria-expanded={isRadialDialOpen}
          aria-label="فتح قرص التنقل الدائري السريع"
          title="انقر لفتح قرص التنقل الدائري السريع"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 group-hover:text-indigo-300">
            {isRadialDialOpen ? (
              <X className="w-3.5 h-3.5 text-slate-200" />
            ) : (
              <Compass className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
            )}
          </div>

          <span className="text-xs font-bold tracking-tight text-slate-200">
            {isRadialDialOpen ? 'إغلاق القرص' : 'قرص الصفحات'}
          </span>
        </button>
      </aside>

      {/* Semi-Circular Half-Dial at the Bottom */}
      <AnimatePresence>
        {isRadialDialOpen && (
          <>
            {/* Non-intrusive backdrop to close on outside tap */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsRadialDialOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] cursor-pointer"
              aria-hidden="true"
            />

            {/* Bottom Semi-Circular Protruding Stage (Half visible at bottom of screen) */}
            <motion.div
              initial={{ y: '100%', opacity: 0.7 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 pointer-events-auto select-none"
              dir="rtl"
            >
              {/* Semi-Circular Dome / Housing */}
              <div 
                className="relative w-[360px] sm:w-[410px] h-[195px] sm:h-[210px] rounded-t-[195px] sm:rounded-t-[210px] bg-gradient-to-b from-[#0f172a]/98 via-[#0b0f17]/98 to-[#06090e] border-t-2 border-x-2 border-slate-750/90 shadow-[0_-15px_45px_rgba(0,0,0,0.75)] backdrop-blur-2xl overflow-hidden flex flex-col items-center justify-end"
              >
                {/* Decorative curved guide tracks */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: centerBottomOffset,
                    left: '50%',
                    width: radius * 2,
                    height: radius * 2,
                    marginLeft: -radius,
                    marginBottom: -radius
                  }}
                  className="rounded-full border border-dashed border-slate-750/60 pointer-events-none opacity-40" 
                />

                {/* Top Subtle Pull Handle */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-1 rounded-full bg-slate-600/70" />
                </div>

                {/* THE PAGES DIV (الـ div الخاصة بالصفحات التي يلمسها الطالب ويسحبها مباشرة) */}
                <div
                  ref={pagesContainerRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onWheel={handleWheel}
                  className={`absolute inset-0 z-10 touch-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  aria-label="منطقة تصفح الصفحات بالسحب المباشر"
                  title="ضع إصبعك على الصفحات واسحبها يميناً أو يساراً للتنقل"
                >
                  {DIAL_PAGES.map((item, index) => {
                    const itemBaseAngle = index * anglePerItem;
                    // Current angle in degrees (-180 to +180)
                    let currentAngle = (itemBaseAngle + rotationAngle) % 360;
                    if (currentAngle < 0) currentAngle += 360;
                    const normalizedAngle = currentAngle > 180 ? currentAngle - 360 : currentAngle;
                    const absAngle = Math.abs(normalizedAngle);

                    // Half the pages visible in upper arc (absAngle <= 86)
                    const isVisible = absAngle <= 86;
                    const isNearApex = absAngle < 14;

                    // Smooth opacity fade near the horizon (between 70 and 86 deg)
                    const opacity = !isVisible 
                      ? 0 
                      : absAngle > 70 
                        ? Math.max(0, (86 - absAngle) / 16) 
                        : 1;

                    // Trigonometry for (x, y) relative to bottom center
                    const rad = (normalizedAngle * Math.PI) / 180;
                    const x = Math.sin(rad) * radius;
                    const y = Math.cos(rad) * radius; // distance above centerBottomOffset

                    const isActive = activeTab === item.tab || (activeTab === 'dashboard' && item.tab === 'home');
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.tab}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasMovedRef.current) return;
                          handleSelectTab(item.tab);
                        }}
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${x}px)`,
                          bottom: `${centerBottomOffset + y}px`,
                          transform: 'translate(-50%, 50%)',
                          opacity,
                          pointerEvents: isVisible && opacity > 0.3 ? 'auto' : 'none',
                          transition: isDragging 
                            ? 'none' 
                            : 'left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), bottom 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease-out'
                        }}
                        className="flex flex-col items-center justify-center cursor-pointer select-none"
                      >
                        {/* Page Button */}
                        <div
                          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-90 ${
                            isActive
                              ? 'bg-slate-800 text-indigo-300 border-2 border-indigo-400 ring-4 ring-indigo-500/30 scale-110 shadow-indigo-500/25'
                              : isNearApex
                                ? 'bg-[#141d2e] text-white border-2 border-slate-600 scale-105 shadow-md'
                                : 'bg-[#0f172a]/95 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-slate-500'
                          }`}
                          title={`انتقل إلى: ${item.title}`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-300 stroke-[2.3]' : item.color}`} />

                          {/* Active pulse dot */}
                          {isActive && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0f17]" />
                          )}
                        </div>

                        {/* Page Label Badge (Clear, upright, readable) */}
                        <div 
                          className={`mt-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight shadow-sm whitespace-nowrap transition-colors select-none ${
                            isActive 
                              ? 'bg-indigo-600/90 text-white border border-indigo-400/60' 
                              : isNearApex 
                                ? 'bg-slate-800/95 text-slate-100 border border-slate-600/80' 
                                : 'bg-[#0c1017]/95 text-slate-300 border border-slate-800/80'
                          }`}
                        >
                          {item.title}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Center Minimal Close Pill */}
                <div className="relative z-30 mb-2 flex items-center gap-2 pointer-events-auto">
                  <button
                    onClick={() => {
                      sound.playTick();
                      setIsRadialDialOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-medium shadow-md transition-all active:scale-95"
                    title="إغلاق القرص"
                    aria-label="إغلاق القرص"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>إغلاق</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
