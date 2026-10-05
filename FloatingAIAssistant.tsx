import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Key, 
  Check, 
  Copy, 
  Trash2, 
  BookOpen, 
  AlertTriangle, 
  X,
  Minimize2,
  Maximize2,
  ChevronDown, 
  Target,
  CheckCircle2,
  ShieldCheck,
  Flame,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId, AIChatMessage, PlanWeek, PlanTask } from '../types';
import { GeminiService, PlanContextInfo } from '../services/geminiService';
import { sound } from '../services/sound';
import { FormattedAIMessage } from './FormattedAIMessage';
import { AIToolActionCards } from './AIToolActionCards';

export const FloatingAIAssistant: React.FC = () => {
  const { 
    activeTab,
    setActiveTab,
    curriculum, 
    getLessonKnowledge, 
    showToast,
    planMeta,
    completedTaskIds,
    user,
    totalPlanTasksCount,
    completedPlanTasksCount,
    planProgressPercentage,
    fetchPlanWeek,
    mistakes,
    aiChatMessages,
    addAiChatMessage,
    updateAiChatMessage,
    clearAiChatMessages,
    aiSelectedSubjectId,
    setAiSelectedSubjectId,
    aiSelectedLessonId,
    setAiSelectedLessonId,
    aiSelectedPlanTaskId,
    setAiSelectedPlanTaskId,
    isAiFloatingDrawerOpen,
    setIsAiFloatingDrawerOpen,
    executeAIToolAction,
    videos,
    channels
  } = useApp();

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{ valid?: boolean; error?: string } | null>(null);

  // Active Plan Week Data
  const [currentWeekPlan, setCurrentWeekPlan] = useState<PlanWeek | null>(null);
  const activeWeekNum = planMeta?.currentCalendarWeek || 1;

  useEffect(() => {
    fetchPlanWeek(activeWeekNum).then(data => {
      if (data) setCurrentWeekPlan(data);
    });
  }, [activeWeekNum, fetchPlanWeek]);

  // Load API Key on Mount
  useEffect(() => {
    const stored = GeminiService.getStoredApiKey();
    if (stored) {
      setApiKey(stored);
      setTempKeyInput(stored);
    }
  }, []);

  const getSyrianDayIndex = () => {
    const d = new Date().getDay();
    if (d === 6) return 0;
    return d + 1;
  };

  const todayIndex = getSyrianDayIndex();
  const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // All tasks in the active week
  const allWeekTasks = useMemo(() => {
    if (!currentWeekPlan?.days) return [];
    return currentWeekPlan.days.flatMap(d => d.tasks || []);
  }, [currentWeekPlan]);

  const selectedPlanTask: PlanTask | null = useMemo(() => {
    if (!aiSelectedPlanTaskId) return null;
    return allWeekTasks.find(t => t.id === aiSelectedPlanTaskId) || null;
  }, [allWeekTasks, aiSelectedPlanTaskId]);

  const todayDayData = currentWeekPlan?.days?.find(d => d.dayIndex === todayIndex);
  const todayTasksList = useMemo(() => {
    return (todayDayData?.tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      subjectId: t.subjectId,
      textbookPages: t.textbookPages,
      studyMode: t.studyMode,
      examWeight: t.examWeight,
      isCompleted: !!completedTaskIds[t.id]
    }));
  }, [todayDayData, completedTaskIds]);

  const planContextInfo: PlanContextInfo = useMemo(() => ({
    currentWeekIndex: activeWeekNum,
    monthName: currentWeekPlan?.monthName || 'الشهر الحالي',
    weekTitle: currentWeekPlan?.weekTitle,
    milestoneBadge: currentWeekPlan?.milestoneBadge,
    todayName: dayNames[todayIndex] || 'اليوم',
    todayTasks: todayTasksList,
    selectedTask: selectedPlanTask ? {
      id: selectedPlanTask.id,
      title: selectedPlanTask.title,
      subjectId: selectedPlanTask.subjectId,
      textbookPages: selectedPlanTask.textbookPages,
      studyMode: selectedPlanTask.studyMode,
      examWeight: selectedPlanTask.examWeight,
      isCompleted: !!completedTaskIds[selectedPlanTask.id]
    } : null,
    completedTasksCount: completedPlanTasksCount,
    totalTasksCount: totalPlanTasksCount,
    progressPercentage: planProgressPercentage,
    streakDays: user?.streakDays || 0,
    totalStudyMinutes: user?.totalStudyMinutes || 0,
    recentMistakesCount: mistakes.filter(m => !m.isResolved).length
  }), [
    activeWeekNum,
    currentWeekPlan,
    todayIndex,
    todayTasksList,
    selectedPlanTask,
    completedTaskIds,
    completedPlanTasksCount,
    totalPlanTasksCount,
    planProgressPercentage,
    user,
    mistakes
  ]);

  const currentSubject = curriculum.find(s => s.id === aiSelectedSubjectId) || curriculum[0];
  const allSubjectLessons = useMemo(() => {
    if (!currentSubject) return [];
    const list: { id: string; name: string; unitName: string }[] = [];
    currentSubject.units.forEach(unit => {
      unit.lessons.forEach(l => {
        list.push({ id: l.id, name: l.name, unitName: unit.unit_name });
      });
    });
    return list;
  }, [currentSubject]);

  const currentLessonInfo = allSubjectLessons.find(l => l.id === aiSelectedLessonId) || allSubjectLessons[0];
  const currentKnowledgeCard = useMemo(() => {
    if (!currentLessonInfo) return null;
    return getLessonKnowledge(aiSelectedSubjectId, currentLessonInfo.id);
  }, [aiSelectedSubjectId, currentLessonInfo, getLessonKnowledge]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAiFloatingDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAiFloatingDrawerOpen, isLoading]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSaveApiKey = async () => {
    const key = tempKeyInput.trim();
    if (!key) {
      setKeyValidationStatus({ valid: false, error: 'الرجاء إدخال المفتاح أولاً.' });
      return;
    }

    setIsValidatingKey(true);
    setKeyValidationStatus(null);

    const test = await GeminiService.validateApiKey(key);
    setIsValidatingKey(false);

    if (test.valid) {
      GeminiService.storeApiKey(key);
      setApiKey(key);
      setKeyValidationStatus({ valid: true });
      sound.playSuccess();
      setTimeout(() => {
        setIsKeyModalOpen(false);
        setKeyValidationStatus(null);
      }, 1200);
    } else {
      setKeyValidationStatus({ valid: false, error: test.error });
      sound.playTick();
    }
  };

  const handleSendQuestion = async (customText?: string) => {
    const query = (customText || inputQuestion).trim();
    if (!query || isLoading) return;

    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    sound.playTick();

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      subjectName: currentSubject?.name,
      lessonName: currentLessonInfo?.name,
      taskTitle: selectedPlanTask ? selectedPlanTask.title : undefined
    };

    addAiChatMessage(userMsg);
    setInputQuestion('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    const assistantMsgId = `ai_${Date.now()}`;
    let hasStreamedChunk = false;

    try {
      const historyPayload = aiChatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const res = await GeminiService.askGroundedQuestion({
        apiKey,
        subjectName: currentSubject?.name || 'المنهاج السوري',
        lessonName: currentLessonInfo?.name || 'الدرس المختار',
        knowledgeItem: currentKnowledgeCard,
        question: query,
        chatHistory: historyPayload,
        planContext: planContextInfo,
        toolsExecutor: executeAIToolAction,
        platformVideos: videos,
        platformChannels: channels,
        explanationMode: 'notebook',
        onChunk: (streamedText) => {
          if (!hasStreamedChunk) {
            hasStreamedChunk = true;
            addAiChatMessage({
              id: assistantMsgId,
              role: 'assistant',
              content: streamedText,
              timestamp: Date.now(),
              subjectName: currentSubject?.name,
              lessonName: currentLessonInfo?.name,
              taskTitle: selectedPlanTask ? selectedPlanTask.title : undefined,
              isStreaming: true
            });
          } else {
            updateAiChatMessage(assistantMsgId, {
              content: streamedText,
              isStreaming: true
            });
          }
        }
      });

      if (res.error) {
        if (hasStreamedChunk) {
          updateAiChatMessage(assistantMsgId, {
            content: `⚠️ **تنبيه:** ${res.error}`,
            isStreaming: false
          });
        } else {
          addAiChatMessage({
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **تنبيه:** ${res.error}`,
            timestamp: Date.now(),
            isStreaming: false
          });
        }
      } else {
        if (hasStreamedChunk) {
          updateAiChatMessage(assistantMsgId, {
            content: res.reply,
            rubricWarning: res.rubricWarning,
            toolActions: res.toolActions,
            isTruncated: res.isTruncated,
            isStreaming: false,
            metrics: res.metrics
          });
          sound.playSuccess();
        } else {
          const assistantMsg: AIChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: res.reply,
            timestamp: Date.now(),
            subjectName: currentSubject?.name,
            lessonName: currentLessonInfo?.name,
            taskTitle: selectedPlanTask ? selectedPlanTask.title : undefined,
            rubricWarning: res.rubricWarning,
            toolActions: res.toolActions,
            isTruncated: res.isTruncated,
            isStreaming: false,
            metrics: res.metrics
          };
          addAiChatMessage(assistantMsg);
          sound.playSuccess();
        }
      }
    } catch {
      if (hasStreamedChunk) {
        updateAiChatMessage(assistantMsgId, {
          content: '⚠️ تعذر إكمال الطلب. تأكد من اتصال الإنترنت وصلاحية مفتاح الـ API الخاص بك.',
          isStreaming: false
        });
      } else {
        addAiChatMessage({
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ تعذر إكمال الطلب. تأكد من اتصال الإنترنت وصلاحية مفتاح الـ API الخاص بك.',
          timestamp: Date.now(),
          isStreaming: false
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick prompt chips
  const quickPrompts = useMemo(() => {
    if (selectedPlanTask) {
      return [
        { label: '🎯 إنجاز المهمة بالخطة', query: `أنهيت دراسة مهمة "${selectedPlanTask.title}" الآن، علّمها لي كـ منجزة في خطتي الدراسية ومزامنة سحابياً.` },
        { label: '⏱️ مؤقت 45 دقيقة', query: `شغل لي مؤقت المذاكرة والتركيز لمدة 45 دقيقة لمهمة "${selectedPlanTask.title}".` },
        { label: '🗂️ بطاقات استذكار', query: `ولّد لي 3 بطاقات استذكار نشط منهجية لمهمة "${selectedPlanTask.title}" واحفظها تلقائياً بحسابي.` },
        { label: '📖 شرح المهمة', query: `اشرح لي بالتفصيل مفاهيم مهمة "${selectedPlanTask.title}" وكيف أركز عليها؟` },
        { label: '⚡ القوانين والواحدات', query: `ما هي القوانين والواحدات المطلوبة في مهمة "${selectedPlanTask.title}" لدورة 2026؟` },
        { label: '⚠️ أفخاخ السلم', query: `ما هي أكثر أفخاخ السلم الوزاري في مهمة "${selectedPlanTask.title}"؟` },
        { label: '📝 مسألة تدريبية', query: `اكتب لي مسألة امتحانية نموذجية مع حلها على مهمة "${selectedPlanTask.title}".` }
      ];
    }
    return [
      { label: '⏱️ مؤقت 45 دقيقة', query: 'شغل لي مؤقت المذاكرة والتركيز لمدة 45 دقيقة.' },
      { label: '🗂️ بطاقات استذكار نشط', query: 'ولّد لي بطاقات استذكار نشط لأهم قوانين وتعاريف هذا الدرس واحفظها في حسابي.' },
      { label: '🚀 افتح بنك الأخطاء', query: 'انتقل بي الآن تلقائياً إلى قسم بنك الأخطاء لمراجعة هفواتي الامتحانية.' },
      { label: '📅 مهام اليوم بالخطة', query: `شو مهامي المقررة لليوم (${dayNames[todayIndex]}) بالأسبوع ${activeWeekNum}؟` },
      { label: '⚡ أهم قوانين الدرس', query: 'لخص لي أهم قوانين وواحدات هذا الدرس لدورة 2026.' },
      { label: '⚠️ أفخاخ سلم التصحيح', query: 'ما هي أفخاخ سلم التصحيح الشائعة في هذا الدرس؟' }
    ];
  }, [selectedPlanTask, todayIndex, activeWeekNum]);

  // Don't render floating drawer if user is already in full 'aiChat' tab
  if (activeTab === 'aiChat') {
    return null;
  }

  return (
    <>
      {/* 1. Floating Collapsed Trigger Button */}
      {!isAiFloatingDrawerOpen && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-20 md:bottom-6 left-4 z-40"
          dir="rtl"
        >
          <button
            onClick={() => {
              setIsAiFloatingDrawerOpen(true);
              sound.playTick();
            }}
            className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-lg shadow-indigo-900/50 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all text-xs"
            title="فتح المعلم الأكاديمي الذكي (المحادثة محفوظة دائماً)"
          >
            {/* Glowing Pulsing Ring */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide">المعلم الذكي</span>
            </div>

            {selectedPlanTask && (
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-950/80 border border-indigo-400/40 text-indigo-200 font-bold max-w-[90px] truncate">
                🎯 {selectedPlanTask.title}
              </span>
            )}

            {aiChatMessages.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono font-bold">
                {aiChatMessages.length}
              </span>
            )}
          </button>
        </motion.div>
      )}

      {/* 2. Floating Persistent Chat Window */}
      <AnimatePresence>
        {isAiFloatingDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 md:bottom-6 left-3 sm:left-6 z-50 w-[94vw] sm:w-[420px] max-w-full h-[560px] max-h-[82vh] rounded-3xl bg-[#0c111a]/95 backdrop-blur-2xl border border-indigo-500/40 shadow-2xl shadow-indigo-950/80 flex flex-col overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#101622] border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>المعلم الأكاديمي الذكي</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      2026
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    محادثة محفوظة • مؤصل بالمنهاج
                  </p>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                {/* Maximize to full tab */}
                <button
                  onClick={() => {
                    setIsAiFloatingDrawerOpen(false);
                    setActiveTab('aiChat');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  title="توسيع إلى صفحة كاملة"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Minimize */}
                <button
                  onClick={() => setIsAiFloatingDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  title="تصغير"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsAiFloatingDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Selector: Subject & Active Task Pill */}
            <div className="p-2.5 bg-[#0f141f] border-b border-slate-800 shrink-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={aiSelectedSubjectId}
                  onChange={(e) => setAiSelectedSubjectId(e.target.value as SubjectId)}
                  className="w-full text-[11px] font-semibold bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none cursor-pointer truncate"
                >
                  {curriculum.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={aiSelectedLessonId}
                  onChange={(e) => setAiSelectedLessonId(e.target.value)}
                  className="w-full text-[11px] font-semibold bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none cursor-pointer truncate"
                >
                  {allSubjectLessons.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Selected Task Strip */}
              {selectedPlanTask ? (
                <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-[10px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Target className="w-3 h-3 text-indigo-300 shrink-0" />
                    <span className="font-bold text-indigo-200 truncate">🎯 {selectedPlanTask.title}</span>
                  </div>
                  <button
                    onClick={() => setAiSelectedPlanTaskId(null)}
                    className="text-slate-400 hover:text-white shrink-0"
                    title="إلغاء تركيز المهمة"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Messages Scrollable Deck */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">المعلم الأكاديمي الذكي جاهز</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      اسأل عن أي مسألة، قانون، فخ وزاري، أو استفسار في خطتك الدراسية.
                    </p>
                  </div>
                </div>
              ) : (
                aiChatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold border ${
                        isUser 
                          ? 'bg-indigo-600 border-indigo-400 text-white' 
                          : 'bg-slate-900 border-slate-750 text-indigo-400'
                      }`}>
                        {isUser ? 'أنت' : <Sparkles className="w-3 h-3" />}
                      </div>

                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1.5 border ${
                        isUser
                          ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                          : 'bg-[#121824] text-slate-200 border-slate-800 rounded-tl-none'
                      }`}>
                        {msg.taskTitle && (
                          <span className="text-[9px] text-indigo-300 font-mono block pb-1 border-b border-white/10">
                            🎯 {msg.taskTitle.slice(0, 22)}...
                          </span>
                        )}

                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <>
                            <FormattedAIMessage content={msg.content} isStreaming={msg.isStreaming} />
                            {msg.toolActions && msg.toolActions.length > 0 && (
                              <AIToolActionCards actions={msg.toolActions} />
                            )}
                          </>
                        )}

                        {!isUser && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 mt-1">
                            <button
                              onClick={() => handleSendQuestion('أكمل الشرح والحل النموذجي بالتفصيل من النقطة التي توقفت عندها وتابع بقية الخطوات.')}
                              disabled={isLoading}
                              className={`text-[9px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold transition-all ${
                                msg.isTruncated 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse' 
                                  : 'text-indigo-300 hover:text-white hover:bg-indigo-950/60'
                              }`}
                            >
                              <span>⏩ {msg.isTruncated ? 'أكمل الإجابة المبتورة' : 'تابع الشرح'}</span>
                            </button>

                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="text-[9px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                            >
                              {copiedMessageId === msg.id ? (
                                <span className="text-emerald-400 font-bold">تم النسخ ✓</span>
                              ) : (
                                <span>نسخ</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>المعلم الذكي يكتب الإجابة المؤصلة...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            <div className="px-3 py-1.5 bg-[#0f141f] border-t border-slate-800 shrink-0 overflow-x-auto scrollbar-none flex items-center gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuestion(qp.query)}
                  disabled={isLoading}
                  className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950 border border-slate-750 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 transition-all active:scale-95"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-[#101622] border-t border-slate-800 shrink-0">
              <div className="flex items-end gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 focus-within:border-indigo-500">
                <textarea
                  ref={textareaRef}
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendQuestion();
                    }
                  }}
                  placeholder={selectedPlanTask ? `اسأل عن مهمة "${selectedPlanTask.title.slice(0, 20)}..."` : 'اكتب سؤالك هنا...'}
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none px-2 py-1 max-h-[90px]"
                />

                <button
                  onClick={() => handleSendQuestion()}
                  disabled={!inputQuestion.trim() || isLoading}
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>

              <div className="flex items-center justify-between px-1 pt-1.5 text-[9px] text-slate-500">
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Key className="w-2.5 h-2.5" />
                  <span>{apiKey ? 'المفتاح متصل ✓' : 'إعداد المفتاح'}</span>
                </button>

                {aiChatMessages.length > 0 && (
                  <button
                    onClick={clearAiChatMessages}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    مسح المحادثة
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key Modal if triggered inside floating widget */}
      <AnimatePresence>
        {isKeyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#101622] border border-indigo-500/30 p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white">مفتاح Google AI Studio</h4>
                </div>
                <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type={showKeyPassword ? 'text' : 'password'}
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl bg-slate-950 border border-slate-750 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />

              {keyValidationStatus && (
                <div className={`p-2 rounded-xl text-[11px] font-semibold ${
                  keyValidationStatus.valid ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'
                }`}>
                  {keyValidationStatus.valid ? 'تم الحفظ والتحقق بنجاح!' : keyValidationStatus.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  disabled={isValidatingKey}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  {isValidatingKey ? 'جاري التحقق...' : 'حفظ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
