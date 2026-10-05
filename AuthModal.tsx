import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Key, 
  AlertTriangle, 
  Lock, 
  MapPin, 
  User, 
  X, 
  Info, 
  Clock, 
  Send,
  MessageSquare,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  authenticateStudent, 
  checkRateLimit, 
  recordFailedAttempt 
} from '../services/firebase';
import { SYRIAN_GOVERNORATES } from '../data/initialData';
import { WhatsAppIcon, TelegramIcon, OFFICIAL_SUPPORT_CHANNELS } from './SocialIcons';

export const AuthModal: React.FC<{ 
  initialError?: string | null; 
  initialCode?: string; 
  initialPhone?: string; 
}> = ({ initialError, initialCode, initialPhone }) => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, deviceId, user } = useApp();

  const [code, setCode] = useState(() => initialCode || '');
  const [phone, setPhone] = useState(() => initialPhone || '');
  const [fullName, setFullName] = useState('');
  const [governorate, setGovernorate] = useState('دمشق');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [requiresReset, setRequiresReset] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
    if (initialPhone) setPhone(initialPhone);
    if (initialError !== undefined) setErrorMessage(initialError);
  }, [initialCode, initialPhone, initialError]);

  // Rate Limiting state (lock if attempts > 4)
  const [isLocked, setIsLocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);

  // Strict check on mount: check if device is locked
  useEffect(() => {
    const status = checkRateLimit();
    setIsLocked(status.isLocked);
    setRemainingSeconds(status.remainingSeconds);
    setFailedAttemptsCount(status.attempts);
  }, []);

  // Smart URL Auto-Login Detection & Instant Cloud Activation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) return; // already logged in

    const searchParams = new URLSearchParams(window.location.search);
    const rawCode = searchParams.get('code') || searchParams.get('studentCode');
    const rawPhone = searchParams.get('phone') || searchParams.get('phoneNumber');

    if (rawCode && rawPhone) {
      const cleanC = rawCode.trim().toUpperCase();
      const cleanP = rawPhone.trim().replace(/[\s-]/g, '');

      // Pre-fill state in case of failure
      setCode(cleanC);
      setPhone(cleanP);

      // Check rate limit before auto-logging in
      const status = checkRateLimit();
      if (status.isLocked) {
        setIsLocked(true);
        setRemainingSeconds(status.remainingSeconds);
        // Clean URL so attempts don't loop
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Trigger instant seamless auto-login
      setIsAutoLoggingIn(true);
      setIsLoading(true);

      authenticateStudent(cleanC, cleanP, 'دمشق', '')
        .then((result) => {
          setIsLoading(false);
          setIsAutoLoggingIn(false);

          if (result.success && result.user) {
            loginUser(result.user);
            setIsAuthModalOpen(false);
            // Clean URL silently upon success
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            // Failed: show clear error, keep code and phone in fields, and clean URL
            setErrorMessage(result.error || 'فشل تسجيل الدخول التلقائي. يرجى التأكد من الكود ورقم الهاتف.');
            if (result.requiresReset) {
              setRequiresReset(true);
            } else {
              const rate = recordFailedAttempt();
              setFailedAttemptsCount(rate.attempts);
              if (rate.isLocked) {
                setIsLocked(true);
                setRemainingSeconds(rate.remainingSeconds);
              }
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch((err) => {
          console.warn('Auto-login exception:', err);
          setIsLoading(false);
          setIsAutoLoggingIn(false);
          setErrorMessage('تعذر الاتصال بالخادم للتحقق من الرابط المباشر. يرجى الضغط على زر الدخول يدوياً.');
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [user, deviceId]);

  // Countdown timer when locked
  useEffect(() => {
    if (!isLocked || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, remainingSeconds]);

  useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
    }
  }, [initialError]);

  const formatLockTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) return;

    setErrorMessage(null);
    setRequiresReset(false);
    setIsLoading(true);

    const result = await authenticateStudent(
      code,
      phone,
      governorate,
      fullName
    );

    setIsLoading(false);

    if (result.success && result.user) {
      loginUser(result.user);
      setIsAuthModalOpen(false);
    } else {
      setErrorMessage(result.error || 'حدث خطأ في التحقق من البيانات المدخلة.');
      if (result.requiresReset) {
        setRequiresReset(true);
      } else {
        const rate = recordFailedAttempt();
        setFailedAttemptsCount(rate.attempts);
        if (rate.isLocked) {
          setIsLocked(true);
          setRemainingSeconds(rate.remainingSeconds);
        }
      }
    }
  };

  // If user is logged in and modal is closed, don't render
  if (user && !isAuthModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl p-3 sm:p-6 md:p-8 flex min-h-screen items-center justify-center select-none" 
      dir="rtl"
    >
      {/* Ambient Radial Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-80 sm:w-96 h-80 sm:h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg lg:max-w-4xl my-auto rounded-3xl border border-slate-800/90 bg-slate-900/95 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
        
        {/* Seamless Auto-Login Splash / Glass Loader */}
        {isAutoLoggingIn && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-indigo-600/40 border border-indigo-400/30 animate-pulse">
                240
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-2">
                <span>جارٍ التحقق وتفعيل حسابك الموثق تلقائياً...</span>
                <span className="inline-block animate-spin">⚡</span>
              </h3>
              <p className="text-xs text-slate-300">
                الربط الآمن المباشر عبر الرابط الذكي • دورة 2026
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mt-1">
                <span>بإشراف وإدارة: أ. محمود صيبعة</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Close Button only available if already logged in */}
        {user && (
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute left-4 top-4 z-20 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Right Column: Platform Presentation & Supervisor Identity (Rich on desktop, compact on mobile) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-slate-950/80 p-5 sm:p-7 border-b lg:border-b-0 lg:border-l border-slate-800/80 flex flex-col justify-between">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/20">
                  240
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>منصة BAC - 240</span>
                    <span className="text-xs">🇸🇾</span>
                  </h1>
                  <span className="text-xs text-indigo-400 font-semibold block">
                    دورة 2026 • العلامة التامة 240/240
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                المنظومة الرقمية التعليمية الشاملة لطلاب شهادة الثانوية العامة السورية (الفرع العلمي).
              </p>

              {/* Highlights on desktop */}
              <div className="hidden sm:block space-y-2.5 bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60">
                <span className="text-[11px] font-bold text-slate-300 block mb-1">
                  محتويات المنظومة المتكاملة:
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>منهاج علمي تفاعلي مع بنك اختبارات مؤتمتة فورية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>بنك أخطاء ذكي يواكب دراستك خطوة بخطوة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>سلسلة الالتزام ومؤقت بومودورو الدراسي المنظم</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                    <span>سحابة الملازم الرسمية ونماذج الامتحانات الوزارية</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Supervisor Branding & Contact Block on Desktop */}
            <div className="pt-4 mt-4 border-t border-slate-800/70">
              <div className="text-[11px] text-slate-400 mb-2 flex items-center justify-between">
                <span>إشراف وإدارة المنصة:</span>
                <span className="text-indigo-300 font-bold">أ. محمود صيبعة</span>
              </div>
              <div className="text-[11px] text-slate-400 mb-2.5">
                هل تحتاج كود تفعيل أو نسيت بياناتك؟ تواصل مباشرة:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={OFFICIAL_SUPPORT_CHANNELS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all active:scale-95 group"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
                  <span>واتساب</span>
                </a>
                <a
                  href={OFFICIAL_SUPPORT_CHANNELS.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-400 hover:text-sky-300 text-xs font-bold transition-all active:scale-95 group"
                >
                  <TelegramIcon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
                  <span>تلغرام</span>
                </a>
              </div>
            </div>
          </div>

          {/* Left Column: Form / Locked State */}
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-center">
            
            <div className="mb-4">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                بوابة التحقق وتسجيل الدخول
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                يرجى إدخال كود التفعيل المعتمد ورقم هاتفك السوري للربط
              </p>
            </div>

            {/* Rate Limiting Active Banner (Locked after more than 4 attempts) */}
            {isLocked ? (
              <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-sm">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>جدار الحظر الأمني النشط</span>
                </div>
                
                <p className="text-xs text-rose-200 leading-relaxed font-medium">
                  تم إدخال أكثر من 4 محاولات خاطئة. تم قفل تسجيل الدخول مؤقتاً على هذا الجهاز لمنع التخمين وحماية الحسابات.
                </p>

                <div className="flex items-center justify-center gap-2 text-rose-300 text-base font-mono font-black pt-1 bg-rose-950/70 py-2.5 rounded-xl border border-rose-500/30 shadow-inner">
                  <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span dir="ltr">الوقت المتبقي لفك القفل: {formatLockTime(remainingSeconds)}</span>
                </div>

                <p className="text-[11px] text-slate-400 pt-1">
                  تواصل مباشرة مع المشرف أ. محمود صيبعة لفك القفل أو استلام بيانات الدخول الصحيحة:
                </p>

                {/* Official Support Channels */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href="https://wa.me/963996148962?text=مرحباً%20أستاذ%20محمود،%20أواجه%20مشكلة%20في%20تسجيل%20الدخول%20لمنصة%20BAC-240"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-95 border border-emerald-400/30 group"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>طلب الدخول عبر واتساب</span>
                  </a>
                  <a
                    href="https://t.me/bac240_saibaa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs transition-all shadow-md shadow-sky-600/25 active:scale-95 border border-sky-400/30 group"
                  >
                    <TelegramIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>طلب الدخول عبر تلغرام</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3.5">

                {/* Activation Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    كود التفعيل المعتمد (Activation Code)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="BAC-XXXX-XXXX-XXXX"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pl-10 text-sm font-mono font-bold text-indigo-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 tracking-wider"
                    />
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    كود خاص صادر عن إدارة المنصة ومقترن برقمك وبصمة جهازك
                  </p>
                </div>

                {/* Syrian Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم الهاتف السوري المسجل
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09XXXXXXXX"
                      maxLength={10}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pl-10 text-sm font-mono text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Student Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الاسم الكامل للطالب
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: يوسف أحمد الصباغ"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>

                {/* Syrian Governorate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المحافظة
                  </label>
                  <div className="relative">
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 pr-10 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {SYRIAN_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                    <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>

                {/* Error Message Alert */}
                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs flex items-start gap-2.5 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">{errorMessage}</p>
                      {requiresReset && (
                        <p className="text-[11px] text-indigo-300 font-medium">
                          لإعادة فك الارتباط بالجهاز السابق يرجى مراسلة أ. محمود صيبعة عبر أزرار واتساب أو تلغرام أدناه مع تزويده بكودك وبصمة هذا الجهاز.
                        </p>
                      )}
                      {failedAttemptsCount > 0 && failedAttemptsCount <= 4 && !requiresReset && (
                        <p className="text-[10px] text-rose-400/90 font-mono">
                          (محاولة غير صحيحة رقم {failedAttemptsCount} من 4 محاولات مسموحة — يمكنك طلب كودك وبياناتك مباشرة عبر أزرار التواصل أدناه)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Device ID info */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>بصمة هذا الجهاز (Device ID):</span>
                  </span>
                  <span className="font-mono text-slate-300 font-semibold truncate max-w-[190px]">
                    {deviceId}
                  </span>
                </div>

                {/* Submit Button */}
                <div className="pt-1.5">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    {isLoading ? (
                      <span>جاري التحقق والمطابقة السحابية...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تأكيد الربط والدخول للمنظومة</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Request Login Credentials via WhatsApp & Telegram */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>طلب كود وبيانات الدخول:</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      استجابة فورية
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                    تواصل مباشرة مع المشرف أ. محمود صيبعة للحصول على كودك وبياناتك فوراً:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://wa.me/963996148962?text=مرحباً%20أستاذ%20محمود،%20أنا%20طالب%20بكالوريا%20علمي%20وأريد%20طلب%20كود%20التفعيل%20ومعلومات%20الدخول%20الخاصة%20بي%20لمنصة%20BAC-240"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-95 border border-emerald-400/30 group"
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>طلب البيانات عبر واتساب</span>
                    </a>

                    <a
                      href="https://t.me/bac240_saibaa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs transition-all shadow-md shadow-sky-600/25 active:scale-95 border border-sky-400/30 group"
                    >
                      <TelegramIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span>طلب البيانات عبر تلغرام</span>
                    </a>
                  </div>
                </div>

              </form>
            )}

            <div className="mt-3.5 border-t border-slate-800/80 pt-3 text-center text-[10px] text-slate-500">
              المشرف العام: أ. محمود صيبعة • دورة 2026 • العلامة التامة 240/240
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
