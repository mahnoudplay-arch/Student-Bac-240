import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Share, 
  PlusSquare, 
  X, 
  RotateCcw,
  Zap,
  Info,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export interface AppInstallSectionProps {
  /**
   * 'dashboard': Prominent rich card anchored at the bottom of the Dashboard page
   * 'settings': Settings row / card styled seamlessly for ProfileSettings
   */
  variant?: 'dashboard' | 'settings';
  className?: string;
}

export const AppInstallSection: React.FC<AppInstallSectionProps> = ({
  variant = 'dashboard',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install, resetInstalledStatus } = usePWAInstall();
  const [activeModal, setActiveModal] = useState<'installed' | 'ios' | 'manual' | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleActionClick = async () => {
    // 1. If already installed: display confirmation modal
    if (isInstalled) {
      setActiveModal('installed');
      return;
    }

    // 2. If iOS Safari: display iOS guidance modal
    if (isIOS) {
      setActiveModal('ios');
      return;
    }

    // 3. If Chromium beforeinstallprompt is ready: trigger native prompt
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (success) {
          setActiveModal('installed');
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
        setActiveModal('manual');
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // 4. Fallback (Desktop, in-app browser, or heuristic not triggered yet)
    setActiveModal('manual');
  };

  const handleTriggerDirectInstall = async () => {
    setActiveModal(null);
    if (isInstallable) {
      try {
        await install();
      } catch (err) {
        console.error('Install execution failed:', err);
      }
    } else if (isIOS) {
      setActiveModal('ios');
    }
  };

  const handleReinstall = async () => {
    resetInstalledStatus();
    setActiveModal(null);
    setTimeout(async () => {
      if (isIOS) {
        setActiveModal('ios');
      } else if (isInstallable) {
        try {
          await install();
        } catch {
          setActiveModal('manual');
        }
      } else {
        setActiveModal('manual');
      }
    }, 150);
  };

  /* -------------------------------------------------------------
   * VARIANT: Settings (ProfileSettings.tsx)
   * ----------------------------------------------------------- */
  if (variant === 'settings') {
    return (
      <>
        <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-sm ${className}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isInstalled 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              }`}>
                {isInstalled ? <CheckCircle2 className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    تطبيق الهاتف المحمول (BAC - 240 App)
                  </h3>
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      مثبت على هذا الجهاز
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                      متاح للتنزيل الفوري
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                  {isInstalled
                    ? 'التطبيق مثبت ومربوط بهاتفك. يمكنك تشغيله من الشاشة الرئيسية بملء الشاشة مع سرعة استجابة فائقة وبدون متصفح.'
                    : 'ثبّت المنصة كتطبيق خفيف على هاتفك لتصل إليها بضغطة زر وتتصفح النوط والاختبارات بدون شريط المتصفح.'}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={handleActionClick}
                disabled={isInstalling}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md ${
                  isInstalled
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/20'
                }`}
              >
                {isInstalled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>التطبيق مثبت على جهازك</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تنزيل وتثبيت التطبيق</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Portals */}
        <AppInstallModals 
          activeModal={activeModal} 
          onClose={() => setActiveModal(null)} 
          onReinstall={handleReinstall} 
          onTriggerInstall={handleTriggerDirectInstall}
        />
      </>
    );
  }

  /* -------------------------------------------------------------
   * VARIANT: Dashboard (bottom of Dashboard.tsx)
   * ----------------------------------------------------------- */
  return (
    <>
      <section 
        className={`relative overflow-hidden rounded-2xl border ${
          isInstalled 
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-slate-900 to-slate-950 shadow-emerald-950/20' 
            : 'border-indigo-500/35 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 shadow-indigo-950/30'
        } p-6 sm:p-7 shadow-xl ${className}`}
      >
        {/* Decorative Ambient Glows */}
        <div className={`pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full ${
          isInstalled ? 'bg-emerald-500/10' : 'bg-indigo-500/15'
        } blur-3xl`} />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            {/* App Icon Mockup */}
            <div className={`relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl ${
              isInstalled
                ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border-emerald-400/30 shadow-emerald-600/30'
                : 'bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-950 border-indigo-400/30 shadow-indigo-600/30'
            } text-white font-black text-2xl shadow-xl border`}>
              240
              <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ${
                isInstalled ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'
              } text-[10px] font-black shadow-md`}>
                {isInstalled ? '✓' : '⚡'}
              </span>
            </div>

            <div className="space-y-1.5 text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                  isInstalled
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {isInstalled ? 'تطبيق الويب مثبت (PWA Active)' : 'تطبيق الويب التقدمي (PWA)'}
                </span>

                <span className="text-[11px] text-slate-400">
                  لأجهزة Android و iPhone و iPad
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {isInstalled
                  ? 'منصة BAC - 240 مثبتة على جهازك بالفعل'
                  : 'ثبّت تطبيق BAC - 240 الرسمي على هاتفك'}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                {isInstalled
                  ? 'تطبيقك جاهز على الشاشة الرئيسية بدون إعلانات وبسرعة خيالية. افتحه مباشرة من شاشتك للتركيز التام.'
                  : 'احصل على تجربة تشغيل ملء الشاشة بدون إعلانات، مع سهولة مراجعة المنهاج وحل الاختبارات حتى عند ضعف الاتصال.'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isInstalling}
              className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-lg ${
                isInstalled
                  ? 'bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 shadow-emerald-950/30'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>التطبيق مثبت على جهازك</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isIOS ? 'تثبيت على آيفون / آيباد' : 'تنزيل وتثبيت التطبيق'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </section>

      {/* Modal Portals */}
      <AppInstallModals 
        activeModal={activeModal} 
        onClose={() => setActiveModal(null)} 
        onReinstall={handleReinstall} 
        onTriggerInstall={handleTriggerDirectInstall}
      />
    </>
  );
};

/* -------------------------------------------------------------
 * SUB-COMPONENT: All Install-Related Modals (Portal)
 * ----------------------------------------------------------- */
interface AppInstallModalsProps {
  activeModal: 'installed' | 'ios' | 'manual' | null;
  onClose: () => void;
  onReinstall: () => void;
  onTriggerInstall: () => void;
}

const AppInstallModals: React.FC<AppInstallModalsProps> = ({
  activeModal,
  onClose,
  onReinstall,
  onTriggerInstall
}) => {
  if (!activeModal || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      <div 
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-indigo-500/30 bg-slate-900 p-6 shadow-2xl text-right space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ================= CASE 1: ALREADY INSTALLED ================= */}
        {activeModal === 'installed' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    التطبيق مثبت على جهازك
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    منصة BAC - 240 تعمل كـ تطبيق مستقل
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 space-y-2">
                <p className="font-semibold text-white leading-relaxed">
                  🎉 تطبيق المنصة مثبت بالفعل على هذا الجهاز ومتاح في شاشتك الرئيسية.
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  إذا كنت تتصفح الآن من داخل متصفح الإنترنت، يمكنك إغلاق التبويب والبحث عن أيقونة <strong className="text-emerald-300">BAC - 240</strong> الذهبية على شاشة هاتفك الرئيسية لتفتحه كتطبيق رسمي وسريع بدون أشرطة المتصفح.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                  <span>شاشة كاملة دون تشويش وأشرطة عناوين المتصفح.</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                  <span>حفظ مسبق للدروس والاختبارات لتصفحها بسلاسة.</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                  <span>سرعة استجابة مضاعفة واستهلاك أقل لبطارية الهاتف.</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حسناً، فهمت</span>
              </button>

              <button
                onClick={onReinstall}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>هل قمت بحذف التطبيق وتريد إعادة تثبيته؟ اضغط هنا</span>
              </button>
            </div>
          </>
        )}

        {/* ================= CASE 2: IOS SAFARI GUIDE ================= */}
        {activeModal === 'ios' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    تثبيت المنصة على iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    خطوات سريعة لإضافة الأيقونة لشاشتك الرئيسية
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    اضغط على زر المشاركة (Share) في Safari:
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed flex items-center gap-1.5 flex-wrap">
                    <span>ستجد زر المشاركة</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono text-[10px]">
                      <Share className="w-3 h-3" /> Share
                    </span>
                    <span>في الشريط السفلي لمتصفح Safari.</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    اختر "إضافة إلى الشاشة الرئيسية":
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed flex items-center gap-1.5 flex-wrap">
                    <span>مرر للأسفل في القائمة واضغط على</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[10px]">
                      <PlusSquare className="w-3 h-3" /> Add to Home Screen
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    اضغط على "إضافة" (Add) في الزاوية العلوية:
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    ستظهر أيقونة <strong className="text-indigo-400">BAC - 240</strong> مباشرة على شاشة الآيفون لفتحها فوراً كتطبيق كامل.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-center gap-2.5 text-xs text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>تطبيق خفيف جداً، لا يستهلك ذاكرة الجهاز ويعمل بدون إنترنت.</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>فهمت الخطوات، سأقوم بالتثبيت</span>
            </button>
          </>
        )}

        {/* ================= CASE 3: GENERAL / BROWSER MANUAL GUIDE ================= */}
        {activeModal === 'manual' && (
          <>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    كيفية تثبيت التطبيق على جهازك
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    دليل التثبيت لمتصفحات Chrome و Edge والأجهزة الذكية
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              {/* Note for In-app browsers */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1 text-amber-300">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>تنبيه هام لمستخدمي تطبيقات المحادثة:</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  إذا فتحت هذا الرابط من داخل (واتساب، تلغرام، أو فيسبوك)، اضغط على النقاط الثلاث <strong className="font-mono text-white">⋮</strong> أعلى الشاشة ثم اختر <strong className="text-white">"فتح في المتصفح / Open in Chrome"</strong> أولاً، لأن المتصفحات المدمجة تمنع التثبيت.
                </p>
              </div>

              {/* Steps for Android Chrome */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>على هواتف أندرويد (Google Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed pr-1">
                  <li>اضغط على زر القائمة <strong className="font-mono text-white">⋮</strong> في أعلى زاوية المتصفح.</li>
                  <li>اضغط على خيار <strong className="text-indigo-300">"تثبيت التطبيق" (Install app)</strong> أو <strong className="text-indigo-300">"إضافة إلى الشاشة الرئيسية"</strong>.</li>
                  <li>أكد التثبيت لتستقر أيقونة المنصة مباشرة بين تطبيقات هاتفك.</li>
                </ol>
              </div>

              {/* Steps for Desktop */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold text-[11px]">
                  <Laptop className="w-3.5 h-3.5 text-violet-400" />
                  <span>على الكمبيوتر أو اللابتوب:</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  ستجد أيقونة تثبيت صغيرة <strong className="text-white">(⊕ أو شاشة مع سهم)</strong> داخل شريط عنوان المتصفح بالأعلى. اضغط عليها لتثبيت التطبيق على سطح المكتب.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onTriggerInstall();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>فهمت الطريقة، شكراً لك (تثبيت التطبيق الآن)</span>
            </button>
          </>
        )}

      </div>
    </div>,
    document.body
  );
};
