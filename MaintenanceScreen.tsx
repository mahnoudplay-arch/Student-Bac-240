import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Clock, 
  ShieldAlert, 
  MessageSquare, 
  Send, 
  Sparkles, 
  RotateCw,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { PlatformStatus } from '../types';
import { WhatsAppIcon, TelegramIcon, OFFICIAL_SUPPORT_CHANNELS } from './SocialIcons';

interface MaintenanceScreenProps {
  status: PlatformStatus;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ 
  status
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const title = status.maintenanceTitle || 'أعمال الصيانة والتحديث الدوري للمنصة';
  const message = status.maintenanceMessage || 
    'يقوم المشرف العام أ. محمود صيبعة حالياً بإجراء تحديثات وتحسينات شاملة على الخوادم وقواعد البيانات لتوفير أعلى كفاءة وأداء لطلاب البكالوريا. نعتذر عن هذا التوقف المؤقت وسنعود للعمل فور اكتمال التحديثات.';

  // Format expected reopen time or countdown if valid date
  const renderExpectedReopen = () => {
    if (!status.expectedReopenAt) return null;

    const reopenDate = new Date(status.expectedReopenAt);
    const isValidDate = !isNaN(reopenDate.getTime());

    if (isValidDate) {
      const diffMs = reopenDate.getTime() - now;
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        return (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>موعد العودة وإعادة الفتح المتوقع:</span>
            </div>
            
            <div className="font-mono text-2xl sm:text-3xl font-black text-amber-300 tracking-tight" dir="ltr">
              {hours > 0 && `${hours}h `}{minutes.toString().padStart(2, '0')}m {seconds.toString().padStart(2, '0')}s
            </div>

            <p className="text-[11px] text-amber-200/80">
              {status.expectedReopenAt}
            </p>
          </div>
        );
      }
    }

    // Otherwise show string representation as set by admin
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>موعد العودة المتوقع:</span>
        </div>
        <p className="text-sm sm:text-base font-bold text-amber-200">
          {status.expectedReopenAt}
        </p>
      </div>
    );
  };

  // Determine emergency contact links
  const emergencyUrl = status.emergencyContact?.startsWith('http') 
    ? status.emergencyContact 
    : (status.emergencyContact ? `https://wa.me/${status.emergencyContact.replace(/\+/g, '')}` : OFFICIAL_SUPPORT_CHANNELS.whatsappUrl);

  return (
    <div 
      className="fixed inset-0 z-[999] overflow-y-auto bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8 select-none"
      dir="rtl"
    >
      {/* Background Ambience & Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -right-28 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -left-28 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/10 via-slate-950/80 to-slate-950" />
      </div>

      <div className="w-full max-w-xl my-auto rounded-3xl border border-amber-500/30 bg-slate-900/90 shadow-2xl shadow-black/90 p-6 sm:p-8 text-center space-y-6 relative overflow-hidden backdrop-blur-2xl">
        
        {/* Animated Amber/Rose Maintenance Badge */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-indigo-950 border border-amber-500/40 shadow-xl shadow-amber-500/10">
            <Wrench className="w-10 h-10 text-amber-400 animate-bounce" />
            
            {/* Live Indicator Dot */}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
            </span>
          </div>
        </div>

        {/* Title & Brand */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>نظام الإغلاق المؤقت المعتمد</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
            {message}
          </p>
        </div>

        {/* Expected Reopen Capsule */}
        {renderExpectedReopen()}

        {/* Live Auto-Reopen Listening Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 flex items-center justify-center gap-2.5 text-xs text-slate-400">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-medium text-slate-300 text-[11px] sm:text-xs">
            المنصة متصلة بالقاعدة السحابية لحظياً.. ستفتح الواجهة تلقائياً فور انتهاء المشرف من التحديث.
          </span>
        </div>

        {/* Emergency Support Channels */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">للحالات الطارئة والاستفسارات:</span>
            <span className="text-indigo-400 font-bold">أ. محمود صيبعة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={emergencyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/40 active:scale-95 group"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>مراسلة واتساب الطارئة</span>
            </a>

            <a
              href={OFFICIAL_SUPPORT_CHANNELS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-950/40 active:scale-95 group"
            >
              <TelegramIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>قناة تلغرام الرسمية</span>
            </a>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-3">
          منصة BAC - 240 الرقمية • دورة 2026 • العلامة التامة 240/240
        </div>

      </div>
    </div>
  );
};
