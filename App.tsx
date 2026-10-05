import React, { useEffect, useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { RadialDialNav } from './components/RadialDialNav';
import { FloatingAIAssistant } from './components/FloatingAIAssistant';
import { GlobalToastBanner } from './components/GlobalToastBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { useDevToolsShield } from './hooks/useDevToolsShield';
import { authenticateStudent, checkRateLimit } from './services/firebase';
import { hasActiveStudentSession } from './services/studentSession';

// Code-split heavy views with automatic retry for instant page load & high resilience
const lazyWithRetry = (importFn: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await importFn();
    } catch (err) {
      console.warn('Dynamic import failed, retrying...', err);
      await new Promise(res => setTimeout(res, 250));
      return await importFn();
    }
  });

const StudyPlanView = lazyWithRetry(() => import('./components/StudyPlanView').then(m => ({ default: m.StudyPlanView })));
const CurriculumView = lazyWithRetry(() => import('./components/CurriculumView').then(m => ({ default: m.CurriculumView })));
const FlashcardsView = lazyWithRetry(() => import('./components/FlashcardsView').then(m => ({ default: m.FlashcardsView })));
const YouTubeHub = lazyWithRetry(() => import('./components/YouTubeHub').then(m => ({ default: m.YouTubeHub })));
const StudyTimer = lazyWithRetry(() => import('./components/StudyTimer').then(m => ({ default: m.StudyTimer })));
const ChallengeView = lazyWithRetry(() => import('./components/ChallengeView').then(m => ({ default: m.ChallengeView })));
const JourneyStats = lazyWithRetry(() => import('./components/JourneyStats').then(m => ({ default: m.JourneyStats })));
const CommunityCloud = lazyWithRetry(() => import('./components/CommunityCloud').then(m => ({ default: m.CommunityCloud })));
const ProfileSettings = lazyWithRetry(() => import('./components/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const MindMapsView = lazyWithRetry(() => import('./components/MindMapsView').then(m => ({ default: m.MindMapsView })));
const WrittenExamsView = lazyWithRetry(() => import('./components/WrittenExamsView').then(m => ({ default: m.WrittenExamsView })));
const MistakeBankView = lazyWithRetry(() => import('./components/MistakeBankView').then(m => ({ default: m.MistakeBankView })));
const StudyToolkitView = lazyWithRetry(() => import('./components/StudyToolkitView').then(m => ({ default: m.StudyToolkitView })));
const AIChatView = lazyWithRetry(() => import('./components/AIChatView').then(m => ({ default: m.AIChatView })));

// Sleek glass skeleton fallback matching platform theme with zero layout shift
const TabLoadingSkeleton: React.FC = () => (
  <div className="w-full space-y-4 animate-pulse pt-1" dir="rtl" aria-hidden="true">
    <div className="h-24 sm:h-28 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-inner" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <div className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/70" />
      <div className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/70" />
      <div className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/70" />
    </div>
    <div className="h-64 rounded-3xl bg-slate-900/50 border border-slate-800/60" />
  </div>
);

const MainContent: React.FC = () => {
  const { 
    activeTab, 
    user, 
    loginUser,
    theme,
    isUltraDarkMode, 
    authInitialError, 
    platformStatus
  } = useApp();

  // Activate DevTools Shield across entire app
  useDevToolsShield();

  // Smart URL Auto-Login State
  const [isUrlAutoLoggingIn, setIsUrlAutoLoggingIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasLocalUser = hasActiveStudentSession();
    if (hasLocalUser) return false;
    const searchParams = new URLSearchParams(window.location.search);
    const rawCode = searchParams.get('code') || searchParams.get('studentCode');
    const rawPhone = searchParams.get('phone') || searchParams.get('phoneNumber');
    return !!(rawCode && rawPhone);
  });

  const [authPreFill, setAuthPreFill] = useState<{ code?: string; phone?: string; error?: string | null }>({});

  // Telegram Mini App Support
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      try {
        (window as any).Telegram.WebApp.ready();
        (window as any).Telegram.WebApp.expand();
      } catch {}
    }
  }, []);

  // Smart URL Direct Auto-Login Execution
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) return; // already authenticated

    const searchParams = new URLSearchParams(window.location.search);
    const rawCode = searchParams.get('code') || searchParams.get('studentCode');
    const rawPhone = searchParams.get('phone') || searchParams.get('phoneNumber');

    if (!rawCode || !rawPhone) {
      setIsUrlAutoLoggingIn(false);
      return;
    }

    const cleanCode = rawCode.trim().toUpperCase();
    const cleanPhone = rawPhone.trim();

    // Check rate limit before running
    const limitStatus = checkRateLimit();
    if (limitStatus.isLocked) {
      setIsUrlAutoLoggingIn(false);
      setAuthPreFill({
        code: cleanCode,
        phone: cleanPhone,
        error: 'تم تجاوز الحد الأقصى للمحاولات وتم قفل الدخول مؤقتاً لحماية الحساب.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Execute authentication with cloud database
    authenticateStudent(cleanCode, cleanPhone)
      .then((res) => {
        setIsUrlAutoLoggingIn(false);
        if (res.success && res.user) {
          loginUser(res.user);
          // Silently clean URL query params after success
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setAuthPreFill({
            code: cleanCode,
            phone: cleanPhone,
            error: res.error || 'فشل تسجيل الدخول التلقائي. يرجى التأكد من البيانات أو مراجعة المشرف.'
          });
          // Clean URL so refresh does not keep looping
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch((err) => {
        console.warn('Auto-login exception:', err);
        setIsUrlAutoLoggingIn(false);
        setAuthPreFill({
          code: cleanCode,
          phone: cleanPhone,
          error: 'تعذر الاتصال بالخادم للتحقق من الرابط المباشر. يمكنك تسجيل الدخول يدوياً.'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      });
  }, [user, loginUser]);

  // 1. Mandatory Platform Status Check (Firestore: systemSettings/platformStatus)
  // When isPlatformOpen === false, show full-screen maintenance mode and block login
  const isMaintenanceActive = platformStatus?.isPlatformOpen === false;
  if (isMaintenanceActive) {
    return <MaintenanceScreen status={platformStatus} />;
  }

  // 2. Seamless Auto-Login Splash / Glass Loader
  if (isUrlAutoLoggingIn) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none" 
        dir="rtl"
      >
        {/* Ambient Radial Glows */}
        <div className="absolute top-1/4 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-80 sm:w-96 h-80 sm:h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center space-y-6 max-w-sm w-full bg-slate-900/80 backdrop-blur-2xl p-8 rounded-3xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/60">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-3xl flex items-center justify-center shadow-xl shadow-indigo-600/40 border border-indigo-400/40 animate-pulse">
              240
            </div>
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
              <span>جارٍ التحقق وتفعيل حسابك الموثق تلقائياً...</span>
              <span className="inline-block animate-spin">⚡</span>
            </h3>
            <p className="text-xs text-slate-300">
              الربط الآمن المباشر عبر الرابط الذكي • دورة 2026
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <span>بإشراف وإدارة: أ. محمود صيبعة</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 3. Mandatory Gatekeeping
  // If student is not authenticated, block the entire platform interface
  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        theme === 'light' 
          ? 'bg-[#f8fafc] text-slate-900' 
          : isUltraDarkMode ? 'bg-black text-slate-100' : 'bg-slate-950 text-slate-100'
      }`}>
        <AuthModal 
          initialError={authPreFill.error || authInitialError} 
          initialCode={authPreFill.code}
          initialPhone={authPreFill.phone}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'light' 
        ? 'bg-[#f8fafc] text-slate-800' 
        : isUltraDarkMode ? 'bg-black text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Global Interactive Action Toast Notification (Top of Screen) */}
      <GlobalToastBanner />

      {/* Top App Bar with Mobile Swipeable Ribbon */}
      <Navbar />

      {/* Real-time Administrative Announcement Banner */}
      <AnnouncementBanner />

      {/* Main View Area + Desktop/iPad Sidebar */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto flex flex-row items-stretch">
        {/* Desktop & Tablet / iPad Vertical Sidebar */}
        <Sidebar />

        {/* Main View Area with Framer Motion transitions */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-10">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                {(activeTab === 'home' || activeTab === 'dashboard') && <Dashboard />}
                {activeTab === 'plan' && <StudyPlanView />}
                {activeTab === 'curriculum' && <CurriculumView />}
                {activeTab === 'writtenExams' && <WrittenExamsView />}
                {activeTab === 'mistakeBank' && <MistakeBankView />}
                {activeTab === 'aiChat' && <AIChatView />}
                {activeTab === 'mindmaps' && <MindMapsView />}
                {activeTab === 'flashcards' && <FlashcardsView />}
                {activeTab === 'youtube' && <YouTubeHub />}
                {activeTab === 'timer' && <StudyTimer />}
                {activeTab === 'tools' && <StudyToolkitView />}
                {activeTab === 'challenge' && <ChallengeView />}
                {activeTab === 'journey' && <JourneyStats />}
                {activeTab === 'community' && <CommunityCloud />}
                {activeTab === 'profile' && <ProfileSettings />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {/* Radial Dial Wheel Navigation (طلب المستخدم: زر مركزي وقرص دائري بالأسفل) */}
      <RadialDialNav />

      {/* Floating Persistent AI Academic Assistant (طلب المستخدم: محادثة عائمة ومحفوظة عبر كافة الصفحات) */}
      <FloatingAIAssistant />

      {/* Mobile Floating Glass Dock Navigation */}
      <BottomNav />

      {/* Floating In-App PWA Install Banner */}
      <PWAInstallPrompt variant="floating" />

      {/* Device Binding & Auth Security Modal */}
      <AuthModal />

      {/* Academic Footer (Desktop) */}
      <footer className="hidden lg:block w-full border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            منظومة <span className="text-slate-400 font-bold">BAC - 240</span> الرقمية للشهادة الثانوية العامة (الفرع العلمي) — دورة 2026
          </p>
          <p>
            إشراف وإدارة: <span className="text-indigo-400 font-semibold">أ. محمود صيبعة</span> • دمشق، سوريا
          </p>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
