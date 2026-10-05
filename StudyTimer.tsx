import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  Flame, 
  Clock, 
  Coffee, 
  Brain,
  Sparkles,
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sound } from '../services/sound';

export const StudyTimer: React.FC = () => {
  const { 
    user, 
    todayStudyMinutes, 
    triggerCelebration, 
    showToast,
    timerState,
    startStudyTimer,
    pauseStudyTimer,
    resumeStudyTimer,
    resetStudyTimer,
    setTimerDurationMinutes,
    setTimerMode
  } = useApp();

  type TimerMode = 'focus' | 'short_break' | 'long_break';

  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [dismissedSessionTime, setDismissedSessionTime] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const { mode, durationMinutes, secondsLeft, isRunning } = timerState;

  const handleDurationChange = (mins: number) => {
    if (isRunning) return;
    setTimerDurationMinutes(mins);
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning) return;
    setTimerMode(newMode);
  };

  const toggleTimer = () => {
    if (isRunning) {
      pauseStudyTimer();
    } else {
      if (secondsLeft <= 0 || secondsLeft === durationMinutes * 60) {
        startStudyTimer(durationMinutes, undefined, undefined, mode);
      } else {
        resumeStudyTimer();
      }
    }
  };

  const resetTimer = () => {
    resetStudyTimer();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPercent = Math.round(((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100);

  const activeSyncedSession = timerState.lastCompletedSession && timerState.lastCompletedSession.time !== dismissedSessionTime 
    ? timerState.lastCompletedSession 
    : null;

  return (
    <div className={`space-y-8 pb-12 transition-all ${isDeepFocus ? 'fixed inset-0 z-50 bg-slate-950 p-6 flex flex-col justify-center items-center overflow-hidden' : 'max-w-3xl mx-auto'}`}>
      
      {/* Header if not deep focus */}
      {!isDeepFocus && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>مؤقت المذاكرة والتركيز</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              جلسات تركيز بومودورو للمذاكرة الفعالة.
            </p>
          </div>

          <button
            onClick={() => setIsDeepFocus(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors self-start sm:self-auto"
          >
            <Maximize2 className="w-4 h-4 text-emerald-400" />
            <span>ملء الشاشة</span>
          </button>
        </div>
      )}

      {/* Exit Deep Focus Floating Button */}
      {isDeepFocus && (
        <button
          onClick={() => setIsDeepFocus(false)}
          className="absolute top-6 left-6 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
          <span>خروج من وضع التركيز العميق</span>
        </button>
      )}

      {/* Main Timer Display Circle Card */}
      <div className="rounded-3xl bg-[#101622] border border-slate-800/80 p-6 sm:p-10 shadow-lg relative flex flex-col items-center justify-center space-y-6 w-full overflow-hidden">
        
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs w-full max-w-md">
          <button
            disabled={isRunning}
            onClick={() => handleModeChange('focus')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
              mode === 'focus'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>جلسة مذاكرة</span>
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleModeChange('short_break')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
              mode === 'short_break'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>استراحة قصيرة</span>
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleModeChange('long_break')}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all active:scale-95 whitespace-nowrap ${
              mode === 'long_break'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>استراحة طويلة</span>
          </button>
        </div>

        {/* Large Digital Clock Dial */}
        <div className="relative flex items-center justify-center my-2 sm:my-4">
          <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full border-2 border-slate-800 flex flex-col items-center justify-center relative overflow-hidden bg-[#0c1017] shadow-inner">
            
            <span className="font-mono text-4xl sm:text-6xl font-bold text-slate-100 tabular-nums tracking-tighter z-10" dir="ltr">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>

            <span className="text-xs text-slate-400 font-medium mt-2 z-10">
              {isRunning ? 'جلسة تركيز نشطة...' : 'المؤقت متوقف'}
            </span>

            <span className="font-mono text-[11px] text-slate-400 mt-1 tabular-nums font-medium z-10">
              متبقي {progressPercent}%
            </span>
          </div>
        </div>

        {/* Play / Pause / Reset Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
            title="إعادة ضبط المؤقت"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base transition-all shadow-xl hover:scale-105 active:scale-95 ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 ml-1" />
                <span>بدء التركيز</span>
              </>
            )}
          </button>

          <button
            onClick={() => sound.playChime()}
            className="p-3.5 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm"
            title="اختبار نغمة الجرس البرمجية"
          >
            <Volume2 className="w-5 h-5 text-emerald-400" />
          </button>
        </div>

        {/* Quick Duration Preset Buttons */}
        {!isRunning && (
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {(mode === 'focus' ? [15, 25, 40, 50, 60, 90, 120] : [5, 10, 15, 20, 25, 30]).map((m) => (
              <button
                key={m}
                onClick={() => handleDurationChange(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors ${
                  durationMinutes === m
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {m} د
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Real-time Cloud Sync Banner */}
      {activeSyncedSession && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">تم توثيق ومزامنة جلسة المذاكرة سحابياً بنجاح! ☁️</span>
              <p className="text-emerald-300 text-[11px] mt-0.5">
                أُضيفت {activeSyncedSession.minutes} دقيقة إلى رصيدك التراكمي في لوحة شرف المتصدرين (الساعة {activeSyncedSession.time}).
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDismissedSessionTime(activeSyncedSession.time)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded bg-emerald-950/40"
          >
            إخفاء
          </button>
        </div>
      )}

      {/* Today Total Study Summary & Cloud Sync Status */}
      {!isDeepFocus && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>مذاكرة اليوم:</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {Math.floor(todayStudyMinutes / 60)} س و {todayStudyMinutes % 60} د
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              سلسلة {user?.streakDays || 1} يوم 🔥
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <CloudCheck className="w-4 h-4 text-sky-400" />
              <span>الإجمالي التراكمي:</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">
                {Math.round((user?.totalStudyMinutes || 0) / 60)} ساعة موثقة
              </span>
            </div>
            <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded-full font-bold">
              متزامن سحابياً ✓
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
