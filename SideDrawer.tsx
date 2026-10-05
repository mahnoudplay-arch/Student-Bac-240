import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  BookOpen, 
  Layers, 
  Tv, 
  Timer, 
  Flame, 
  Trophy, 
  Share2, 
  User, 
  LogOut, 
  ShieldCheck, 
  Moon, 
  Sun,
  Copy,
  Check,
  GitFork,
  Smartphone,
  FileText,
  Award
} from 'lucide-react';
import { useApp, NavTab } from '../context/AppContext';
import { getStudentDisplayId } from '../lib/studentUtils';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    activeTab, 
    setActiveTab, 
    user, 
    logoutUser, 
    setIsAuthModalOpen, 
    theme,
    toggleTheme,
    showToast
  } = useApp();

  const [copiedId, setCopiedId] = React.useState(false);

  // Prevent background body scroll when drawer is open
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

  const isCurrentTab = (tab: NavTab) => {
    if (tab === 'home' || tab === 'dashboard') {
      return activeTab === 'home' || activeTab === 'dashboard';
    }
    return activeTab === tab;
  };

  const navItems: { tab: NavTab; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    { tab: 'home', label: 'لوحة التحكم الرئيسية', icon: Home, description: 'نظرة عامة وإحصائيات' },
    { tab: 'curriculum', label: 'المنهاج السوري 2026', icon: BookOpen, description: 'متابعة الدروس والوحدات' },
    { tab: 'writtenExams', label: 'الامتحانات والسلالم الوزارية', icon: FileText, description: 'محاكاة القاعة وسلالم التصحيح الذاتي' },
    { tab: 'mistakeBank', label: 'بنك أخطائي وتأصيل NotebookLM', icon: Award, description: 'توثيق الهفوات وسد الثغرات المعرفية' },
    { tab: 'mindmaps', label: 'الخرائط الذهنية التفاعلية', icon: GitFork, description: 'أشجار مفاهيمية بتصميم NotebookLM' },
    { tab: 'flashcards', label: 'البطاقات الذكية', icon: Layers, description: 'مراجعة وحفظ المفاهيم' },
    { tab: 'youtube', label: 'اليوتيوب التعليمي', icon: Tv, description: 'دروس مرئية مختارة' },
    { tab: 'timer', label: 'مؤقت المذاكرة (بومودورو)', icon: Timer, description: 'جلسات تركيز بدون تشتيت' },
    { tab: 'challenge', label: 'التحدي وسلسلة الالتزام', icon: Flame, description: 'المنافسة والترتيب' },
    { tab: 'journey', label: 'الرحلة والجدول الأسبوعي', icon: Trophy, description: 'خطة الطريق للـ 240' },
    { tab: 'community', label: 'المكتبة والملفات السحابية', icon: Share2, description: 'نماذج وزارية وسلالم تصحيح' },
    { tab: 'profile', label: 'الملف الشخصي والحساب', icon: User, description: 'إعدادات الطالب وبصمة الجهاز' },
  ];

  const studentDisplayId = getStudentDisplayId(user);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(studentDisplayId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end" dir="rtl">
          {/* Dim Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Side Drawer Body (Anchored to Right Edge) */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-84 max-w-[85vw] h-full h-dvh bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-right select-none"
            role="dialog"
            aria-modal="true"
            aria-label="القائمة الجانبية للمنصة"
          >
            {/* 1. Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-lg shadow-md shadow-indigo-600/30">
                  240
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">BAC - 240</h3>
                  <span className="text-xs text-indigo-400 font-medium">بوابة الطالب العلمي 🇸🇾</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95"
                aria-label="إغلاق القائمة"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Student Identification Card */}
              {user ? (
                <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {user.fullName.charAt(0) || 'ط'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-snug">{user.fullName}</h4>
                        <span className="text-[11px] text-slate-400 block">
                          محافظة {user.governorate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-lg">
                      <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-amber-400">{user.streakDays}d</span>
                    </div>
                  </div>

                  {/* Student ID (معرف الطالب - وليس كود التفعيل) */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">معرف الطالب (ID)</span>
                      <span className="font-mono font-bold text-indigo-300 text-xs tracking-wider">
                        {studentDisplayId}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyId}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      title="نسخ معرف الطالب"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId ? 'تم' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-950/20 text-center space-y-2">
                  <p className="text-xs text-indigo-300 font-semibold">أنت مسجل حالياً كزائر</p>
                  <button
                    onClick={() => {
                      onClose();
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    تفعيل كود الاشتراك
                  </button>
                </div>
              )}

              {/* In-Drawer Quick Install Capsule */}
              <div>
                <PWAInstallPrompt variant="navbar" className="w-full justify-center py-2.5 text-xs shadow-sm" />
              </div>

              {/* Navigation Tabs List */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 block mb-2">
                  أقسام المنصة الشاملة
                </span>

                {navItems.map((item) => {
                  const active = isCurrentTab(item.tab);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.tab}
                      onClick={() => {
                        setActiveTab(item.tab);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${active ? 'bg-indigo-500/30 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <span className="block leading-snug">{item.label}</span>
                          <span className={`text-[10px] font-normal block ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {item.description}
                          </span>
                        </div>
                      </div>

                      {active ? (
                        <span className="text-xs font-mono font-bold text-indigo-200">←</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">›</span>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* 3. Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  toggleTheme();
                  const nextTheme = theme === 'dark' ? 'light' : 'dark';
                  showToast(nextTheme === 'light' ? '☀️ تم تفعيل الوضع النهاري' : '🌙 تم تفعيل الوضع الليلي');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>{theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
              </button>

              {user ? (
                <button
                  onClick={() => {
                    onClose();
                    logoutUser();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل خروج</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>تفعيل الكود</span>
                </button>
              )}
            </div>

          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
