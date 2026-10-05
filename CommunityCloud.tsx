import React, { useState } from 'react';
import { 
  FolderDown, 
  Search, 
  Bookmark, 
  Plus, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  Trash2, 
  X,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LibraryDocument, SubjectId } from '../types';
import { WhatsAppIcon, TelegramIcon } from './SocialIcons';

export const CommunityCloud: React.FC = () => {
  const { 
    libraryDocs, 
    toggleBookmark, 
    addCustomDocument, 
    curriculum 
  } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  // Add document modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectId>('physics');
  const [newType, setNewType] = useState<LibraryDocument['type']>('automated_model');
  const [newSource, setNewSource] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSize, setNewSize] = useState('3.5 MB');

  const filteredDocs = libraryDocs.filter(doc => {
    if (onlyBookmarks && !doc.isBookmarked) return false;
    if (selectedSubject !== 'all' && doc.subjectId !== selectedSubject) return false;
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.teacherOrSource.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    addCustomDocument({
      title: newTitle.trim(),
      subjectId: newSubject,
      type: newType,
      teacherOrSource: newSource.trim() || 'ملزمة خاصة',
      year: '2026',
      url: newUrl.trim(),
      fileSize: newSize.trim()
    });

    setNewTitle('');
    setNewUrl('');
    setNewSource('');
    setIsAddModalOpen(false);
  };

  const getDocTypeBadge = (type: LibraryDocument['type']) => {
    switch (type) {
      case 'automated_model':
        return { label: 'نموذج مؤتمت', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'summary':
        return { label: 'مكثفة امتحانية', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'correction_ladder':
        return { label: 'سلم تصحيح وزاري', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'exam_archive':
        return { label: 'أسئلة دورات', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' };
      case 'teacher_notes':
        return { label: 'نوطة مدرس', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Official Community Communication Channels Bar */}
      <div className="rounded-2xl border border-slate-800 bg-[#101622] p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <h2 className="text-sm font-bold text-white">
                قنوات التواصل والمجتمع الرسمي
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              سحابة تلغرام ومجموعة واتساب للمتابعة اليومية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://t.me/bac240_saibaa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
            >
              <TelegramIcon className="w-3.5 h-3.5" />
              <span>سحابة تلغرام</span>
            </a>

            <a
              href="https://wa.me/963996148962"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>مجتمع واتساب</span>
            </a>
          </div>
        </div>
      </div>

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FolderDown className="w-5 h-5 text-sky-400" />
            <span>بنك الملازم والملفات</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            الملازم ونماذج الأتمتة وسلالم التصحيح.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ملزمة أو رابط خاص</span>
        </button>
      </div>

      {/* Search and Filters Deck */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الملزمة أو اسم الأستاذ أو السلم الوزاري..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 pl-10 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Bookmarks Toggle */}
          <button
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border ${
              onlyBookmarks
                ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>المفضلة فقط</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pt-1">
          {[
            { id: 'all', label: 'كافة التصنيفات' },
            { id: 'automated_model', label: 'نماذج مؤتمتة' },
            { id: 'summary', label: 'مكثفات' },
            { id: 'correction_ladder', label: 'سلالم تصحيح' },
            { id: 'teacher_notes', label: 'نوط المدرسين' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                selectedType === t.id
                  ? 'bg-slate-800 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Subjects Selector Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-2.5 py-0.5 rounded text-xs whitespace-nowrap ${
              selectedSubject === 'all'
                ? 'text-white font-bold bg-slate-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            الكل
          </button>
          {curriculum.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-2.5 py-0.5 rounded text-xs whitespace-nowrap ${
                selectedSubject === s.id
                  ? 'text-indigo-300 font-bold bg-indigo-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sky-400 text-sm font-bold">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>بانتظار رفع بنك الملازم والنماذج المؤتمتة من قبل الإدارة</span>
            </div>
            <p className="text-slate-500 max-w-md mx-auto">
              تتزامن مستندات بنك الملازم ونماذج بنك الأتمتة الوزارية وسلالم التصحيح تلقائياً وفورياً فور رفعها من المشرف العام (أ. محمود صيبعة) عبر منصة الإدارة. يمكنك أيضاً إضافة روابط لملازمك الخاصة على Google Drive أو Telegram.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20"
            >
              إضافة ملزمة أو رابط خاص
            </button>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const subject = curriculum.find(s => s.id === doc.subjectId);
            const badge = getDocTypeBadge(doc.type);

            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="font-bold text-[10px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${subject?.color || '#3B82F6'}22`, color: subject?.color || '#fff' }}
                      >
                        {subject?.name || 'مادة منهجية'}
                      </span>
                      {!doc.isCustom && (
                        <span className="text-[10px] bg-sky-950/80 text-sky-400 border border-sky-800/60 px-1.5 py-0.2 rounded font-semibold">
                          سحابي ☁️
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleBookmark(doc.id)}
                      className={`p-1 transition-colors ${
                        doc.isBookmarked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={doc.isBookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                    <span className="text-[11px]">{doc.teacherOrSource}</span>
                    {doc.fileSize && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[10px] text-slate-500">{doc.fileSize}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold transition-colors"
                  >
                    <span>تحميل / معاينة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>إضافة ملزمة أو رابط سحابي خاص</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان الملزمة أو النموذج
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: نوطة الفيزياء الحديثة وقوانين الأشعة..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المادة
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as SubjectId)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {curriculum.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    نوع الوثيقة
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as LibraryDocument['type'])}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="automated_model">نموذج مؤتمت</option>
                    <option value="summary">مكثفة امتحانية</option>
                    <option value="correction_ladder">سلم تصحيح وزاري</option>
                    <option value="teacher_notes">نوطة مدرس</option>
                    <option value="exam_archive">أسئلة دورات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  المصدر أو اسم الأستاذ
                </label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="مثال: أ. محمود صيبعة"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رابط الملف (Google Drive أو Telegram)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://drive.google.com/... أو https://t.me/..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  حفظ الوثيقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
