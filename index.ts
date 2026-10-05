export type SubjectId = 
  | 'math1' 
  | 'math2' 
  | 'physics' 
  | 'chemistry' 
  | 'biology' 
  | 'arabic' 
  | 'english' 
  | 'french' 
  | 'islamic';

export type TaskStudyMode = 'problem_solving' | 'memorization' | 'concept_reading' | 'revision';
export type ExamWeight = 'critical_major' | 'standard_question' | 'foundational';

export interface TaskAttachment {
  id: string;
  type: 'telegram' | 'summary' | 'video' | 'flashcards' | 'mindmap' | 'exam' | 'external_link';
  title: string;
  url: string;
  isEssential?: boolean; // مرفق أساسي للإتقان vs إثرائي اختياري
}

export interface PlanTask {
  id: string;
  subjectId: SubjectId;
  title: string;
  unitName?: string;
  estimatedMinutes: number;
  
  // الخيارات الأكاديمية المتقدمة:
  textbookPages?: string;           // مثال: "كتاب الجزء 1: صـ 24 - 28"
  studyMode?: TaskStudyMode;        // نمط الحل: حل باليد، حفظ، قراءة، مراجعة
  examWeight?: ExamWeight;          // الثقل الوزاري: علامة كبرى، تعليل، تأسيسي
  pitfallWarning?: string;          // فخ امتحاني شائع من الأستاذ المشرف
  
  attachments: TaskAttachment[];
  isDeprecated?: boolean;
  order: number;
}

export interface PlanDay {
  dayIndex: number; // 1: السبت .. 7: الجمعة
  dayName: string;
  isBufferDay?: boolean;            // صحيح ليوم الجمعة (استدراك واختبار)
  dayTip?: string;                  // همسة وتوجيه اليوم
  bestTimeSlot?: 'morning' | 'evening' | 'flexible'; // التوقيت الأنسب
  tasks: PlanTask[];
}

export interface PlanWeek {
  id: string;                       // مثل: 'bac240_w4'
  weekIndex: number;
  monthName: string;
  weekTitle: string;
  focusSummary?: string;
  milestoneBadge?: string;          // مثل: "معسكر النواسات والأمواج ⚡"
  voiceBriefUrl?: string;           // رابط تسجيل صوتي توجيهي من المشرف
  linkedExamId?: string;            // معرف النموذج الامتحاني في كولكشن exams
  days: PlanDay[];
  totalMinutes: number;
  totalTasksCount: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface PlanMetadata {
  id: string;
  title: string;
  totalWeeks: number;
  currentCalendarWeek: number;
  isFreeNavigationEnabled: boolean;
  isPublished: boolean;
  updatedAt: string;
}

export interface LessonAttachment {
  id: string;
  title: string;
  type: 'pdf' | 'drive' | 'telegram' | 'note';
  url?: string;
  content?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  name: string;
  completed: boolean;
  inProgress?: boolean;
  notes?: string;
  attachments?: LessonAttachment[];
}

export interface Unit {
  id: string;
  unit_name: string;
  lessons: Lesson[];
}

export interface Subject {
  id: SubjectId;
  name: string;
  nameEn: string;
  maxScore: number;
  icon: string;
  color: string;
  gradient: string;
  units: Unit[];
}

export interface DailyTask {
  id: string;
  title: string;
  subjectId: SubjectId;
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  completed: boolean;
  date: string;
}

export interface Flashcard {
  id: string;
  subjectId: SubjectId;
  question: string;
  answer: string;
  hint?: string;
  status: 'new' | 'mastered' | 'review';
  lastReviewed?: string;
  custom?: boolean;
  deckId?: string;
  deckTitle?: string;
  unit?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: SubjectId | string;
  subjectId: SubjectId;
  unit?: string;
  cardsCount?: number;
  cards?: Flashcard[];
  isPublished?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface YouTubeChannel {
  id: string;
  channelName: string;
  teacherName?: string;
  channelUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  subject?: SubjectId | string;
  description?: string;
  addedAt?: any;
}

export interface YouTubePlaylist {
  id: string;
  channelId: string;
  playlistName: string;
  videoIds?: string[];
  addedAt?: any;
}

export interface VideoAttachment {
  id: string;
  title: string;
  url: string;
  type?: 'pdf' | 'summary' | 'ladder' | 'image' | 'link';
  fileSize?: string;
  addedBy?: 'admin' | 'student';
  addedAt?: string;
}

export interface EducationalVideo {
  id: string;
  youtubeId: string;
  title: string;
  teacherName: string;
  subjectId: SubjectId;
  category: 'explanation' | 'problem_solving' | 'intensive' | 'exam_review';
  durationMinutes: number;
  duration?: string | number;
  isWatched?: boolean;
  isFavorite?: boolean;
  notes?: string;
  channelId?: string;
  playlistId?: string;
  unit?: string;
  lesson?: string;
  isFeatured?: boolean;
  description?: string;
  attachments?: VideoAttachment[];
  studentAttachments?: VideoAttachment[];
}

export interface LibraryDocument {
  id: string;
  title: string;
  subjectId: SubjectId;
  type: 'automated_model' | 'summary' | 'correction_ladder' | 'exam_archive' | 'teacher_notes';
  teacherOrSource: string;
  year?: string;
  url: string;
  fileSize?: string;
  isBookmarked?: boolean;
  isCustom?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'urgent' | 'important' | 'normal';
  author: string;
  isActive: boolean;
}

export interface ExamCountdown {
  id: string;
  title: string;
  examDate: string; // ISO string or date string
  subject?: SubjectId | string;
  notes?: string;
  isMain?: boolean;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  docId?: string;
  fullName: string;
  phoneNumber: string;
  governorate: string; // المحافظة
  studentCode: string; // e.g. BAC-8492-4102-9912
  deviceId: string;
  registeredAt: string;
  status: 'active' | 'disabled' | 'suspended' | 'inactive';
  streakDays: number;
  lastActiveDate: string;
  totalStudyMinutes: number;
  rankTitle: string;
  completedLessonsCount: number;
  completedTaskIds?: Record<string, string>;
  /** Firebase Auth anonymous UID for backend rules integration */
  firebaseAuthUid?: string;
}

/**
 * Canonical Student Session Model for BAC-240 frontend.
 * Provides the unified boundary representation of the currently authenticated student.
 */
export interface StudentSession {
  /** Canonical student identifier (e.g. STU-240-xxxx) */
  studentId: string;
  /** Primary Firestore document ID in 'students' collection */
  docId: string;
  /** Student activation / voucher code */
  studentCode: string;
  /** Normalized Syrian phone number (09xxxxxxxx) */
  phoneNumber: string;
  /** Bound hardware/browser device fingerprint */
  deviceId: string;
  /** Student full display name */
  fullName: string;
  /** Syrian Governorate / region */
  governorate: string;
  /** Whether the session is currently authenticated */
  authenticated: boolean;
  /** Timestamp of registration or session creation (ISO) */
  registeredAt?: string;
  /** Technical Firebase Auth UID for future Security Rules */
  firebaseAuthUid?: string;
}

export interface TimeBlock {
  id: string;
  startHour: number; // 0-23
  endHour: number;
  title: string;
  type: 'study' | 'sleep' | 'school' | 'break' | 'exercise';
  subjectId?: SubjectId;
  dayOfWeek?: string;
  notes?: string;
  isOfficial?: boolean;
}

export interface MindMap {
  id: string;
  title: string;
  subjectId: SubjectId;
  unit?: string;
  content?: string; // Markdown hierarchical content (#, ##, ###, -)
  imageUrl?: string;
  pdfUrl?: string;
  description?: string;
  author?: string;
  createdAt?: string;
}

export interface RoadmapMilestone {
  id: string;
  phase: string;
  months: string;
  description: string;
  checklist: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  mindMapUrl?: string;
  order?: number;
}

export interface ExamQuestion {
  id: string;
  questionNumber?: number;
  questionText: string;
  imageUrl?: string;
  score: number;
  correctionLadder: string;
  ladderImageUrl?: string;
  notebookLmNotebookUrl?: string;
  hints?: string;
}

export interface WrittenExam {
  id: string;
  title: string;
  subjectId: SubjectId;
  description?: string;
  durationMinutes: number;
  totalScore: number;
  questionsCount?: number;
  questions: ExamQuestion[];
  isPublished: boolean;
  notebookLmNotebookUrl?: string;     // رابط مفكرة المادة في NotebookLM للأستاذ محمود
  audioOverviewUrl?: string;          // بودكاست صوتي لتحليل أخطاء وفخاخ الاختبار
  createdAt?: any;
}

export interface MistakeRecord {
  id: string;
  examId: string;
  examTitle: string;
  subjectId: SubjectId;
  questionText: string;
  imageUrl?: string;
  correctionLadder: string;
  ladderImageUrl?: string;
  studentNote?: string;               // سبب الخطأ الذي كتبه الطالب بيده
  mistakeType: 'partial' | 'wrong';   // جزئي أو خطأ كامل
  notebookLmNotebookUrl?: string;     // رابط مفكرة المادة للأستاذ محمود
  addedAt: string;
  isResolved: boolean;                // هل تم استدراك الخطأ لاحقاً؟
}

export interface PlatformStatus {
  isPlatformOpen: boolean;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  expectedReopenAt?: string;
  emergencyContact?: string;
  updatedAt?: any;
}

export interface CurriculumKnowledgeItem {
  id: string; // e.g. "physics_elastic_pendulum"
  subjectId: SubjectId;
  subjectName: string;
  unitId: string;
  unitName: string;
  lessonId: string;
  lessonName: string;
  officialLaws: string;
  rubricTraps: string;
  keyConcepts: string;
  fullContent?: string;
  updatedAt: string;
  isPublished?: boolean;
}

export type AIToolName = 
  | 'complete_plan_task' 
  | 'navigate_to_section' 
  | 'add_to_mistake_bank' 
  | 'start_study_timer' 
  | 'create_flashcards';

export interface AIToolAction {
  id: string;
  toolName: AIToolName;
  title: string;
  description: string;
  status: 'executed' | 'pending' | 'failed';
  badgeIcon?: string;
  actionPayload?: any;
}

export interface VideoContextPayload {
  videoId?: string;
  youtubeId: string;
  title: string;
  teacherName?: string;
  subjectId?: SubjectId;
  subjectName?: string;
  lessonName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  autoExplainPrompt?: string;
  autoAnalysisPrompt?: string;
}

export interface AIPerformanceMetrics {
  ttftMs?: number; // Time to first token (ms)
  totalDurationMs?: number; // Total generation latency (ms)
  tokensPerSec?: number; // Estimated generation speed (tokens/second)
  usedModel?: string; // Model name used (e.g. gemini-3.8-flash)
  isCached?: boolean; // Loaded from instant local smart cache (0ms)
  source?: 'stream' | 'cache' | 'standard';
  cacheKey?: string;
  charCount?: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  subjectName?: string;
  lessonName?: string;
  taskTitle?: string;
  rubricWarning?: string;
  toolActions?: AIToolAction[];
  imageUrl?: string;
  imageMimeType?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: 'image' | 'pdf' | 'document' | 'text';
  videoContext?: VideoContextPayload;
  isTruncated?: boolean;
  isStreaming?: boolean;
  metrics?: AIPerformanceMetrics;
}

