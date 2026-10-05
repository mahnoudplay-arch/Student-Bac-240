import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Copy, 
  Check, 
  Clock, 
  BookOpen, 
  Target, 
  Plus, 
  Trash2, 
  ChevronLeft,
  Calendar,
  Trophy,
  Activity,
  Layers,
  FileText,
  Award,
  Compass,
  ArrowUpRight,
  Sparkles,
  Zap,
  Timer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId } from '../types';
import { getStudentDisplayId } from '../lib/studentUtils';
import { AppInstallSection } from './AppInstallSection';

export const Dashboard: React.FC = () => {
  const { 
    user, 
    setActiveTab, 
    curriculum, 
    completedLessonsCount, 
    totalLessonsCount, 
    overallProgressPercentage, 
    todayStudyMinutes, 
    tasks, 
    addTask, 
    toggleTask, 
    deleteTask, 
    tasksCompletedRatio,
    countdowns,
    theme
  } = useApp();

  const [copiedId, setCopiedId] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState<SubjectId>('math1');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [taskDuration, setTaskDuration] = useState(45);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Live Timer ticker for dynamic exam countdowns (configured by Admin)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Active exam countdowns from Admin exclusively (collection: examCountdowns)
  const activeExams = (countdowns || []).filter(item => item.isActive !== false && item.examDate);
  const mainExam = activeExams.find(item => item.isMain) || activeExams[0];
  const secondaryExams = activeExams.filter(item => item.id !== mainExam?.id);

  const getTimeRemaining = (dateString: string) => {
    const target = new Date(dateString).getTime();
    const diff = target - currentTime;
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, isPast: false };
  };

  const mainRemaining = mainExam ? getTimeRemaining(mainExam.examDate) : null;
  const studentDisplayId = getStudentDisplayId(user);

  const handleCopyStudentId = () => {
    if (!user) return;
    navigator.clipboard.writeText(studentDisplayId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle.trim(), taskSubject, taskPriority, taskDuration);
    setTaskTitle('');
    setIsAddingTask(false);
  };

  const remainingLessons = totalLessonsCount - completedLessonsCount;
  const todayHours = Math.floor(todayStudyMinutes / 60);
  const todayRemainingMins = todayStudyMinutes % 60;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.3, ease: 'easeOut' as const } 
    }
  };

  // Quick Launchpad items
  const quickLaunchpad = [
    {
      id: 'physics_lab',
      title: 'المختبر العلمي',
      icon: Activity,
      color: 'text-sky-300 bg-sky-950/30 border-sky-800/40',
      action: () => setActiveTab('tools')
    },
    {
      id: 'study_plan',
      title: 'الخطة الموجهة',
      icon: Calendar,
      color: 'text-indigo-300 bg-indigo-950/30 border-indigo-800/40',
      action: () => setActiveTab('plan')
    },
    {
      id: 'written_exams',
      title: 'الامتحانات والسلالم',
      icon: FileText,
      color: 'text-emerald-300 bg-emerald-950/30 border-emerald-800/40',
      action: () => setActiveTab('writtenExams')
    },
    {
      id: 'mistake_bank',
      title: 'بنك الهفوات',
      icon: Award,
      color: 'text-amber-300 bg-amber-950/30 border-amber-800/40',
      action: () => setActiveTab('mistakeBank')
    },
    {
      id: 'challenge_hub',
      title: 'لوحة المتصدرين',
      icon: Trophy,
      color: 'text-amber-300 bg-amber-950/30 border-amber-800/40',
      action: () => setActiveTab('challenge')
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
      dir="rtl"
    >
      
      {/* 1. Executive Hero Header + National Exam Countdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Executive Hero Banner (Wide 7 cols) */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-7 rounded-3xl bg-[#101622] border border-slate-800/80 relative overflow-hidden p-6 sm:p-7 flex flex-col justify-between shadow-lg"
        >
          {/* Subtle Ambient Mathematical Coordinate Grid Texture */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative space-y-4">
            
            {/* Clean Unboxed Metadata Line with Typographic Separators */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-300">
                  {user ? user.rankTitle : 'طالب بكالوريا'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{user ? `محافظة ${user.governorate}` : 'الجمهورية العربية السورية'}</span>
                <span aria-hidden="true">·</span>
                <span>الفرع العلمي دورة 2026</span>
              </div>

              {/* Student Identification ID Pill */}
              {user && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">ID</span>
                  <span className="font-mono text-xs font-semibold text-slate-300 tracking-wider">
                    {studentDisplayId}
                  </span>
                  <button
                    onClick={handleCopyStudentId}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="نسخ المعرف"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="pt-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight leading-snug">
                {user ? `أهلاً بك، ${user.fullName}` : 'منصة BAC - 240'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                الشهادة الثانوية العامة · الفرع العلمي 2026
              </p>
            </div>
          </div>

          {/* Integrated Overall Curriculum Progress bar at bottom of Hero */}
          <div className="relative mt-6 pt-4 border-t border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-slate-400" />
                <span>إجمالي إنجاز مواد المنهاج التسع</span>
              </span>
              <span className="font-mono font-bold text-slate-300 text-sm tabular-nums">
                {overallProgressPercentage}% ({completedLessonsCount}/{totalLessonsCount} درس)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
              <div 
                className="h-full rounded-full bg-slate-400 transition-all duration-700 shadow-sm"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* National Exam Countdown Card (5 cols) */}
        {mainExam && mainRemaining ? (
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-5 rounded-3xl bg-[#101622] border border-slate-800/80 p-6 flex flex-col justify-between relative overflow-hidden shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <Clock className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-200 leading-tight">
                      {mainExam.title}
                    </h2>
                    <span className="text-[11px] text-slate-400">الامتحان الوزاري المعتمد لدورة 2026</span>
                  </div>
                </div>

                {mainExam.subject && (
                  <span className="text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 rounded-lg">
                    {mainExam.subject}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-4 line-clamp-1">
                {mainExam.notes || 'كل دقيقة مذاكرة بتركيز واعية تقربك من التامة 240.'}
              </p>
            </div>

            {/* High-Precision Digital Time Boxes */}
            <div className="grid grid-cols-4 gap-2 text-center" dir="ltr">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-sm">
                <span className="block text-2xl sm:text-3xl font-bold text-slate-200 tabular-nums font-mono tracking-tight">
                  {mainRemaining.days}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">يوم</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-sm">
                <span className="block text-2xl sm:text-3xl font-bold text-slate-200 tabular-nums font-mono tracking-tight">
                  {mainRemaining.hours.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">ساعة</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-sm">
                <span className="block text-2xl sm:text-3xl font-bold text-slate-200 tabular-nums font-mono tracking-tight">
                  {mainRemaining.minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">دقيقة</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2.5 sm:p-3 shadow-sm">
                <span className="block text-2xl sm:text-3xl font-bold text-slate-300 tabular-nums font-mono tracking-tight">
                  {mainRemaining.seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">ثانية</span>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60">
              <span className="text-slate-500">إشراف: أ. محمود صيبعة</span>
              <button 
                onClick={() => setActiveTab('writtenExams')}
                className="text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
              >
                <span>نماذج وسلالم الامتحان</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-5 rounded-3xl bg-[#101622] border border-slate-800/80 p-6 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>العد التنازلي للامتحانات</span>
              </div>
              <p className="text-xs text-slate-400">
                استمر في جدولك اليومي للوصول لهدفك.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('timer')}
              className={`mt-3 w-full py-2.5 rounded-xl font-bold text-xs transition-all border active:scale-98 ${
                theme === 'light'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              بدء جلسة مذاكرة
            </button>
          </motion.div>
        )}

      </div>

      {/* Secondary Scheduled Exams if any */}
      {secondaryExams.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <span className="text-xs font-bold text-slate-400 px-1 block">الامتحانات التجريبية المجدولة:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {secondaryExams.map((exam) => {
              const remaining = getTimeRemaining(exam.examDate);
              return (
                <div 
                  key={exam.id}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate block">{exam.title}</span>
                      {exam.subject && (
                        <span className="text-[10px] font-medium text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/20">
                          {exam.subject}
                        </span>
                      )}
                    </div>
                    {exam.notes && (
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">{exam.notes}</span>
                    )}
                  </div>

                  <div className="text-left font-mono shrink-0" dir="ltr">
                    <span className="font-black text-rose-400 text-sm block tabular-nums">
                      {remaining.isPast ? 'انتهى' : `${remaining.days}d ${remaining.hours}h`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">متبقي</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 2. Command Center KPI Bento: 4 Structured Metric Tiles */}
      <motion.section 
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Metric 1: Curriculum Progress */}
        <div 
          onClick={() => setActiveTab('curriculum')}
          className="cursor-pointer rounded-2xl bg-[#101622] border border-slate-800/80 p-5 group hover:border-slate-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">إنجاز المنهاج</span>
            <div className="h-8 w-8 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums font-mono">
            {overallProgressPercentage}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {completedLessonsCount} من أصل {totalLessonsCount} درس
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 group-hover:text-white pt-2 border-t border-slate-800/60">
            <span>تصفح المنهاج</span>
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>

        {/* Metric 2: Today Study */}
        <div 
          onClick={() => setActiveTab('timer')}
          className="cursor-pointer rounded-2xl bg-[#101622] border border-slate-800/80 p-5 group hover:border-slate-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">مذاكرة اليوم</span>
            <div className="h-8 w-8 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400/90 tabular-nums font-mono">
            {todayHours}س {todayRemainingMins}د
          </div>
          <div className="mt-1 text-xs text-slate-400">
            مسجلة بمؤقت التركيز
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 group-hover:text-white pt-2 border-t border-slate-800/60">
            <span>بدء جلسة تركيز</span>
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>

        {/* Metric 3: Streak Days */}
        <div 
          onClick={() => setActiveTab('challenge')}
          className="cursor-pointer rounded-2xl bg-[#101622] border border-slate-800/80 p-5 group hover:border-slate-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">سلسلة الالتزام</span>
            <div className="h-8 w-8 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300">
              <Flame className="w-4 h-4 text-amber-400/90" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums font-mono">
            {user ? user.streakDays : 0} <span className="text-xs font-normal text-slate-400">أيام</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            انضباط يومي موثق
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 group-hover:text-white pt-2 border-t border-slate-800/60">
            <span>لوحة المتصدرين</span>
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>

        {/* Metric 4: Lessons Remaining */}
        <div 
          onClick={() => setActiveTab('curriculum')}
          className="cursor-pointer rounded-2xl bg-[#101622] border border-slate-800/80 p-5 group hover:border-slate-700 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">الدروس المتبقية</span>
            <div className="h-8 w-8 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums font-mono">
            {remainingLessons} <span className="text-xs font-normal text-slate-400">درس</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            حتى ختم المنهاج كاملاً
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 group-hover:text-white pt-2 border-t border-slate-800/60">
            <span>خارطة المنهاج</span>
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>
      </motion.section>

      {/* 3. Interactive Quick Launchpad */}
      <motion.section variants={itemVariants} className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>بوابات الوصول السريع</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {quickLaunchpad.map((item) => {
            const Icon = item.icon;
            
            // Resolve light vs dark color scheme
            let iconBoxStyle = item.color;
            if (theme === 'light') {
              if (item.id === 'physics_lab') iconBoxStyle = 'text-sky-700 bg-sky-50 border-sky-200';
              else if (item.id === 'study_plan') iconBoxStyle = 'text-indigo-700 bg-indigo-50 border-indigo-200';
              else if (item.id === 'written_exams') iconBoxStyle = 'text-emerald-700 bg-emerald-50 border-emerald-200';
              else if (item.id === 'mistake_bank') iconBoxStyle = 'text-amber-700 bg-amber-50 border-amber-200';
              else if (item.id === 'challenge_hub') iconBoxStyle = 'text-amber-700 bg-amber-50 border-amber-200';
            }

            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all group text-right shadow-xs ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-200'
                    : 'bg-[#101622] border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-xl border ${iconBoxStyle} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold transition-colors truncate ${
                  theme === 'light'
                    ? 'text-slate-800 group-hover:text-indigo-700'
                    : 'text-slate-200 group-hover:text-white'
                }`}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* 4. Daily Tasks Bento Manager */}
      <motion.section 
        variants={itemVariants}
        className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-7 space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>مهام المذاكرة لليوم</span>
              <span className="text-xs text-slate-400 font-normal">
                ({tasksCompletedRatio.completed} من {tasksCompletedRatio.total} منجزة)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إتمام كافة المهام اليومية يرفع سلسلة التزامك تلقائياً ويوثق انضباطك
            </p>
          </div>

          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/25 text-xs font-semibold transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة جديدة</span>
          </button>
        </div>

        {/* Task Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-400">
            <span>نسبة إنجاز مهام اليوم</span>
            <span className="font-mono tabular-nums text-indigo-400 font-bold">{tasksCompletedRatio.percentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                tasksCompletedRatio.percentage === 100 
                  ? 'bg-emerald-500' 
                  : tasksCompletedRatio.percentage > 50 
                    ? 'bg-indigo-500' 
                    : 'bg-indigo-600/70'
              }`}
              style={{ width: `${tasksCompletedRatio.percentage}%` }}
            />
          </div>
        </div>

        {/* Add Task Form */}
        {isAddingTask && (
          <form onSubmit={handleAddTaskSubmit} className="rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-3">
            <div className="text-xs font-bold text-indigo-300">إضافة مهمة مذاكرة جديدة</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="عنوان المهمة (مثال: حل المسألة الرابعة عامة فيزياء)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <select
                  value={taskSubject}
                  onChange={(e) => setTaskSubject(e.target.value as SubjectId)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {curriculum.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-1/2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="high">قصوى 🔴</option>
                  <option value="medium">متوسطة 🟡</option>
                  <option value="low">عادية 🟢</option>
                </select>

                <input
                  type="number"
                  min={10}
                  max={180}
                  step={5}
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(parseInt(e.target.value, 10))}
                  title="المدة التقديرية بالدقائق"
                  className="w-1/2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-100 text-center font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
              >
                حفظ المهمة
              </button>
            </div>
          </form>
        )}

        {/* Task Items List */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
              لا توجد مهام مضافة لليوم حتى الآن. ابدأ يومك بإضافة المهام الدراسية للتركيز عليها.
            </div>
          ) : (
            tasks.map((task) => {
              const subjectInfo = curriculum.find(s => s.id === task.subjectId);
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                    task.completed
                      ? 'border-emerald-500/20 bg-emerald-950/15 text-slate-400'
                      : 'border-slate-800/80 bg-slate-950/60 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                        task.completed
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm'
                          : 'border-slate-600 hover:border-indigo-400'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span style={{ color: subjectInfo?.color }}>{subjectInfo?.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.estimatedMinutes} دقيقة</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {task.priority === 'high' ? 'أولوية قصوى' : task.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية عادية'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      {/* 5. Nine Scientific Subjects Mastery Bento (خارطة مواد البكالوريا) */}
      <motion.section variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>خارطة مواد المنهاج التسع (الفرع العلمي)</span>
          </h2>
          <button 
            onClick={() => setActiveTab('curriculum')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>عرض المنهاج كاملاً</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {curriculum.map((subj) => {
            const completedCount = subj.units.reduce(
              (acc, u) => acc + u.lessons.filter(l => l.completed).length,
              0
            );
            const totalCount = subj.units.reduce(
              (acc, u) => acc + u.lessons.length,
              0
            );
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={subj.id}
                onClick={() => setActiveTab('curriculum')}
                className="cursor-pointer rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 hover:border-slate-700 hover:bg-slate-850 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: subj.color }}
                    />
                    <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {subj.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                    {progress}%
                  </span>
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: subj.color
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{completedCount} من {totalCount} درس</span>
                    <span className="text-slate-500">{subj.units.length} وحدات</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* App Install Card */}
      <motion.div variants={itemVariants}>
        <AppInstallSection variant="dashboard" />
      </motion.div>

    </motion.div>
  );
};

