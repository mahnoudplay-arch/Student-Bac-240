import React from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarCheck, 
  BookOpen, 
  Timer, 
  FileText, 
  Award, 
  Wrench, 
  Layers, 
  GitFork, 
  Tv, 
  Trophy, 
  Share2, 
  Compass, 
  User,
  ChevronLeft
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';

export interface HubGroup {
  id: 'study' | 'exams' | 'tools' | 'community';
  title: string;
  tabs: {
    tab: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[];
}

export const HUB_GROUPS: Record<string, HubGroup> = {
  study: {
    id: 'study',
    title: 'مسار المنهاج والدراسة',
    tabs: [
      { tab: 'plan', label: 'الخطة الموجهة يوماً بيوم', icon: CalendarCheck, badge: 'المركزي' },
      { tab: 'curriculum', label: 'شجرة المنهاج والدروس', icon: BookOpen },
      { tab: 'timer', label: 'مؤقت التركيز وبومودورو', icon: Timer }
    ]
  },
  exams: {
    id: 'exams',
    title: 'قاعة الامتحانات والتقييم',
    tabs: [
      { tab: 'writtenExams', label: 'نماذج وسلالم التصحيح الوزارية', icon: FileText },
      { tab: 'mistakeBank', label: 'بنك الهفوات وسد الثغرات', icon: Award }
    ]
  },
  tools: {
    id: 'tools',
    title: 'المختبر والأدوات الذكية',
    tabs: [
      { tab: 'tools', label: 'المختبر والأدوات (11 أداة)', icon: Wrench, badge: 'المحاكي' },
      { tab: 'flashcards', label: 'البطاقات الذكية 3D', icon: Layers },
      { tab: 'mindmaps', label: 'الخرائط الذهنية', icon: GitFork },
      { tab: 'youtube', label: 'يوتيوب المعزول', icon: Tv }
    ]
  },
  community: {
    id: 'community',
    title: 'لوحة الشرف والمجتمع',
    tabs: [
      { tab: 'challenge', label: 'المتصدرين وسلسلة الالتزام', icon: Trophy, badge: 'المنافسة' },
      { tab: 'community', label: 'المكتبة السحابية', icon: Share2 },
      { tab: 'journey', label: 'جدول الرحلة للـ 240', icon: Compass },
      { tab: 'profile', label: 'الملف الأكاديمي والإعدادات', icon: User }
    ]
  }
};

export const getHubForTab = (tab: NavTab): HubGroup | null => {
  if (tab === 'home' || tab === 'dashboard') return null;
  if (tab === 'plan' || tab === 'curriculum' || tab === 'timer') return HUB_GROUPS.study;
  if (tab === 'writtenExams' || tab === 'mistakeBank') return HUB_GROUPS.exams;
  if (tab === 'tools' || tab === 'flashcards' || tab === 'mindmaps' || tab === 'youtube') return HUB_GROUPS.tools;
  if (tab === 'challenge' || tab === 'community' || tab === 'journey' || tab === 'profile') return HUB_GROUPS.community;
  return null;
};

export const HubNavigationBar: React.FC = () => {
  const { activeTab, setActiveTab, exams, mistakes } = useApp();

  const currentHub = getHubForTab(activeTab);
  if (!currentHub) return null;

  return (
    <div className="mb-5 select-none" dir="rtl">
      <div className="rounded-2xl border border-slate-800/80 bg-[#101622] p-1.5 sm:p-2 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          
          {/* Hub Title and Breadcrumb */}
          <div className="flex items-center gap-2 px-2.5 py-1 text-xs">
            <span className="text-[11px] font-medium text-slate-400">
              المحور الأكاديمي
            </span>
            <ChevronLeft className="w-3 h-3 text-slate-600" />
            <span className="font-bold text-slate-200">
              {currentHub.title}
            </span>
          </div>

          {/* Quick Sub-Tab Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {currentHub.tabs.map((item) => {
              const isActive = activeTab === item.tab;
              const Icon = item.icon;

              // Live counters
              let extraCount: number | null = null;
              if (item.tab === 'writtenExams' && exams.length > 0) {
                extraCount = exams.length;
              } else if (item.tab === 'mistakeBank') {
                const unresolved = mistakes.filter(m => !m.isResolved).length;
                if (unresolved > 0) extraCount = unresolved;
              }

              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 border border-slate-700/70 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="text-[10px] text-indigo-300 font-normal opacity-80 hidden md:inline">
                      · {item.badge}
                    </span>
                  )}

                  {extraCount !== null && (
                    <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold ${
                      item.tab === 'mistakeBank' 
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' 
                        : 'bg-slate-750 text-slate-300 border border-slate-700'
                    }`}>
                      {extraCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
