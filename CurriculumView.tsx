import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Paperclip, 
  Plus, 
  Search, 
  RotateCcw, 
  ExternalLink, 
  FileText, 
  Trash2, 
  AlertCircle,
  X,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Subject, SubjectId, Lesson, Unit, LessonAttachment } from '../types';

export const CurriculumView: React.FC = () => {
  const { 
    curriculum, 
    addLessonAttachment, 
    removeLessonAttachment, 
    resetCurriculumToOfficial,
    videos,
    startAIChatWithVideo,
    showToast
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('math1');
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion state: set of unit IDs that are expanded
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(() => new Set(['math1_u1', 'math1_u2']));

  // Confirmation modal for resetting curriculum to official
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  // Active attachment modal state
  const [attachmentTarget, setAttachmentTarget] = useState<{
    subjectId: SubjectId;
    unitId: string;
    lesson: Lesson;
  } | null>(null);

  const [attachTitle, setAttachTitle] = useState('');
  const [attachType, setAttachType] = useState<'pdf' | 'drive' | 'telegram' | 'note'>('drive');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachContent, setAttachContent] = useState('');

  const currentSubject: Subject = curriculum.find(s => s.id === selectedSubjectId) || curriculum[0];

  // Subject statistics calculation (Pure exploration: total units, total lessons, total attachments)
  const { subjectLessonsTotal, subjectAttachmentsTotal } = useMemo(() => {
    let totalLessons = 0;
    let totalAttachments = 0;
    currentSubject.units.forEach((u: Unit) => {
      totalLessons += u.lessons.length;
      u.lessons.forEach((l: Lesson) => {
        totalAttachments += l.attachments?.length || 0;
      });
    });
    return {
      subjectLessonsTotal: totalLessons,
      subjectAttachmentsTotal: totalAttachments
    };
  }, [currentSubject]);

  // Toggle single unit expand/collapse
  const toggleUnitAccordion = (unitId: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  // Expand all units in current subject
  const expandAllUnits = () => {
    const allIds = new Set<string>(currentSubject.units.map((u: Unit) => u.id));
    setExpandedUnits(allIds);
  };

  // Collapse all units in current subject
  const collapseAllUnits = () => {
    setExpandedUnits(new Set());
  };

  // Filtered units and lessons by search query only (No completion filtering)
  const filteredUnits = useMemo(() => {
    return currentSubject.units.map((unit: Unit) => {
      let lessons = unit.lessons;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesUnit = unit.unit_name.toLowerCase().includes(query);
        if (!matchesUnit) {
          lessons = lessons.filter((l: Lesson) => l.name.toLowerCase().includes(query));
        }
      }

      return {
        ...unit,
        filteredLessons: lessons
      };
    }).filter((unit: Unit & { filteredLessons: Lesson[] }) => {
      if (searchQuery.trim()) {
        return unit.filteredLessons.length > 0;
      }
      return true;
    });
  }, [currentSubject, searchQuery]);

  const handleResetCurriculum = () => {
    resetCurriculumToOfficial();
    setIsResetModalOpen(false);
    setResetSuccessMessage(true);
    showToast('تمت استعادة هيكلية المنهاج الوزاري الرسمي 2026 بنجاح');
    setTimeout(() => setResetSuccessMessage(false), 3000);
  };

  const handleAddAttachmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentTarget || !attachTitle.trim()) return;

    addLessonAttachment(
      attachmentTarget.subjectId,
      attachmentTarget.unitId,
      attachmentTarget.lesson.id,
      {
        title: attachTitle.trim(),
        type: attachType,
        url: attachUrl.trim() || undefined,
        content: attachContent.trim() || undefined
      }
    );

    showToast(`تم حفظ المرفق "${attachTitle.trim()}" في مفردات الدرس بنجاح 📎`);

    // Reset attachment form
    setAttachTitle('');
    setAttachUrl('');
    setAttachContent('');
    setAttachmentTarget(null);
  };

  return (
    <div className="space-y-5 pb-16 max-w-6xl mx-auto" dir="rtl">
      
      {/* Page Title & Exploration Mode Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>فهرس المنهاج والكتب المدرسية</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            استعراض مفردات ووحدات المنهاج العلمي لدورة 2026.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#101622] hover:bg-slate-800 border border-slate-800 transition-all self-start sm:self-auto shrink-0"
          title="استعادة هيكلية المنهاج الوزاري المعتمد"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>استعادة فهرس الوزارة</span>
        </button>
      </div>

      {resetSuccessMessage && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تمت إعادة ضبط فهرس المنهاج وفق الكتب المدرسية الصادرة لدورة 2026 بنجاح!</span>
        </div>
      )}

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {curriculum.map((subj) => {
          const isSelected = subj.id === selectedSubjectId;
          return (
            <button
              key={subj.id}
              onClick={() => {
                setSelectedSubjectId(subj.id);
                if (subj.units && subj.units.length > 0) {
                  setExpandedUnits(new Set([subj.units[0].id]));
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'border-slate-700 bg-slate-800 text-slate-100 shadow-sm'
                  : 'border-slate-800 bg-[#101622] text-slate-400 hover:text-slate-200 hover:border-slate-700/80'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subj.color }} />
              <span>{subj.name}</span>
              <span className="font-mono text-[10px] opacity-75 tabular-nums">
                ({subj.maxScore} علامة)
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Subject Reference Header */}
      <motion.div 
        key={currentSubject.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl border border-slate-800/80 bg-[#101622] p-5 sm:p-6 space-y-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md bg-gradient-to-br ${currentSubject.gradient} border border-white/10 shrink-0`}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{currentSubject.name}</span>
                <span className="text-xs font-normal text-slate-400">
                  · المجموع الأقصى: {currentSubject.maxScore} درجة
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{currentSubject.units.length} وحدات دراسية</span>
                <span>·</span>
                <span className="text-slate-300 font-semibold">{subjectLessonsTotal} موضوعاً ودرساً مقرراً</span>
                <span>·</span>
                <span className="text-sky-300">{subjectAttachmentsTotal} مرفقاً وملاحظة مسجلة</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>فهرس دراسي استطلاعي معتمد</span>
          </div>
        </div>

        {/* Search and Accordion Control Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن درس أو وحدة في المنهاج..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-8 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Accordion Expand/Collapse All */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={expandAllUnits}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-colors"
              title="توسيع كافة وحدات المادة"
            >
              توسيع كافة الوحدات
            </button>
            <button
              onClick={collapseAllUnits}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-colors"
              title="طي كافة وحدات المادة"
            >
              طي كافة الوحدات
            </button>
          </div>
        </div>
      </motion.div>

      {/* Units & Lessons Accordion List */}
      <div className="space-y-3">
        {filteredUnits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#101622] p-10 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">لم يتم العثور على أي دروس تطابق معايير البحث في المنهاج.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-indigo-400 hover:underline inline-block mt-1 font-bold"
            >
              إلغاء البحث وإظهار كامل الفهرس
            </button>
          </div>
        ) : (
          filteredUnits.map((unit: Unit & { filteredLessons?: Lesson[] }, unitIdx: number) => {
            const unitTotal = unit.lessons.length;
            const isExpanded = searchQuery.trim() ? true : expandedUnits.has(unit.id);
            const displayedLessons = unit.filteredLessons || unit.lessons;

            return (
              <div 
                key={unit.id}
                className="rounded-2xl border border-slate-800 bg-[#101622] hover:border-slate-700/80 transition-all overflow-hidden"
              >
                {/* Unit Accordion Header */}
                <div 
                  className="p-4 sm:px-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => toggleUnitAccordion(unit.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUnitAccordion(unit.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-sky-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                        <span className="truncate">{unit.unit_name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        الوحدة {unitIdx + 1} • {unitTotal} موضوعاً مقرراً في الكتاب المدرسي
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg shrink-0">
                    {unitTotal} دروس
                  </span>
                </div>

                {/* Lesson Cards when Accordion is Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="border-t border-slate-800/80 p-3 sm:p-4 space-y-2 bg-[#0c1017]/80"
                    >
                      {displayedLessons.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          لا توجد دروس مطابقة في هذه الوحدة.
                        </div>
                      ) : (
                        displayedLessons.map((lesson: Lesson, lessonIdx: number) => {
                          const attachmentsCount = lesson.attachments?.length || 0;

                          return (
                            <div
                              key={lesson.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#101622] p-3 text-slate-200 hover:border-slate-700 transition-colors"
                            >
                              {/* Lesson Number and Title (No Checkboxes - Exploration reference) */}
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-7 h-7 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-center font-mono text-[11px] text-slate-300 font-bold shrink-0">
                                  {String(lessonIdx + 1).padStart(2, '0')}
                                </span>
                                
                                <span className="text-xs font-semibold text-slate-100 leading-snug">
                                  {lesson.name}
                                </span>
                              </div>

                              {/* Attachments & Study Notes Affordance */}
                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                {/* Video AI Explanation Button if lesson has associated video */}
                                {(() => {
                                  const matchingVideo = videos.find(v => 
                                    v.subjectId === selectedSubjectId && (
                                      v.lesson === lesson.id || 
                                      v.title.toLowerCase().includes(lesson.name.toLowerCase()) ||
                                      v.unit === unit.id
                                    )
                                  );

                                  if (matchingVideo) {
                                    return (
                                      <button
                                        onClick={() => startAIChatWithVideo(matchingVideo, currentSubject.name, lesson.name)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-500/40 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                                        title={`شرح فيديو "${matchingVideo.title}" للأستاذ ${matchingVideo.teacherName} بالذكاء الاصطناعي`}
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="hidden md:inline">اشرح بالفيديو مع المعلم الذكي ✨</span>
                                        <span className="md:hidden">فيديو AI ✨</span>
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}

                                {attachmentsCount > 0 && (
                                  <span className="text-[11px] font-mono text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{attachmentsCount} مرفق</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => setAttachmentTarget({
                                    subjectId: selectedSubjectId,
                                    unitId: unit.id,
                                    lesson: lesson
                                  })}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
                                  title="عرض أو إضافة مراجع وملخصات لهذا الدرس"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                                  <span>مرفقات وملاحظات</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Lesson Attachments Modal */}
      {attachmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#101622] p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-sky-400" />
                  <span>مرفقات وملاحظات الدرس</span>
                </h3>
                <p className="text-xs text-sky-300 mt-0.5 truncate max-w-sm">
                  {attachmentTarget.lesson.name}
                </p>
              </div>
              <button
                onClick={() => setAttachmentTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of existing attachments */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(!attachmentTarget.lesson.attachments || attachmentTarget.lesson.attachments.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-3">
                  لا توجد ملازم أو ملاحظات مربوطة بهذا الدرس حتى الآن. يمكنك إضافة رابط Drive أو Telegram أو كتابة ملخص أدناه.
                </p>
              ) : (
                attachmentTarget.lesson.attachments.map((att: LessonAttachment) => (
                  <div 
                    key={att.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {att.type === 'note' ? (
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-200 block truncate">{att.title}</span>
                        {att.content && (
                          <p className="text-[11px] text-slate-400 mt-0.5 whitespace-pre-wrap">{att.content}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {att.url && (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline text-[11px] flex items-center gap-1"
                        >
                          <span>فتح</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          removeLessonAttachment(
                            attachmentTarget.subjectId,
                            attachmentTarget.unitId,
                            attachmentTarget.lesson.id,
                            att.id
                          );
                          showToast('تمت إزالة المرفق من مفردات الدرس');
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="حذف هذا المرفق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Attachment Form */}
            <form onSubmit={handleAddAttachmentSubmit} className="rounded-xl border border-slate-800 bg-[#0c1017] p-3.5 space-y-3">
              <span className="text-xs font-bold text-sky-300 block">إضافة ملزمة أو ملاحظة خاصة للدرس</span>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={attachTitle}
                  onChange={(e) => setAttachTitle(e.target.value)}
                  placeholder="عنوان المرفق (مثال: نوطة النواس المرن)..."
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none col-span-2 sm:col-span-1"
                  required
                />

                <select
                  value={attachType}
                  onChange={(e) => setAttachType(e.target.value as 'pdf' | 'drive' | 'telegram' | 'note')}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none col-span-2 sm:col-span-1"
                >
                  <option value="drive">رابط Google Drive</option>
                  <option value="telegram">رابط Telegram</option>
                  <option value="pdf">ملف PDF خارجي</option>
                  <option value="note">ملاحظة مكتوبة خاصة</option>
                </select>
              </div>

              {attachType !== 'note' ? (
                <input
                  type="url"
                  dir="ltr"
                  value={attachUrl}
                  onChange={(e) => setAttachUrl(e.target.value)}
                  placeholder="https://drive.google.com/... أو https://t.me/..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              ) : (
                <textarea
                  value={attachContent}
                  onChange={(e) => setAttachContent(e.target.value)}
                  placeholder="اكتب ملاحظاتك المهمة والقوانين الخاصة بهذا الدرس..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAttachmentTarget(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>حفظ المرفق</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Reset Curriculum Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#101622] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">استعادة فهرس المنهاج الوزاري</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم استعادة فهرس المنهاج وفق الكتب المدرسية الصادرة لدورة 2026. هل ترغب بالمتابعة؟
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetCurriculum}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shadow-sm"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
