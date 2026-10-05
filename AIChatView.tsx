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
  RefreshCw, 
  X,
  Eye,
  EyeOff,
  Target,
  CheckCircle2,
  ListTodo,
  Settings,
  ExternalLink,
  ArrowRight,
  ChevronDown,
  Camera,
  Paperclip,
  Image as ImageIcon,
  RotateCcw,
  FileQuestion,
  HelpCircle,
  Lightbulb,
  FileCheck2,
  Flame,
  Clock,
  GraduationCap,
  Sigma,
  FileText,
  FileCode,
  Calendar,
  Cpu,
  Youtube,
  Play,
  Video
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId, AIChatMessage, PlanWeek, PlanTask, VideoContextPayload } from '../types';
import { GeminiService, PlanContextInfo, SUPPORTED_GEMINI_MODELS } from '../services/geminiService';
import { sound } from '../services/sound';
import { FormattedAIMessage } from './FormattedAIMessage';
import { AIToolActionCards } from './AIToolActionCards';

export const AIChatView: React.FC = () => {
  const { 
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
    executeAIToolAction,
    activeVideoForAI,
    setActiveVideoForAI,
    videos,
    channels,
    setActiveTheaterVideo
  } = useApp();

  const getSubjectNameLabel = (subjectId: SubjectId) => {
    switch (subjectId) {
      case 'physics': return 'فيزياء';
      case 'chemistry': return 'كيمياء';
      case 'biology': return 'علوم أحياء';
      case 'math1': return 'رياضيات 1';
      case 'math2': return 'رياضيات 2';
      case 'arabic': return 'لغة عربية';
      case 'english': return 'لغة إنكليزية';
      case 'french': return 'لغة فرنسية';
      case 'islamic': return 'تربية إسلامية';
      default: return 'مادة';
    }
  };

  // Chat State
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Student Style Selector: Detailed Notebook Style vs Free Dialogue Style
  const [explanationMode, setExplanationMode] = useState<'notebook' | 'dialogue'>(() => {
    if (typeof window === 'undefined') return 'notebook';
    return (localStorage.getItem('bac240_ai_explanation_mode') as 'notebook' | 'dialogue') || 'notebook';
  });

  const handleToggleExplanationMode = (mode: 'notebook' | 'dialogue') => {
    setExplanationMode(mode);
    try {
      localStorage.setItem('bac240_ai_explanation_mode', mode);
    } catch {}
    sound.playTick();
    showToast(mode === 'notebook' ? 'تم تفعيل نمط الدفتر والتبييض التفصيلي 📝' : 'تم تفعيل نمط الحوار والنقاش الحر 💬');
  };

  // Multimodal Document & Image Attachment State (Max 20MB, Zero Cloud Storage)
  interface AttachedDocument {
    file: File;
    base64: string;
    mimeType: string;
    fileName: string;
    fileSize: number;
    category: 'pdf' | 'image' | 'text';
    previewUrl?: string;
  }
  const [selectedFile, setSelectedFile] = useState<AttachedDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Selected Gemini Model State (Persisted in localStorage)
  const [selectedModel, setSelectedModel] = useState<string>(() => GeminiService.getStoredModel());

  const currentModelObj = useMemo(() => {
    return SUPPORTED_GEMINI_MODELS.find(m => m.id === selectedModel) || SUPPORTED_GEMINI_MODELS[0];
  }, [selectedModel]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    GeminiService.storeSelectedModel(modelId);
    sound.playTick();
    const m = SUPPORTED_GEMINI_MODELS.find(x => x.id === modelId);
    showToast(`تم تفعيل النموذج: ${m?.badge || modelId}`);
  };

  // YouTube Video Analyzer Modal State
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [youtubeModalUrl, setYoutubeModalUrl] = useState('');
  const [isPastingFromClipboard, setIsPastingFromClipboard] = useState(false);
  const [isFetchingYouTubeMeta, setIsFetchingYouTubeMeta] = useState(false);

  const handleAttachCustomYouTube = async (customUrl?: string) => {
    const urlToUse = (customUrl || youtubeModalUrl).trim();
    if (!urlToUse) {
      showToast('يرجى إدخال أو لصق رابط فيديو يوتيوب');
      return;
    }

    const ytMatch = urlToUse.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (!ytMatch) {
      showToast('رابط يوتيوب غير صالح، يرجى التأكد من صحة الرابط');
      return;
    }

    const ytId = ytMatch[1];
    const matchedVideo = videos.find(v => v.youtubeId === ytId);

    setIsFetchingYouTubeMeta(true);
    let realTitle = matchedVideo?.title || '';
    let realAuthor = matchedVideo?.teacherName || '';
    let realThumbnail = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;

    if (!matchedVideo) {
      try {
        const meta = await GeminiService.fetchYouTubeMetadata(ytId);
        if (meta) {
          realTitle = meta.title;
          realAuthor = meta.authorName;
          realThumbnail = meta.thumbnailUrl;
        }
      } catch (e) {
        console.warn('Metadata fetch error', e);
      }
    }

    setIsFetchingYouTubeMeta(false);

    const isGeneralOrGaming = realAuthor.includes('ملزلز') || realAuthor.includes('Mlzlez') || !matchedVideo;

    const payload: VideoContextPayload = {
      videoId: matchedVideo?.id,
      youtubeId: ytId,
      title: realTitle || 'فيديو يوتيوب مرفق',
      teacherName: realAuthor || (matchedVideo ? 'أستاذ المادة' : 'قناة يوتيوب'),
      subjectId: matchedVideo?.subjectId,
      subjectName: matchedVideo ? currentSubject?.name : undefined,
      lessonName: matchedVideo ? (matchedVideo.lesson || currentLessonInfo?.name) : undefined,
      videoUrl: urlToUse,
      thumbnailUrl: realThumbnail,
      autoAnalysisPrompt: isGeneralOrGaming
        ? 'أريد معرفة محتوى هذا الفيديو بالتفصيل وما استعرضه صاحب القناة.'
        : 'أريد تلخيص وشرح النقاط الأساسية وأفخاخ السلم الوزاري 2026 الواردة في هذا الفيديو.'
    };

    setActiveVideoForAI(payload);
    setInputQuestion(
      isGeneralOrGaming
        ? 'اشرح لي محتوى هذا الفيديو بالتفصيل وما يدور فيه وما استعرضه صاحب القناة.'
        : 'اشرح لي هذا الفيديو واستخرج أهم القوانين والمفاهيم وأفخاخ السلم الوزاري 2026.'
    );
    setYoutubeModalUrl('');
    setIsYouTubeModalOpen(false);
    sound.playSuccess();
    showToast(`تم إرفاق فيديو: "${(realTitle || 'اليوتيوب').slice(0, 32)}..." 🎬`);
  };

  const handlePasteFromClipboard = async () => {
    try {
      setIsPastingFromClipboard(true);
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setYoutubeModalUrl(text.trim());
        showToast('تم لصق الرابط من الحافظة ✓');
      } else {
        showToast('الحافظة فارغة');
      }
    } catch {
      showToast('يرجى لصق الرابط يدوياً داخل الحقل');
    } finally {
      setIsPastingFromClipboard(false);
    }
  };

  // Compact Settings Popover Menu State
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  // Active Plan Week Data
  const [currentWeekPlan, setCurrentWeekPlan] = useState<PlanWeek | null>(null);
  const activeWeekNum = planMeta?.currentCalendarWeek || 1;

  // Day Selector within active week (0: Sat .. 6: Fri)
  const getSyrianDayIndex = () => {
    const d = new Date().getDay();
    if (d === 6) return 0;
    return d + 1;
  };

  const todayIndex = getSyrianDayIndex();
  const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  useEffect(() => {
    fetchPlanWeek(activeWeekNum).then(data => {
      if (data) setCurrentWeekPlan(data);
    });
  }, [activeWeekNum, fetchPlanWeek]);

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

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{ valid?: boolean; error?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load API Key on Mount
  useEffect(() => {
    const stored = GeminiService.getStoredApiKey();
    if (stored) {
      setApiKey(stored);
      setTempKeyInput(stored);
    }
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setIsSettingsPopoverOpen(false);
      }
    };
    if (isSettingsPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsPopoverOpen]);

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

  useEffect(() => {
    if (allSubjectLessons.length > 0) {
      const exists = allSubjectLessons.some(l => l.id === aiSelectedLessonId);
      if (!exists) {
        setAiSelectedLessonId(allSubjectLessons[0].id);
      }
    }
  }, [aiSelectedSubjectId, allSubjectLessons, aiSelectedLessonId, setAiSelectedLessonId]);

  const currentLessonInfo = allSubjectLessons.find(l => l.id === aiSelectedLessonId) || allSubjectLessons[0];
  const currentKnowledgeCard = useMemo(() => {
    if (!currentLessonInfo) return null;
    return getLessonKnowledge(aiSelectedSubjectId, currentLessonInfo.id);
  }, [aiSelectedSubjectId, currentLessonInfo, getLessonKnowledge]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages, isLoading]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuestion(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  // Document & Image Selection Handler (Client-side Base64 conversion without cloud storage usage, Max 20MB)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 20MB Max Limit
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showToast('حجم الملف يتجاوز الحد الأقصى المسموح به (20 ميغابايت)');
      e.target.value = '';
      return;
    }

    const nameLower = file.name.toLowerCase();
    let category: 'pdf' | 'image' | 'text' = 'image';
    let mimeType = file.type;

    if (file.type === 'application/pdf' || nameLower.endsWith('.pdf')) {
      category = 'pdf';
      mimeType = 'application/pdf';
    } else if (file.type.startsWith('text/') || nameLower.endsWith('.txt')) {
      category = 'text';
      mimeType = 'text/plain';
    } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(nameLower)) {
      category = 'image';
      mimeType = file.type || 'image/jpeg';
    } else {
      showToast('يرجى اختيار ملف مدعوم (PDF أو صورة أو ملف نصي)');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      const base64Data = dataUrl.split(',')[1] || '';
      setSelectedFile({
        file,
        base64: base64Data,
        mimeType,
        fileName: file.name,
        fileSize: file.size,
        category,
        previewUrl: category === 'image' ? dataUrl : undefined
      });
      sound.playTick();
      const typeLabel = category === 'pdf' ? 'مستند PDF 📄' : category === 'text' ? 'ملف نصي 📝' : 'صورة ورقة الحل 📷';
      showToast(`تم إرفاق ${typeLabel} بنجاح`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    sound.playTick();
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
      showToast('تم التحقق من المفتاح وحفظه بنجاح ✓');
    } else {
      setKeyValidationStatus({ valid: false, error: test.error });
      sound.playTick();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    sound.playTick();
    showToast('تم نسخ الحل النموذجي إلى الحافظة 📋');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Auto-send prompt when redirected with video for AI explanation
  useEffect(() => {
    if (activeVideoForAI?.autoExplainPrompt) {
      const promptToRun = activeVideoForAI.autoExplainPrompt;
      const currentVid = { ...activeVideoForAI, autoExplainPrompt: undefined };
      setActiveVideoForAI(currentVid);
      const timer = setTimeout(() => {
        handleSendQuestion(promptToRun, currentVid);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeVideoForAI]);

  const handleSendQuestion = async (customText?: string, customVideo?: VideoContextPayload | null) => {
    const query = (customText !== undefined ? customText : inputQuestion).trim();
    if ((!query && !selectedFile) || isLoading) return;

    if (!apiKey) {
      setIsSettingsPopoverOpen(true);
      showToast('يرجى إدخال مفتاح Gemini API أولاً من القائمة المنبثقة 🔑');
      return;
    }

    sound.playTick();

    const currentFile = selectedFile;
    setSelectedFile(null); // Clear pending attachment immediately

    // Detect YouTube URL in user query if no video is already active
    let effectiveVideoContext: VideoContextPayload | null = customVideo !== undefined ? customVideo : activeVideoForAI;
    if (!effectiveVideoContext && query) {
      const ytMatch = query.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      if (ytMatch) {
        const ytId = ytMatch[1];
        const knownVideo = videos.find(v => v.youtubeId === ytId);
        effectiveVideoContext = {
          videoId: knownVideo?.id,
          youtubeId: ytId,
          title: knownVideo?.title || 'فيديو يوتيوب تعليمي',
          teacherName: knownVideo?.teacherName || 'أستاذ المادة',
          subjectId: knownVideo?.subjectId || aiSelectedSubjectId,
          subjectName: currentSubject?.name,
          lessonName: currentLessonInfo?.name,
          videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
        };
        setActiveVideoForAI(effectiveVideoContext);
      }
    }

    let defaultContent = 'يرجى مراجعة وتدقيق حل هذه المسألة المرفق بالصورة وفق سلّم التصحيح السوري 2026.';
    if (currentFile) {
      if (currentFile.category === 'pdf') {
        defaultContent = `أرفقت مستند PDF بعنوان "${currentFile.fileName}". يرجى تحليله واستخراج أهم القوانين والمفاهيم الوزارية منه وفق المنهاج السوري 2026.`;
      } else if (currentFile.category === 'text') {
        defaultContent = `أرفقت ملفاً نصياً بعنوان "${currentFile.fileName}". يرجى مراجعته وتلخيصه علمياً.`;
      }
    }

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query || defaultContent,
      timestamp: Date.now(),
      subjectName: currentSubject?.name,
      lessonName: currentLessonInfo?.name,
      taskTitle: selectedPlanTask ? selectedPlanTask.title : undefined,
      imageUrl: currentFile?.category === 'image' ? currentFile.previewUrl : undefined,
      imageMimeType: currentFile?.mimeType,
      fileName: currentFile?.fileName,
      fileSize: currentFile?.fileSize,
      fileType: currentFile?.category,
      videoContext: effectiveVideoContext || undefined
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
        content: m.content,
        imageUrl: m.imageUrl,
        fileName: m.fileName,
        fileType: m.fileType
      }));

      const res = await GeminiService.askGroundedQuestion({
        apiKey,
        subjectName: currentSubject?.name || 'المنهاج السوري',
        lessonName: currentLessonInfo?.name || 'الدرس المختار',
        knowledgeItem: currentKnowledgeCard,
        question: query,
        documentAttachment: currentFile ? {
          data: currentFile.base64,
          mimeType: currentFile.mimeType,
          fileName: currentFile.fileName,
          fileSize: currentFile.fileSize,
          category: currentFile.category
        } : null,
        chatHistory: historyPayload,
        planContext: planContextInfo,
        toolsExecutor: executeAIToolAction,
        selectedModel,
        videoContext: effectiveVideoContext,
        platformVideos: videos,
        platformChannels: channels,
        explanationMode,
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
              videoContext: effectiveVideoContext || undefined,
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

      // Notify if an automatic fallback was used to keep conversation unbroken
      if (res.usedModel && res.usedModel !== selectedModel) {
        showToast(`تم التبديل تلقائياً للنموذج السريع ${res.usedModel} لتجاوز الضغط المؤقت ⚡`);
      }

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
            videoContext: effectiveVideoContext || undefined,
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
            videoContext: effectiveVideoContext || undefined,
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

  return (
    <div className="fixed inset-0 z-50 bg-[#070b12] flex flex-col select-none overflow-hidden" dir="rtl">
      
      {/* Hidden File & Camera Inputs for Document, PDF & OCR Handwriting Grading */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".pdf,image/*,.txt,text/plain,application/pdf" 
        onChange={handleFileSelect} 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        accept="image/*" 
        capture="environment" 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* 1. Smart Context Header (شريط علوي متجاوب ونظيف لشاشات الجوال والحاسوب) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-6 py-2 sm:py-2.5 bg-[#0d121c]/95 border-b border-slate-800/90 backdrop-blur-2xl shrink-0 z-30 relative shadow-sm">
        
        {/* Right Corner: Exit Button + Context Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          
          {/* Exit / Return Button (لاستعادة واجهة التنقل) */}
          <button
            onClick={() => {
              setActiveTab('home');
              sound.playTick();
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition-all active:scale-95 shadow-sm shrink-0 group"
            title="الخروج واستعادة شريط التنقل"
          >
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">الخروج للتنقل</span>
            <span className="sm:hidden">خروج</span>
          </button>

          {/* Quick Subject & Lesson Switcher Pill */}
          <button
            onClick={() => setIsSettingsPopoverOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-750 text-slate-200 text-xs font-semibold transition-all shadow-inner truncate max-w-[150px] sm:max-w-xs group"
            title="تبديل المادة أو الدرس"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-indigo-300 font-bold shrink-0">{getSubjectNameLabel(aiSelectedSubjectId)}:</span>
            <span className="truncate text-slate-200">{currentLessonInfo?.name || 'الدرس'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white shrink-0" />
          </button>

          {/* Plan Task Pill if Active (Desktop) */}
          {selectedPlanTask && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] font-bold text-amber-300 truncate max-w-xs">
              <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">المهمة: {selectedPlanTask.title}</span>
            </div>
          )}
        </div>

        {/* Left Corner: Mode Selector (Desktop) + Model Badge + Settings + Clear */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
          
          {/* Student Explanation Style Selector (hidden on mobile, inside popover) */}
          <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-750 text-xs shadow-inner shrink-0">
            <button
              onClick={() => handleToggleExplanationMode('notebook')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                explanationMode === 'notebook'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمط الدفتر والتبييض: شرح مفصل وموسع بالخطوات والتعليلات"
            >
              <span>📝</span>
              <span>دفتر</span>
            </button>

            <button
              onClick={() => handleToggleExplanationMode('dialogue')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                explanationMode === 'dialogue'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمط الحوار والنقاش الحر: ردود تفاعلية ومركزة"
            >
              <span>💬</span>
              <span>حوار</span>
            </button>
          </div>

          {/* Active Gemini Model Badge */}
          <button
            onClick={() => setIsSettingsPopoverOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all shadow-sm shrink-0"
            title="نموذج الذكاء الاصطناعي النشط - اضغط للتغيير"
          >
            <span>{currentModelObj.badge}</span>
          </button>

          {/* Settings Popover Button */}
          <button
            ref={settingsBtnRef}
            onClick={() => setIsSettingsPopoverOpen(!isSettingsPopoverOpen)}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
              isSettingsPopoverOpen 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-slate-900 hover:bg-slate-850 border-slate-750 text-slate-300 hover:text-white'
            }`}
            title="إعدادات المادة والمفتاح"
            aria-label="إعدادات المادة والمفتاح"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">خيارات</span>
          </button>

          {/* Clear Chat Button */}
          {aiChatMessages.length > 0 && (
            <button
              onClick={clearAiChatMessages}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-400 hover:text-rose-400 transition-all shadow-sm"
              title="مسح المحادثة"
              aria-label="مسح المحادثة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Compact Settings Popover Menu */}
          <AnimatePresence>
            {isSettingsPopoverOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 w-80 sm:w-96 max-h-[85vh] overflow-y-auto scrollbar-thin rounded-3xl bg-[#0e1420]/95 border border-indigo-500/40 shadow-2xl shadow-indigo-950/90 backdrop-blur-2xl p-4 space-y-3.5 z-50 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>إعدادات وسياق المعلم الأكاديمي</span>
                  </div>
                  <button
                    onClick={() => setIsSettingsPopoverOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 0. Explanation Style Selector (Mobile & Desktop) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">
                    نمط الشرح والتبييض:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-750">
                    <button
                      onClick={() => handleToggleExplanationMode('notebook')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        explanationMode === 'notebook'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>📝</span>
                      <span>دفتر وتبييض</span>
                    </button>
                    <button
                      onClick={() => handleToggleExplanationMode('dialogue')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        explanationMode === 'dialogue'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>💬</span>
                      <span>حوار حر</span>
                    </button>
                  </div>
                </div>

                {/* 1. Gemini AI Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span>نموذج الذكاء الاصطناعي (Gemini Model):</span>
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">
                      {currentModelObj.icon} نشط
                    </span>
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => handleSelectModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_GEMINI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.badge} - {m.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {currentModelObj.description}
                  </p>
                </div>

                {/* 2. Current Week & Today's Plan Tasks Overview */}
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-200 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>الأسبوع {activeWeekNum}: {currentWeekPlan?.weekTitle || 'خطة الأسبوع'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium font-mono">
                      {dayNames[todayIndex]}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between pt-1">
                    <span>مهام اليوم المقررة ({todayTasksList.length}):</span>
                    {aiSelectedPlanTaskId && (
                      <button
                        onClick={() => setAiSelectedPlanTaskId(null)}
                        className="text-[10px] text-rose-400 hover:underline font-normal"
                      >
                        إلغاء تركيز المهمة
                      </button>
                    )}
                  </div>

                  {todayTasksList.length === 0 ? (
                    <p className="text-[10px] text-slate-400 py-1">
                      لا توجد مهام مجدولة لليوم في خطتك، يمكنك المذاكرة الحرة في أي درس.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin pr-0.5">
                      {todayTasksList.map((t) => {
                        const isFocused = aiSelectedPlanTaskId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setAiSelectedPlanTaskId(t.id);
                              sound.playTick();
                              showToast(`تم تركيز المعلم على مهمة: ${t.title}`);
                            }}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isFocused
                                ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm'
                                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[11px] ${t.isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {t.isCompleted ? '✓' : '⏳'}
                              </span>
                              <span className="truncate font-medium">{t.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                                {getSubjectNameLabel(t.subjectId)}
                              </span>
                              {isFocused && (
                                <span className="text-[10px] text-emerald-400 font-bold">نشط</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Subject & Lesson Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>المادة والدرس:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={aiSelectedSubjectId}
                      onChange={(e) => setAiSelectedSubjectId(e.target.value as SubjectId)}
                      className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold focus:border-indigo-500 focus:outline-none cursor-pointer truncate"
                    >
                      {curriculum.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={aiSelectedLessonId}
                      onChange={(e) => setAiSelectedLessonId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold focus:border-indigo-500 focus:outline-none cursor-pointer truncate"
                    >
                      {allSubjectLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. API Key Settings */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>مفتاح Gemini API الشخصي:</span>
                    </span>
                    {apiKey && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> مفعل
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type={showKeyPassword ? 'text' : 'password'}
                      value={tempKeyInput}
                      onChange={(e) => setTempKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      dir="ltr"
                      className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl pl-8 pr-3 py-1.5 font-mono text-[11px] focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {keyValidationStatus && (
                    <div className={`p-2 rounded-xl text-[10px] ${
                      keyValidationStatus.valid 
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                    }`}>
                      {keyValidationStatus.valid ? '✓ تم التحقق من المفتاح وحفظه بنجاح!' : keyValidationStatus.error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>احصل على مفتاح مجاني</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    <button
                      onClick={handleSaveApiKey}
                      disabled={isValidatingKey || !tempKeyInput.trim()}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
                    >
                      {isValidatingKey && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>{isValidatingKey ? 'جاري الفحص...' : 'حفظ المفتاح'}</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* 🎬 Active Video Context Card (Video Card Preview) */}
      {activeVideoForAI && (
        <div className="mx-3 sm:mx-6 mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#0d1424] via-[#10172a] to-[#1e1b4b] border border-indigo-500/40 shadow-xl flex items-center justify-between gap-3 text-xs shrink-0 animate-fade-in z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail with Play Overlay */}
            <div 
              className="relative w-16 h-11 sm:w-20 sm:h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-750 shrink-0 group cursor-pointer shadow-md"
              onClick={() => {
                if (activeVideoForAI.videoId) {
                  const v = videos.find(x => x.id === activeVideoForAI.videoId);
                  if (v) setActiveTheaterVideo(v);
                  else window.open(activeVideoForAI.videoUrl || `https://www.youtube.com/watch?v=${activeVideoForAI.youtubeId}`, '_blank');
                } else {
                  window.open(activeVideoForAI.videoUrl || `https://www.youtube.com/watch?v=${activeVideoForAI.youtubeId}`, '_blank');
                }
              }}
              title="مشاهدة الفيديو في مسرح اليوتيوب"
            >
              <img 
                src={activeVideoForAI.thumbnailUrl || `https://img.youtube.com/vi/${activeVideoForAI.youtubeId}/mqdefault.jpg`} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                <Play className="w-4 h-4 text-white fill-current" />
              </div>
            </div>

            {/* Video Details */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[10px]">
                  <Youtube className="w-3 h-3 text-rose-400" />
                  <span>فيديو تعليمي معتمد</span>
                </span>
                {activeVideoForAI.teacherName && (
                  <span className="text-[10px] text-slate-400 truncate">
                    • شرح الأستاذ: <strong className="text-slate-200">{activeVideoForAI.teacherName}</strong>
                  </span>
                )}
              </div>
              <h4 className="font-bold text-white text-xs truncate max-w-sm sm:max-w-md">
                {activeVideoForAI.title}
              </h4>
              <p className="text-[10px] text-indigo-300 truncate">
                المعلم الذكي جاهز لشرح وتحليل محتوى هذا الفيديو واستخراج القوانين وأفخاخ السلم الوزاري 2026.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                if (activeVideoForAI.videoId) {
                  const v = videos.find(x => x.id === activeVideoForAI.videoId);
                  if (v) setActiveTheaterVideo(v);
                  else window.open(activeVideoForAI.videoUrl || `https://www.youtube.com/watch?v=${activeVideoForAI.youtubeId}`, '_blank');
                } else {
                  window.open(activeVideoForAI.videoUrl || `https://www.youtube.com/watch?v=${activeVideoForAI.youtubeId}`, '_blank');
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold transition-all flex items-center gap-1 border border-slate-700"
              title="مشاهدة الفيديو في مسرح اليوتيوب"
            >
              <Play className="w-3 h-3 fill-current text-rose-400" />
              <span className="hidden sm:inline">مشاهدة</span>
            </button>

            <button
              onClick={() => {
                setActiveVideoForAI(null);
                sound.playTick();
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
              title="إغلاق سياق الفيديو"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Messages Deck (Fills entire screen height) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
        
        {/* Welcome Hero Grid (واجهة البداية الجذابة) */}
        {aiChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-6 text-slate-400 max-w-2xl mx-auto">
            
            {/* Hero Badge & Avatar */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-800 border-2 border-indigo-400/40 flex items-center justify-center text-white shadow-2xl shadow-indigo-950/90">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#070b12]"></span>
              </span>
            </div>

            <div className="space-y-1.5 px-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>الوكيل الأكاديمي الذكي لمنهاج 2026</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                أهلاً بك يا بطل في غرفة المعلم الذكي
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
                مؤصل حصرياً بالمنهاج الوزاري السوري دورة 2026. المادة الحالية: <strong className="text-indigo-300">{getSubjectNameLabel(aiSelectedSubjectId)}</strong> — درس: <strong className="text-slate-200">{currentLessonInfo?.name}</strong>.
              </p>
            </div>

            {/* 4 Interactive Hero Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-1 px-2">
              
              {/* Card 1: قوانين وواحدات الدرس */}
              <button
                onClick={() => handleSendQuestion(`لخص لي كافة القوانين والمعادلات والواحدات الدولية المعتمدة في درس "${currentLessonInfo?.name || 'الدرس'}" لدورة 2026 مع جدول الرموز.`)}
                className="group p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0e1522] hover:border-cyan-500/50 border border-slate-800 text-right transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <Sigma className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-cyan-300 transition-colors">
                    ⚡ قوانين وواحدات الدرس
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    استخرج كافة القوانين والواحدات الدولية والمعادلات الرسمية المعتمدة.
                  </div>
                </div>
              </button>

              {/* Card 2: أهم أفخاخ السلم الوزاري */}
              <button
                onClick={() => handleSendQuestion(`ما هي أكثر أفخاخ السلم الوزاري ونقاط خصم الدرجات التي يقع فيها الطلاب في درس "${currentLessonInfo?.name || 'الدرس'}"؟`)}
                className="group p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0e1522] hover:border-amber-500/50 border border-slate-800 text-right transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-amber-300 transition-colors">
                    🎯 أهم أفخاخ السلم الوزاري
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    اكتشف أين يخسر الطلاب درجاتهم والنقاط الحرجة في التدقيق الوزاري.
                  </div>
                </div>
              </button>

              {/* Card 3: مسألة امتحانية نموذجية */}
              <button
                onClick={() => handleSendQuestion(`اكتب لي مسألة امتحانية نموذجية تحاكي ورقة الفحص في درس "${currentLessonInfo?.name || 'الدرس'}" مع خطوات الحل وسلّم الدرجات.`)}
                className="group p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0e1522] hover:border-indigo-500/50 border border-slate-800 text-right transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                    ❓ مسألة امتحانية نموذجية
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    تدرّب على مسألة امتحانية مخصصة تحاكي ورقة الفحص الرسمي 2026.
                  </div>
                </div>
              </button>

              {/* Card 4: صوّر حلك وتأكد من علامتك (Vision Trigger) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0e1522] hover:border-emerald-500/50 border border-slate-800 text-right transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                    📷 صوّر حلك وتأكد من علامتك
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    التقط صورة لورقة حلك بخط يدك ليدققها المعلم سطراً بسطر ويقارنها بالسلم.
                  </div>
                </div>
              </button>

            </div>

          </div>
        ) : (
          aiChatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border ${
                  isUser 
                    ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 border-indigo-400 text-white shadow-md' 
                    : 'bg-[#141d2c] border-slate-750 text-indigo-400'
                }`}>
                  {isUser ? 'أنت' : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble Card */}
                <div className={`max-w-[88%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-2 border ${
                  isUser
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none shadow-md shadow-indigo-950/40'
                    : 'bg-[#101622] text-slate-100 border-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  {/* Meta Bar */}
                  <div className={`flex items-center justify-between text-[10px] pb-1 border-b ${
                    isUser ? 'border-white/10 text-indigo-200' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold">{isUser ? 'أنت' : 'المعلم الأكاديمي الذكي'}</span>
                      {msg.subjectName && (
                        <span className="truncate">• {msg.subjectName}</span>
                      )}
                      {msg.lessonName && (
                        <span className="truncate">• {msg.lessonName}</span>
                      )}
                      {msg.taskTitle && (
                        <span className="font-mono text-indigo-300 truncate">• 🎯 {msg.taskTitle}</span>
                      )}
                    </div>
                    <span className="font-mono shrink-0">{new Date(msg.timestamp).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* User Message with Optional Photo or Document Attachment */}
                  {isUser ? (
                    <div className="space-y-2">
                      {/* Image Attachment Preview */}
                      {msg.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-indigo-400/40 max-w-sm shadow-md bg-slate-950">
                          <img 
                            src={msg.imageUrl} 
                            alt="ورقة حل الطالب" 
                            className="w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                          <div className="bg-indigo-950/90 px-3 py-1 text-[10px] text-indigo-200 flex items-center justify-between font-mono border-t border-indigo-500/20">
                            <span className="flex items-center gap-1">
                              <Camera className="w-3 h-3 text-emerald-400" />
                              <span>{msg.fileName || 'ورقة حل الطالب المرفقة'}</span>
                            </span>
                            <span className="text-emerald-400 font-bold">تم التدقيق بالرؤية ✓</span>
                          </div>
                        </div>
                      )}

                      {/* PDF / Document Attachment Card */}
                      {msg.fileName && !msg.imageUrl && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-950/80 border border-indigo-400/40 text-xs shadow-md max-w-sm">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            msg.fileType === 'pdf' 
                              ? 'bg-rose-950/70 border-rose-500/40 text-rose-300' 
                              : 'bg-indigo-900/70 border-indigo-400/40 text-indigo-300'
                          }`}>
                            {msg.fileType === 'pdf' ? (
                              <FileText className="w-5 h-5 text-rose-400" />
                            ) : (
                              <FileCode className="w-5 h-5 text-indigo-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-white text-xs block truncate" title={msg.fileName}>
                              {msg.fileName}
                            </span>
                            <span className="text-[10px] text-indigo-200/80 font-mono block mt-0.5">
                              {msg.fileSize ? `${(msg.fileSize / (1024 * 1024)).toFixed(1)} MB` : ''} • {msg.fileType === 'pdf' ? 'مستند PDF' : 'ملف نصي'}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium">
                            تم تحليله ✓
                          </span>
                        </div>
                      )}

                      {/* Video Context Attached in Message */}
                      {msg.videoContext && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-400/40 text-xs shadow-md max-w-sm mb-2">
                          <div 
                            className="relative w-14 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-950 cursor-pointer group"
                            onClick={() => {
                              if (msg.videoContext?.videoId) {
                                const v = videos.find(x => x.id === msg.videoContext?.videoId);
                                if (v) setActiveTheaterVideo(v);
                                else window.open(msg.videoContext?.videoUrl, '_blank');
                              } else {
                                window.open(msg.videoContext?.videoUrl, '_blank');
                              }
                            }}
                          >
                            <img src={msg.videoContext.thumbnailUrl || `https://img.youtube.com/vi/${msg.videoContext.youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20">
                              <Play className="w-3.5 h-3.5 text-white fill-current" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
                              <Youtube className="w-3 h-3 text-rose-400" />
                              <span>فيديو يوتيوب تعليمي</span>
                            </span>
                            <span className="font-bold text-white text-xs block truncate" title={msg.videoContext.title}>
                              {msg.videoContext.title}
                            </span>
                            {msg.videoContext.teacherName && (
                              <span className="text-[10px] text-indigo-200/80 block truncate">
                                شرح الأستاذ: {msg.videoContext.teacherName}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                    </div>
                  ) : (
                    <>
                      {/* Structured AI Response Cards with Incremental Streaming */}
                      <FormattedAIMessage content={msg.content} isStreaming={msg.isStreaming} />

                      {/* Tool Calling Executed Actions */}
                      {msg.toolActions && msg.toolActions.length > 0 && (
                        <AIToolActionCards actions={msg.toolActions} />
                      )}

                      {/* Truncation Notice with 1-click Continue Action */}
                      {msg.isTruncated && (
                        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-orange-950/30 p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner animate-fade-in">
                          <div className="flex items-center gap-2.5 text-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                            <span>وصلت الإجابة إلى حد المخرجات الأقصى قبل اكتمال الشرح. انقر للمتابعة الفورية:</span>
                          </div>
                          <button
                            onClick={() => handleSendQuestion('أكمل الشرح والحل النموذجي بالتفصيل من النقطة التي توقفت عندها بالضبط وتابع بقية الخطوات حتى النهاية.')}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95 shrink-0"
                          >
                            <span>⏩ أكمل الإجابة الآن</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Interactive Follow-ups below each Teacher Message */}
                  {!isUser && (
                    <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      
                      {/* Follow-up Quick Action Chips */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Always visible Continue Button if Truncated, or general continuation */}
                        <button
                          onClick={() => handleSendQuestion('تابع الشرح وقدم المزيد من التوضيح والتفاصيل حول ما ذكرته أعلاه.')}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/30 hover:border-indigo-400 text-indigo-200 hover:text-white text-[11px] font-semibold transition-all active:scale-95"
                          title="إكمال ومتابعة الشرح"
                        >
                          <span>⏩ تابع الشرح</span>
                        </button>

                        <button
                          onClick={() => handleSendQuestion(`اختبرني الآن بمسألة تدريبية تحاكي ما شرحته للتو في مادة ${msg.subjectName || currentSubject?.name} وفق سلم التصحيح 2026.`)}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 text-[11px] font-semibold transition-all active:scale-95"
                          title="توليد تمرين تطبيقي فوري"
                        >
                          <span>📝 اختبرني بمسألة مشابهة</span>
                        </button>

                        <button
                          onClick={() => handleSendQuestion(`بسّط لي الشرح السابق أكثر بأسلوب تشبيهي مبسط وخطوات مباشرة للحفظ والتثبيت.`)}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all active:scale-95"
                          title="تبسيط الشرح أكثر"
                        >
                          <RotateCcw className="w-3 h-3 text-cyan-400" />
                          <span>بسّط الشرح أكثر</span>
                        </button>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all text-[11px] font-semibold"
                        title="نسخ الإجابة النموذجية"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الحل</span>
                          </>
                        )}
                      </button>

                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-[#141d2c] border border-slate-750 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-none bg-[#111724] border border-slate-800 text-xs text-slate-300 flex items-center gap-3 shadow-md">
              <span className="flex space-x-1 space-x-reverse">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="font-medium text-xs text-indigo-300">
                المعلم الذكي يحلل القوانين وسلالم التصحيح 2026 ويكتب الرد...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Clean Floating Input Area (Removed outer dark footer bar & helper text) */}
      <div className="p-2 sm:p-3 shrink-0 max-w-5xl w-full mx-auto">
        
        {/* Document & Image Attachment Preview Chip (Zero Cloud Storage, In-Memory) */}
        {selectedFile && (
          <div className="mb-2 space-y-2 animate-fade-in">
            {/* File Chip */}
            <div className="flex items-center gap-3 p-2.5 px-3 rounded-2xl bg-[#101726] border border-indigo-500/40 text-xs shadow-lg backdrop-blur-md">
              {/* Thumbnail or File Icon */}
              {selectedFile.category === 'image' && selectedFile.previewUrl ? (
                <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 shadow-inner">
                  <img src={selectedFile.previewUrl} alt="معاينة الحل" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  selectedFile.category === 'pdf' 
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-300' 
                    : 'bg-indigo-950/70 border-indigo-400/50 text-indigo-300'
                }`}>
                  {selectedFile.category === 'pdf' ? (
                    <FileText className="w-6 h-6 text-rose-400" />
                  ) : (
                    <FileCode className="w-6 h-6 text-indigo-300" />
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <span className="truncate">{selectedFile.fileName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono shrink-0">
                    {(selectedFile.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {selectedFile.category === 'pdf' 
                    ? 'مستند PDF • جاهز للتحليل وتلخيص القوانين وفق المنهاج السوري 2026' 
                    : selectedFile.category === 'text'
                      ? 'ملف نصي • جاهز للفحص والاستخراج العلمي'
                      : 'صورة ورقة الحل • جاهزة للتدقيق ومقارنتها بالسلم الوزاري'}
                </p>
              </div>

              <button
                onClick={handleRemoveFile}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
                title="إلغاء وإزالة الملف"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Suggestions when file attached */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 text-xs">
              <button
                onClick={() => handleSendQuestion('لخّص لي هذا الملف في نقاط أساسية وشرح مبسط وفق المنهاج السوري 2026.')}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>📄 لخّص لي هذا الملف في نقاط أساسية</span>
              </button>

              <button
                onClick={() => handleSendQuestion('استخرج كافة القوانين والمعادلات والمسائل الواردة هنا مع خطوات حلها.')}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Sigma className="w-3.5 h-3.5 text-cyan-400" />
                <span>📐 استخرج القوانين والمسائل الواردة هنا</span>
              </button>

              <button
                onClick={() => handleSendQuestion('دقّق محتوى هذا الملف حسب سلّم تصحيح المنهاج الوزاري السوري دورة 2026 وحدد الملاحظات.')}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>⚠️ دقّق محتوى الملف حسب سلم المنهاج السوري 2026</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Text Box with Three Media & Action Buttons */}
        <div className="flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-2xl">
          
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition-colors shrink-0"
            title="التقاط صورة للحل بالكاميرا"
            aria-label="التقاط صورة للحل بالكاميرا"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Attachment Clip Button (PDF, Images, Documents) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-900 transition-colors shrink-0"
            title="إرفاق مستند أو ملف PDF أو صورة (حتى 20MB)"
            aria-label="إرفاق مستند أو ملف PDF أو صورة"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* YouTube Video Link Analyzer Button */}
          <button
            type="button"
            onClick={() => {
              setIsYouTubeModalOpen(true);
              sound.playTick();
            }}
            disabled={isLoading}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors shrink-0"
            title="إرفاق أو تحليل رابط فيديو يوتيوب"
            aria-label="إرفاق أو تحليل رابط فيديو يوتيوب"
          >
            <Youtube className="w-4 h-4" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={inputQuestion}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendQuestion();
              }
            }}
            placeholder={
              activeVideoForAI
                ? `اسأل المعلم الذكي عن فيديو "${activeVideoForAI.title.slice(0, 24)}..." (أو اضغط إرسال للتحليل)...`
                : selectedFile
                  ? `أضف سؤالك حول ملف "${selectedFile.fileName.slice(0, 24)}..." (أو اضغط إرسال للتحليل التلقائي)...`
                  : selectedPlanTask 
                    ? `اسأل المعلم الذكي عن مهمة "${selectedPlanTask.title.slice(0, 24)}..."` 
                    : `اكتب سؤالك، أو الصق رابط فيديو يوتيوب، أو اسأل في درس "${currentLessonInfo?.name || 'الدرس'}"...`
            }
            rows={1}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none px-1.5 py-1.5 max-h-[140px] leading-relaxed"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendQuestion()}
            disabled={(!inputQuestion.trim() && !selectedFile) || isLoading}
            className="p-2.5 sm:p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/30 shrink-0 active:scale-95"
            aria-label="إرسال السؤال"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>

      </div>

      {/* 🎬 YouTube Video Analyzer & Selector Modal */}
      <AnimatePresence>
        {isYouTubeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-[#0e1422] border border-rose-500/40 shadow-2xl flex flex-col text-xs"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <span>شرح وتحليل فيديو اليوتيوب بالذكاء الاصطناعي</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                        YouTube AI
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      الصق رابط أي فيديو، أو اختر من فيديوهات المنصة لتحليله واستخراج القوانين وأفخاخ السلم الوزاري 2026.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsYouTubeModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
                
                {/* 1. Paste Custom YouTube Link Section */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-750 space-y-3 shadow-sm">
                  <label className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                      <span>الصق رابط فيديو يوتيوب تعليمي (URL):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      disabled={isPastingFromClipboard}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-500/30 transition-all active:scale-95"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{isPastingFromClipboard ? 'جاري اللصق...' : 'لصق من الحافظة'}</span>
                    </button>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={youtubeModalUrl}
                        onChange={(e) => setYoutubeModalUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAttachCustomYouTube();
                          }
                        }}
                        placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                        dir="ltr"
                        className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAttachCustomYouTube()}
                      disabled={!youtubeModalUrl.trim() || isFetchingYouTubeMeta}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/40 shrink-0 active:scale-95"
                    >
                      {isFetchingYouTubeMeta ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{isFetchingYouTubeMeta ? 'جاري جلب تفاصيل الفيديو...' : 'إرفاق وتحليل الرابط'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Platform Library Videos for Current Subject / Lesson */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>فيديوهات المنصة المعتمدة ({currentSubject?.name || 'المادة'}):</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {videos.filter(v => v.subjectId === aiSelectedSubjectId).length} فيديو متاح
                    </span>
                  </div>

                  {videos.filter(v => v.subjectId === aiSelectedSubjectId).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {videos
                        .filter(v => v.subjectId === aiSelectedSubjectId)
                        .slice(0, 6)
                        .map((video) => (
                          <div
                            key={video.id}
                            className="p-2.5 rounded-2xl bg-[#090e18] border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between gap-2.5 group shadow-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-750">
                                <img
                                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Play className="w-3 h-3 text-white fill-current" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-white text-xs truncate max-w-[170px] sm:max-w-[190px]">
                                  {video.title}
                                </h5>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {video.teacherName}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const payload: VideoContextPayload = {
                                  videoId: video.id,
                                  youtubeId: video.youtubeId,
                                  title: video.title,
                                  teacherName: video.teacherName,
                                  subjectId: video.subjectId,
                                  subjectName: currentSubject?.name,
                                  lessonName: video.lesson || video.unit || currentLessonInfo?.name,
                                  videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
                                  thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`,
                                  autoAnalysisPrompt: 'أريد تلخيص وشرح النقاط الأساسية وأفخاخ السلم الوزاري 2026 الواردة في هذا الفيديو.'
                                };
                                setActiveVideoForAI(payload);
                                setInputQuestion('اشرح لي هذا الفيديو واستخرج أهم القوانين والمفاهيم وأفخاخ السلم الوزاري 2026.');
                                setIsYouTubeModalOpen(false);
                                sound.playSuccess();
                                showToast(`تم اختيار فيديو: "${video.title}" 🎬`);
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold transition-all shrink-0 border border-indigo-500/30"
                              title="اختيار هذا الفيديو للشرح"
                            >
                              اختر للتحليل
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                      لا توجد فيديوهات مرفوعة لهذه المادة حالياً، يمكنك لصق رابط خارجي من يوتيوب في الحقل أعلاه.
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>يتم استخراج الأفكار والقوانين وأفخاخ السلم الوزاري 2026 تلقائياً</span>
                <button
                  type="button"
                  onClick={() => setIsYouTubeModalOpen(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
