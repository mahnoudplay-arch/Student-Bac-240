import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  ExternalLink, 
  Star, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Award, 
  Check, 
  Flame, 
  FileText, 
  Layers, 
  GitFork, 
  Tv, 
  Info,
  ArrowRight,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlanWeek, PlanDay, PlanTask, SubjectId, TaskStudyMode, ExamWeight } from '../types';
import { subscribeToPlanWeek } from '../services/firebase';

export const StudyPlanView: React.FC = () => {
  const { 
    planMeta, 
    selectedPlanWeekIndex,
    setSelectedPlanWeekIndex,
    completedTaskIds, 
    toggleTaskCompletion, 
    fetchPlanWeek, 
    totalPlanTasksCount, 
    completedPlanTasksCount, 
    planProgressPercentage,
    setActiveTab,
    exams,
    openAiChatWithTask,
    showToast
  } = useApp();

  const totalWeeks = planMeta?.totalWeeks || 36;
  const currentCalendarWeek = planMeta?.currentCalendarWeek || 1;
  const isFreeNavigation = !!planMeta?.isFreeNavigationEnabled;

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0); // 0: السبت .. 6: الجمعة
  const [currentWeekData, setCurrentWeekData] = useState<PlanWeek | null>(null);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFocusSummaryOpen, setIsFocusSummaryOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('الآن');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Month mapping for the 36 weeks (7 months syllabus + 2 months review and exams)
  const getMonthNameForWeek = (wIdx: number) => {
    if (wIdx <= 4) return 'أيلول (1)';
    if (wIdx <= 8) return 'تشرين 1 (2)';
    if (wIdx <= 12) return 'تشرين 2 (3)';
    if (wIdx <= 16) return 'كانون 1 (4)';
    if (wIdx <= 20) return 'كانون 2 (5)';
    if (wIdx <= 24) return 'شباط (6)';
    if (wIdx <= 28) return 'آذار (7)';
    if (wIdx <= 32) return 'نيسان (دورات)';
    return 'أيار (نماذج)';
  };

  // Check if an arbitrary week is unlocked for the student
  const isWeekUnlocked = (wIdx: number): boolean => {
    if (isFreeNavigation) return true;
    if (wIdx <= currentCalendarWeek) return true;
    return false;
  };

  const handleWeekClick = (wNum: number) => {
    if (!isWeekUnlocked(wNum)) {
      showToast(`الأسبوع ${wNum} مقفل حالياً وفق تدرج الخطة 🔒`);
      return;
    }
    setSelectedPlanWeekIndex(wNum);
    setSelectedDayIndex(0);
    showToast(`تم اختيار وحفظ الأسبوع ${wNum} (${getMonthNameForWeek(wNum)}) كمسارك الدراسي النشط 📌`);
  };

  // Realtime subscription to the selected week data
  useEffect(() => {
    setIsLoadingWeek(true);
    setIsPlayingAudio(false);

    // Initial fetch to be fast
    fetchPlanWeek(selectedPlanWeekIndex).then((initialData) => {
      if (initialData) {
        setCurrentWeekData(initialData);
        setIsLoadingWeek(false);
        setLastSyncedTime(new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }));
      }
    });

    // Realtime listener: any update written to Firebase by Admin Plan Builder reflects live
    const unsub = subscribeToPlanWeek(selectedPlanWeekIndex, (liveData) => {
      setCurrentWeekData(liveData);
      setIsLoadingWeek(false);
      setIsRefreshing(false);
      setLastSyncedTime(new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }));
    });

    return () => {
      unsub();
    };
  }, [selectedPlanWeekIndex, fetchPlanWeek]);

  // Manual force-refresh function
  const handleForceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchPlanWeek(selectedPlanWeekIndex);
      if (fresh) {
        setCurrentWeekData(fresh);
      }
      setLastSyncedTime(new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [selectedPlanWeekIndex, fetchPlanWeek]);

  // Auto-select first day that has tasks if current selected day has 0 tasks
  useEffect(() => {
    if (currentWeekData?.days && currentWeekData.days.length > 0) {
      const currentDay = currentWeekData.days.find(d => d.dayIndex === selectedDayIndex);
      if (!currentDay || (currentDay.tasks && currentDay.tasks.length === 0)) {
        const firstDayWithTasks = currentWeekData.days.find(d => d.tasks && d.tasks.length > 0);
        if (firstDayWithTasks) {
          setSelectedDayIndex(firstDayWithTasks.dayIndex);
        }
      }
    }
  }, [currentWeekData]);

  // Handle Audio brief playback
  const togglePlayAudio = (url?: string) => {
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.onerror = () => setIsPlayingAudio(false);
    } else if (audioRef.current.src !== url) {
      audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.onerror = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Compute selected week tasks progress
  const weekTasks = useMemo(() => {
    if (!currentWeekData?.days) return [];
    return currentWeekData.days.flatMap(d => d.tasks || []);
  }, [currentWeekData]);

  const weekCompletedCount = useMemo(() => {
    return weekTasks.filter(t => !!completedTaskIds[t.id]).length;
  }, [weekTasks, completedTaskIds]);

  const weekProgressPct = weekTasks.length > 0 
    ? Math.round((weekCompletedCount / weekTasks.length) * 100) 
    : 0;

  // Selected day object
  const activeDay = useMemo(() => {
    if (!currentWeekData?.days || currentWeekData.days.length === 0) return null;
    return currentWeekData.days.find(d => d.dayIndex === selectedDayIndex) || currentWeekData.days[0];
  }, [currentWeekData, selectedDayIndex]);

  // Subject aesthetic definitions
  const getSubjectBadge = (subjectId: SubjectId) => {
    switch (subjectId) {
      case 'math1':
        return { name: 'الرياضيات 1', color: 'border-blue-500/40 bg-blue-950/40 text-blue-300' };
      case 'math2':
        return { name: 'الرياضيات 2', color: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300' };
      case 'physics':
        return { name: 'الفيزياء', color: 'border-amber-500/40 bg-amber-950/40 text-amber-300' };
      case 'chemistry':
        return { name: 'الكيمياء', color: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' };
      case 'biology':
        return { name: 'العلوم العامة', color: 'border-rose-500/40 bg-rose-950/40 text-rose-300' };
      case 'arabic':
        return { name: 'اللغة العربية', color: 'border-violet-500/40 bg-violet-950/40 text-violet-300' };
      case 'english':
        return { name: 'اللغة الإنكليزية', color: 'border-sky-500/40 bg-sky-950/40 text-sky-300' };
      case 'french':
        return { name: 'اللغة الفرنسية', color: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300' };
      case 'islamic':
        return { name: 'التربية الإسلامية', color: 'border-teal-500/40 bg-teal-950/40 text-teal-300' };
      default:
        return { name: 'مادة أساسية', color: 'border-slate-700 bg-slate-800 text-slate-300' };
    }
  };

  // Study mode aesthetic labels
  const getStudyModeBadge = (mode?: TaskStudyMode) => {
    switch (mode) {
      case 'problem_solving':
        return { label: '✍️ حل مسائل باليد', color: 'text-amber-300 bg-amber-950/40 border-amber-500/30' };
      case 'memorization':
        return { label: '🧠 حفظ وتسميع', color: 'text-rose-300 bg-rose-950/40 border-rose-500/30' };
      case 'concept_reading':
        return { label: '📖 قراءة نظرية وتأسيس', color: 'text-sky-300 bg-sky-950/40 border-sky-500/30' };
      case 'revision':
        return { label: '⚡ مراجعة وتثبيت', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30' };
      default:
        return null;
    }
  };

  // Exam weight aesthetic labels
  const getExamWeightBadge = (weight?: ExamWeight) => {
    switch (weight) {
      case 'critical_major':
        return { label: '🔴 ثقل وزاري رئيسي (مسألة كبرى)', color: 'text-rose-300 bg-rose-950/50 border-rose-500/30' };
      case 'standard_question':
        return { label: '🟡 سؤال نظري أو تعليل متكرر', color: 'text-amber-300 bg-amber-950/50 border-amber-500/30' };
      case 'foundational':
        return { label: '🟢 فقرة تأسيسية ممهدة', color: 'text-emerald-300 bg-emerald-950/50 border-emerald-500/30' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* 1. Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#101622] border border-slate-800/80 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>الخطة الدراسية الموجهة</span>
              <span className="text-xs text-indigo-400 font-normal">· دورة 2026</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            جدول المهام الدراسية يوماً بيوم للفرع العلمي.
          </p>
        </div>

        {/* Plan Progress & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95"
            title="تحديث بيانات الخطة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث'}</span>
          </button>

          <div className="flex items-center gap-2.5 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-white font-mono">{planProgressPercentage}%</span>
                <span className="text-[10px] text-slate-400 font-mono">({completedPlanTasksCount} منجزة)</span>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* 2. Weeks Carousel / Rail (أيام وأسابيع العام الـ 36) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>محطات الأسابيع الدراسية (36 أسبوعاً):</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {isFreeNavigation ? '🌟 التصفح الحر مفعل لجميع الأسابيع' : `الأسبوع الحالي تقويمياً: ${currentCalendarWeek}`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {Array.from({ length: totalWeeks }, (_, idx) => {
            const wNum = idx + 1;
            const isUnlocked = isWeekUnlocked(wNum);
            const isSelected = selectedPlanWeekIndex === wNum;
            const isCurrentCal = currentCalendarWeek === wNum;
            const month = getMonthNameForWeek(wNum);

            return (
              <button
                key={wNum}
                onClick={() => handleWeekClick(wNum)}
                disabled={!isUnlocked}
                className={`shrink-0 flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 min-w-[76px] sm:min-w-[88px] text-center active:scale-95 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/80 text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-500 font-bold'
                    : isUnlocked
                      ? isCurrentCal
                        ? 'border-slate-700 bg-slate-850 text-slate-200 hover:bg-slate-800'
                        : 'border-slate-800 bg-[#101622] text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      : 'border-slate-900 bg-slate-950/40 text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title={!isUnlocked ? 'يفتح هذا الأسبوع تقويمياً أو بإنجاز مهام أسبوعك' : `الأسبوع ${wNum} • ${month}`}
              >
                <span className="text-[10px] text-slate-400 font-medium mb-0.5">{month}</span>
                <span className="text-xs sm:text-sm font-semibold font-mono flex items-center gap-1">
                  {isSelected && <span className="text-indigo-400 text-xs">📌</span>}
                  <span>أسبوع {wNum}</span>
                </span>
                
                <div className="mt-1 flex items-center justify-center">
                  {!isUnlocked ? (
                    <Lock className="w-3 h-3 text-slate-600" />
                  ) : isSelected ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-bold font-mono">
                      نشط
                    </span>
                  ) : isCurrentCal ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Week Header Banner (ترويسة الأسبوع الفاخرة) */}
      {currentWeekData ? (
        <div className="rounded-3xl glass-card border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-7 shadow-xl space-y-4">
          
          {/* Milestone Badge & Month */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                {currentWeekData.monthName} • أسبوع {currentWeekData.weekIndex}
              </span>
              
              {currentWeekData.milestoneBadge && (
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 shadow-sm flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{currentWeekData.milestoneBadge}</span>
                </span>
              )}
            </div>

            {/* Voice Brief player from A. Mahmoud Saibaa if available */}
            {currentWeekData.voiceBriefUrl && (
              <button
                onClick={() => togglePlayAudio(currentWeekData.voiceBriefUrl)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95 ${
                  isPlayingAudio
                    ? 'border-rose-500 bg-rose-600 text-white shadow-rose-600/30'
                    : 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlayingAudio ? 'إيقاف التوجيه الصوتي' : 'دقيقة التوجيه (أ. محمود)'}</span>
              </button>
            )}
          </div>

          {/* Week Title & Summary */}
          <div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
              {currentWeekData.weekTitle}
            </h2>

            {currentWeekData.focusSummary && (
              <div className="mt-2.5">
                <button
                  onClick={() => setIsFocusSummaryOpen(!isFocusSummaryOpen)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>نصيحة وخارطة هذا الأسبوع</span>
                  {isFocusSummaryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isFocusSummaryOpen && (
                  <p className="mt-2 p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 leading-relaxed animate-fadeIn">
                    {currentWeekData.focusSummary}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress bar of current week */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>إنجاز مهام الأسبوع:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {weekCompletedCount} من {weekTasks.length} منجزة ({weekProgressPct}%)
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${weekProgressPct}%` }}
              />
            </div>
          </div>

        </div>
      ) : isLoadingWeek ? (
        <div className="p-8 text-center rounded-3xl glass-card border-slate-800 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">جاري استرجاع بيانات الأسبوع من الخادم السحابي...</p>
        </div>
      ) : (
        <div className="p-10 text-center rounded-3xl glass-card border border-slate-800/80 space-y-3 bg-slate-900/40">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">لم تُنشر خطة هذا الأسبوع بعد</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            يتم إعداد وبث مهام الأسبوع سحابياً من قِبل إدارة المنصة والمشرف الأكاديمي.
          </p>
        </div>
      )}

      {/* 4. Days Selector (كبسولات أيام الأسبوع السبعة) */}
      {currentWeekData?.days && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300">أيام الأسبوع السبعة:</span>
            <span className="text-[11px] text-slate-400">انقر على اليوم لعرض مهامه</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {currentWeekData.days.map((day) => {
              const isSelected = selectedDayIndex === day.dayIndex;
              const dayTasks = day.tasks || [];
              const dayCompletedCount = dayTasks.filter(t => !!completedTaskIds[t.id]).length;
              const isAllDayCompleted = dayTasks.length > 0 && dayCompletedCount === dayTasks.length;

              return (
                <button
                  key={day.dayIndex}
                  onClick={() => setSelectedDayIndex(day.dayIndex)}
                  className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all text-center active:scale-95 ${
                    isSelected
                      ? 'border-slate-600 bg-slate-800 text-slate-100 shadow-sm font-semibold'
                      : 'border-slate-800/80 bg-[#101622] text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-black">{day.dayName}</span>
                    {isAllDayCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        {dayCompletedCount}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  {day.isBufferDay ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold whitespace-nowrap mt-1">
                      🛡️ استدراك
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono mt-1">
                      {dayTasks.length} {dayTasks.length === 1 ? 'مهمة' : 'مهام'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Selected Day Bento Tasks Deck (قائمة مهام اليوم المحدد) */}
      {activeDay && (
        <div className="space-y-4">
          
          {/* Day Header Banner (همسة اليوم + التوقيت الأنسب) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/70">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-white">{activeDay.dayName}</span>
                {activeDay.bestTimeSlot && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {activeDay.bestTimeSlot === 'morning' && '🌅 التوقيت الأنسب: صباحي'}
                    {activeDay.bestTimeSlot === 'evening' && '🌆 التوقيت الأنسب: مسائي'}
                    {activeDay.bestTimeSlot === 'flexible' && '☕ التوقيت الأنسب: مرن'}
                  </span>
                )}
              </div>
              {activeDay.dayTip && (
                <p className="text-xs text-indigo-300 font-medium">
                  💡 {activeDay.dayTip}
                </p>
              )}
            </div>

            <div className="text-xs text-slate-400 font-mono shrink-0">
              {activeDay.tasks.length} مهام مبرمجة لليوم
            </div>
          </div>

          {/* Special Friday Linked Exam Hero Card */}
          {activeDay.isBufferDay && currentWeekData?.linkedExamId && (
            <div className="p-5 sm:p-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    📝 الاختبار التحريري الشامل لأسبوع {currentWeekData.weekTitle}
                  </h3>
                  <p className="text-xs text-slate-300">
                    اختبر جاهزيتك واكشف ثغراتك فوراً مع سلم التصحيح المعتمد من الأستاذ محمود صيبعة.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('writtenExams')}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 w-full sm:w-auto"
                >
                  <span>🚀 خوض الاختبار التحريري الآن والاطلاع على سلم التصحيح</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Tasks List Bento Grid */}
          {activeDay.tasks.length > 0 ? (
            <div className="space-y-3">
              {activeDay.tasks.map((task) => {
                const isCompleted = !!completedTaskIds[task.id];
                const subjectInfo = getSubjectBadge(task.subjectId);
                const studyModeInfo = getStudyModeBadge(task.studyMode);
                const examWeightInfo = getExamWeightBadge(task.examWeight);

                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
                      isCompleted
                        ? 'border-emerald-500/30 bg-emerald-950/10 opacity-90'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Task Top Header: Checkbox + Title + Time */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`mt-0.5 h-6 w-6 rounded-xl flex items-center justify-center border transition-all shrink-0 active:scale-90 ${
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'border-slate-600 bg-slate-950 hover:border-indigo-400 text-transparent'
                        }`}
                        aria-label="تحديد إنجاز المهمة"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Subject Badge */}
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${subjectInfo.color}`}>
                            {subjectInfo.name}
                          </span>

                          {/* Unit name */}
                          {task.unitName && (
                            <span className="text-[10px] text-slate-400">
                              • {task.unitName}
                            </span>
                          )}

                          {/* Estimated Duration */}
                          <span className="mr-auto text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                            ⏱️ {task.estimatedMinutes} د
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs sm:text-sm font-bold text-white leading-relaxed ${
                          isCompleted ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    {/* Task Metadata: Textbook pages + Study Mode + Exam Weight */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {task.textbookPages && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{task.textbookPages}</span>
                        </span>
                      )}

                      {studyModeInfo && (
                        <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${studyModeInfo.color}`}>
                          {studyModeInfo.label}
                        </span>
                      )}

                      {examWeightInfo && (
                        <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${examWeightInfo.color}`}>
                          {examWeightInfo.label}
                        </span>
                      )}

                      {/* Direct Ask AI Assistant Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAiChatWithTask(task);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] font-bold transition-all mr-auto active:scale-95 shadow-sm shadow-indigo-950/40"
                        title="مناقشة وفهم هذه المهمة مع المعلم الأكاديمي الذكي"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>اسأل المعلم الذكي عنها</span>
                      </button>
                    </div>

                    {/* Pitfall Warning Box if any */}
                    {task.pitfallWarning && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[11px] text-amber-300">⚠️ فخ امتحاني وملاحظة ذهبية من الأستاذ:</span>
                          <p className="mt-0.5 leading-relaxed">{task.pitfallWarning}</p>
                        </div>
                      </div>
                    )}

                    {/* Attachments Capsules */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                        <span className="text-[11px] text-slate-400 font-semibold">المرفقات المساعدة:</span>
                        {task.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
                              att.isEssential
                                ? 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
                                : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {att.isEssential && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                            <span>{att.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-10 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Inbox className="w-7 h-7" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  لا توجد مهام مضافة ليوم ({activeDay.dayName}) حتى الآن
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  إذا أضفت مهام هذا اليوم من خلال باني الخطط في لوحة المشرف، انقر على زر التحديث السحابي أو تأكد من حفظ ونشر الأسبوع.
                </p>
              </div>

              {/* Show other days that currently have tasks */}
              {currentWeekData && currentWeekData.days.some(d => d.tasks && d.tasks.length > 0) && (
                <div className="pt-2 border-t border-slate-800/80 max-w-md mx-auto">
                  <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                    الأيام التي تحتوي على مهام في هذا الأسبوع:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {currentWeekData.days.filter(d => d.tasks && d.tasks.length > 0).map(d => (
                      <button
                        key={d.dayIndex}
                        onClick={() => setSelectedDayIndex(d.dayIndex)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>{d.dayName}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] font-mono">
                          {d.tasks.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleForceRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>فحص وتحديث الخطة من Firebase</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
