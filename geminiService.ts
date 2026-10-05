import { 
  CurriculumKnowledgeItem, 
  AIToolAction, 
  VideoContextPayload, 
  EducationalVideo, 
  YouTubeChannel,
  AIPerformanceMetrics 
} from '../types';
import { AICacheService } from './aiCache';

const API_KEY_STORAGE_KEY = 'bac240_student_gemini_api_key';
export const SELECTED_MODEL_STORAGE_KEY = 'bac240_selected_gemini_model';

export interface GeminiModelOption {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
}

export const SUPPORTED_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'gemini-3.8-flash',
    badge: '⚡ 3.8 Flash',
    icon: '⚡',
    description: 'الافتراضي - سرعة فائقة وتوازن عالي'
  },
  {
    id: 'gemini-3.5-flash',
    name: 'gemini-3.5-flash',
    badge: '🚀 3.5 Flash',
    icon: '🚀',
    description: 'خفيف وسريع لشبكات الإنترنت الضعيفة'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'gemini-3-flash-preview',
    badge: '✨ 3 Flash Preview',
    icon: '✨',
    description: 'النسخة التجريبية الأحدث'
  },
  {
    id: 'gemini-3.1-pro',
    name: 'gemini-3.1-pro',
    badge: '🧠 3.1 Pro',
    icon: '🧠',
    description: 'التفكير العميق للمسائل الرياضية والفيزيائية المعقدة'
  }
];

// Preferred models for STEM reasoning & ultra-fast Syrian curriculum Q&A
const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.7-flash'
];

export const AI_AGENT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'complete_plan_task',
        description: 'تعليم مهمة أو درس في الخطة الدراسية كـ منجزة (أو غير منجزة) وحفظها ومزامنتها سحابياً في حساب الطالب على Firebase. استدعِ هذه الدالة عندما يقول الطالب إنه أنهى دراسة مهمة أو درس، أو يطلب وضع علامة إنجاز عليها.',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskTitle: {
              type: 'STRING',
              description: 'عنوان المهمة الدراسية أو الدرس المراد تعليمه كمنجز (مثال: "النواس المرن - استنتاج السرعة والتسارع" أو "الأعداد العقدية")'
            },
            taskId: {
              type: 'STRING',
              description: 'المعرف الفريد للمهمة إن كان معروفاً من سياق الخطة المرفق'
            },
            isCompleted: {
              type: 'BOOLEAN',
              description: 'true لتعليم المهمة كمنجزة (القيمة الافتراضية)، أو false لإلغاء الإنجاز'
            }
          },
          required: ['taskTitle']
        }
      },
      {
        name: 'navigate_to_section',
        description: 'التنقل التلقائي والفوري بين أقسام وشاشات منصة BAC - 240. استدعِ هذه الدالة عندما يطلب الطالب فتح أو الانتقال إلى قسم مثل بنك الأخطاء، الامتحانات، الخريطة الذهنية، الخطة الدراسية، البطاقات، مؤقت المذاكرة، وغيرها.',
        parameters: {
          type: 'OBJECT',
          properties: {
            section: {
              type: 'STRING',
              enum: [
                'mistakeBank',
                'writtenExams',
                'plan',
                'mindmaps',
                'flashcards',
                'timer',
                'curriculum',
                'youtube',
                'challenge',
                'journey',
                'community',
                'profile',
                'dashboard',
                'tools'
              ],
              description: 'القسم المستهدف: mistakeBank (بنك الأخطاء), writtenExams (الامتحانات وسلالم التصحيح), plan (الخطة الأسبوعية), mindmaps (الخرائط الذهنية), flashcards (بطاقات الاستذكار), timer (مؤقت بومودورو), curriculum (المنهاج), youtube (المكتبة المرئية), challenge (تحدي الاستمرارية), tools (الأدوات العلمية), profile (الملف الشخصي)'
            },
            reason: {
              type: 'STRING',
              description: 'سبب التنقل التوجيهي ليظهر للطالب في الرسالة'
            }
          },
          required: ['section']
        }
      },
      {
        name: 'add_to_mistake_bank',
        description: 'إضافة مسألة أو سؤال أخطأ فيه الطالب إلى "بنك الأخطاء" الخاص به تلقائياً مع توثيق سلّم التصحيح الوزاري المعتمد وتوضيح سبب الخطأ لتفادي تكراره.',
        parameters: {
          type: 'OBJECT',
          properties: {
            subjectId: {
              type: 'STRING',
              enum: ['physics', 'chemistry', 'biology', 'math1', 'math2', 'arabic', 'english', 'french', 'islamic'],
              description: 'المادة الدراسية التي وقع فيها الخطأ'
            },
            questionText: {
              type: 'STRING',
              description: 'نص المسألة أو السؤال كاملاً'
            },
            correctionLadder: {
              type: 'STRING',
              description: 'سلّم التصحيح والحل النموذجي المعتمد خطوة بخطوة وتوزيع الدرجات مع التنبيه الوزاري'
            },
            studentNote: {
              type: 'STRING',
              description: 'توجيه ونصيحة للطالب عن سبب الوقوع في هذا الفخ الامتحاني وكيف يتفاداه في ورقة الامتحان'
            },
            mistakeType: {
              type: 'STRING',
              enum: ['wrong', 'partial'],
              description: 'نوع الهفوة: wrong (خطأ كامل) أو partial (هفوة جزئية أو نقص واحدات/إشارات)'
            },
            examTitle: {
              type: 'STRING',
              description: 'عنوان الاختبار أو الدرس التابع له (مثال: "مسألة نواس مرن دورة 2024")'
            }
          },
          required: ['subjectId', 'questionText', 'correctionLadder', 'studentNote']
        }
      },
      {
        name: 'start_study_timer',
        description: 'تشغيل مؤقت بومودورو الدراسي (Study Timer) وجلسة التركيز تلقائياً وتحديد مدتها بالدقائق والمادة، لتحفيز الطالب على بدء المذاكرة فوراً.',
        parameters: {
          type: 'OBJECT',
          properties: {
            durationMinutes: {
              type: 'NUMBER',
              description: 'مدة جلسة المذاكرة بالدقائق (مثال: 25، 45، 60 دقيقة)'
            },
            subjectId: {
              type: 'STRING',
              enum: ['physics', 'chemistry', 'biology', 'math1', 'math2', 'arabic', 'english', 'french', 'islamic'],
              description: 'المادة الدراسية المستهدفة'
            },
            topic: {
              type: 'STRING',
              description: 'عنوان الدرس أو المهمة المراد التركيز عليها أثناء الجلسة'
            },
            mode: {
              type: 'STRING',
              enum: ['focus', 'short_break', 'long_break'],
              description: 'نمط الجلسة: focus (جلسة مذاكرة)، short_break (استراحة قصيرة)، long_break (استراحة طويلة)'
            }
          },
          required: ['durationMinutes']
        }
      },
      {
        name: 'create_flashcards',
        description: 'توليد وحفظ بطاقات استذكار نشط (Flashcards) تلقائياً في حساب الطالب، مخصصة لقوانين أو تعاليل أو تعاريف أو مقارنات الدرس للمراجعة السريعة.',
        parameters: {
          type: 'OBJECT',
          properties: {
            subjectId: {
              type: 'STRING',
              enum: ['physics', 'chemistry', 'biology', 'math1', 'math2', 'arabic', 'english', 'french', 'islamic'],
              description: 'المادة التابعة لها البطاقات'
            },
            deckTitle: {
              type: 'STRING',
              description: 'عنوان حزمة البطاقات (مثال: "قوانين النواس المرن الأساسية")'
            },
            cards: {
              type: 'ARRAY',
              description: 'قائمة بطاقات الاستذكار المولدة',
              items: {
                type: 'OBJECT',
                properties: {
                  question: {
                    type: 'STRING',
                    description: 'السؤال أو القانون أو التعليل المطلوب على وجه البطاقة'
                  },
                  answer: {
                    type: 'STRING',
                    description: 'الإجابة النموذجية أو الصيغة الرياضية على ظهر البطاقة وفق المنهاج السوري'
                  },
                  hint: {
                    type: 'STRING',
                    description: 'تلميح ذهني ذكي أو مفتاح للتذكر'
                  }
                },
                required: ['question', 'answer']
              }
            }
          },
          required: ['subjectId', 'cards']
        }
      }
    ]
  }
];

export interface PlanContextInfo {
  currentWeekIndex: number;
  monthName: string;
  weekTitle?: string;
  milestoneBadge?: string;
  todayName: string;
  todayTasks: {
    id?: string;
    title: string;
    subjectId: string;
    textbookPages?: string;
    studyMode?: string;
    examWeight?: string;
    isCompleted: boolean;
  }[];
  selectedTask?: {
    id?: string;
    title: string;
    subjectId: string;
    textbookPages?: string;
    studyMode?: string;
    examWeight?: string;
    isCompleted: boolean;
  } | null;
  completedTasksCount: number;
  totalTasksCount: number;
  progressPercentage: number;
  streakDays: number;
  totalStudyMinutes: number;
  recentMistakesCount?: number;
}

export interface AttachedDocumentPayload {
  data: string; // base64 payload
  mimeType: string;
  fileName?: string;
  fileSize?: number;
  category?: 'pdf' | 'image' | 'text';
}

export interface AskGeminiParams {
  apiKey: string;
  subjectName: string;
  lessonName: string;
  knowledgeItem?: CurriculumKnowledgeItem | null;
  question: string;
  imageAttachment?: {
    data: string; // base64 payload
    mimeType: string;
  } | null;
  documentAttachment?: AttachedDocumentPayload | null;
  chatHistory?: { role: 'user' | 'assistant'; content: string; imageUrl?: string; fileName?: string; fileType?: string }[];
  planContext?: PlanContextInfo | null;
  toolsExecutor?: (toolName: string, args: any) => Promise<AIToolAction>;
  selectedModel?: string;
  videoContext?: VideoContextPayload | null;
  platformVideos?: EducationalVideo[];
  platformChannels?: YouTubeChannel[];
  explanationMode?: 'notebook' | 'dialogue';
  onChunk?: (streamedText: string) => void;
  signal?: AbortSignal;
}

export interface AskGeminiResult {
  reply: string;
  toolActions?: AIToolAction[];
  rubricWarning?: string;
  isTruncated?: boolean;
  usedModel?: string;
  error?: string;
  metrics?: AIPerformanceMetrics;
}

export class GeminiService {
  /**
   * Retrieves the student's selected Gemini model from local storage
   */
  static getStoredModel(): string {
    if (typeof window === 'undefined') return 'gemini-3.8-flash';
    try {
      return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  }

  /**
   * Persists the student's preferred Gemini model
   */
  static storeSelectedModel(modelId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, modelId);
    } catch (e) {
      console.warn('Failed to save selected model to localStorage', e);
    }
  }

  /**
   * Retrieves the student's saved API key from local storage
   */
  static getStoredApiKey(): string {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  /**
   * Persists the student's API key cleanly
   */
  static storeApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      const cleanKey = key.trim().replace(/^["']|["']$/g, '');
      localStorage.setItem(API_KEY_STORAGE_KEY, cleanKey);
    } catch (e) {
      console.warn('Failed to save API key to localStorage', e);
    }
  }

  /**
   * Clears the student's API key
   */
  static clearApiKey(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch {}
  }

  /**
   * Fetches real YouTube video metadata (title, author/channel, thumbnail) in real-time
   */
  static async fetchYouTubeMetadata(youtubeIdOrUrl: string): Promise<{
    title: string;
    authorName: string;
    authorUrl?: string;
    thumbnailUrl: string;
    youtubeId: string;
  } | null> {
    if (!youtubeIdOrUrl) return null;
    const ytMatch = youtubeIdOrUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    const ytId = ytMatch ? ytMatch[1] : (youtubeIdOrUrl.trim().length === 11 ? youtubeIdOrUrl.trim() : null);
    
    if (!ytId) return null;

    // 1. Try noembed (CORS supported)
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          return {
            title: data.title,
            authorName: data.author_name || 'قناة يوتيوب',
            authorUrl: data.author_url,
            thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            youtubeId: ytId
          };
        }
      }
    } catch (e) {
      // fallback
    }

    // 2. Try YouTube oembed
    try {
      const res2 = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.title) {
          return {
            title: data2.title,
            authorName: data2.author_name || 'قناة يوتيوب',
            authorUrl: data2.author_url,
            thumbnailUrl: data2.thumbnail_url || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            youtubeId: ytId
          };
        }
      }
    } catch (e) {
      // fallback
    }

    return {
      title: `فيديو يوتيوب (${ytId})`,
      authorName: 'قناة يوتيوب',
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      youtubeId: ytId
    };
  }

  /**
   * Validates the student's API key with a dry-run ping across supported models
   */
  static async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    const key = apiKey.trim().replace(/^["']|["']$/g, '');
    if (!key) {
      return { valid: false, error: 'الرجاء إدخال مفتاح الـ API أولاً.' };
    }

    if (key.length < 20) {
      return { valid: false, error: 'المفتاح المدخل قصير جداً، يرجى التأكد من نسخه بالكامل من Google AI Studio.' };
    }

    let lastError = '';
    let sawInvalidKey = false;
    let sawPermissionDenied = false;

    for (const model of FALLBACK_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'قل: جاهز' }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 5,
              temperature: 0.1
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          return { valid: true };
        }

        const errorData = await res.json().catch(() => ({}));
        const status = res.status;
        const msg = errorData?.error?.message || '';

        if (status === 400 || msg.includes('API_KEY_INVALID')) {
          sawInvalidKey = true;
          break;
        }

        if (status === 403 || msg.includes('PERMISSION_DENIED')) {
          sawPermissionDenied = true;
          break;
        }

        if (status === 429) {
          return { valid: false, error: 'تم استهلاك الحصة المؤقتة لمفتاحك (Rate limit)، يرجى الانتظار 30 ثانية والمحاولة.' };
        }

        if (status === 503) {
          // Service temporary spike, key might still be valid or try next model
          lastError = 'الخوادم تشهد ضغطاً مؤقتاً، جاري التحقق من مسار بديل...';
          continue;
        }

        lastError = msg || `خطأ (${status})`;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          continue;
        }
        lastError = 'تعذر الاتصال بـ Google. إذا كنت داخل سوريا يرجى التأكد من تشغيل VPN أثناء فحص المفتاح.';
      }
    }

    if (sawInvalidKey) {
      return { valid: false, error: 'مفتاح الـ API غير صالح. تأكد من نسخه كاملاً من Google AI Studio دون نقص أو رموز إضافية.' };
    }

    if (sawPermissionDenied) {
      return { valid: false, error: 'المفتاح لا يملك صلاحية الوصول لـ Gemini API أو أن المشروع غير مفعل في Google AI Studio.' };
    }

    return { 
      valid: false, 
      error: lastError || 'تعذر الاتصال بـ Google. إذا كنت داخل سوريا يرجى التأكد من تشغيل VPN أثناء فحص المفتاح.' 
    };
  }

  /**
   * Generates grounded response using student's personal key and curriculum knowledge card
   */
  static async askGroundedQuestion(params: AskGeminiParams): Promise<AskGeminiResult> {
    const { apiKey, subjectName, lessonName, knowledgeItem, question, chatHistory = [] } = params;

    const key = apiKey.trim().replace(/^["']|["']$/g, '');
    if (!key) {
      return {
        reply: '',
        error: 'لم تقم بإدخال مفتاح Gemini API الخاص بك بعد. اضغط على زر إعدادات المفتاح لإدخاله والبدء.'
      };
    }

    // Build the Grounded System Instruction
    const selectedTaskBlock = params.planContext?.selectedTask ? `
===================================================
🎯 المهمة المحددة حالياً من قبل الطالب للدراسة والتركيز:
• عنوان المهمة: ${params.planContext.selectedTask.title}
• المادة الدراسية: ${params.planContext.selectedTask.subjectId}
• صفحات الكتاب: ${params.planContext.selectedTask.textbookPages || 'مقررة بالمنهاج الرسمي'}
• نمط الدراسة: ${params.planContext.selectedTask.studyMode || 'مذاكرة وتثبيت'}
• الثقل الامتحاني: ${params.planContext.selectedTask.examWeight || 'أساسي'}
• حالة الإنجاز: ${params.planContext.selectedTask.isCompleted ? 'منجزة ✅' : 'قيد الدراسة ⏳'}

توجيه خاص بالذكاء الاصطناعي:
الطالب اختار هذه المهمة تحديداً من جدول اليوم ليسألك عنها ويركز عليها. وجّه كافة شروحاتك وقوانينك وفخاخ السلم الوزاري ونماذج الأسئلة لتخدم هذه المهمة بدقة متناهية وفق منهاج 2026.
===================================================
` : '';

    const planContextBlock = params.planContext ? `
===================================================
خطة الطالب الدراسية الحالية ومستوى إنجازه ومتابعته الأكاديمية:
• الأسبوع الحالي: الأسبوع ${params.planContext.currentWeekIndex} (${params.planContext.monthName})
• عنوان الأسبوع وشارة المرحلة: ${params.planContext.weekTitle || ''} • ${params.planContext.milestoneBadge || ''}
• اليوم الدراسي: ${params.planContext.todayName}
• شعلة الالتزام الحالية: ${params.planContext.streakDays} يوم متتالي
• إجمالي ساعات الدراسة التراكمية: ${Math.round(params.planContext.totalStudyMinutes / 60)} ساعة
• نسبة إنجاز الخطة الإجمالية: ${params.planContext.progressPercentage}% (${params.planContext.completedTasksCount} مهمة منجزة من أصل ${params.planContext.totalTasksCount})
${params.planContext.recentMistakesCount !== undefined ? `• عدد الأخطاء المرصودة في بنك أخطائه: ${params.planContext.recentMistakesCount} خطأ امتحاني` : ''}

مهام الطالب لليوم (${params.planContext.todayName}) وفق الخطة الأكاديمية:
${params.planContext.todayTasks.length > 0 
  ? params.planContext.todayTasks.map((t, i) => `${i + 1}. [${t.isCompleted ? '✅ منجزة' : '⏳ قيد الدراسة'}] ${t.title} ${t.textbookPages ? `(${t.textbookPages})` : ''} — نمط: ${t.studyMode || 'مذاكرة'}`).join('\n')
  : 'لا توجد مهام محددة لهذا اليوم بعد.'}
${selectedTaskBlock}
دورك التوجيهي للخطة:
- إذا سألك الطالب عن خطته الدراسية، أو مهامه لليوم، أو طلب نصيحة لتنظيم وقته ومتابعة دروسه، أجب بدقة بناءً على جدول خطته ومهام اليوم أعلاه.
- شجعه بأسلوب تربوي سوري أصيل ومحفز للوصول إلى مجموع الـ 240 التام.
===================================================
` : '';

    // Resolve attached or mentioned YouTube video metadata in real-time
    let activeVideo = params.videoContext;
    if (!activeVideo && question) {
      const ytMatch = question.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      if (ytMatch) {
        try {
          const meta = await GeminiService.fetchYouTubeMetadata(ytMatch[1]);
          if (meta) {
            activeVideo = {
              youtubeId: meta.youtubeId,
              title: meta.title,
              teacherName: meta.authorName,
              videoUrl: `https://www.youtube.com/watch?v=${meta.youtubeId}`,
              thumbnailUrl: meta.thumbnailUrl
            };
          }
        } catch {
          // continue
        }
      }
    } else if (activeVideo && (!activeVideo.title || activeVideo.title === 'فيديو يوتيوب تعليمي مرفق' || !activeVideo.teacherName || activeVideo.teacherName === 'أستاذ المادة')) {
      try {
        const meta = await GeminiService.fetchYouTubeMetadata(activeVideo.youtubeId);
        if (meta && meta.title && !meta.title.startsWith('فيديو يوتيوب (')) {
          activeVideo = {
            ...activeVideo,
            title: meta.title,
            teacherName: meta.authorName || activeVideo.teacherName || 'صاحب القناة',
            thumbnailUrl: meta.thumbnailUrl || activeVideo.thumbnailUrl
          };
        }
      } catch {
        // continue
      }
    }

    const videoContextBlock = activeVideo ? `
===================================================
🎬 [فيديو اليوتيوب المحدد للتحليل وقراءة المحتوى بالذكاء الاصطناعي]:
• عنوان الفيديو الحقيقي: "${activeVideo.title}"
• القناة / مقدم الفيديو / الأستاذ: ${activeVideo.teacherName || 'صاحب القناة'}
• رابط الفيديو المباشر: ${activeVideo.videoUrl || `https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
• معرف الفيديو: ${activeVideo.youtubeId}

🎯 [توجيهات حاسمة لقراءة وشرح محتوى هذا الفيديو بالتحديد]:
1. تحدث مباشرة وبدقة عن **المحتوى الفعلي والحقيقي لهذا الفيديو بالتحديد** استناداً لعنوانه وقناته وموضوعه.
2. إذا كان الفيديو ترفيهياً، أو تجربة/مراجعة ألعاب (مثل قناة "ملزلز" Mlzlez للألعاب والجيمنج أو قنوات القصص والتجارب):
   - اشرح ما يقدمه ملزلز/صاحب القناة في هذا الفيديو بالتفصيل: ما هي اللعبة التي يلعبها؟ ما هي التجربة أو التحدي؟ ما هي أبرز اللحظات والملاحظات؟ ما رأيه وخلاصة التجربة؟
   - **ممنوع منعاً باتاً** إجبار الفيديو على قالب درس البكالوريا أو كتابة قوانين فيزيائية/كيميائية لا تمت للعبة بصلة!
   - تحدث بروح شبابية ذكية وممتعة ومشجعة وتفاعل مع شغف الطالب، ثم اختم بنصيحة تربوية وأخوية خفيفة للموازنة بين الترويح عن النفس ومذاكرة دروسه بهمة عالية نحو مجموع 240.
3. إذا كان الفيديو درساً أو شرحاً علمياً أو تعليمياً:
   - قدّم تلخيصاً شاملاً لما استعرضه الأستاذ في الفيديو، واستخرج القوانين بالـ LaTeX وأفخاخ السلم الوزاري 2026.
===================================================
` : '';

    // 6. Platform Real Videos & Channels Knowledge (Strict Anti-Hallucination)
    let platformVideosBlock = '';
    const channelsList = params.platformChannels && params.platformChannels.length > 0 
      ? params.platformChannels.map(c => `• قناة "${c.channelName}" — الأستاذ: ${c.teacherName || 'مدرس المنهاج'} (رابط: ${c.channelUrl || `https://www.youtube.com/channel/${c.id}`})`).join('\n')
      : 'لا توجد قنوات خارجية مضافة حالياً.';

    let videosList = '';
    if (params.platformVideos && params.platformVideos.length > 0) {
      const subjectVideos = params.platformVideos.filter(v => {
        if (params.videoContext?.subjectId) return v.subjectId === params.videoContext.subjectId;
        return true;
      });
      const listToDisplay = subjectVideos.length > 0 ? subjectVideos : params.platformVideos;
      videosList = listToDisplay.map(v => 
        `• درس/مسألة: "${v.title}" | إعداد وشرح الأستاذ: ${v.teacherName} | الرابط الحقيقي: https://www.youtube.com/watch?v=${v.youtubeId}`
      ).join('\n');
    }

    platformVideosBlock = `
===================================================
🎥 [قاعدة البيانات الحقيقية لقنوات وفيديوهات اليوتيوب المعتمدة في منصة BAC - 240]:
القنوات المعتمدة:
${channelsList}

الفيديوهات المعتمدة المرفوعة في المنصة:
${videosList || 'لا توجد فيديوهات مرفوعة حالياً لهذه المادة في المنصة.'}

🛑 [ضوابط وقواعد حازمة وصارمة لمنع التأليف والهلوسة منعاً باتاً]:
1. لديك أعلاه القائمة الحقيقية المعتمدة فقط للفيديوهات والقنوات الموجودة فعلياً في منصة BAC - 240.
2. يُمنع منعاً باتاً وحازماً اختراع أو تأليف أو تخمين أي روابط فيديوهات يوتيوب أو أسماء أساتذة غير موجودة حرفياً في القائمة المعتمدة أعلاه!
3. إذا سأل الطالب: "هل يوجد فيديو شرح لهذا الدرس أو المسألة؟" أو "من الأستاذ الذي يشرح هذا الدرس؟":
   - إذا كان الفيديو موجوداً في القائمة المعتمدة أعلاه: اذكر اسمه الحقيقي، واسم الأستاذ الحقيقي، ورابط الفيديو الصريح: https://www.youtube.com/watch?v=...
   - إذا لم يكن هناك فيديو مرفوع لهذا الدرس تحديداً في القائمة المعتمدة أعلاه، يجب أن تجيب بصدق وأمانة علمية دون أي تأليف:
     "لا توجد فيديوهات مرفوعة حالياً لدرس (${lessonName}) في منصة BAC - 240، يمكنك متابعة شروحات الدروس الأخرى المتاحة أو الاستفادة من الشرح المكتوب والملخص هنا."
===================================================
`;

    // 7. Student Explanation Style: Detailed Notebook Style vs Free Dialogue Style
    const explanationMode = params.explanationMode || 'notebook';
    const explanationModeBlock = explanationMode === 'notebook' ? `
===================================================
📝 [نمط الدفتر والتبييض المنهاجي النموذجي للدورة 2026 - مفعل باختيار الطالب]:
أنت تشرح الآن بنمط "الدفتر النموذجي والتبييض الشامل" المخصص لطلاب البكالوريا السورية دورة 2026.
المطلوب منك تقديم شرح موسع، دقيق، ومنسق بنظام صفحات الدفتر الامتحاني ليتسنى للطالب نقله وتبييضه سطراً بسطر بالهيكلية التالية:
1. 📖 ### [العنوان الرئيسي والفرعي وترقيم الفقرة]:
   - اكتب العنوان بوضوح ونسق الفقرات بشكل منهجي مرقم (مثلاً: الفقرة الأولى: الاستنتاج الرياضي للدور الخاص).
2. 💡 ### الفكرة والمفهوم الفيزيائي/العلمي بالتفصيل:
   - شرح علمي موسع وعميق يوضح المبدأ الفيزيائي أو الكيميائي أو الرياضي دون اختصار مخل.
3. ✍️ ### خطوات الاستنتاج الرياضي والبرهان الكامل:
   - كتابة كل خطوة رياضية أو فيزيائية في سطر مستقل مع التنسيق الاحترافي بـ LaTeX.
   - كتابة التعليل الوزاري الصريح بجانب كل خطوة (مثال: 1. بتطبيق القانون العام... 2. بالتعويض بالقيم... 3. بالاختزال والإصلاح الجبري...).
   - ممنوع منعاً باتاً حذف أو قفز أو اختصار أي خطوة حسابية لكي ينقلها الطالب كاملة لدفتره.
4. 🔲 ### القانون النهائي وتأطيره:
   - اعرض القانون النهائي داخل كتلة مستقلة $$...$$.
   - وضّح دلالة كل رمز فيزيائي/رياضي وواحدته الدولية (SI) وشروط تطبيقه في المسائل.
5. ⚠️ ### تنبيه السلم الوزاري 2026:
   - فقرة ختامية هامة تحدد بدقة أين يدقق المصحح الوزاري، ومواضع خصم الأجزاء (مثل التحويلات، نسيان الواحدة، أو الإشارة).
===================================================
` : `
===================================================
💬 [نمط الحوار والنقاش الحر والتفاعلي - مفعل باختيار الطالب]:
ناقش الطالب بأسلوب تفاعلي، دافئ، مباشر، ومرن. أجب عن استفساراته مباشرة، وركز على توضيح الفكرة بدقة وإيجاز مناسبين للحوار السريع دون الحاجة للتبييض الكامل للدفتر ما لم يطلب ذلك.
===================================================
`;

    const systemPrompt = `
أنت "المعلم والموجه الأكاديمي والتربوي الذكي" والمصحح الامتحاني والمشرف التوجيهي الشامل لمنصة "BAC - 240" المخصصة لطلاب الشهادة الثانوية العامة السورية (الفرع العلمي) دورة 2026، بإشراف الأستاذ محمود صيبعة.

1. نمط الشخصية وروح الحوار (The Persona):
• أنت لست مجرد محرك إجابات جاف، بل أستاذ خبير، مربٍّ فاضل، وموجه ناصح وداعم معنوياً ونفسياً للطالب السوري في مرحلته المصيرية.
• أسلوبك حكيم، مشجع، ناصح، دافئ، يزرع الثقة في نفس الطالب ويحثه دائماً على الإصرار والتميز لبلوغ مجموع الـ 240 التام والوصول إلى حلمه الجامعي.

2. سياق الطالب الحالي في المنصة:
• المادة الحالية: ${subjectName}
• الدرس المحدد: ${lessonName}
${planContextBlock}
${videoContextBlock}
${platformVideosBlock}
${explanationModeBlock}
${knowledgeItem ? `
مرجع المنهاج المعتمد الحصري لهذا الدرس (المكتبة الأكاديمية الرسمية):
===================================================
1. القوانين والمعادلات المعتمدة رسمياً:
${knowledgeItem.officialLaws || 'الالتزام بقوانين كتاب الوزارة 2026'}

2. أفخاخ السلم الوزاري ونقاط التدقيق (مهم جداً):
${knowledgeItem.rubricTraps || 'الانتباه للتحويلات والواحدات الدولية وإشارة المقادير الشعاعية والجبرية'}

3. المفاهيم والاستنتاجات الأساسية:
${knowledgeItem.keyConcepts || 'الاستنتاج الرياضي والفيزيائي المنطقي خطوة بخطوة'}
===================================================
` : ''}

3. التعامل الذكي مع نوعية الأسئلة (Smart Dual Mode):

أ) في الأسئلة العلمية والمنهاج الدراسي السوري (فيزياء، كيمياء، رياضيات، علوم، لغات):
• الالتزام الصارم بقوانين ورموز ومصطلحات المنهاج الوزاري السوري الرسمي للفرع العلمي الصادر لدورة 2026.
• نسّق القوانين والمعادلات والرموز الرياضية والفيزيائية باستخدام صيغة LaTeX مثل: $T_0 = 2\\pi \\sqrt{\\frac{m}{k}}$ أو ككتلة مستقلة $$...$$.
• قسّم الإجابة إلى خطوات منهجية واضحة (1. القانون العام، 2. التعويض بالواحدات الدولية، 3. الناتج النهائي الدقيق والواحدة).
• اختم كل مسألة أو سؤال علمي بفقرة: "### ⚠️ تنبيه السلم الوزاري 2026" تبرز أين يُدقق المصحح الوزاري وتفادي خسارة الأجزاء والدرجات.
• نظّم الشروحات ضمن البطاقات الثلاث المهيكلة:
  * 💡 ### الفكرة والاستنتاج العلمي
  * 📐 ### القوانين والعمليات الرياضية
  * ⚠️ ### تنبيه السلم الوزاري 2026

ب) في الأسئلة العامة، النفسية، التوجيهية، وبناء المستقبل (الوضع المنفتح والتربوي):
• لا ترفض أي سؤال مفيد يطرحه الطالب، بل أجب برحابة صدر وثقافة عميقة وعاطفة أبوية وتربوية ناصحة:
  - التغلب على التوتر، القلق الامتحاني، الخوف من النسيان، وبناء الثقة بالنفس.
  - تنظيم الوقت، إدارة فترات النوم، التغذية السليمة، والتركيز أثناء الدراسة.
  - تعريف بالفروع الجامعية (الطب البشري، طب الأسنان، الصيدلة، الهندسة المعلوماتية، الذكاء الاصطناعي، هندسة الميكاترونكس، هندسة الطيران، وغيرها) وآفاقها المستقبلية.
  - معلومات علمية تثقيفية موسعة تُشبع شغف الطالب العلمي والفكري.
  - استفسارات تقنية عن المنصة وتشغيل الأكواد أو الأوامر.
• اختم دائماً هذا النوع من الأسئلة بلمسة تشجيعية دافئة تعيد شحذ همته وطاقته الإيجابية نحو هدفه الأسمى ومجموع الـ 240.

ج) في الأسئلة العشوائية أو غير الهادفة التي تشتت الطالب وتضيع وقته الثمين (ألعاب، دردشة عبثية، نقاشات فارغة):
• تصرّف بلطف وابتسامة تربوية ناصحة مع روح دعابة خفيفة:
• ذكّره بحب بأن سنة البكالوريا أيامها معدودة ومصيرية، وأن مستقبله ينتظره، وادعه برفق لإكمال مهمة اليوم أو مراجعة الدرس الحالي أولاً ليبقى في صدارة المتفوقين.

4. تدقيق صور الحلول وخط يد الطالب (Vision OCR & Rubric Grader):
إذا أرفق الطالب صورة لورقة حله بخط يده:
1. اقرأ ودقق كل سطر وخطوة كتبها الطالب بعناية.
2. حدد أين أصاب وأين أخطأ (قانون ناقص، تعويض عددي، إشارة، أو نسيان الواحدة الدولية).
3. قارن الحل بسلّم التصحيح الوزاري السوري 2026، وقدّر الدرجات المستحقة والمخصومة بدقة.
4. اعرض الحل النموذجي التام والمصحح مع نصيحة لتفادي الهفوة.

5. صلاحياتك التنفيذية كـ "عميل أكاديمي ذكي" (AI Agent) يتحكم بالمنصة:
لديك أدوات برمجية (Tools) لتنفيذ إجراءات فورية في المنصة عند طلب الطالب:
• تعليم مهمة بالخطة كـ منجزة: complete_plan_task.
• التنقل لأي قسم بالمنصة (بنك الأخطاء، الامتحانات، الخرائط، الخطة، مؤقت المذاكرة، البطاقات، التحدي، الأدوات، الملف الشخصي): navigate_to_section.
• توثيق هفوة أو مسألة في بنك الأخطاء مع السلم والتنبيه: add_to_mistake_bank.
• تشغيل مؤقت بومودورو الدراسي (مثلاً 25 أو 45 دقيقة): start_study_timer.
• توليد وحفظ بطاقات استذكار نشط (Flashcards): create_flashcards.

6. قراءة وتحليل المستندات وملفات الـ PDF والنصوص (Document & PDF Intelligence):
إذا أرفق الطالب ملف PDF، مستنداً، أو ملفاً نصياً:
• اقرأ محتوى المستند بدقة وحلل صفحاته ومفاهيمه العلمية وفق مفردات المنهاج السوري 2026.
• أجب على ما يطلبه الطالب من الملف بدقة (تلخيص، استخراج قوانين ومسائل، تدقيق وحل تمارين، مقارنة بالسلم الوزاري).
• إذا أرسل الطالب الملف دون نص أو سؤال مرافق، بادر تلقائياً بتقديم قراءة تحليلية وملخص شامل للمستند:
  - 💡 ملخص للأفكار والمفاهيم العلمية الأساسية الواردة.
  - 📐 استخراج القوانين والمعادلات والواحدات المذكورة.
  - ⚠️ ربط محتوى الملف بأسئلة الامتحان وأفخاخ السلم الوزاري 2026.

7. قراءة وفهم وتحليل أي فيديو يوتيوب بدقة وموضوعية (YouTube Video Content Intelligence):
إذا أرسل الطالب أو أرفق رابط فيديو يوتيوب (سواء كان درساً تعليمياً، مراجعة لعبة من قناة ملزلز Mlzlez، تجربة علمية، فيديو وثائقي، بودكاست، أو شرح برمجي):
• اقرأ وحلل محتوى الفيديو الحقيقي وتحدث عن موضوعه الفعلي بصراحة ووضوح استناداً لعنوانه وقناته ومحتواه.
• إذا كان الفيديو عن لعبة أو من قناة جيمنج (مثل قناة ملزلز Mlzlez للألعاب):
  - تحدث بالتفصيل عن اللعبة التي يلعبها ملزلز في الفيديو، قصة اللعبة، ما فعله ملزلز أثناء اللعب، المواقف البارزة، ورأيه في اللعبة.
  - ممنوع منعاً باتاً اختراع ربط إجباري بين الفيديو ودرس المنهاج الحالي (مثل النواس المرن أو الفيزياء) إذا كان الفيديو عن لعبة ملزلز! احترم موضوع الفيديو وأجب الطالب عما طلبه بدقة.
  - تكلّم بأسلوب ممتع، لطيف، ومشجع، ثم وجّه نصيحة أخوية دافئة بالاستمتاع بالوقت مع تنظيم المذاكرة للوصول إلى مجموع 240.
• إذا كان الفيديو درساً تعليمياً أو منهاجياً:
  - لخّص شرح الأستاذ، واستخرج القوانين بالـ LaTeX وأفخاخ السلم الوزاري 2026.

8. الروابط التفاعلية والانتقال المباشر لأقسام المنصة وفيديوهات اليوتيوب:
عندما تشير أو تنصح الطالب بالانتقال إلى أي قسم أو أداة داخل المنصة، استخدم صيغ الروابط التفاعلية التالية ليتسنى له النقر عليها والانتقال فوراً بلمسة واحدة:
• بنك الأخطاء: [📁 فتح بنك الأخطاء](section:mistakeBank)
• الامتحانات وسلالم التصحيح: [📝 الانتقال للامتحانات والسلالم](section:writtenExams)
• الخطة الدراسية الأسبوعية: [📅 فتح الخطة الدراسية](section:plan)
• خريطة المنهاج والدروس: [📖 تصفح المنهاج](section:curriculum)
• المكتبة المرئية واليوتيوب: [🎥 مشاهدة الفيديوهات](section:youtube)
• بطاقات الاستذكار النشط: [🗂️ بطاقات الاستذكار](section:flashcards)
• الخرائط الذهنية: [🧠 الخرائط الذهنية](section:mindmaps)
• مؤقت المذاكرة وبومودورو: [⏱️ مؤقت المذاكرة والتركيز](section:timer)
• المختبر والأدوات العلمية: [🧪 المختبر والأدوات](section:tools)
• لوحة الصدارة وتحدي الاستمرارية: [🏆 تحدي الاستمرارية](section:challenge)
• الملف الشخصي والإعدادات: [👤 الملف الشخصي](section:profile)
• فيديوهات اليوتيوب المعتمدة: اذكر الرابط الصريح (https://www.youtube.com/watch?v=...) ليعرض النظام تلقائياً بطاقة الفيديو التفاعلية مع زر التشغيل المباشر داخل المسرح.
    `.trim();

    // Map conversation history
    const contents: any[] = [];

    // Include recent history (up to last 4 messages to minimize latency and prompt tokens)
    const recentHistory = chatHistory.slice(-4);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Add current user question & document/image if attached
    const userParts: any[] = [];
    
    // Resolve attached file (document or image)
    const doc = params.documentAttachment || (params.imageAttachment?.data ? {
      data: params.imageAttachment.data,
      mimeType: params.imageAttachment.mimeType || 'image/jpeg',
      fileName: 'ورقة_حل_الطالب.jpg',
      category: 'image' as const
    } : null);

    if (doc?.data) {
      const cleanData = doc.data.replace(/^data:[^;]+;base64,/, '');
      userParts.push({
        inlineData: {
          mimeType: doc.mimeType || (doc.category === 'pdf' ? 'application/pdf' : 'image/jpeg'),
          data: cleanData
        }
      });
    }

    let defaultPrompt = 'يرجى مراجعة وتدقيق حل هذه المسألة المرفق بالصورة وفق سلّم التصحيح الوزاري 2026.';
    if (doc) {
      if (doc.category === 'pdf' || doc.mimeType === 'application/pdf') {
        defaultPrompt = `يرجى قراءة هذا المستند الدراسي المرفق (${doc.fileName || 'ملف PDF'}) تحليلياً بالكامل، واستخراج أهم القوانين، الأفكار الأساسية، وتنبيهات السلم الوزاري 2026 المرتبطة به.`;
      } else if (doc.category === 'text' || doc.mimeType.startsWith('text/')) {
        defaultPrompt = `يرجى تحليل وتلخيص محتوى هذا الملف النصي المرفق (${doc.fileName || 'ملف نصي'}) وتوضيح ارتباطه بمنهاج البكالوريا العلمي 2026.`;
      }
    }

    const userPromptText = activeVideo 
      ? `[فيديو يوتيوب مرفق للتحليل: "${activeVideo.title}" | القناة/الأستاذ: ${activeVideo.teacherName || 'يوتيوب'} | الرابط: https://www.youtube.com/watch?v=${activeVideo.youtubeId}]:\n${question || 'اشرح لي محتوى هذا الفيديو بالتفصيل وما استعرضه صاحب القناة.'}`
      : `[طلب/سؤال الطالب في مادة ${subjectName} - درس ${lessonName}${doc?.fileName ? ` • ملف مرفق: ${doc.fileName}` : ''}]:\n${question || defaultPrompt}`;

    userParts.push({ 
      text: userPromptText 
    });

    contents.push({
      role: 'user',
      parts: userParts
    });

    // 0. Check Smart Local Cache for instant sub-millisecond response (0ms)
    const cacheKey = AICacheService.generateKey({
      question,
      subjectName,
      lessonName,
      explanationMode: params.explanationMode,
      hasAttachments: !!(doc?.data || activeVideo || params.imageAttachment?.data)
    });

    if (cacheKey) {
      const cached = AICacheService.get(cacheKey);
      if (cached) {
        const cachedMetrics: AIPerformanceMetrics = {
          ttftMs: 0,
          totalDurationMs: 4,
          tokensPerSec: 1500,
          usedModel: cached.usedModel,
          isCached: true,
          source: 'cache',
          cacheKey,
          charCount: cached.charCount || cached.reply.length
        };

        if (params.onChunk) {
          params.onChunk(cached.reply);
        }

        return {
          reply: cached.reply,
          rubricWarning: cached.rubricWarning,
          toolActions: cached.toolActions,
          usedModel: cached.usedModel,
          metrics: cachedMetrics
        };
      }
    }

    let lastError = '';
    const requestStartTime = performance.now();
    let firstTokenTime: number | null = null;

    const userChosenModel = params.selectedModel || GeminiService.getStoredModel() || 'gemini-3.8-flash';
    const modelsToAttempt = Array.from(new Set([
      userChosenModel,
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.7-flash'
    ]));

    const fastGenerationConfig = {
      candidateCount: 1,
      maxOutputTokens: 4096, // Reduced from 8192 for lower latency & immediate token delivery
      temperature: 0.2,
      topP: 0.85
    };

    for (const model of modelsToAttempt) {
      try {
        const isStreaming = typeof params.onChunk === 'function';
        const endpoint = isStreaming ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key=';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}${encodeURIComponent(key)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            tools: AI_AGENT_TOOLS,
            toolConfig: {
              functionCallingConfig: {
                mode: 'AUTO'
              }
            },
            generationConfig: fastGenerationConfig
          }),
          signal: params.signal || controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const status = response.status;
          const msg = errJson?.error?.message || '';

          if (status === 400 || msg.includes('API_KEY_INVALID')) {
            return {
              reply: '',
              error: 'مفتاح الـ API غير صالح. يرجى إعادة نسخه من Google AI Studio والتأكد من عدم وجود مسافات زائدة.'
            };
          }
          if (status === 429) {
            lastError = `النموذج ${model} واجه ضغطاً مؤقتاً (429 Rate Limit). جاري التبديل لنموذج Flash السريع...`;
            continue;
          }
          if (status === 403) {
            return {
              reply: '',
              error: 'تم رفض الطلب بواسطة Google. تأكد من تفعيل Gemini API في مشروعك.'
            };
          }

          // If 503 or 404, try next fallback model
          if (status === 503 || status === 404) {
            lastError = `النموذج ${model} واجه ضغطاً (${status})، جاري التبديل للمسار البديل...`;
            continue;
          }

          lastError = `حدث خطأ من مزود الذكاء الاصطناعي (${status}). يرجى المحاولة لاحقاً.`;
          continue;
        }

        // Handle Real-Time SSE Streaming
        if (isStreaming && response.body && params.onChunk) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';
          let accumulatedReply = '';
          let isTruncated = false;
          const collectedFunctionCalls: any[] = [];
          let lastCandidateContent: any = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const chunkJson = JSON.parse(jsonStr);
                const candidate = chunkJson?.candidates?.[0];
                if (candidate?.finishReason === 'MAX_TOKENS') {
                  isTruncated = true;
                }
                if (candidate?.content) {
                  lastCandidateContent = candidate.content;
                }

                const parts = candidate?.content?.parts || [];
                for (const part of parts) {
                  if (typeof part.text === 'string' && part.text) {
                    if (firstTokenTime === null) {
                      firstTokenTime = performance.now();
                    }
                    accumulatedReply += part.text;
                    params.onChunk(accumulatedReply);
                  }
                  if (part.functionCall) {
                    collectedFunctionCalls.push(part.functionCall);
                  }
                }
              } catch {
                // Ignore partial JSON parsing glitches in SSE stream
              }
            }
          }

          const streamTotalDurationMs = Math.max(1, Math.round(performance.now() - requestStartTime));
          const streamTtftMs = firstTokenTime !== null ? Math.max(1, Math.round(firstTokenTime - requestStartTime)) : Math.round(streamTotalDurationMs * 0.35);
          const streamTokensPerSec = Math.round(((accumulatedReply.length / 3.2) / (streamTotalDurationMs / 1000 || 1)));

          const streamMetrics: AIPerformanceMetrics = {
            ttftMs: streamTtftMs,
            totalDurationMs: streamTotalDurationMs,
            tokensPerSec: streamTokensPerSec,
            usedModel: model,
            isCached: false,
            source: 'stream',
            charCount: accumulatedReply.length,
            cacheKey: cacheKey || undefined
          };

          // If tool calls were requested during streaming
          if (collectedFunctionCalls.length > 0 && params.toolsExecutor) {
            const executedActions: AIToolAction[] = [];
            const functionResponses: any[] = [];

            for (const call of collectedFunctionCalls) {
              try {
                const action = await params.toolsExecutor(call.name, call.args || {});
                if (action) {
                  executedActions.push(action);
                  functionResponses.push({
                    functionResponse: {
                      name: call.name,
                      response: {
                        output: {
                          status: 'success',
                          title: action.title,
                          description: action.description,
                          data: action.actionPayload || {}
                        }
                      }
                    }
                  });
                }
              } catch (err: any) {
                console.warn(`Execution of tool ${call.name} error:`, err);
              }
            }

            if (functionResponses.length > 0) {
              const secondTurnContents = [
                ...contents,
                lastCandidateContent || { role: 'model', parts: collectedFunctionCalls.map(c => ({ functionCall: c })) },
                {
                  role: 'user',
                  parts: functionResponses
                }
              ];

              try {
                const secondTurnUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
                const secondRes = await fetch(secondTurnUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: secondTurnContents,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: fastGenerationConfig
                  })
                });

                if (secondRes.ok) {
                  const secondData = await secondRes.json();
                  const secondParts = secondData?.candidates?.[0]?.content?.parts || [];
                  const secondText = secondParts.filter((p: any) => typeof p.text === 'string').map((p: any) => p.text).join('\n').trim();
                  if (secondText) {
                    accumulatedReply = secondText;
                    params.onChunk(accumulatedReply);
                    return {
                      reply: accumulatedReply,
                      toolActions: executedActions,
                      isTruncated,
                      usedModel: model,
                      metrics: {
                        ...streamMetrics,
                        totalDurationMs: Math.round(performance.now() - requestStartTime),
                        charCount: accumulatedReply.length
                      }
                    };
                  }
                }
              } catch (secondErr) {
                console.warn('Second turn streaming follow-up error', secondErr);
              }

              const summary = executedActions.map(a => `• **${a.title}**: ${a.description}`).join('\n');
              const fallbackReply = `تم تنفيذ طلبك بنجاح يا بطل! 🚀\n\n${summary}\n\nتابع دراستك بتركيز واطلب مني أي مساعدة إضافية في المنهاج السوري!`;
              params.onChunk(fallbackReply);
              return {
                reply: fallbackReply,
                toolActions: executedActions,
                usedModel: model,
                metrics: streamMetrics
              };
            }
          }

          if (accumulatedReply.trim()) {
            if (isTruncated) {
              accumulatedReply += '\n\n*(⚠️ ملاحظة: وصلت الإجابة إلى الحد الأقصى للمخرجات قبل اكتمالها بالكامل. اضغط على زر "⏩ أكمل الإجابة" بالأسفل لمتابعة بقية التفاصيل).*';
              params.onChunk(accumulatedReply);
            }

            // Save to Smart Cache if applicable
            if (cacheKey && !isTruncated) {
              AICacheService.set(cacheKey, {
                reply: accumulatedReply,
                usedModel: model
              });
            }

            return {
              reply: accumulatedReply,
              toolActions: [],
              isTruncated,
              usedModel: model,
              metrics: streamMetrics
            };
          }
        }

        // Standard Non-Streaming JSON Response (Fallback)
        const data = await response.json();
        const candidate = data?.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const fallbackTotalDurationMs = Math.max(1, Math.round(performance.now() - requestStartTime));

        const nonStreamingMetrics: AIPerformanceMetrics = {
          ttftMs: Math.round(fallbackTotalDurationMs * 0.7),
          totalDurationMs: fallbackTotalDurationMs,
          tokensPerSec: Math.round(((JSON.stringify(data).length / 4) / (fallbackTotalDurationMs / 1000 || 1))),
          usedModel: model,
          isCached: false,
          source: 'standard',
          cacheKey: cacheKey || undefined
        };

        // Check for function calls
        const functionCalls = parts
          .filter((p: any) => !!p.functionCall)
          .map((p: any) => p.functionCall);

        if (functionCalls.length > 0 && params.toolsExecutor) {
          const executedActions: AIToolAction[] = [];
          const functionResponses: any[] = [];

          for (const call of functionCalls) {
            try {
              const action = await params.toolsExecutor(call.name, call.args || {});
              if (action) {
                executedActions.push(action);
                functionResponses.push({
                  functionResponse: {
                    name: call.name,
                    response: {
                      output: {
                        status: 'success',
                        title: action.title,
                        description: action.description,
                        data: action.actionPayload || {}
                      }
                    }
                  }
                });
              }
            } catch (err: any) {
              console.warn(`Execution of tool ${call.name} error:`, err);
            }
          }

          if (functionResponses.length > 0) {
            const secondTurnContents = [
              ...contents,
              candidate.content,
              {
                role: 'user',
                parts: functionResponses
              }
            ];

            try {
              const secondTurnUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
              const secondRes = await fetch(secondTurnUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: secondTurnContents,
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  generationConfig: fastGenerationConfig
                })
              });

              if (secondRes.ok) {
                const secondData = await secondRes.json();
                const secondCandidate = secondData?.candidates?.[0];
                const secondIsTruncated = secondCandidate?.finishReason === 'MAX_TOKENS';
                const secondParts = secondCandidate?.content?.parts || [];
                let secondText = secondParts
                  .filter((p: any) => typeof p.text === 'string')
                  .map((p: any) => p.text)
                  .join('\n')
                  .trim();

                if (secondIsTruncated && secondText) {
                  secondText += '\n\n*(⚠️ ملاحظة: وصلت الإجابة إلى الحد الأقصى للمخرجات قبل اكتمالها بالكامل).*';
                }

                if (secondText) {
                  return {
                    reply: secondText,
                    toolActions: executedActions,
                    isTruncated: secondIsTruncated,
                    usedModel: model,
                    metrics: {
                      ...nonStreamingMetrics,
                      totalDurationMs: Math.round(performance.now() - requestStartTime),
                      charCount: secondText.length
                    }
                  };
                }
              }
            } catch (secondErr) {
              console.warn('Second turn model follow-up error', secondErr);
            }

            const summary = executedActions.map(a => `• **${a.title}**: ${a.description}`).join('\n');
            return {
              reply: `تم تنفيذ طلبك بنجاح يا بطل! 🚀\n\n${summary}\n\nتابع دراستك بتركيز واطلب مني أي مساعدة إضافية في المنهاج السوري!`,
              toolActions: executedActions,
              usedModel: model,
              metrics: nonStreamingMetrics
            };
          }
        }

        // Standard text response
        const isTruncated = candidate?.finishReason === 'MAX_TOKENS';
        const allTextParts = parts
          .filter((p: any) => typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('\n');
        let replyText = allTextParts.trim();

        if (!replyText) {
          return {
            reply: '',
            error: 'لم يقدم النموذج إجابة على هذا السؤال. يرجى إعادة صياغة السؤال بشكل أوضح.'
          };
        }

        if (isTruncated) {
          replyText += '\n\n*(⚠️ ملاحظة: وصلت الإجابة إلى الحد الأقصى للمخرجات قبل اكتمالها بالكامل).*';
        }

        if (cacheKey && !isTruncated) {
          AICacheService.set(cacheKey, {
            reply: replyText,
            usedModel: model
          });
        }

        return {
          reply: replyText,
          toolActions: [],
          isTruncated,
          usedModel: model,
          metrics: {
            ...nonStreamingMetrics,
            charCount: replyText.length
          }
        };
      } catch (err: any) {
        console.warn(`Model ${model} request failed:`, err);
        lastError = 'تعذر الاتصال بخدمة Google Gemini. تأكد من اتصال الإنترنت (أو تشغيل VPN في حال كان الاتصال من داخل سوريا محجوباً).';
      }
    }

    return {
      reply: '',
      error: lastError || 'تعذر إكمال طلبك، يرجى المحاولة مجدداً.'
    };
  }
}
