import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  Subject, 
  DailyTask, 
  Flashcard, 
  FlashcardDeck, 
  EducationalVideo, 
  LibraryDocument, 
  Announcement, 
  TimeBlock, 
  RoadmapMilestone,
  LessonAttachment,
  SubjectId,
  MindMap,
  YouTubeChannel,
  YouTubePlaylist,
  ExamCountdown,
  WrittenExam,
  MistakeRecord,
  VideoAttachment,
  PlatformStatus,
  PlanWeek,
  PlanMetadata,
  CurriculumKnowledgeItem,
  AIChatMessage,
  AIToolAction,
  VideoContextPayload
} from '../types';
import { INITIAL_CURRICULUM_KNOWLEDGE } from '../data/initialCurriculumKnowledge';
import { INITIAL_CURRICULUM } from '../data/curriculumData';
import { 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_FLASHCARDS, 
  INITIAL_VIDEOS, 
  INITIAL_LIBRARY, 
  INITIAL_ROADMAP, 
  INITIAL_MINDMAPS, 
  INITIAL_TIME_BLOCKS, 
  SEED_LEADERBOARD,
  LeaderboardEntry 
} from '../data/initialData';
import { 
  getOrCreateDeviceId, 
  subscribeToAnnouncements, 
  subscribeToStudentProfile,
  subscribeToFlashcards,
  subscribeToFlashcardDecks,
  subscribeToVideos,
  subscribeToYouTubeChannels,
  subscribeToYouTubePlaylists,
  subscribeToLibrary,
  subscribeToRoadmap,
  subscribeToMindMaps,
  subscribeToSchedule,
  subscribeToLessonAttachments,
  subscribeToLeaderboard,
  subscribeToExamCountdowns,
  subscribeToCurriculum,
  subscribeToExams,
  syncMistakesToCloud,
  syncStudentProgressToCloud,
  queueProgressSync,
  deleteStudentAccountFromCloud,
  subscribeToPlatformStatus,
  subscribeToPlanMetadata,
  fetchPlanWeekFromCloud,
  syncPlanTaskCompletionToCloud,
  subscribeToCurriculumKnowledge
} from '../services/firebase';
import {
  STUDENT_STORAGE_KEYS,
  getCurrentStudentSession,
  saveStudentSession,
  clearStudentSession,
  sessionToUserProfile,
  getCanonicalStudentDocId,
  assertStudentOwnership
} from '../services/studentSession';
import {
  ensureStudentFirebaseAuth,
  signOutStudentFirebaseAuth,
  getCurrentStudentAuthUid,
  ensureStudentFirebaseIdentityPersisted
} from '../services/studentAuth';
import { sound } from '../services/sound';

export type NavTab = 
  | 'home'
  | 'dashboard' 
  | 'plan'
  | 'curriculum' 
  | 'writtenExams'
  | 'mistakeBank'
  | 'aiChat'
  | 'mindmaps'
  | 'flashcards' 
  | 'youtube' 
  | 'timer' 
  | 'tools'
  | 'challenge' 
  | 'journey' 
  | 'community' 
  | 'profile';

export type ThemeMode = 'dark' | 'light';

export interface GlobalTimerState {
  isRunning: boolean;
  secondsLeft: number;
  durationMinutes: number;
  mode: 'focus' | 'short_break' | 'long_break';
  subjectId?: SubjectId;
  topic?: string;
  lastCompletedSession?: { minutes: number; time: string } | null;
}

interface AppContextType {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Written Exams (الامتحانات التحريرية وسلالم التصحيح)
  exams: WrittenExam[];

  // Mistake Bank (بنك الأخطاء وتأصيل NotebookLM)
  mistakes: MistakeRecord[];
  addMistake: (mistake: Omit<MistakeRecord, 'id' | 'addedAt' | 'isResolved'>) => void;
  resolveMistake: (id: string) => void;
  deleteMistake: (id: string) => void;
  updateMistakeNote: (id: string, note: string) => void;

  // AI Knowledge Base (مكتبة المنهاج وتأصيل الذكاء الاصطناعي)
  curriculumKnowledge: CurriculumKnowledgeItem[];
  getLessonKnowledge: (subjectId: string, lessonId: string) => CurriculumKnowledgeItem | null;

  // Auth & Profile
  user: UserProfile | null;
  deviceId: string;
  authInitialError: string | null;
  setAuthInitialError: (err: string | null) => void;
  loginUser: (user: UserProfile) => void;
  logoutUser: () => void;
  deleteAccount: () => Promise<boolean>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Platform Status & Maintenance Control
  platformStatus: PlatformStatus;

  // Study Plan (الخطة الدراسية المركزية الموجهة)
  planMeta: PlanMetadata | null;
  selectedPlanWeekIndex: number;
  setSelectedPlanWeekIndex: (week: number) => void;
  completedTaskIds: Record<string, string>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  fetchPlanWeek: (weekIndex: number) => Promise<PlanWeek | null>;
  totalPlanTasksCount: number;
  completedPlanTasksCount: number;
  planProgressPercentage: number;

  // Announcements
  announcements: Announcement[];
  dismissedAnnouncementIds: string[];
  dismissAnnouncement: (id: string) => void;
  restoreAnnouncements: () => void;

  // Curriculum
  curriculum: Subject[];
  resetCurriculumToOfficial: () => void;
  toggleLessonCompletion: (subjectId: SubjectId, unitId: string, lessonId: string) => void;
  toggleUnitCompletion: (subjectId: SubjectId, unitId: string, markAllComplete: boolean) => void;
  addLessonAttachment: (subjectId: SubjectId, unitId: string, lessonId: string, attachment: Omit<LessonAttachment, 'id' | 'createdAt'>) => void;
  removeLessonAttachment: (subjectId: SubjectId, unitId: string, lessonId: string, attachmentId: string) => void;
  totalLessonsCount: number;
  completedLessonsCount: number;
  overallProgressPercentage: number;

  // Exam Countdowns (العد التنازلي للامتحانات من الإدارة)
  countdowns: ExamCountdown[];

  // Daily Tasks
  tasks: DailyTask[];
  addTask: (title: string, subjectId: SubjectId, priority: 'high' | 'medium' | 'low', estimatedMinutes: number) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
  tasksCompletedRatio: { completed: number; total: number; percentage: number };

  // Study Timer
  todayStudyMinutes: number;
  recordStudySession: (minutes: number) => void;
  timerState: GlobalTimerState;
  startStudyTimer: (minutes?: number, subjectId?: SubjectId, topic?: string, mode?: 'focus' | 'short_break' | 'long_break') => void;
  pauseStudyTimer: () => void;
  resumeStudyTimer: () => void;
  resetStudyTimer: () => void;
  setTimerDurationMinutes: (minutes: number) => void;
  setTimerMode: (mode: 'focus' | 'short_break' | 'long_break') => void;

  // Plan Task Completion Helpers
  setTaskCompletionStatus: (taskId: string, isCompleted: boolean) => Promise<void>;
  completePlanTaskByTitleOrId: (titleOrId: string, isCompleted?: boolean) => Promise<{ success: boolean; taskTitle: string; taskId: string }>;

  // AI Agent Function Calling Dispatcher
  executeAIToolAction: (toolName: string, args: any) => Promise<AIToolAction>;

  // Flashcards
  flashcards: Flashcard[];
  flashcardDecks: FlashcardDeck[];
  markFlashcardStatus: (id: string, status: 'mastered' | 'review') => void;
  addCustomFlashcard: (card: Omit<Flashcard, 'id' | 'status'>) => void;
  resetFlashcardSession: () => void;

  // YouTube Hub & Theater
  videos: EducationalVideo[];
  channels: YouTubeChannel[];
  playlists: YouTubePlaylist[];
  activeTheaterVideo: EducationalVideo | null;
  setActiveTheaterVideo: (video: EducationalVideo | null) => void;
  toggleVideoWatched: (id: string) => void;
  toggleVideoFavorite: (id: string) => void;
  updateVideoNotes: (id: string, notes: string) => void;
  addStudentVideoAttachment: (videoId: string, attachment: Omit<VideoAttachment, 'id' | 'addedAt' | 'addedBy'>) => void;
  removeStudentVideoAttachment: (videoId: string, attachmentId: string) => void;
  addCustomVideo: (video: { url: string; title: string; teacherName: string; subjectId: SubjectId; category: EducationalVideo['category'] }) => void;

  // Library & Community
  libraryDocs: LibraryDocument[];
  toggleBookmark: (id: string) => void;
  addCustomDocument: (doc: Omit<LibraryDocument, 'id' | 'isBookmarked'>) => void;

  // Roadmap & Daily Planner
  roadmap: RoadmapMilestone[];
  toggleRoadmapItem: (milestoneId: string, checklistId: string) => void;
  timeBlocks: TimeBlock[];
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  removeTimeBlock: (id: string) => void;

  // Mind Maps (الخرائط الذهنية السحابية من الإدارة)
  mindmaps: MindMap[];

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // Mobile Pages Sheet State (بديل القائمة الجانبية: تصفح الصفحات بالسحب)
  isMobilePagesOpen: boolean;
  setIsMobilePagesOpen: (open: boolean) => void;

  // Radial Circular Dial Navigation State (طلب المستخدم: قرص دائري بالأسفل وسحب دائري)
  isRadialDialOpen: boolean;
  setIsRadialDialOpen: (open: boolean) => void;

  // Settings & Theme (Dark Mode & Light Mode)
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isUltraDarkMode: boolean;
  setIsUltraDarkMode: (val: boolean) => void;

  // Confetti trigger
  triggerCelebration: () => void;

  // AI Chat & Persistent Assistant
  aiChatMessages: AIChatMessage[];
  setAiChatMessages: React.Dispatch<React.SetStateAction<AIChatMessage[]>>;
  addAiChatMessage: (msg: AIChatMessage) => void;
  updateAiChatMessage: (id: string, updates: Partial<AIChatMessage>) => void;
  clearAiChatMessages: () => void;
  aiSelectedSubjectId: SubjectId;
  setAiSelectedSubjectId: (subj: SubjectId) => void;
  aiSelectedLessonId: string;
  setAiSelectedLessonId: (lessonId: string) => void;
  aiSelectedPlanTaskId: string | null;
  setAiSelectedPlanTaskId: (taskId: string | null) => void;
  isAiFloatingDrawerOpen: boolean;
  setIsAiFloatingDrawerOpen: (open: boolean) => void;
  openAiChatWithTask: (task: { id: string; subjectId: SubjectId; title: string; textbookPages?: string; studyMode?: string; examWeight?: string }) => void;
  activeVideoForAI: VideoContextPayload | null;
  setActiveVideoForAI: (video: VideoContextPayload | null) => void;
  startAIChatWithVideo: (video: EducationalVideo, subjectName?: string, lessonName?: string, customPrompt?: string) => void;

  // Global Interactive Toast Feedback
  toastMessage: { text: string; id: number; icon?: string } | null;
  showToast: (message: string, icon?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>('dashboard');
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobilePagesOpen, setIsMobilePagesOpen] = useState(false);
  const [isRadialDialOpen, setIsRadialDialOpen] = useState(false);

  // AI Knowledge Base State (Realtime synchronization with Firebase & starter seeds)
  const [curriculumKnowledge, setCurriculumKnowledge] = useState<CurriculumKnowledgeItem[]>(INITIAL_CURRICULUM_KNOWLEDGE);

  useEffect(() => {
    const unsub = subscribeToCurriculumKnowledge((cloudItems) => {
      if (cloudItems && cloudItems.length > 0) {
        setCurriculumKnowledge(() => {
          const map = new Map<string, CurriculumKnowledgeItem>();
          INITIAL_CURRICULUM_KNOWLEDGE.forEach(item => map.set(item.id, item));
          cloudItems.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
    });
    return () => unsub();
  }, []);

  const getLessonKnowledge = useCallback((subjectId: string, lessonId: string) => {
    return curriculumKnowledge.find(k => k.subjectId === subjectId && k.lessonId === lessonId) || null;
  }, [curriculumKnowledge]);

  // Global Interactive Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; id: number; icon?: string } | null>(null);

  const showToast = useCallback((text: string, icon?: string) => {
    setToastMessage({ text, id: Date.now(), icon });
  }, []);

  // AI Chat & Persistent Assistant State (Stored in LocalStorage & synchronized across entire app)
  const [aiChatMessages, setAiChatMessages] = useState<AIChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('bac240_ai_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bac240_ai_chat_messages', JSON.stringify(aiChatMessages));
    } catch {}
  }, [aiChatMessages]);

  const [aiSelectedSubjectId, setAiSelectedSubjectId] = useState<SubjectId>('physics');
  const [aiSelectedLessonId, setAiSelectedLessonId] = useState<string>('elastic_pendulum');
  const [aiSelectedPlanTaskId, setAiSelectedPlanTaskId] = useState<string | null>(null);
  const [isAiFloatingDrawerOpen, setIsAiFloatingDrawerOpen] = useState(false);

  const addAiChatMessage = useCallback((msg: AIChatMessage) => {
    setAiChatMessages(prev => [...prev, msg]);
  }, []);

  const updateAiChatMessage = useCallback((id: string, updates: Partial<AIChatMessage>) => {
    setAiChatMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const clearAiChatMessages = useCallback(() => {
    setAiChatMessages([]);
    try {
      localStorage.removeItem('bac240_ai_chat_messages');
    } catch {}
    showToast('تم مسح المحادثة وبدء جلسة جديدة 🔄');
  }, [showToast]);

  const openAiChatWithTask = useCallback((task: { id: string; subjectId: SubjectId; title: string; textbookPages?: string; studyMode?: string; examWeight?: string }) => {
    setAiSelectedSubjectId(task.subjectId);
    setAiSelectedPlanTaskId(task.id);
    setIsAiFloatingDrawerOpen(true);
    showToast(`تم تحديد مهمة "${task.title.length > 28 ? task.title.slice(0, 28) + '...' : task.title}" للمحادثة مع المعلم الذكي ⚡`);
  }, [showToast]);

  // Video Context for AI Assistant
  const [activeVideoForAI, setActiveVideoForAI] = useState<VideoContextPayload | null>(null);

  const startAIChatWithVideo = useCallback((
    video: EducationalVideo, 
    subjectName?: string, 
    lessonName?: string, 
    customPrompt?: string
  ) => {
    setAiSelectedSubjectId(video.subjectId);
    if (video.lesson) {
      setAiSelectedLessonId(video.lesson);
    }
    const resolvedSubjectName = subjectName || 'المنهاج السوري';
    const resolvedLessonName = lessonName || video.lesson || video.unit || 'شرح الدرس';
    
    const payload: VideoContextPayload = {
      videoId: video.id,
      youtubeId: video.youtubeId,
      title: video.title,
      teacherName: video.teacherName,
      subjectId: video.subjectId,
      subjectName: resolvedSubjectName,
      lessonName: resolvedLessonName,
      videoUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`,
      autoExplainPrompt: customPrompt || 'أريد تلخيص وشرح النقاط الأساسية وأفخاخ السلم الوزاري الواردة في شرح الأستاذ بهذا الفيديو وفق المنهاج السوري 2026.'
    };
    
    setActiveVideoForAI(payload);
    setActiveTabState('aiChat');
    sound.playSuccess();
    showToast(`تم توجيه المعلم الذكي لتحليل وشرح فيديو: "${video.title.slice(0, 30)}..." ✨`);
  }, [showToast]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState(tab);
  }, []);

  // Initialize Theme (Light Theme & Dark Theme)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bac240_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    localStorage.setItem('bac240_theme', theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light', 'light-theme');
      document.body.classList.remove('dark');
      document.body.classList.add('light', 'light-theme');
    } else {
      root.classList.remove('light', 'light-theme');
      root.classList.add('dark');
      document.body.classList.remove('light', 'light-theme');
      document.body.classList.add('dark');
    }
  }, [theme]);

  // Backward-compatible Ultra Dark Mode
  const [isUltraDarkMode, setIsUltraDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('bac240_ultra_dark') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('bac240_ultra_dark', isUltraDarkMode ? 'true' : 'false');
    if (isUltraDarkMode) {
      document.documentElement.classList.add('ultra-dark');
    } else {
      document.documentElement.classList.remove('ultra-dark');
    }
  }, [isUltraDarkMode]);

  // User State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const activeSession = getCurrentStudentSession();
      const saved = localStorage.getItem(STUDENT_STORAGE_KEYS.CURRENT_USER);
      if (!saved && !activeSession) return null;

      const parsed = (saved ? JSON.parse(saved) : (activeSession ? sessionToUserProfile(activeSession) : null)) as UserProfile;
      if (!parsed) return null;

      // Normalize student ID if it equals activation voucher code
      if (!parsed.id || parsed.id === parsed.studentCode || parsed.id.startsWith('BAC-202')) {
        const phone = parsed.phoneNumber?.replace(/\D/g, '') || '';
        const suffix = phone.length >= 4 ? phone.slice(-4) : (parsed.studentCode?.slice(-4) || '2401');
        parsed.id = `STU-240-${suffix}`;
      }
      // Force reset streak to 0 if streak reset migration has not been applied locally
      const hasResetStreaks = localStorage.getItem(STUDENT_STORAGE_KEYS.STREAKS_RESET_MIGRATION);
      if (!hasResetStreaks) {
        parsed.streakDays = 0;
        parsed.rankTitle = 'طامح للـ 240';
        saveStudentSession(parsed);
        localStorage.setItem(STUDENT_STORAGE_KEYS.STREAKS_RESET_MIGRATION, 'true');
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [authInitialError, setAuthInitialError] = useState<string | null>(null);

  // Platform Status & Maintenance State
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>(() => {
    try {
      const saved = localStorage.getItem('bac240_platform_status');
      return saved ? JSON.parse(saved) : { isPlatformOpen: true };
    } catch {
      return { isPlatformOpen: true };
    }
  });

  // Study Plan State (الخطة الدراسية المركزية الموجهة)
  const [planMeta, setPlanMeta] = useState<PlanMetadata | null>(() => {
    try {
      const saved = localStorage.getItem('bac240_plan_meta');
      return saved ? JSON.parse(saved) : {
        id: 'bac240_official_2026',
        title: 'الخطة السنوية الموجهة 2026',
        totalWeeks: 34,
        currentCalendarWeek: 4,
        isFreeNavigationEnabled: false,
        isPublished: true,
        updatedAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  });

  // Selected Plan Week State (حفظ واختيار الأسبوع الدراسي للطالب ومزامنته دائماً)
  const [selectedPlanWeekIndex, setSelectedPlanWeekIndexState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const saved = localStorage.getItem('bac240_selected_plan_week');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 36) return parsed;
      }
    } catch {}
    return 1;
  });

  const setSelectedPlanWeekIndex = useCallback((weekIndex: number) => {
    setSelectedPlanWeekIndexState(weekIndex);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bac240_selected_plan_week', weekIndex.toString());
      } catch {}
    }
  }, []);

  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('bac240_completed_task_ids');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save completedTaskIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bac240_completed_task_ids', JSON.stringify(completedTaskIds));
    } catch {}
  }, [completedTaskIds]);

  // Purge any stale session or local mock plan cache once on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('bac240_plan_week_')) sessionStorage.removeItem(k);
        });
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('bac240_plan_week_')) localStorage.removeItem(k);
        });
      } catch {}
    }
  }, []);

  // Plan week fetcher: Directly queries Firebase Firestore for 100% live synchronization with Admin
  const fetchPlanWeek = useCallback(async (weekIndex: number): Promise<PlanWeek | null> => {
    return await fetchPlanWeekFromCloud(weekIndex);
  }, []);

  // Atomic toggle for plan task completion
  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    const isCurrentlyDone = !!completedTaskIds[taskId];
    const nextState = !isCurrentlyDone;

    // 1. Optimistic UI update
    setCompletedTaskIds(prev => {
      const updated = { ...prev };
      if (nextState) {
        updated[taskId] = new Date().toISOString();
      } else {
        delete updated[taskId];
      }
      return updated;
    });

    if (nextState) {
      sound.playSuccess();
    } else {
      sound.playTick();
    }

    // 2. Cloud sync if user authenticated
    if (user) {
      try {
        const targetStudentId = getCanonicalStudentDocId(user);
        assertStudentOwnership(targetStudentId);
        syncPlanTaskCompletionToCloud(targetStudentId, taskId, nextState).catch(err => {
          console.warn('Background sync for task completion error:', err);
        });
      } catch (guardErr) {
        console.warn('Task completion guard warning:', guardErr);
      }
    }
  }, [completedTaskIds, user]);

  // Direct programmatic task completion setter (for AI Agent tool calling)
  const setTaskCompletionStatus = useCallback(async (taskId: string, isCompleted: boolean) => {
    const isCurrentlyDone = !!completedTaskIds[taskId];
    if (isCurrentlyDone === isCompleted) return;

    setCompletedTaskIds(prev => {
      const updated = { ...prev };
      if (isCompleted) {
        updated[taskId] = new Date().toISOString();
      } else {
        delete updated[taskId];
      }
      return updated;
    });

    if (isCompleted) {
      sound.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        zIndex: 9999
      });
    } else {
      sound.playTick();
    }

    if (user) {
      try {
        const targetStudentId = getCanonicalStudentDocId(user);
        assertStudentOwnership(targetStudentId);
        syncPlanTaskCompletionToCloud(targetStudentId, taskId, isCompleted).catch(err => {
          console.warn('Background sync for task completion error:', err);
        });
      } catch (guardErr) {
        console.warn('Task completion guard warning:', guardErr);
      }
    }
  }, [completedTaskIds, user]);

  // AI Agent helper: Match task by title or id from current week/day and update
  const completePlanTaskByTitleOrId = useCallback(async (
    titleOrId: string, 
    isCompleted: boolean = true
  ): Promise<{ success: boolean; taskTitle: string; taskId: string }> => {
    const cleanQuery = titleOrId.trim().toLowerCase();
    let targetId = '';
    let targetTitle = titleOrId;

    const weekNum = planMeta?.currentCalendarWeek || selectedPlanWeekIndex || 1;
    const weekData = await fetchPlanWeek(weekNum);
    
    if (weekData?.days) {
      const allTasks = weekData.days.flatMap(d => d.tasks || []);
      const matched = allTasks.find(t => 
        t.id === cleanQuery || 
        t.title.toLowerCase().includes(cleanQuery) || 
        cleanQuery.includes(t.title.toLowerCase())
      );
      if (matched) {
        targetId = matched.id;
        targetTitle = matched.title;
      }
    }

    if (!targetId) {
      targetId = cleanQuery.startsWith('task_') ? cleanQuery : `plan_task_${Date.now()}`;
    }

    await setTaskCompletionStatus(targetId, isCompleted);
    return {
      success: true,
      taskTitle: targetTitle,
      taskId: targetId
    };
  }, [planMeta, selectedPlanWeekIndex, fetchPlanWeek, setTaskCompletionStatus]);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_announcements');
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_dismissed_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Curriculum State (Self-heals and guarantees pristine subject and lesson names)
  const [curriculum, setCurriculum] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_curriculum');
      if (!saved) return INITIAL_CURRICULUM;
      const parsed = JSON.parse(saved) as Subject[];
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_CURRICULUM;

      // Check if data is corrupted (e.g. subject name or lesson name missing as seen in user report)
      const hasCorruptedNames = parsed.some(s => !s.name && !(s as any).title && !(s as any).subjectName);
      if (hasCorruptedNames) {
        return INITIAL_CURRICULUM;
      }

      // Safe merge with INITIAL_CURRICULUM to preserve completed lesson ticks and attachments
      return INITIAL_CURRICULUM.map(initSub => {
        const savedSub = parsed.find(p => p.id === initSub.id);
        if (!savedSub) return initSub;

        return {
          ...initSub,
          name: savedSub.name || (savedSub as any).title || initSub.name,
          maxScore: typeof savedSub.maxScore === 'number' ? savedSub.maxScore : initSub.maxScore,
          units: initSub.units.map(initUnit => {
            const savedUnit = savedSub.units?.find(u => u.id === initUnit.id);
            if (!savedUnit) return initUnit;

            return {
              ...initUnit,
              unit_name: savedUnit.unit_name || (savedUnit as any).title || (savedUnit as any).name || initUnit.unit_name,
              lessons: initUnit.lessons.map(initLesson => {
                const savedLesson = savedUnit.lessons?.find(l => l.id === initLesson.id);
                return {
                  ...initLesson,
                  name: (savedLesson?.name || (savedLesson as any)?.title || initLesson.name),
                  completed: !!savedLesson?.completed,
                  attachments: savedLesson?.attachments || initLesson.attachments || []
                };
              })
            };
          })
        };
      });
    } catch {
      return INITIAL_CURRICULUM;
    }
  });

  // Exam Countdowns State (managed exclusively by Admin)
  const [countdowns, setCountdowns] = useState<ExamCountdown[]>([]);

  // Daily Tasks (Starts empty - user adds their own tasks)
  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Study time
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(() => {
    try {
      const savedToday = localStorage.getItem('bac240_today_date');
      const todayStr = new Date().toISOString().split('T')[0];
      if (savedToday === todayStr) {
        return parseInt(localStorage.getItem('bac240_today_minutes') || '0', 10);
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_flashcards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_FLASHCARDS;
    } catch {
      return INITIAL_FLASHCARDS;
    }
  });

  // Flashcard Decks (حزم البطاقات المنهجية من الإدارة)
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_flashcard_decks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Videos
  const [videos, setVideos] = useState<EducationalVideo[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_videos');
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    } catch {
      return INITIAL_VIDEOS;
    }
  });

  // YouTube Channels and Playlists from Admin
  const [channels, setChannels] = useState<YouTubeChannel[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_channels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTheaterVideo, setActiveTheaterVideo] = useState<EducationalVideo | null>(null);

  // Library
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_library');
      return saved ? JSON.parse(saved) : INITIAL_LIBRARY;
    } catch {
      return INITIAL_LIBRARY;
    }
  });

  // Roadmap & Planner
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_roadmap');
      return saved ? JSON.parse(saved) : INITIAL_ROADMAP;
    } catch {
      return INITIAL_ROADMAP;
    }
  });

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_time_blocks');
      return saved ? JSON.parse(saved) : INITIAL_TIME_BLOCKS;
    } catch {
      return INITIAL_TIME_BLOCKS;
    }
  });

  // Mind Maps (الخرائط الذهنية السحابية)
  const [mindmaps, setMindmaps] = useState<MindMap[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_mindmaps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_MINDMAPS;
    } catch {
      return INITIAL_MINDMAPS;
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    return SEED_LEADERBOARD;
  });

  // Written Exams (الامتحانات التحريرية وسلالم التصحيح من الإدارة)
  const [exams, setExams] = useState<WrittenExam[]>([]);

  // Mistake Bank (بنك أخطائي الشخصي)
  const [mistakes, setMistakes] = useState<MistakeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_mistakes_bank');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save changes to LocalStorage
  useEffect(() => {
    if (user) {
      saveStudentSession(user);
    } else {
      clearStudentSession();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bac240_curriculum', JSON.stringify(curriculum));
  }, [curriculum]);

  useEffect(() => {
    localStorage.setItem('bac240_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('bac240_today_date', todayStr);
    localStorage.setItem('bac240_today_minutes', todayStudyMinutes.toString());
  }, [todayStudyMinutes]);

  useEffect(() => {
    localStorage.setItem('bac240_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('bac240_flashcard_decks', JSON.stringify(flashcardDecks));
  }, [flashcardDecks]);

  useEffect(() => {
    localStorage.setItem('bac240_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('bac240_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('bac240_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('bac240_library', JSON.stringify(libraryDocs));
  }, [libraryDocs]);

  useEffect(() => {
    localStorage.setItem('bac240_roadmap', JSON.stringify(roadmap));
  }, [roadmap]);

  useEffect(() => {
    localStorage.setItem('bac240_mindmaps', JSON.stringify(mindmaps));
  }, [mindmaps]);

  useEffect(() => {
    localStorage.setItem('bac240_time_blocks', JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  useEffect(() => {
    localStorage.setItem('bac240_dismissed_announcements', JSON.stringify(dismissedAnnouncementIds));
  }, [dismissedAnnouncementIds]);

  // Persist mistakes and sync with cloud document
  useEffect(() => {
    try {
      localStorage.setItem('bac240_mistakes_bank', JSON.stringify(mistakes));
      if (user) {
        const studentId = getCanonicalStudentDocId(user);
        assertStudentOwnership(studentId);
        syncMistakesToCloud(studentId, mistakes);
      }
    } catch {
      // offline silent fallback
    }
  }, [mistakes, user]);

  // Subscribe to real-time collections populated by the Admin project
  useEffect(() => {
    // 1. Administrative Announcements
    // 1. Critical Priority: Immediate Subscriptions for First Paint
    const unsubAnnouncements = subscribeToAnnouncements((newAnnouncements) => {
      setAnnouncements(newAnnouncements || []);
    });

    const unsubPlatform = subscribeToPlatformStatus((status) => {
      setPlatformStatus(status);
      try {
        localStorage.setItem('bac240_platform_status', JSON.stringify(status));
      } catch {}
    });

    const unsubPlan = subscribeToPlanMetadata((meta) => {
      setPlanMeta(meta);
      try {
        localStorage.setItem('bac240_plan_meta', JSON.stringify(meta));
      } catch {}
    });

    const unsubCountdowns = subscribeToExamCountdowns((items) => {
      setCountdowns(items || []);
    });

    let unsubUser = () => {};
    if (user) {
      try {
        const studentIdentifier = getCanonicalStudentDocId(user);
        unsubUser = subscribeToStudentProfile(
          studentIdentifier,
          deviceId,
          (updatedProfile) => {
            setUser(prev => prev ? { ...prev, ...updatedProfile } : null);
          },
          (reason) => {
            clearStudentSession(studentIdentifier);
            setUser(null);
            sessionStorage.clear();
            setAuthInitialError(reason);
            setIsAuthModalOpen(true);
            alert(`⚠️ تنبيه إداري من منصة BAC-240:\n${reason}`);
          }
        );
      } catch (err) {
        console.warn('Student profile subscription setup warning:', err);
      }

      // Ensure/restore Firebase Anonymous Auth technical identity for active student
      ensureStudentFirebaseAuth()
        .then(async (authUid) => {
          if (!authUid) return;
          setUser((prev) => {
            if (!prev) return null;
            if (prev.firebaseAuthUid !== authUid) {
              const updated = { ...prev, firebaseAuthUid: authUid };
              saveStudentSession(updated);
              return updated;
            }
            return prev;
          });
          // تأكيد مطابقة وتخزين هوية Firebase Auth في سجل الفايرستور بدون تكرار
          await ensureStudentFirebaseIdentityPersisted();
        })
        .catch((authErr) => {
          console.warn('[AppContext] Could not restore Firebase Auth identity on startup:', authErr);
        });
    }

    // 2. Secondary Priority: Staggered Background Subscriptions (150ms delay)
    // Frees main thread completely for instant initial hydration & 120fps animations
    let deferredUnsubs: Array<() => void> = [];
    const deferTimer = setTimeout(() => {
      const unsubFlashcards = subscribeToFlashcards((adminCards) => {
        setFlashcards(adminCards || []);
      });

      const unsubDecks = subscribeToFlashcardDecks((adminDecks) => {
        setFlashcardDecks(adminDecks || []);
      });

      const unsubVideos = subscribeToVideos((adminVideos) => {
        setVideos(adminVideos || []);
      });

      const unsubChannels = subscribeToYouTubeChannels((adminChannels) => {
        setChannels(adminChannels || []);
      });

      const unsubPlaylists = subscribeToYouTubePlaylists((adminPlaylists) => {
        setPlaylists(adminPlaylists || []);
      });

      const unsubLibrary = subscribeToLibrary((adminDocs) => {
        if (adminDocs && adminDocs.length > 0) {
          setLibraryDocs(prev => {
            const bookmarkSet = new Set(prev.filter(d => d.isBookmarked).map(d => d.id));
            const customDocs = prev.filter(d => d.isCustom);
            const merged = adminDocs.map(d => ({
              ...d,
              isBookmarked: bookmarkSet.has(d.id)
            }));
            return [...merged, ...customDocs];
          });
        }
      });

      const unsubRoadmap = subscribeToRoadmap((adminRoadmap) => {
        setRoadmap(adminRoadmap || []);
      });

      const unsubMindmaps = subscribeToMindMaps((adminMindmaps) => {
        setMindmaps(adminMindmaps || []);
      });

      const unsubSchedule = subscribeToSchedule((adminSchedule) => {
        if (adminSchedule && adminSchedule.length > 0) {
          setTimeBlocks(adminSchedule);
        }
      });

      const unsubAttachments = subscribeToLessonAttachments((attachments) => {
        if (attachments && attachments.length > 0) {
          setCurriculum(prevCurriculum => {
            return prevCurriculum.map(sub => ({
              ...sub,
              units: sub.units.map(unit => ({
                ...unit,
                lessons: unit.lessons.map(lesson => {
                  const adminAtts = attachments.filter(
                    a => a.subjectId === sub.id && a.unitId === unit.id && a.lessonId === lesson.id
                  );
                  if (adminAtts.length > 0) {
                    const existingNonAdmin = (lesson.attachments || []).filter(
                      a => !adminAtts.some(adm => adm.id === a.id)
                    );
                    return {
                      ...lesson,
                      attachments: [...existingNonAdmin, ...adminAtts]
                    };
                  }
                  return lesson;
                })
              }))
            }));
          });
        }
      });

      const unsubLeaderboard = subscribeToLeaderboard((liveStudents) => {
        setLeaderboard(liveStudents || []);
      });

      const unsubCurriculum = subscribeToCurriculum((adminSubjects) => {
        if (adminSubjects && adminSubjects.length > 0) {
          setCurriculum(prevCurriculum => {
            const completedSet = new Set<string>();
            prevCurriculum.forEach(s => s.units?.forEach(u => u.lessons?.forEach(l => {
              if (l.completed) completedSet.add(`${s.id}-${u.id}-${l.id}`);
            })));

            return prevCurriculum.map(sub => {
              const adminMatch = adminSubjects.find(as => as.id === sub.id);
              if (!adminMatch || !adminMatch.units || adminMatch.units.length === 0) return sub;

              return {
                ...sub,
                units: adminMatch.units.map((u: any, uIdx: number) => {
                  const unitId = u.id || `unit_${uIdx + 1}`;
                  const unitName = u.unit_name || u.title || u.name || `الوحدة ${uIdx + 1}`;
                  const rawLessons = Array.isArray(u.lessons) ? u.lessons : [];
                  return {
                    id: unitId,
                    unit_name: unitName,
                    lessons: rawLessons.map((l: any, lIdx: number) => {
                      const lessonId = l.id || `l_${lIdx + 1}`;
                      const lessonName = l.name || l.title || `درس ${lIdx + 1}`;
                      const isDone = completedSet.has(`${sub.id}-${unitId}-${lessonId}`) || !!l.completed;
                      return {
                        id: lessonId,
                        name: lessonName,
                        completed: isDone,
                        attachments: l.attachments || []
                      };
                    })
                  };
                })
              };
            });
          });
        }
      });

      const unsubExams = subscribeToExams((items) => {
        if (Array.isArray(items)) {
          setExams(items);
        }
      });

      deferredUnsubs = [
        unsubFlashcards,
        unsubDecks,
        unsubVideos,
        unsubChannels,
        unsubPlaylists,
        unsubLibrary,
        unsubRoadmap,
        unsubMindmaps,
        unsubSchedule,
        unsubAttachments,
        unsubLeaderboard,
        unsubCurriculum,
        unsubExams
      ];
    }, 150);

    return () => {
      clearTimeout(deferTimer);
      unsubAnnouncements();
      unsubUser();
      unsubCountdowns();
      unsubPlatform();
      unsubPlan();
      deferredUnsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, [user?.docId, user?.studentCode, user?.id]);

  // Celebration function
  const triggerCelebration = useCallback(() => {
    sound.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  }, []);

  // Rank calculator helper
  const getRankTitleForStreak = (streak: number) => {
    if (streak >= 100) return 'قمة الجمهورية 🌟';
    if (streak >= 60) return 'أسطورة البكالوريا 👑';
    if (streak >= 30) return 'محارب الـ 240 🏆';
    if (streak >= 14) return 'عادة التفوق الراسخة 🥇';
    if (streak >= 7) return 'أسبوع الالتزام الخارق 🥈';
    if (streak >= 3) return 'انطلاقة الشغف 🥉';
    return 'طامح للـ 240';
  };

  // Strict streak increment and cloud sync logic
  const recordRealActivity = useCallback(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // If streak is 0, student has never completed a day yet -> immediately award day 1!
    // Or if last active was before today, check if yesterday (consecutive) or missed a day.
    const shouldIncrement = (user.streakDays === 0) || (user.lastActiveDate !== today);

    if (shouldIncrement) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = user.lastActiveDate === yesterday;
      // If streak was 0, start at 1. If consecutive, increment. If broken/gap, restart at 1.
      const newStreak = user.streakDays === 0 ? 1 : (isConsecutive ? user.streakDays + 1 : 1);
      const rank = getRankTitleForStreak(newStreak);

      const updatedUser: UserProfile = {
        ...user,
        streakDays: newStreak,
        lastActiveDate: today,
        rankTitle: rank
      };

      setUser(updatedUser);

      // Instant cloud sync to Firestore
      try {
        const targetId = getCanonicalStudentDocId(user);
        assertStudentOwnership(targetId);
        syncStudentProgressToCloud(targetId, {
          streakDays: newStreak,
          streak: newStreak,
          lastActiveDate: today,
          lastActive: 'الآن',
          rankTitle: rank,
          honorBadge: rank,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Real activity sync error:', err);
      }
    }
  }, [user]);

  // Auth Handlers
  const loginUser = (newUser: UserProfile) => {
    saveStudentSession(newUser);
    setUser(newUser);
    setIsAuthModalOpen(false);

    // If firebaseAuthUid is not already attached, establish it asynchronously
    if (!newUser.firebaseAuthUid) {
      ensureStudentFirebaseAuth()
        .then(async (authUid) => {
          if (authUid) {
            setUser((prev) => {
              if (!prev) return null;
              const enriched: UserProfile = { ...prev, firebaseAuthUid: authUid };
              saveStudentSession(enriched);
              return enriched;
            });
            await ensureStudentFirebaseIdentityPersisted();
          }
        })
        .catch((err) => {
          console.warn('[AppContext] Failed to establish Firebase Auth on login:', err);
        });
    } else {
      ensureStudentFirebaseIdentityPersisted().catch(() => {});
    }
  };

  const logoutUser = () => {
    const docId = user?.docId || user?.studentCode;
    clearStudentSession(docId);
    signOutStudentFirebaseAuth().catch((err) => {
      console.warn('[AppContext] Error signing out Firebase Auth on logout:', err);
    });
    setUser(null);
  };

  /**
   * Delete student account permanently from Firebase cloud and all local storage data,
   * then automatically redirect to login modal.
   */
  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    const currentUser = { ...user };

    // 1. Delete from Firebase Firestore cloud
    try {
      await deleteStudentAccountFromCloud(currentUser);
    } catch (cloudErr) {
      console.warn('Could not completely wipe from cloud:', cloudErr);
    }

    // 2. Remove all personal student information and progress from local storage
    try {
      clearStudentSession(currentUser.studentCode || currentUser.docId);
      signOutStudentFirebaseAuth().catch(() => {});
      localStorage.removeItem('bac240_tasks');
      localStorage.removeItem('bac240_today_date');
      localStorage.removeItem('bac240_today_minutes');
      localStorage.removeItem('bac240_mistakes_bank');
      localStorage.removeItem('bac240_flashcards');
      localStorage.removeItem('bac240_roadmap');
      localStorage.removeItem('bac240_time_blocks');
      localStorage.removeItem('bac240_dismissed_announcements');
      localStorage.removeItem('bac240_curriculum');
    } catch (localErr) {
      console.warn('Error clearing local storage upon deletion:', localErr);
    }

    // 3. Reset React states
    setUser(null);
    setTasks([]);
    setTodayStudyMinutes(0);
    setMistakes([]);
    setCurriculum(INITIAL_CURRICULUM);
    setRoadmap(INITIAL_ROADMAP);
    setTimeBlocks(INITIAL_TIME_BLOCKS);
    setFlashcards(INITIAL_FLASHCARDS);

    // 4. Force active tab to dashboard and open AuthModal for login
    setActiveTab('dashboard');
    setIsAuthModalOpen(true);
    setAuthInitialError('تم حذف حسابك وجميع بياناتك بنجاح من المنصة وقاعدة البيانات.');

    return true;
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...updates };
    saveStudentSession(updated);
    setUser(updated);

    try {
      const targetId = getCanonicalStudentDocId(updated);
      assertStudentOwnership(targetId);
      await syncStudentProgressToCloud(targetId, {
        fullName: updated.fullName,
        name: updated.fullName,
        governorate: updated.governorate,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.warn('Error syncing profile updates to cloud:', err);
      return false;
    }
  };

  // Re-synchronize curriculum from pristine official Syrian curriculum (preserves completed ticks)
  const resetCurriculumToOfficial = () => {
    setCurriculum(prev => {
      const completedSet = new Set<string>();
      prev.forEach(s => s.units?.forEach(u => u.lessons?.forEach(l => {
        if (l.completed) completedSet.add(`${s.id}-${u.id}-${l.id}`);
      })));

      const pristine = INITIAL_CURRICULUM.map(s => ({
        ...s,
        units: s.units.map(u => ({
          ...u,
          lessons: u.lessons.map(l => ({
            ...l,
            completed: completedSet.has(`${s.id}-${u.id}-${l.id}`)
          }))
        }))
      }));

      localStorage.setItem('bac240_curriculum', JSON.stringify(pristine));
      return pristine;
    });
  };

  // Helper to sync completed lessons array to Firestore (progress.completedLessons)
  const syncCompletedLessonsToCloud = (curr: Subject[]) => {
    const allCompletedLessons: string[] = [];
    curr.forEach(s => s.units.forEach(u => u.lessons.forEach(l => {
      if (l.completed) allCompletedLessons.push(`${s.id}:${u.id}:${l.id}`);
    })));

    const targetId = user?.docId || user?.studentCode || user?.id;
    if (targetId) {
      queueProgressSync(targetId, {
        'progress.completedLessons': allCompletedLessons,
        lastActivity: 'الآن',
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Curriculum logic
  const toggleLessonCompletion = (subjectId: SubjectId, unitId: string, lessonId: string) => {
    setCurriculum(prev => {
      const updated = prev.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          units: subj.units.map(unit => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              lessons: unit.lessons.map(lesson => {
                if (lesson.id !== lessonId) return lesson;
                const nextState = !lesson.completed;
                if (nextState) {
                  sound.playSuccess();
                  recordRealActivity();
                }
                return { ...lesson, completed: nextState };
              })
            };
          })
        };
      });

      syncCompletedLessonsToCloud(updated);
      return updated;
    });
  };

  const toggleUnitCompletion = (subjectId: SubjectId, unitId: string, markAllComplete: boolean) => {
    setCurriculum(prev => {
      let anyCompleted = false;
      const updated = prev.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          units: subj.units.map(unit => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              lessons: unit.lessons.map(lesson => {
                if (markAllComplete && !lesson.completed) anyCompleted = true;
                return { ...lesson, completed: markAllComplete };
              })
            };
          })
        };
      });

      if (anyCompleted) {
        sound.playSuccess();
        recordRealActivity();
      }

      syncCompletedLessonsToCloud(updated);
      return updated;
    });
  };

  const addLessonAttachment = (
    subjectId: SubjectId, 
    unitId: string, 
    lessonId: string, 
    attachment: Omit<LessonAttachment, 'id' | 'createdAt'>
  ) => {
    const newAttach: LessonAttachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setCurriculum(prev => {
      return prev.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          units: subj.units.map(unit => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              lessons: unit.lessons.map(lesson => {
                if (lesson.id !== lessonId) return lesson;
                const currentAtt = lesson.attachments || [];
                return { ...lesson, attachments: [...currentAtt, newAttach] };
              })
            };
          })
        };
      });
    });
  };

  const removeLessonAttachment = (
    subjectId: SubjectId, 
    unitId: string, 
    lessonId: string, 
    attachmentId: string
  ) => {
    setCurriculum(prev => {
      return prev.map(subj => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          units: subj.units.map(unit => {
            if (unit.id !== unitId) return unit;
            return {
              ...unit,
              lessons: unit.lessons.map(lesson => {
                if (lesson.id !== lessonId) return lesson;
                return {
                  ...lesson,
                  attachments: (lesson.attachments || []).filter(a => a.id !== attachmentId)
                };
              })
            };
          })
        };
      });
    });
  };

  // Curriculum Stats
  let totalLessonsCount = 0;
  let completedLessonsCount = 0;

  curriculum.forEach(sub => {
    sub.units.forEach(unit => {
      unit.lessons.forEach(les => {
        totalLessonsCount++;
        if (les.completed) completedLessonsCount++;
      });
    });
  });

  const overallProgressPercentage = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  // Study Plan Progress Stats
  const totalWeeksEstimated = planMeta?.totalWeeks || 36;
  const totalPlanTasksCount = totalWeeksEstimated * 21; // 21 tasks per week (3 periods x 7 days)
  const completedPlanTasksCount = Object.keys(completedTaskIds).length;
  const planProgressPercentage = totalPlanTasksCount > 0
    ? Math.min(100, Math.round((completedPlanTasksCount / totalPlanTasksCount) * 100))
    : 0;

  // Tasks logic
  const addTask = (title: string, subjectId: SubjectId, priority: 'high' | 'medium' | 'low', estimatedMinutes: number) => {
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title,
      subjectId,
      priority,
      estimatedMinutes,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      const allDone = updated.length > 0 && updated.every(t => t.completed);
      if (allDone) {
        triggerCelebration();
        recordRealActivity();
      } else {
        const justChecked = updated.find(t => t.id === id)?.completed;
        if (justChecked) sound.playTick();
      }
      return updated;
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearCompletedTasks = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const tasksCompletedCount = tasks.filter(t => t.completed).length;
  const tasksCompletedRatio = {
    completed: tasksCompletedCount,
    total: tasks.length,
    percentage: tasks.length > 0 ? Math.round((tasksCompletedCount / tasks.length) * 100) : 0
  };

  // Study timer records with complete cloud sync
  const recordStudySession = (minutes: number) => {
    const updatedTodayStudyMins = todayStudyMinutes + minutes;
    setTodayStudyMinutes(updatedTodayStudyMins);

    const today = new Date().toISOString().split('T')[0];
    let newStreak = user?.streakDays || 0;

    // Requirement: Streak increments if student studied >= 90 minutes (1.5 hours)
    const qualifiesForTimerStreak = updatedTodayStudyMins >= 90;

    if (user && qualifiesForTimerStreak) {
      const shouldIncrement = (user.streakDays === 0) || (user.lastActiveDate !== today);
      if (shouldIncrement) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = user.lastActiveDate === yesterday;
        newStreak = user.streakDays === 0 ? 1 : (isConsecutive ? user.streakDays + 1 : 1);
      }
    }
    const rank = getRankTitleForStreak(newStreak);
    const newTotalMinutes = (user?.totalStudyMinutes || 0) + minutes;
    const newTotalHours = Math.round(newTotalMinutes / 60);

    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        totalStudyMinutes: newTotalMinutes,
        streakDays: newStreak,
        lastActiveDate: qualifiesForTimerStreak ? today : user.lastActiveDate,
        rankTitle: rank
      };
      setUser(updatedUser);

      // Instant debounced cloud sync
      const targetId = user.docId || user.studentCode || user.id;
      if (targetId) {
        queueProgressSync(targetId, {
          totalStudyMinutes: newTotalMinutes,
          totalStudyHours: newTotalHours,
          streakDays: newStreak,
          lastActiveDate: qualifiesForTimerStreak ? today : user.lastActiveDate,
          lastActive: 'الآن',
          rankTitle: rank,
          honorBadge: rank,
          lastSessionMinutes: minutes,
          updatedAt: new Date().toISOString()
        });
      }
    }
  };

  // Global Study Timer State
  const [timerState, setTimerState] = useState<GlobalTimerState>(() => {
    return {
      isRunning: false,
      secondsLeft: 45 * 60,
      durationMinutes: 45,
      mode: 'focus'
    };
  });

  const startStudyTimer = useCallback((
    minutes: number = 45, 
    subjectId?: SubjectId, 
    topic?: string, 
    mode: 'focus' | 'short_break' | 'long_break' = 'focus'
  ) => {
    const mins = Math.max(1, Math.min(minutes, 180));
    setTimerState({
      isRunning: true,
      secondsLeft: mins * 60,
      durationMinutes: mins,
      mode,
      subjectId,
      topic,
      lastCompletedSession: null
    });
    sound.playTick();
  }, []);

  const pauseStudyTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false }));
    sound.playTick();
  }, []);

  const resumeStudyTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: true }));
    sound.playTick();
  }, []);

  const resetStudyTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      secondsLeft: prev.durationMinutes * 60
    }));
  }, []);

  const setTimerDurationMinutes = useCallback((minutes: number) => {
    setTimerState(prev => {
      if (prev.isRunning) return prev;
      const mins = Math.max(1, Math.min(minutes, 180));
      return {
        ...prev,
        durationMinutes: mins,
        secondsLeft: mins * 60
      };
    });
  }, []);

  const setTimerMode = useCallback((newMode: 'focus' | 'short_break' | 'long_break') => {
    setTimerState(prev => {
      if (prev.isRunning) return prev;
      let defaultMins = 45;
      if (newMode === 'short_break') defaultMins = 10;
      if (newMode === 'long_break') defaultMins = 20;
      return {
        ...prev,
        mode: newMode,
        durationMinutes: defaultMins,
        secondsLeft: defaultMins * 60
      };
    });
  }, []);

  // Global Timer Tick Interval Effect
  useEffect(() => {
    if (!timerState.isRunning) return;

    const interval = setInterval(() => {
      setTimerState(prev => {
        if (!prev.isRunning) return prev;
        if (prev.secondsLeft <= 1) {
          // Timer finished
          sound.playChime();
          if (prev.mode === 'focus') {
            recordStudySession(prev.durationMinutes);
            triggerCelebration();
            showToast(`أحسنت يا بطل! أتممت جلسة تركيز ${prev.durationMinutes} دقيقة وتم حفظها ومزامنتها سحابياً 🏆`);
          } else {
            showToast('انتهت فترة الاستراحة، حان وقت استئناف المذاكرة بكل تركيز!');
          }

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('منصة BAC - 240', {
              body: prev.mode === 'focus' 
                ? `أحسنت! أتممت جلسة تركيز لمدة ${prev.durationMinutes} دقيقة وتم حفظها ومزامنتها سحابياً.` 
                : 'انتهت فترة الاستراحة، حان وقت العودة للمذاكرة بكل عزيمة!'
            });
          }

          return {
            ...prev,
            isRunning: false,
            secondsLeft: 0,
            lastCompletedSession: {
              minutes: prev.durationMinutes,
              time: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })
            }
          };
        }
        return {
          ...prev,
          secondsLeft: prev.secondsLeft - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isRunning, recordStudySession, triggerCelebration, showToast]);

  // Flashcards
  const markFlashcardStatus = (id: string, status: 'mastered' | 'review') => {
    sound.playTick();
    setFlashcards(prev => prev.map(card => {
      if (card.id !== id) return card;
      return { ...card, status, lastReviewed: new Date().toISOString() };
    }));
  };

  const addCustomFlashcard = (card: Omit<Flashcard, 'id' | 'status'>) => {
    const newCard: Flashcard = {
      ...card,
      id: `custom-fc-${Date.now()}`,
      status: 'new',
      custom: true
    };
    setFlashcards(prev => [newCard, ...prev]);
  };

  const resetFlashcardSession = () => {
    setFlashcards(prev => prev.map(c => ({ ...c, status: 'new' })));
  };

  // Videos
  const toggleVideoWatched = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, isWatched: !v.isWatched } : v));
  };

  const toggleVideoFavorite = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, isFavorite: !v.isFavorite } : v));
  };

  const updateVideoNotes = (id: string, notes: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, notes } : v));
  };

  const addStudentVideoAttachment = (videoId: string, attachment: Omit<VideoAttachment, 'id' | 'addedAt' | 'addedBy'>) => {
    const newAttach: VideoAttachment = {
      ...attachment,
      id: `att-student-${Date.now()}`,
      addedBy: 'student',
      addedAt: new Date().toISOString()
    };

    setVideos(prev => prev.map(v => {
      if (v.id !== videoId) return v;
      const current = v.studentAttachments || [];
      return { ...v, studentAttachments: [...current, newAttach] };
    }));

    if (activeTheaterVideo && activeTheaterVideo.id === videoId) {
      setActiveTheaterVideo(prev => {
        if (!prev) return null;
        const current = prev.studentAttachments || [];
        return { ...prev, studentAttachments: [...current, newAttach] };
      });
    }
  };

  const removeStudentVideoAttachment = (videoId: string, attachmentId: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id !== videoId) return v;
      const current = v.studentAttachments || [];
      return { ...v, studentAttachments: current.filter(a => a.id !== attachmentId) };
    }));

    if (activeTheaterVideo && activeTheaterVideo.id === videoId) {
      setActiveTheaterVideo(prev => {
        if (!prev) return null;
        const current = prev.studentAttachments || [];
        return { ...prev, studentAttachments: current.filter(a => a.id !== attachmentId) };
      });
    }
  };

  const addCustomVideo = ({ url, title, teacherName, subjectId, category }: {
    url: string;
    title: string;
    teacherName: string;
    subjectId: SubjectId;
    category: EducationalVideo['category'];
  }) => {
    // Extract video ID from youtube url
    let videoId = 'dQw4w9WgXcQ';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }

    const newVideo: EducationalVideo = {
      id: `custom-vid-${Date.now()}`,
      youtubeId: videoId,
      title: title || 'درس يوتيوب مضاف',
      teacherName: teacherName || 'مدرس خاص',
      subjectId,
      category,
      durationMinutes: 45
    };
    setVideos(prev => [newVideo, ...prev]);
  };

  // Library
  const toggleBookmark = (id: string) => {
    setLibraryDocs(prev => prev.map(doc => doc.id === id ? { ...doc, isBookmarked: !doc.isBookmarked } : doc));
  };

  const addCustomDocument = (doc: Omit<LibraryDocument, 'id' | 'isBookmarked'>) => {
    const newDoc: LibraryDocument = {
      ...doc,
      id: `custom-doc-${Date.now()}`,
      isBookmarked: true,
      isCustom: true
    };
    setLibraryDocs(prev => [newDoc, ...prev]);
  };

  // Roadmap & Planner
  const toggleRoadmapItem = (milestoneId: string, checklistId: string) => {
    setRoadmap(prev => prev.map(m => {
      if (m.id !== milestoneId) return m;
      return {
        ...m,
        checklist: m.checklist.map(item => {
          if (item.id !== checklistId) return item;
          const next = !item.completed;
          if (next) sound.playTick();
          return { ...item, completed: next };
        })
      };
    }));
  };

  const addTimeBlock = (block: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      ...block,
      id: `tb-${Date.now()}`
    };
    setTimeBlocks(prev => [...prev, newBlock].sort((a, b) => a.startHour - b.startHour));
  };

  const removeTimeBlock = (id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
  };

  // Announcements
  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncementIds(prev => [...prev, id]);
  };

  const restoreAnnouncements = () => {
    setDismissedAnnouncementIds([]);
  };

  // Mistake Bank methods
  const addMistake = (item: Omit<MistakeRecord, 'id' | 'addedAt' | 'isResolved'>) => {
    const newRecord: MistakeRecord = {
      ...item,
      id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      addedAt: new Date().toISOString(),
      isResolved: false
    };

    setMistakes(prev => {
      const existsIdx = prev.findIndex(m => m.examId === newRecord.examId && m.questionText === newRecord.questionText);
      if (existsIdx >= 0) {
        const copy = [...prev];
        copy[existsIdx] = { ...copy[existsIdx], ...newRecord, id: copy[existsIdx].id };
        return copy;
      }
      return [newRecord, ...prev];
    });
    sound.playTick();
  };

  const resolveMistake = (id: string) => {
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, isResolved: !m.isResolved } : m));
    sound.playSuccess();
  };

  const deleteMistake = (id: string) => {
    setMistakes(prev => prev.filter(m => m.id !== id));
  };

  const updateMistakeNote = (id: string, note: string) => {
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, studentNote: note } : m));
  };

  // AI Agent Function Calling Dispatcher
  const executeAIToolAction = useCallback(async (toolName: string, args: any): Promise<AIToolAction> => {
    switch (toolName) {
      case 'complete_plan_task': {
        const title = args.taskTitle || args.title || 'مهمة دراسية';
        const isCompleted = args.isCompleted !== false;
        const res = await completePlanTaskByTitleOrId(args.taskId || title, isCompleted);
        const actionTitle = isCompleted ? `تعليم المهمة: «${res.taskTitle}» كمنجزة ✅` : `إلغاء إنجاز: «${res.taskTitle}»`;
        showToast(actionTitle);
        return {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          toolName: 'complete_plan_task',
          title: actionTitle,
          description: isCompleted ? 'تم توثيق إنجاز المهمة ومزامنتها سحابياً في حسابك ورفع نسبة الإنجاز في Firebase.' : 'تم تعديل حالة المهمة في الخطة.',
          status: 'executed',
          actionPayload: { taskId: res.taskId, taskTitle: res.taskTitle, isCompleted, targetTab: 'plan' }
        };
      }

      case 'navigate_to_section': {
        const sec = args.section as NavTab;
        const reason = args.reason || '';
        setActiveTab(sec);
        sound.playTick();
        const tabLabels: Record<string, string> = {
          mistakeBank: 'بنك الأخطاء وتأصيل النماذج',
          writtenExams: 'الامتحانات التحريرية وسلالم التصحيح',
          plan: 'الخطة الدراسية الأسبوعية',
          mindmaps: 'الخرائط الذهنية السحابية',
          flashcards: 'بطاقات الاستذكار النشط',
          timer: 'مؤقت المذاكرة والتركيز',
          curriculum: 'فهرس المنهاج الوزاري 2026',
          youtube: 'المكتبة المرئية وقنوات الأساتذة',
          challenge: 'تحدي الاستمرارية وقائمة الشرف',
          journey: 'سجل الإنجاز والمسار التراكمي',
          community: 'سحابة المجتمع والملفات',
          profile: 'الملف الشخصي والإعدادات',
          dashboard: 'لوحة التحكم والمتابعة',
          tools: 'الأدوات العلمية والمعادلات'
        };
        const label = tabLabels[sec] || sec;
        showToast(`🚀 تم نقلك إلى: ${label}`);
        return {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          toolName: 'navigate_to_section',
          title: `الانتقال إلى: ${label}`,
          description: reason || `تم الانتقال المباشر إلى قسم ${label} لتسهيل وصولك للمحتوى.`,
          status: 'executed',
          actionPayload: { targetTab: sec }
        };
      }

      case 'add_to_mistake_bank': {
        const subjectId = args.subjectId || aiSelectedSubjectId || 'physics';
        const questionText = args.questionText || 'مسألة تدريبية';
        const correctionLadder = args.correctionLadder || 'الانتباه للخطوات والواحدات وتوزيع الدرجات الوزاري.';
        const studentNote = args.studentNote || 'تجنب التسرع ومراعاة شروط المنهاج الوزاري.';
        const mistakeType = args.mistakeType === 'partial' ? 'partial' : 'wrong';
        const examTitle = args.examTitle || 'مذاكرة الذكاء الأكاديمي';

        addMistake({
          examId: `ai_exam_${Date.now()}`,
          examTitle,
          subjectId,
          questionText,
          correctionLadder,
          studentNote,
          mistakeType
        });
        showToast('📕 تمت إضافة المسألة إلى بنك الأخطاء مع سلّم التصحيح');
        return {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          toolName: 'add_to_mistake_bank',
          title: `إضافة لبنك الأخطاء: ${questionText.length > 55 ? questionText.substring(0, 55) + '...' : questionText}`,
          description: 'تم توثيق سلّم التصحيح ونقاط الفخاخ الوزارية وتوجيه الطالب، والمزامنة مع بنك الأخطاء السحابي.',
          status: 'executed',
          actionPayload: { subjectId, targetTab: 'mistakeBank' }
        };
      }

      case 'start_study_timer': {
        const durationMinutes = Number(args.durationMinutes) || 45;
        const subjectId = args.subjectId || aiSelectedSubjectId;
        const topic = args.topic;
        const mode = (args.mode === 'short_break' || args.mode === 'long_break') ? args.mode : 'focus';

        startStudyTimer(durationMinutes, subjectId, topic, mode);
        showToast(`⏱️ تم تشغيل مؤقت المذاكرة والتركيز (${durationMinutes} دقيقة)`);
        return {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          toolName: 'start_study_timer',
          title: `تشغيل مؤقت المذاكرة: ${durationMinutes} دقيقة ${topic ? `(موضوع: ${topic})` : ''}`,
          description: 'المؤقت بدأ بالعد التنازلي الآن، وسيتم احتساب الجلسة وإضافتها لساعات دراستك وتحديث شعلة الالتزام تلقائياً ⏳',
          status: 'executed',
          actionPayload: { durationMinutes, targetTab: 'timer' }
        };
      }

      case 'create_flashcards': {
        const subjectId = args.subjectId || aiSelectedSubjectId || 'physics';
        const deckTitle = args.deckTitle || 'بطاقات استذكار نشط';
        const rawCards = Array.isArray(args.cards) ? args.cards : [];

        rawCards.forEach((c: any) => {
          if (c.question && c.answer) {
            addCustomFlashcard({
              subjectId,
              question: c.question,
              answer: c.answer,
              hint: c.hint,
              deckTitle,
              custom: true
            });
          }
        });

        const count = rawCards.length;
        showToast(`🗂️ تم حفظ ${count} بطاقة استذكار نشط في حسابك`);
        return {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          toolName: 'create_flashcards',
          title: `توليد ${count} بطاقة استذكار نشط (${deckTitle})`,
          description: 'تم حفظ البطاقات في قسم بطاقات الاستذكار بحسابك، ويمكنك التدرب عليها بأسلوب التكرار المتباعد 🧠',
          status: 'executed',
          actionPayload: { count, targetTab: 'flashcards' }
        };
      }

      default:
        return {
          id: `act_${Date.now()}`,
          toolName: toolName as any,
          title: `إجراء ذكي: ${toolName}`,
          description: 'تم تنفيذ الإجراء المطلوب.',
          status: 'executed'
        };
    }
  }, [
    completePlanTaskByTitleOrId, 
    setActiveTab, 
    aiSelectedSubjectId, 
    addMistake, 
    startStudyTimer, 
    addCustomFlashcard, 
    showToast
  ]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        exams,
        mistakes,
        addMistake,
        resolveMistake,
        deleteMistake,
        updateMistakeNote,
        user,
        deviceId,
        authInitialError,
        setAuthInitialError,
        loginUser,
        logoutUser,
        deleteAccount,
        updateUserProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        platformStatus,
        planMeta,
        selectedPlanWeekIndex,
        setSelectedPlanWeekIndex,
        completedTaskIds,
        toggleTaskCompletion,
        setTaskCompletionStatus,
        completePlanTaskByTitleOrId,
        fetchPlanWeek,
        totalPlanTasksCount,
        completedPlanTasksCount,
        planProgressPercentage,
        announcements,
        dismissedAnnouncementIds,
        dismissAnnouncement,
        restoreAnnouncements,
        curriculum,
        resetCurriculumToOfficial,
        toggleLessonCompletion,
        toggleUnitCompletion,
        addLessonAttachment,
        removeLessonAttachment,
        totalLessonsCount,
        completedLessonsCount,
        overallProgressPercentage,
        countdowns,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        clearCompletedTasks,
        tasksCompletedRatio,
        todayStudyMinutes,
        recordStudySession,
        timerState,
        startStudyTimer,
        pauseStudyTimer,
        resumeStudyTimer,
        resetStudyTimer,
        setTimerDurationMinutes,
        setTimerMode,
        executeAIToolAction,
        flashcards,
        flashcardDecks,
        markFlashcardStatus,
        addCustomFlashcard,
        resetFlashcardSession,
        videos,
        channels,
        playlists,
        activeTheaterVideo,
        setActiveTheaterVideo,
        toggleVideoWatched,
        toggleVideoFavorite,
        updateVideoNotes,
        addStudentVideoAttachment,
        removeStudentVideoAttachment,
        addCustomVideo,
        libraryDocs,
        toggleBookmark,
        addCustomDocument,
        roadmap,
        toggleRoadmapItem,
        timeBlocks,
        addTimeBlock,
        removeTimeBlock,
        mindmaps,
        curriculumKnowledge,
        getLessonKnowledge,
        leaderboard,
        isMobilePagesOpen,
        setIsMobilePagesOpen,
        isRadialDialOpen,
        setIsRadialDialOpen,
        theme,
        setTheme,
        toggleTheme,
        isUltraDarkMode,
        setIsUltraDarkMode,
        triggerCelebration,
        toastMessage,
        showToast,
        aiChatMessages,
        setAiChatMessages,
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
        openAiChatWithTask,
        activeVideoForAI,
        setActiveVideoForAI,
        startAIChatWithVideo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
