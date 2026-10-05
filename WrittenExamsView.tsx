import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  Headphones, 
  Play, 
  Pause, 
  Copy, 
  ExternalLink, 
  BookmarkPlus, 
  RotateCcw, 
  Check, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Flame,
  Volume2,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId, WrittenExam, ExamQuestion } from '../types';
import { sound } from '../services/sound';

const SUBJECT_LIST: { id: SubjectId | 'all'; name: string; icon: string; color: string }[] = [
  { id: 'all', name: 'جميع المواد', icon: '📚', color: 'from-indigo-600 to-violet-600' },
  { id: 'math1', name: 'رياضيات 1', icon: '📐', color: 'from-blue-600 to-indigo-700' },
  { id: 'math2', name: 'رياضيات 2', icon: '📊', color: 'from-sky-600 to-blue-700' },
  { id: 'physics', name: 'الفيزياء', icon: '⚡', color: 'from-violet-600 to-purple-700' },
  { id: 'chemistry', name: 'الكيمياء', icon: '🧪', color: 'from-emerald-600 to-teal-700' },
  { id: 'biology', name: 'العلوم وعلم الأحياء', icon: '🧬', color: 'from-green-600 to-emerald-700' },
  { id: 'arabic', name: 'اللغة العربية', icon: '📖', color: 'from-amber-600 to-yellow-700' },
  { id: 'english', name: 'اللغة الإنكليزية', icon: '🇬🇧', color: 'from-rose-600 to-red-700' },
  { id: 'french', name: 'اللغة الفرنسية', icon: '🇫🇷', color: 'from-cyan-600 to-blue-700' },
  { id: 'islamic', name: 'التربية الإسلامية', icon: '🕌', color: 'from-teal-600 to-emerald-700' },
];

export const WrittenExamsView: React.FC = () => {
  const { exams, addMistake, mistakes, setActiveTab, showToast, theme } = useApp();

  // Mode: 'catalog' | 'solving' | 'ladder'
  const [activeMode, setActiveMode] = useState<'catalog' | 'solving' | 'ladder'>('catalog');
  const [selectedExam, setSelectedExam] = useState<WrittenExam | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Exam solving state
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isDeepFocus, setIsDeepFocus] = useState<boolean>(false);

  // Self audit state: questionId -> 'full' | 'partial' | 'wrong'
  const [evaluations, setEvaluations] = useState<Record<string, 'full' | 'partial' | 'wrong'>>({});
  // student notes for mistakes: questionId -> note string
  const [mistakeNotes, setMistakeNotes] = useState<Record<string, string>>({});
  // added to bank set: questionId
  const [addedToBank, setAddedToBank] = useState<Set<string>>(new Set());

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter exams
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      if (selectedSubject !== 'all' && exam.subjectId !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = exam.title?.toLowerCase().includes(q);
        const matchDesc = exam.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [exams, selectedSubject, searchQuery]);

  // Handle Starting Exam Simulation
  const handleStartExam = (exam: WrittenExam) => {
    setSelectedExam(exam);
    setTimerSecondsRemaining((exam.durationMinutes || 60) * 60);
    setIsTimerPaused(false);
    setEvaluations({});
    setMistakeNotes({});
    setAddedToBank(new Set());
    setActiveMode('solving');
    sound.playTick();
  };

  // Timer interval in solving mode
  useEffect(() => {
    if (activeMode !== 'solving' || isTimerPaused) return;

    const interval = setInterval(() => {
      setTimerSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playChime();
          showToast('⏰ انتهى وقت الامتحان المقرر! حان وقت المطابقة وسلم التصحيح.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMode, isTimerPaused]);

  // Format time MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Finish solving and open Ladder Self-Audit
  const handleFinishSolving = () => {
    sound.playSuccess();
    setActiveMode('ladder');
    setIsDeepFocus(false);
  };

  // Self Evaluation calculation
  const totalExamScore = selectedExam?.totalScore || 
    (selectedExam?.questions?.reduce((acc, q) => acc + (q.score || 0), 0) || 0);

  const earnedScore = useMemo(() => {
    if (!selectedExam || !selectedExam.questions) return 0;
    return selectedExam.questions.reduce((sum, q) => {
      const evaluation = evaluations[q.id];
      if (evaluation === 'full') return sum + (q.score || 0);
      if (evaluation === 'partial') return sum + Math.round((q.score || 0) * 0.5);
      return sum;
    }, 0);
  }, [selectedExam, evaluations]);

  const scorePercentage = totalExamScore > 0 ? Math.round((earnedScore / totalExamScore) * 100) : 0;

  // Add question to Mistake Bank
  const handleAddToMistakes = (q: ExamQuestion, type: 'partial' | 'wrong') => {
    if (!selectedExam) return;
    const note = mistakeNotes[q.id] || '';
    const notebookUrl = q.notebookLmNotebookUrl || selectedExam.notebookLmNotebookUrl;

    addMistake({
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      subjectId: selectedExam.subjectId,
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      correctionLadder: q.correctionLadder,
      ladderImageUrl: q.ladderImageUrl,
      studentNote: note,
      mistakeType: type,
      notebookLmNotebookUrl: notebookUrl
    });

    setAddedToBank(prev => new Set(prev).add(q.id));
    sound.playSuccess();
    showToast('📌 تم توثيق المسألة وإضافتها بنجاح إلى بنك أخطائك الشخصي!');
  };

  // Handle NotebookLM Directed Prompt & Navigation
  const handleAskNotebookLM = (q: ExamQuestion) => {
    if (!selectedExam) return;
    const notebookUrl = q.notebookLmNotebookUrl || selectedExam.notebookLmNotebookUrl || 'https://notebooklm.google.com';
    const cleanQuestionTitle = q.questionText.slice(0, 120);
    const directedPrompt = `بناءً على كتاب الوزارة المعتمد، اشرح لي خطوة [القانون/التعويض] في مسألة: [${cleanQuestionTitle}] وما هو التعليل العلمي لها؟`;

    // Copy to clipboard
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(directedPrompt).then(() => {
        showToast('✨ تم نسخ صيغة السؤال الموجه إلى الحافظة! يمكنك لصقها مباشرة في NotebookLM.');
      }).catch(() => {
        showToast('جاري فتح مفكرة NotebookLM المعتمدة...');
      });
    }

    // Open NotebookLM in new tab
    window.open(notebookUrl, '_blank', 'noopener,noreferrer');
  };

  // Audio Player Toggle
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.warn('Audio play error:', err);
      });
    }
  };

  return (
    <div className={`space-y-6 select-none ${isDeepFocus ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-y-auto' : 'pb-12'}`} dir="rtl">
      
      {/* ========================================================================= */}
      {/* STAGE 1: EXAMS CATALOG (معرض الاختبارات التحريرية المتاحة) */}
      {/* ========================================================================= */}
      {activeMode === 'catalog' && (
        <div className="space-y-6">
          {/* Header & Quick stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>النماذج الوزارية والسلالم</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 font-normal">دورة 2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>الاختبارات التحريرية وسلالم التصحيح</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                نماذج امتحانية مع سلالم التصحيح النموذجية.
              </p>
            </div>

            {/* Link to Mistake Bank */}
            <button
              onClick={() => setActiveTab('mistakeBank')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>بنك أخطائي ({mistakes.length})</span>
            </button>
          </div>

          {/* Subjects Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SUBJECT_LIST.map((sub) => {
              const active = selectedSubject === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                    active
                      ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                      : 'bg-[#101622] text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اختبار تحريري، نموذج وزاري، مسألة، أو موضوع..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 bg-[#101622] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700 transition-all"
            />
          </div>

          {/* Exams List Grid */}
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => {
                const subMeta = SUBJECT_LIST.find(s => s.id === exam.subjectId) || SUBJECT_LIST[1];
                const questionsCount = exam.questionsCount || (exam.questions ? exam.questions.length : 0);

                return (
                  <motion.div
                    key={exam.id}
                    whileHover={{ y: -2 }}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#101622] p-5 shadow-sm hover:border-slate-700 transition-all"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                          <span>{subMeta.icon}</span>
                          <span>{subMeta.name}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {exam.notebookLmNotebookUrl && (
                            <span 
                              title="مرتبط بـ NotebookLM المعتمد"
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-950/20 border border-amber-500/20 text-amber-400/90 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>NotebookLM</span>
                            </span>
                          )}
                          {exam.audioOverviewUrl && (
                            <span 
                              title="يتضمن بودكاست صوتي لتحليل الأخطاء"
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1"
                            >
                              <Headphones className="w-3 h-3 text-purple-400" />
                              <span>بودكاست</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-white line-clamp-2 mb-1.5 leading-snug">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                          {exam.description}
                        </p>
                      )}

                      {/* Meta Pills */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/70 text-center mb-4">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500">الزمن المقترح</span>
                          <span className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>{exam.durationMinutes || 60} د</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center border-x border-slate-800/70">
                          <span className="text-[10px] text-slate-500">مجموع الدرجات</span>
                          <span className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{exam.totalScore || 600}</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-500">عدد الأسئلة</span>
                          <span className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{questionsCount}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Action */}
                    <button
                      onClick={() => handleStartExam(exam)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <span>🚀 ابدأ محاكاة الامتحان الورقي</span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                لا توجد نماذج امتحانية منشورة حالياً في هذه المادة
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-5">
                تُجلب جميع الاختبارات لحظياً من خادم السحابة. يقوم المشرف (أ. محمود صيبعة) برفع النماذج الوزارية وسلالم التصحيح ومذكرات NotebookLM دورياً عبر لوحة الإدارة.
              </p>
              {selectedSubject !== 'all' && (
                <button
                  onClick={() => setSelectedSubject('all')}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  عرض جميع المواد الأخرى
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: EXAM SOLVING MODE (وضع القاعة الامتحانية والمؤقت الصامت) */}
      {/* ========================================================================= */}
      {activeMode === 'solving' && selectedExam && (
        <div className="space-y-6">
          
          {/* Solving Top Bar: Timer, Deep Focus & Finish button */}
          <div className="sticky top-16 z-30 rounded-2xl border border-indigo-500/30 bg-slate-950/90 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
            
            {/* Exam info + Cancel button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من رغبتك بالخروج من جلسة الامتحان الحالي؟')) {
                    setActiveMode('catalog');
                    setIsDeepFocus(false);
                  }
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                title="الرجوع لمعرض الاختبارات"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div>
                <h2 className="text-sm sm:text-base font-black text-white line-clamp-1">
                  {selectedExam.title}
                </h2>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>محاكاة القاعة الامتحانية جارية</span>
                </span>
              </div>
            </div>

            {/* Center: Countdown Timer */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
              <Clock className={`w-4 h-4 ${timerSecondsRemaining < 300 ? 'text-rose-400 animate-bounce' : 'text-indigo-400'}`} />
              <div className="flex flex-col text-center">
                <span className={`text-base sm:text-lg font-mono font-black ${timerSecondsRemaining < 300 ? 'text-rose-400' : 'text-white'}`}>
                  {formatTime(timerSecondsRemaining)}
                </span>
                <span className="text-[9px] text-slate-500">الوقت المتبقي</span>
              </div>
              <button
                onClick={() => setIsTimerPaused(!isTimerPaused)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
              >
                {isTimerPaused ? 'استئناف' : 'إيقاف مؤقت'}
              </button>
            </div>

            {/* Deep Focus toggle & Finish button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setIsDeepFocus(!isDeepFocus)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors shrink-0"
                title={isDeepFocus ? 'إلغاء وضع ملء الشاشة' : 'وضع التركيز العميق (Deep Focus)'}
              >
                {isDeepFocus ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleFinishSolving}
                className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
              >
                <span>🏁 الانتقال للسلم</span>
              </button>
            </div>
          </div>

          {/* Mandatory Paper Instruction Banner */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 shadow-lg flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                قاعدة ذهبية: أحضر ورقة وقلم وابدأ الحل الفعلي بالخطوات الرياضية والقوانين كما في الامتحان الحقيقي!
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                الامتحانات التحريرية لا تُحل بالنظر أو التخمين. اكتب المعطيات، القانون الفيزيائي أو الرياضي بالرموز والواحدات الدولية، واحرص على تنظيم خطواتك قبل التوجه لسلم التصحيح الذاتي.
              </p>
            </div>
          </div>

          {/* Questions Render List */}
          <div className="space-y-6">
            {selectedExam.questions && selectedExam.questions.length > 0 ? (
              selectedExam.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-md"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      السؤال رقم {q.questionNumber || idx + 1}
                    </span>

                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>{q.score || 0} درجة</span>
                    </span>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm sm:text-base text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Optional Graphic or Image */}
                  {q.imageUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                      <img
                        src={q.imageUrl}
                        alt={`شكل توضيحي للسؤال ${idx + 1}`}
                        className="max-h-96 w-auto mx-auto object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {/* Hints if present */}
                  {q.hints && (
                    <div className="mt-3 text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>توجيه: {q.hints}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                لا توجد أسئلة مسجلة في هذا النموذج بعد.
              </div>
            )}
          </div>

          {/* Bottom Complete Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right">
              <h4 className="text-sm font-bold text-white">هل فرغت من كتابة حلولك على الورق؟</h4>
              <p className="text-xs text-slate-400">انتقل الآن لمقارنة خطواتك مع السلم الوزاري ورصد هفواتك في بنك الأخطاء.</p>
            </div>
            <button
              onClick={handleFinishSolving}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>🏁 الانتقال لسلم التصحيح والمطابقة الذاتية</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: LADDER SELF-AUDIT (كشف سلم التصحيح والتقييم الذاتي وتأصيل NotebookLM) */}
      {/* ========================================================================= */}
      {activeMode === 'ladder' && selectedExam && (
        <div className="space-y-6">
          
          {/* Top Audit Header: Live score counter + Back button */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setActiveMode('catalog')}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-colors"
                title="إنهاء والعودة للمعرض"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div>
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>المرحلة الثالثة: المطابقة والتقييم الذاتي</span>
                </span>
                <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                  {selectedExam.title}
                </h2>
              </div>
            </div>

            {/* Live Score Counter Card */}
            <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-5 py-2.5 rounded-2xl w-full md:w-auto justify-between md:justify-start">
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400">علامتك المستحقة</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-400 font-mono">{earnedScore}</span>
                  <span className="text-xs text-slate-500 font-bold">/ {totalExamScore}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400">النسبة المئوية</span>
                <span className="text-xl font-black text-indigo-400 font-mono">{scorePercentage}%</span>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <button
                onClick={() => {
                  sound.playSuccess();
                  showToast('🎉 تم حفظ نتيجتك وتقييمك الذاتي بنجاح!');
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                اعتماد النتيجة
              </button>
            </div>
          </div>

          {/* Audio Overview Player (if audioOverviewUrl exists) */}
          {selectedExam.audioOverviewUrl && (
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🎧 استمع لتحليل أخطاء وفخاخ هذا الاختبار</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-normal">تأصيل صوتي</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    بودكاست صوتي يوضح النقاط الحساسة في السلم الوزاري والمواضع التي تضيع فيها درجات الطلاب.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <audio ref={audioRef} src={selectedExam.audioOverviewUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
                <button
                  onClick={toggleAudio}
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>إيقاف البودكاست مؤقتاً</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>تشغيل التحليل الصوتي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Questions with Correction Ladder side-by-side */}
          <div className="space-y-6">
            {selectedExam.questions?.map((q, idx) => {
              const currentEval = evaluations[q.id];
              const isAdded = addedToBank.has(q.id);
              const notebookUrl = q.notebookLmNotebookUrl || selectedExam.notebookLmNotebookUrl;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-md ${
                    currentEval === 'full'
                      ? 'border-emerald-500/30 bg-slate-900/80'
                      : currentEval === 'partial'
                      ? 'border-amber-500/30 bg-slate-900/80'
                      : currentEval === 'wrong'
                      ? 'border-rose-500/30 bg-slate-900/80'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  {/* Question and Score Header */}
                  <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      السؤال رقم {q.questionNumber || idx + 1}
                    </span>

                    <span className="text-xs font-bold text-amber-400">
                      العلامة المخصصة: {q.score} درجة
                    </span>
                  </div>

                  {/* Grid: Question Text VS Correction Ladder */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Left: Original Question */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                      <span className="text-[11px] font-bold text-slate-400 mb-2 block">
                        نص المسألة / السؤال:
                      </span>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {q.questionText}
                      </p>
                      {q.imageUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-slate-800 p-1">
                          <img src={q.imageUrl} alt="شكل السؤال" className="max-h-48 mx-auto object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Right: Ministerial Correction Ladder */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>سلم التصحيح الوزاري المعتمد:</span>
                        </span>
                        <span className="text-[10px] text-slate-500">توزيع الدرجات خطوة بخطوة</span>
                      </div>
                      <div className="text-sm text-emerald-100/90 whitespace-pre-wrap leading-relaxed font-sans">
                        {q.correctionLadder || 'سلم التصحيح قيد التدقيق من قِبل المشرف.'}
                      </div>
                      {q.ladderImageUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-emerald-500/30 p-1">
                          <img src={q.ladderImageUrl} alt="صورة السلم الوزاري" className="max-h-48 mx-auto object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Self Evaluation Buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-slate-300 block mb-2.5">
                      كيف كان حلك لهذه المسألة مقارنة بالسلم الوزاري أعلاه؟
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      
                      {/* Button 1: Full Score */}
                      <button
                        onClick={() => {
                          setEvaluations(prev => ({ ...prev, [q.id]: 'full' }));
                          sound.playSuccess();
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentEval === 'full'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✅ حلي تام وصحيح (العلامة كاملة)</span>
                      </button>

                      {/* Button 2: Partial Mistake */}
                      <button
                        onClick={() => {
                          setEvaluations(prev => ({ ...prev, [q.id]: 'partial' }));
                          sound.playTick();
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentEval === 'partial'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>⚠️ خطأ جزئي / هفوة بالحساب أو الواحدة</span>
                      </button>

                      {/* Button 3: Wrong */}
                      <button
                        onClick={() => {
                          setEvaluations(prev => ({ ...prev, [q.id]: 'wrong' }));
                          sound.playTick();
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentEval === 'wrong'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/40'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>❌ خطأ كامل / لم أحل المسألة</span>
                      </button>
                    </div>

                    {/* Mistake Drawer (Revealed on Partial or Wrong) */}
                    {(currentEval === 'partial' || currentEval === 'wrong') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-950/15 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <BookmarkPlus className="w-4 h-4 text-amber-400" />
                            <span>توثيق الهفوة في بنك أخطائك الشخصي:</span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {currentEval === 'partial' ? 'نوع الخطأ: هفوة جزئية' : 'نوع الخطأ: عدم تمكن / خطأ كامل'}
                          </span>
                        </div>

                        <input
                          type="text"
                          value={mistakeNotes[q.id] || ''}
                          onChange={(e) => setMistakeNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="ما سبب هفوتك؟ (مثلاً: نسيت تربيع السرعة، نسيت إشارة السالب، أو أخطأت بالتحويل للواحدة الدولية)"
                          className="w-full px-3.5 py-2 rounded-lg border border-amber-500/30 bg-slate-950 text-xs text-amber-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          
                          {/* Add to Bank Button */}
                          <button
                            onClick={() => handleAddToMistakes(q, currentEval)}
                            disabled={isAdded}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isAdded
                                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 active:scale-95'
                            }`}
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>{isAdded ? '✓ مضافة إلى بنك أخطائك' : '📌 إضافة إلى بنك أخطائي'}</span>
                          </button>

                          {/* NotebookLM Smart Capsule Button */}
                          {notebookUrl && (
                            <button
                              onClick={() => handleAskNotebookLM(q)}
                              className="px-4 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
                              title="نسخ صيغة السؤال التوضيحي والانتقال لمفكرة الأستاذ محمود"
                            >
                              <Sparkles className="w-3.5 h-3.5 fill-current" />
                              <span>📖 استفسر من مرجع المادة في NotebookLM</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Completion Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-900 p-6 text-center space-y-3">
            <h3 className="text-base font-bold text-white">
              تهانينا! أكملت مراجعة النموذج بالكامل بنتيجة {earnedScore} من {totalExamScore} ({scorePercentage}%)
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              تم تسجيل جميع الثغرات والهفوات التي رصدتها في بنك أخطائك الشخصي لتتمكن من مراجعتها واستدراكها لاحقاً.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('mistakeBank')}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>الذهاب إلى بنك الأخطاء</span>
              </button>
              <button
                onClick={() => setActiveMode('catalog')}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-colors"
              >
                العودة لمعرض الاختبارات
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
