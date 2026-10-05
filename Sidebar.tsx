import React from 'react';
import { 
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
  Sparkles,
  Wrench
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    user, 
    exams, 
    mistakes,
    theme
  } = useApp();

  const isCurrentTab = (tab: NavTab) => {
    if (tab === 'home' || tab === 'dashboard') {
      return activeTab === 'home' || activeTab === 'dashboard';
    }
    return activeTab === tab;
  };

  const unresolvedMistakesCount = mistakes.filter(m => !m.isResolved).length;

  const navItems: {
    tab: NavTab;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    hub: 'home' | 'study' | 'exams' | 'tools' | 'community';
    badge?: string;
    badgeDot?: boolean;
    badgeColor?: string;
  }[] = [
    { 
      tab: 'home', 
      label: 'الرئيسية', 
      description: 'غرفة القيادة الأكاديمية والمهام', 
      icon: Home,
      hub: 'home'
    },
    { 
      tab: 'plan', 
      label: 'الخطة الموجهة', 
      description: 'مسار إنجازك الأسبوعي واليومي', 
      icon: CalendarCheck,
      hub: 'study',
      badge: 'المركزي'
    },
    { 
      tab: 'curriculum', 
      label: 'شجرة المنهاج', 
      description: 'تتبع دروس ووحدات الكتب الرسمية', 
      icon: BookOpen,
      hub: 'study'
    },
    { 
      tab: 'aiChat', 
      label: 'المعلم الذكي', 
      description: 'مساعد المنهاج السوري 2026', 
      icon: Sparkles,
      hub: 'study',
      badge: 'AI 2026'
    },
    { 
      tab: 'timer', 
      label: 'مؤقت التركيز', 
      description: 'جلسات تركيز بومودورو بدون تشتيت', 
      icon: Timer,
      hub: 'study'
    },
    { 
      tab: 'writtenExams', 
      label: 'الامتحانات والسلالم', 
      description: 'نماذج وسلالم تصحيح وزارية', 
      icon: FileText,
      hub: 'exams',
      badgeDot: exams.length > 0,
      badgeColor: 'bg-emerald-400'
    },
    { 
      tab: 'mistakeBank', 
      label: 'بنك الأخطاء', 
      description: 'توثيق الهفوات وسد الثغرات', 
      icon: Award,
      hub: 'exams',
      badgeDot: unresolvedMistakesCount > 0,
      badgeColor: 'bg-amber-400'
    },
    { 
      tab: 'tools', 
      label: 'المختبر والأدوات', 
      description: 'مختبر فيزياء، حاسبة، كيمياء، راسم توابع، ومسودة', 
      icon: Wrench,
      hub: 'tools',
      badge: '11 أداة'
    },
    { 
      tab: 'flashcards', 
      label: 'البطاقات الذكية', 
      description: 'تثبيت وحفظ المفاهيم والقوانين 3D', 
      icon: Layers,
      hub: 'tools'
    },
    { 
      tab: 'mindmaps', 
      label: 'الخرائط الذهنية', 
      description: 'أشجار مفاهيمية تفاعلية', 
      icon: GitFork,
      hub: 'tools'
    },
    { 
      tab: 'youtube', 
      label: 'مسرح اليوتيوب', 
      description: 'مشاهدة سينمائية بدون تشتيت', 
      icon: Tv,
      hub: 'tools'
    },
    { 
      tab: 'challenge', 
      label: 'سلسلة الالتزام', 
      description: 'المنافسة ولوحة المتصدرين', 
      icon: Flame,
      hub: 'community',
      badgeDot: Boolean(user?.streakDays && user.streakDays > 0),
      badgeColor: 'bg-amber-400'
    },
    { 
      tab: 'journey', 
      label: 'الرحلة والجدول', 
      description: 'خطة الطريق للـ 240', 
      icon: Trophy,
      hub: 'community'
    },
    { 
      tab: 'community', 
      label: 'المكتبة السحابية', 
      description: 'ملفات وملخصات ونماذج تشاركية', 
      icon: Share2,
      hub: 'community'
    }
  ];

  // Helper to extract the first letter of the student's account name
  const getAccountFirstLetter = (name?: string): string => {
    if (!name || !name.trim()) return 'ط';
    const trimmed = name.trim();
    const firstChar = trimmed[0];
    return /[A-Za-z]/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
  };

  const accountInitial = getAccountFirstLetter(user?.fullName);

  return (
    <aside 
      className={`hidden md:flex flex-col w-16 lg:w-[68px] shrink-0 self-stretch min-h-full border-l backdrop-blur-xl select-none z-30 transition-colors duration-200 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200'
          : 'bg-[#0c1017]/95 border-slate-800/70'
      }`}
      dir="rtl"
      aria-label="شريط الصفحات الدائم"
    >
      {/* Sticky Inner Column: Fixed on screen, never opens or closes (ChatGPT Rail Style) */}
      <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col items-center justify-between py-3 w-full">
        

        {/* Middle Navigation Icons (Smoothly scrollable if viewport is small) */}
        <div 
          className="flex-1 w-full flex flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden py-1 px-1.5 no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {navItems.map((item, idx) => {
            const active = isCurrentTab(item.tab);
            const Icon = item.icon;
            const prevItem = idx > 0 ? navItems[idx - 1] : null;
            const isNewHub = prevItem && prevItem.hub !== item.hub;

            return (
              <React.Fragment key={item.tab}>
                {isNewHub && (
                  <div className={`w-6 h-[1px] my-1 shrink-0 ${
                    theme === 'light' ? 'bg-slate-200' : 'bg-slate-800/80'
                  }`} />
                )}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab(item.tab)}
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      active
                        ? theme === 'light'
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm'
                          : 'bg-slate-800 text-indigo-300 border border-slate-700 shadow-sm'
                        : theme === 'light'
                          ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${
                      active 
                        ? theme === 'light' ? 'scale-105 text-indigo-600' : 'scale-105 text-indigo-400' 
                        : 'group-hover:scale-105'
                    }`} />

                    {/* Active right border indicator line */}
                    {active && (
                      <span className={`absolute right-0 top-2 bottom-2 w-1 rounded-l-full ${
                        theme === 'light' ? 'bg-indigo-600' : 'bg-indigo-500/80'
                      }`} />
                    )}

                    {/* Dot Badge if any */}
                    {item.badgeDot && !active && (
                      <span className={`absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full ${item.badgeColor || 'bg-indigo-400'} ring-2 ${
                        theme === 'light' ? 'ring-white' : 'ring-[#0c1017]'
                      }`} />
                    )}
                  </button>

                  {/* Floating Tooltip to the left of the rail */}
                  <div className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-150 pointer-events-none absolute right-13 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-xl z-50 border ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
                      : 'bg-slate-900 border-slate-750 text-slate-100 shadow-xl'
                  }`}>
                    <span>{item.label}</span>
                    {active && (
                      <span className={`text-[10px] font-normal ${
                        theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'
                      }`}>● نشط</span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom Student Profile Avatar */}
        <div className={`shrink-0 pt-2 border-t w-full flex justify-center ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800/70'
        }`}>
          <div className="relative group">
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border ${
                theme === 'light'
                  ? isCurrentTab('profile')
                    ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-white border-indigo-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-200'
                  : isCurrentTab('profile')
                    ? 'bg-slate-800 text-slate-200 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[#0c1017] border-slate-600'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              aria-label="الملف الشخصي"
            >
              <span className={`font-bold text-sm tracking-tight leading-none select-none ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {accountInitial}
              </span>

              {/* Online student indicator */}
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500/90 ring-2 ${
                theme === 'light' ? 'ring-white' : 'ring-[#0c1017]'
              }`} />
            </button>

            {/* Floating Profile Tooltip */}
            <div className={`opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-150 pointer-events-none absolute right-13 bottom-1 flex flex-col gap-0.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shadow-xl z-50 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
                : 'bg-slate-900 border-slate-750 text-slate-100'
            }`}>
              <span className={theme === 'light' ? 'text-slate-900 font-bold' : 'text-slate-100'}>{user?.fullName || 'الملف الشخصي'}</span>
              <span className={`text-[10px] font-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>انقر لفتح حسابك وإعداداتك</span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
