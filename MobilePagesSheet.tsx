import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  CalendarCheck, 
  BookOpen, 
  Layers, 
  Tv, 
  Timer, 
  Flame, 
  Trophy, 
  Share2, 
  User, 
  GitFork, 
  FileText, 
  Award,
  ChevronRight,
  ChevronLeft,
  Compass,
  ArrowRight,
  Wrench
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';
import { sound } from '../services/sound';

interface MobilePagesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PageItem {
  tab: NavTab;
  title: string;
  subtitle: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
  category: 'home' | 'study' | 'exams' | 'tools' | 'community';
  badge?: string;
  colorBorder: string;
  glowColor: string;
}

export const MobilePagesSheet: React.FC<MobilePagesSheetProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, user, exams, mistakes } = useApp();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'study' | 'exams' | 'tools' | 'community'>('all');

  // Prevent background scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const unresolvedMistakesCount = mistakes.filter(m => !m.isResolved).length;

  const pages: PageItem[] = [
    {
      tab: 'home',
      title: 'الرئيسية',
      subtitle: 'لوحة التحكم والإحصائيات',
      description: 'نظرة شاملة ومباشرة على تقدمك اليومي، العداد التنازلي، والمهام الأكاديمية.',
      icon: Home,
      gradient: 'from-blue-600 via-indigo-600 to-violet-700',
      category: 'home',
      colorBorder: 'border-blue-500/50',
      glowColor: 'shadow-blue-500/20'
    },
    {
      tab: 'plan',
      title: 'خطتي الموجهة',
      subtitle: 'الخطة المركزية 2026',
      description: 'مسار إنجازك الأسبوعي واليومي، مراجع المنهاج الوزاري، والأفخاخ الامتحانية.',
      icon: CalendarCheck,
      gradient: 'from-indigo-600 via-violet-600 to-purple-700',
      category: 'study',
      badge: 'المركزي ⚡',
      colorBorder: 'border-indigo-500/60',
      glowColor: 'shadow-indigo-500/30'
    },
    {
      tab: 'curriculum',
      title: 'شجرة المنهاج الوزاري',
      subtitle: 'وحدات ودروس الكتب الرسمية',
      description: 'تتبع شامل لكافة دروس ووحدات المواد الـ 9 الرسمية الصادرة لعام 2026 مع توثيق الإنجاز وإرفاق الملاحظات.',
      icon: BookOpen,
      gradient: 'from-sky-600 via-indigo-600 to-blue-700',
      category: 'study',
      colorBorder: 'border-sky-500/50',
      glowColor: 'shadow-sky-500/20'
    },
    {
      tab: 'timer',
      title: 'مؤقت بومودورو',
      subtitle: 'جلسات تركيز عميقة',
      description: 'نظّم فترات مذاكرتك واستراحاتك واقضِ على التسويف بأسلوب التركيز الفعال.',
      icon: Timer,
      gradient: 'from-cyan-600 via-sky-600 to-blue-700',
      category: 'study',
      colorBorder: 'border-cyan-500/50',
      glowColor: 'shadow-cyan-500/20'
    },
    {
      tab: 'writtenExams',
      title: 'الامتحانات والسلالم',
      subtitle: 'نماذج وسلالم وزارية',
      description: 'محاكاة القاعة الامتحانية، مؤقت زمني دقيق، وسلالم تصحيح نموذجية معتمدة.',
      icon: FileText,
      gradient: 'from-emerald-600 via-teal-600 to-green-700',
      category: 'exams',
      badge: exams.length > 0 ? `${exams.length} نموذج` : undefined,
      colorBorder: 'border-emerald-500/50',
      glowColor: 'shadow-emerald-500/20'
    },
    {
      tab: 'mistakeBank',
      title: 'بنك الأخطاء',
      subtitle: 'تأصيل وتوثيق الهفوات',
      description: 'وثّق أخطاءك الامتحانية وسد ثغراتك المعرفية لضمان عدم تكرارها في سلم التصحيح.',
      icon: Award,
      gradient: 'from-rose-600 via-red-600 to-pink-700',
      category: 'exams',
      badge: unresolvedMistakesCount > 0 ? `${unresolvedMistakesCount} ثغرة` : undefined,
      colorBorder: 'border-rose-500/50',
      glowColor: 'shadow-rose-500/20'
    },
    {
      tab: 'tools',
      title: 'مختبر وأدوات الطالب',
      subtitle: 'مختبر فيزياء، حاسبة، كيمياء، راسم توابع، ومسودة',
      description: '11 أداة دراسية متخصصة ومختبر تفاعلي للفيزياء والكيمياء والرياضيات واستخراج النصوص.',
      icon: Wrench,
      gradient: 'from-indigo-600 via-violet-600 to-teal-700',
      category: 'tools',
      badge: '11 أداة',
      colorBorder: 'border-indigo-500/50',
      glowColor: 'shadow-indigo-500/20'
    },
    {
      tab: 'flashcards',
      title: 'البطاقات الذكية',
      subtitle: 'تثبيت المفاهيم بالتكرار',
      description: 'نظام بطاقات تعليمية ذكي لحفظ التعاليل، القوانين، والتعاريف الوزارية.',
      icon: Layers,
      gradient: 'from-purple-600 via-violet-600 to-indigo-700',
      category: 'tools',
      colorBorder: 'border-purple-500/50',
      glowColor: 'shadow-purple-500/20'
    },
    {
      tab: 'mindmaps',
      title: 'الخرائط الذهنية',
      subtitle: 'أشجار مفاهيمية تفاعلية',
      description: 'مخططات بصرية مترابطة تلخص القوانين والتعاليل والوحدات المعقدة بسهولة.',
      icon: GitFork,
      gradient: 'from-amber-600 via-orange-600 to-yellow-700',
      category: 'tools',
      colorBorder: 'border-amber-500/50',
      glowColor: 'shadow-amber-500/20'
    },
    {
      tab: 'youtube',
      title: 'مسرح اليوتيوب',
      subtitle: 'دروس وسلاسل مركزة',
      description: 'مشاهدة سينمائية لدروس الأساتذة المعتمدين في بيئة هادئة بدون تشتيت.',
      icon: Tv,
      gradient: 'from-red-600 via-rose-600 to-orange-700',
      category: 'tools',
      colorBorder: 'border-red-500/50',
      glowColor: 'shadow-red-500/20'
    },
    {
      tab: 'challenge',
      title: 'سلسلة الالتزام',
      subtitle: 'المنافسة ولوحة الشرف',
      description: 'تنافس مع نخب طلاب البكالوريا في سوريا وحافظ على سلسلة انضباطك اليومية.',
      icon: Flame,
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      category: 'community',
      badge: user?.streakDays ? `${user.streakDays}d 🔥` : undefined,
      colorBorder: 'border-amber-500/50',
      glowColor: 'shadow-amber-500/20'
    },
    {
      tab: 'journey',
      title: 'الرحلة والجدول',
      subtitle: 'خطة الطريق للـ 240',
      description: 'خريطة زمنية مفصلة ومحطات التقدم الدراسي نحو تحقيق العلامة التامة.',
      icon: Trophy,
      gradient: 'from-yellow-600 via-amber-600 to-orange-700',
      category: 'community',
      colorBorder: 'border-yellow-500/50',
      glowColor: 'shadow-yellow-500/20'
    },
    {
      tab: 'community',
      title: 'المكتبة السحابية',
      subtitle: 'ملفات ومراجع ونماذج',
      description: 'مكتبة شاملة للنوطات، أوراق العمل، والأسئلة الوزارية الصادرة عن المشرفين.',
      icon: Share2,
      gradient: 'from-teal-600 via-emerald-600 to-green-700',
      category: 'community',
      colorBorder: 'border-teal-500/50',
      glowColor: 'shadow-teal-500/20'
    },
    {
      tab: 'profile',
      title: 'الملف الشخصي',
      subtitle: 'إعدادات الحساب والبصمة',
      description: 'إدارة حسابك، كود التفعيل، بصمة جهازك، والخيارات الشخصية للمنصة.',
      icon: User,
      gradient: 'from-violet-600 via-purple-600 to-indigo-700',
      category: 'community',
      colorBorder: 'border-violet-500/50',
      glowColor: 'shadow-violet-500/20'
    }
  ];

  const handleSelectPage = (tab: NavTab) => {
    sound.playTick();
    setActiveTab(tab);
    onClose();
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const isCurrentTab = (tab: NavTab) => {
    if (tab === 'home' || tab === 'dashboard') {
      return activeTab === 'home' || activeTab === 'dashboard';
    }
    if (tab === 'plan') {
      return activeTab === 'plan' || activeTab === 'curriculum';
    }
    return activeTab === tab;
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end select-none"
          dir="rtl"
        >
          {/* Backdrop Blur */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Swipeable Pages Sheet Panel */}
          <motion.div
            key="sheet-content"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full bg-slate-950/95 border-t border-indigo-500/30 rounded-t-[32px] shadow-2xl shadow-black pb-8 pt-4 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="تصفح صفحات المنصة"
          >
            {/* Top Sheet Handle Pill */}
            <div className="flex justify-center mb-2">
              <span className="w-12 h-1.5 rounded-full bg-slate-700/80" />
            </div>

            {/* Header: Title, Instruction, and Action Buttons */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
                  <Compass className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    صفحات وأقسام المنصة
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    اسحب لليمين واليسار (← →) ثم اضغط للانتقال
                  </p>
                </div>
              </div>

              {/* Scroll Arrows & Close Button */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={scrollRight}
                  className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95"
                  aria-label="تمرير لليمين"
                  title="السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollLeft}
                  className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95"
                  aria-label="تمرير لليسار"
                  title="التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 transition-colors active:scale-95 mr-1"
                  aria-label="إغلاق"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Hub Category Filter Bar */}
            <div className="flex items-center gap-1.5 px-5 pt-3 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'كافة الأقسام (13)' },
                { id: 'study', label: 'المنهاج والدراسة' },
                { id: 'exams', label: 'الامتحانات والتقييم' },
                { id: 'tools', label: 'المختبر والأدوات' },
                { id: 'community', label: 'التفوق والمجتمع' }
              ].map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playTick();
                      setActiveCategory(cat.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Horizontal Swipeable Track (بتسحب لليمين واليسار) */}
            <div 
              ref={carouselRef}
              className="flex flex-row items-stretch gap-3.5 overflow-x-auto px-5 py-5 scroll-smooth snap-x snap-mandatory no-scrollbar"
              style={{
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {(activeCategory === 'all' ? pages : pages.filter(p => p.category === activeCategory)).map((item, index) => {
                const Icon = item.icon;
                const active = isCurrentTab(item.tab);

                return (
                  <button
                    key={item.tab}
                    onClick={() => handleSelectPage(item.tab)}
                    className={`relative w-[260px] sm:w-[280px] shrink-0 snap-center rounded-3xl p-5 text-right flex flex-col justify-between transition-all duration-200 active:scale-95 text-slate-200 ${
                      active
                        ? `bg-slate-900 border-2 ${item.colorBorder} shadow-xl ${item.glowColor} ring-2 ring-indigo-500/40`
                        : 'bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Icon + Badge + Number */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg shadow-black/40`}>
                          <Icon className="w-6 h-6 stroke-[2]" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                              {item.badge}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            {index + 1}/12
                          </span>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white tracking-tight">
                            {item.title}
                          </h4>
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-indigo-400 block">
                          {item.subtitle}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 mt-4 border-t border-slate-800/70 flex items-center justify-between">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${active ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {active ? (
                          <>
                            <span>الصفحة الحالية</span>
                            <span className="text-sm font-bold">✓</span>
                          </>
                        ) : (
                          <>
                            <span>انتقال مباشر</span>
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        اضغط هنا
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Swipe Hint */}
            <div className="flex items-center justify-center gap-2 text-center px-4 pt-1 text-[11px] text-slate-400 font-medium">
              <span>← اسحب يميناً ويساراً لاستكشاف بقية الأقسام الـ 12 →</span>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
