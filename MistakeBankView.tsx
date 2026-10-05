import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  ExternalLink, 
  Trash2, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Flame, 
  BookOpen, 
  Edit3, 
  Clock, 
  Layers,
  ArrowRight,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId, MistakeRecord } from '../types';
import { sound } from '../services/sound';

const SUBJECT_LIST: { id: SubjectId | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: 'جميع المواد', icon: '📚' },
  { id: 'math1', name: 'رياضيات 1', icon: '📐' },
  { id: 'math2', name: 'رياضيات 2', icon: '📊' },
  { id: 'physics', name: 'الفيزياء', icon: '⚡' },
  { id: 'chemistry', name: 'الكيمياء', icon: '🧪' },
  { id: 'biology', name: 'علم الأحياء', icon: '🧬' },
  { id: 'arabic', name: 'اللغة العربية', icon: '📖' },
  { id: 'english', name: 'اللغة الإنكليزية', icon: '🇬🇧' },
  { id: 'french', name: 'اللغة الفرنسية', icon: '🇫🇷' },
  { id: 'islamic', name: 'التربية الإسلامية', icon: '🕌' },
];

export const MistakeBankView: React.FC = () => {
  const { mistakes, resolveMistake, deleteMistake, updateMistakeNote, setActiveTab, showToast, theme } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(item => {
      if (selectedSubject !== 'all' && item.subjectId !== selectedSubject) return false;
      if (statusFilter === 'pending' && item.isResolved) return false;
      if (statusFilter === 'resolved' && !item.isResolved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchExam = item.examTitle?.toLowerCase().includes(q);
        const matchQ = item.questionText?.toLowerCase().includes(q);
        const matchNote = item.studentNote?.toLowerCase().includes(q);
        const matchLadder = item.correctionLadder?.toLowerCase().includes(q);
        if (!matchExam && !matchQ && !matchNote && !matchLadder) return false;
      }
      return true;
    });
  }, [mistakes, selectedSubject, statusFilter, searchQuery]);

  // Statistics
  const totalCount = mistakes.length;
  const resolvedCount = mistakes.filter(m => m.isResolved).length;
  const pendingCount = totalCount - resolvedCount;
  const masteryPercentage = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Ask NotebookLM
  const handleAskNotebookLM = (item: MistakeRecord) => {
    const notebookUrl = item.notebookLmNotebookUrl || 'https://notebooklm.google.com';
    const cleanQuestionTitle = item.questionText.slice(0, 140);
    const directedPrompt = `بناءً على كتاب الوزارة المعتمد، اشرح لي خطوة [القانون/التعويض] في مسألة: [${cleanQuestionTitle}] وما هو التعليل العلمي لها؟`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(directedPrompt).then(() => {
        showToast('✨ تم نسخ صيغة السؤال الموجه إلى الحافظة! الصقها في NotebookLM مباشرة.');
      }).catch(() => {
        showToast('جاري فتح مرجع NotebookLM المعتمد للأستاذ محمود...');
      });
    }

    window.open(notebookUrl, '_blank', 'noopener,noreferrer');
  };

  // Start Note Edit
  const handleStartEditNote = (item: MistakeRecord) => {
    setEditingNoteId(item.id);
    setNoteText(item.studentNote || '');
  };

  // Save Note Edit
  const handleSaveNote = (id: string) => {
    updateMistakeNote(id, noteText);
    setEditingNoteId(null);
    showToast('تم تحديث ملاحظتك بنجاح');
  };

  return (
    <div className="space-y-6 pb-12 select-none" dir="rtl">
      
      {/* Header and Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>سجل الثغرات والهفوات</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-normal">دورة 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>بنك الهفوات والأخطاء</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            سجل المسائل والأخطاء المرصودة لمراجعتها وسد الثغرات.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('writtenExams')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>قاعة الاختبارات التحريرية</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-800 bg-[#101622] p-4">
          <span className="text-xs text-slate-400 block mb-1">إجمالي الهفوات المرصودة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-100 font-mono">{totalCount}</span>
            <span className="text-xs text-slate-400 font-normal">مسألة</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-800 bg-[#101622] p-4">
          <span className="text-xs text-slate-400 block mb-1">قيد المراجعة والاستدراك</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-400/90 font-mono">{pendingCount}</span>
            <span className="text-xs text-slate-400 font-normal">ثغرة نشطة</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-800 bg-[#101622] p-4">
          <span className="text-xs text-slate-400 block mb-1">تم استدراكها وفهمها</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-400/90 font-mono">{resolvedCount}</span>
            <span className="text-xs text-slate-400 font-normal">متقنة ✓</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-800 bg-[#101622] p-4">
          <span className="text-xs text-slate-400 block mb-1">نسبة تصفير الثغرات</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-200 font-mono">{masteryPercentage}%</span>
            <TrendingUp className="w-4 h-4 text-slate-400 inline" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Subject Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع المسائل ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            قيد الاستدراك ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'resolved'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تم تصفيرها ({resolvedCount})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في نصوص الأسئلة والملاحظات..."
            className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Subjects Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SUBJECT_LIST.map((sub) => {
          const active = selectedSubject === sub.id;
          const subCount = mistakes.filter(m => sub.id === 'all' || m.subjectId === sub.id).length;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                active
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{sub.icon}</span>
              <span>{sub.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {subCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mistakes Records List */}
      {filteredMistakes.length > 0 ? (
        <div className="space-y-4">
          {filteredMistakes.map((item) => {
            const subMeta = SUBJECT_LIST.find(s => s.id === item.subjectId) || SUBJECT_LIST[1];
            const isEditing = editingNoteId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-md ${
                  item.isResolved
                    ? 'border-emerald-500/20 bg-slate-900/50 opacity-90'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                {/* Header: Subject & Mistake Type & Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                      <span>{subMeta.icon}</span>
                      <span>{subMeta.name}</span>
                    </span>

                    <span className="text-xs text-slate-400 font-medium">
                      نموذج: <strong className="text-slate-200">{item.examTitle}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge: Partial vs Wrong */}
                    {item.mistakeType === 'partial' ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>هفوة جزئية (حساب أو واحدة)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>خطأ كامل / عدم استيعاب</span>
                      </span>
                    )}

                    {/* Badge: Resolved status */}
                    {item.isResolved && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم الاستدراك</span>
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذه المسألة من بنك أخطائك؟')) {
                          deleteMistake(item.id);
                          showToast('تم حذف المسألة من السجل');
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="حذف المسألة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">نص المسألة:</span>
                  <p className="text-sm sm:text-base text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {item.questionText}
                  </p>
                  {item.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-800 max-w-sm">
                      <img src={item.imageUrl} alt="رسم المسألة" className="max-h-40 object-contain mx-auto" />
                    </div>
                  )}
                </div>

                {/* Student Personal Note in Amber Border */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 sm:p-4 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>سبب الهفوة الذي كتبته بيدك وقت الامتحان:</span>
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEditNote(item)}
                        className="text-[11px] text-amber-400/80 hover:text-amber-200 underline"
                      >
                        تعديل الملاحظة
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-500/40 bg-slate-950 text-xs text-amber-100 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveNote(item.id)}
                          className="px-3 py-1 rounded bg-amber-600 text-white text-xs font-bold"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-amber-200/90 font-medium leading-relaxed">
                      {item.studentNote ? `"${item.studentNote}"` : '(لم تسجل ملاحظة محددة وقت الاختبار)'}
                    </p>
                  )}
                </div>

                {/* Ministerial Correction Ladder Preview */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 sm:p-4 mb-4">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>سلم التصحيح الوزاري المعتمد للمسألة:</span>
                  </span>
                  <div className="text-xs sm:text-sm text-emerald-100/90 whitespace-pre-wrap leading-relaxed font-sans">
                    {item.correctionLadder || 'سلم التصحيح قيد المراجعة.'}
                  </div>
                  {item.ladderImageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-emerald-500/30 max-w-sm">
                      <img src={item.ladderImageUrl} alt="صورة السلم" className="max-h-40 object-contain mx-auto" />
                    </div>
                  )}
                </div>

                {/* Action Buttons: NotebookLM + Resolve Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  
                  {/* NotebookLM Button */}
                  <button
                    onClick={() => handleAskNotebookLM(item)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>🔍 اسأل مرجع NotebookLM عن هذا الخطأ</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {/* Resolve/Mastery Button */}
                  <button
                    onClick={() => {
                      resolveMistake(item.id);
                      showToast(item.isResolved ? 'تمت إعادة فتح المسألة للمراجعة' : '✨ أحسنت! تم نقل المسألة للأرشيف المتقن وتصفير الثغرة.');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.isResolved
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 active:scale-95'
                    }`}
                  >
                    {item.isResolved ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>إعادة إلى قائمة الثغرات النشطة</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>✨ تم استدراك الخطأ وفهمه بنجاح</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">
            {statusFilter === 'resolved' 
              ? 'لم تقم بتصفير أي ثغرات بعد' 
              : 'بنك الأخطاء نظيف تماماً في هذا التصفية!'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-5">
            عند حل أي اختبار تحريري، يمكنك رصد أي هفوة بالقانون أو الحساب لتوثيقها هنا مع سلم التصحيح وتأصيل NotebookLM.
          </p>
          <button
            onClick={() => setActiveTab('writtenExams')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            الانتقال للاختبارات التحريرية
          </button>
        </div>
      )}

    </div>
  );
};
