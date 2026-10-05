import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  X, 
  Share, 
  PlusSquare, 
  Sparkles, 
  CheckCircle2, 
  ArrowDownToLine,
  Zap
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DISMISS_SESSION_KEY = 'bac240_pwa_install_banner_dismissed';

export interface PWAInstallPromptProps {
  /**
   * 'navbar': Elegant quick capsule designed for top navbar beside platform logo/title
   * 'floating': Floating install banner anchored at screen bottom with dismiss option
   */
  variant?: 'navbar' | 'floating';
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  variant = 'floating', 
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check sessionStorage for dismissed status on mount
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(DISMISS_SESSION_KEY);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // Handle potential sessionStorage access restrictions gracefully
    }
  }, []);

  // 1. Standalone check: If running in standalone mode (already installed), render nothing
  if (isInstalled) {
    return null;
  }

  // 2. Only show if device can actually install (Chromium deferredPrompt or iOS Safari)
  const canShowPrompt = isInstallable || isIOS;
  if (!canShowPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (success) {
          setIsDismissed(true);
        }
      } catch (err) {
        console.error('PWA Install Error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_SESSION_KEY, 'true');
    } catch {}
  };

  /* -------------------------------------------------------------
   * RENDER: Top Navbar Capsule (variant="navbar")
   * ----------------------------------------------------------- */
  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          title={isIOS ? 'تثبيت المنصة على آيفون / آيباد' : 'تثبيت المنصة كتطبيق على جهازك'}
          className={`relative group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 hover:from-indigo-600 hover:to-violet-600 text-indigo-300 hover:text-white font-bold text-xs shadow-sm hover:shadow-md hover:shadow-indigo-500/25 transition-all duration-300 active:scale-95 ${className}`}
        >
          {/* Subtle glowing animated border effect */}
          <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500/30 via-amber-500/20 to-violet-500/30 opacity-0 group-hover:opacity-100 transition-opacity blur-xs" />
          
          <span className="relative flex items-center gap-1.5">
            <span className="text-sm">📲</span>
            <span className="font-bold tracking-tight">تثبيت التطبيق</span>
            <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400 group-hover:text-white transition-colors" />
          </span>
        </button>

        {/* iOS Safari Instruction Modal */}
        <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
      </>
    );
  }

  /* -------------------------------------------------------------
   * RENDER: Floating Bottom Banner (variant="floating")
   * ----------------------------------------------------------- */
  if (isDismissed) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-20 lg:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 select-none ${className}`}
          >
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-4 sm:p-5 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl">
              {/* Decorative background glows */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" />

              <div className="relative flex items-start justify-between gap-3">
                {/* Left: App Icon & Text */}
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src="/favicon.svg"
                      alt="BAC - 240"
                      className="h-12 w-12 rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 object-contain bg-slate-950"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-slate-950 font-black shadow">
                      ⚡
                    </span>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-black text-white tracking-tight">
                        ثبّت منصة BAC - 240 على هاتفك
                      </h4>
                      <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                        PWA
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs sm:max-w-sm">
                      تصفح المنهاج، البطاقات، والمؤقت بملء الشاشة مع سرعة فائقة والعمل في وضع عدم الاتصال بدون متصفح.
                    </p>
                  </div>
                </div>

                {/* Right: Dismiss button */}
                <button
                  onClick={handleDismissBanner}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="إغلاق الإشعار مؤقتاً"
                  title="إغلاق مؤقت"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="relative mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>تثبيت فوري بضغطة زر واحدة</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDismissBanner}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                  >
                    لاحقاً
                  </button>

                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isIOS ? 'تثبيت على آيفون' : 'تثبيت الآن'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Instruction Modal */}
      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  );
};

/* -------------------------------------------------------------
 * SUB-COMPONENT: iOS Safari Install Guidance Modal / Bottom Sheet
 * ----------------------------------------------------------- */
interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      <div 
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-indigo-500/30 bg-slate-900 p-6 shadow-2xl text-right space-y-5 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.svg"
              alt="BAC - 240"
              className="h-9 w-9 rounded-xl border border-indigo-500/30 object-contain bg-slate-950 shadow"
            />
            <div>
              <h3 className="text-sm font-bold text-white">
                تثبيت المنصة على iPhone / iPad
              </h3>
              <p className="text-[11px] text-slate-400">
                خطوتان بسيطتان لإضافة التطبيق لشاشتك الرئيسية
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

        {/* Steps */}
        <div className="space-y-3 text-xs text-slate-200">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
              1
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-white">
                اضغط على زر المشاركة (Share) في Safari:
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed flex items-center gap-1.5">
                <span>تجد أيقونة المشاركة</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700 font-mono">
                  <Share className="w-3 h-3" /> Share
                </span>
                <span>في الشريط السفلي لمتصفح Safari.</span>
              </p>
            </div>
          </div>

          {/* Step 2 */}
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
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                  <PlusSquare className="w-3 h-3" /> Add to Home Screen
                </span>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
              3
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-white">
                اضغط على "إضافة" (Add) في الزاوية العلوية:
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ستستقر أيقونة منصة <strong className="text-indigo-400">BAC - 240</strong> مباشرة على شاشتك الرئيسية لفتحها دون شريط عناوين المتصفح.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits reminder */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-center gap-2.5 text-xs text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>تطبيق خفيف، يفتح بلمح البصر، ولا يستهلك ذاكرة هاتفك.</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>فهمت الخطوات، سأقوم بالتثبيت</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
