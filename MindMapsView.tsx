import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, 
  Sparkles, 
  Maximize2, 
  X, 
  FileText, 
  Search,
  BookOpen,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId, MindMap } from '../types';
import { InteractiveMindMap } from './InteractiveMindMap';

export const MindMapsView: React.FC = () => {
  const { mindmaps, curriculum } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [activeInteractiveMindMap, setActiveInteractiveMindMap] = useState<MindMap | null>(null);

  // Filter mind maps by subject and search query
  const filteredMindMaps = mindmaps.filter(m => {
    if (selectedSubject !== 'all' && m.subjectId !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      const matchUnit = m.unit?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchUnit) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Header and Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <GitFork className="w-5 h-5" />
            </div>
            <span>الخرائط الذهنية</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            مخططات مفاهيمية ذكية لربط أفكار وقوانين المنهاج.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث في الخرائط والمفاهيم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
        <button
          onClick={() => setSelectedSubject('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedSubject === 'all'
              ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
          }`}
        >
          كافة المواد ({mindmaps.length})
        </button>
        {curriculum.map(s => {
          const count = mindmaps.filter(m => m.subjectId === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubject === s.id
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Mind Maps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMindMaps.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>لا توجد خرائط ذهنية مطابقة لخيارات البحث</span>
            </div>
            <p className="text-slate-500 max-w-md mx-auto">
              يقوم المشرف العام (أ. محمود صيبعة) برفع الخرائط المفاهيمية عالية الدقة لكل وحدة عبر لوحة الإدارة في Firebase، وستظهر هنا فور نشرها.
            </p>
          </div>
        ) : (
          filteredMindMaps.map((map) => {
            const subject = curriculum.find(s => s.id === map.subjectId);
            const hasMarkdown = !!(map.content && map.content.trim().length > 0);

            return (
              <div
                key={map.id}
                onClick={() => {
                  if (hasMarkdown) {
                    setActiveInteractiveMindMap(map);
                  } else if (map.imageUrl) {
                    setActivePreviewImage(map.imageUrl);
                  }
                }}
                className="rounded-2xl border border-slate-800 bg-[#101622] overflow-hidden flex flex-col justify-between hover:border-slate-700 hover:bg-[#131b29] transition-all shadow-sm group cursor-pointer"
              >
                <div>
                  {/* Thumbnail / Visual Interactive Preview */}
                  {hasMarkdown ? (
                    <div className="relative aspect-video w-full bg-gradient-to-br from-[#064e3b]/30 via-[#0f172a] to-[#022c22]/40 overflow-hidden p-4 flex flex-col items-center justify-center text-center border-b border-slate-800/80 group-hover:border-emerald-500/30 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 shadow-inner group-hover:scale-110 transition-transform">
                        <GitFork className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {map.title}
                      </span>
                      <span className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>شجرة تفاعلية NotebookLM قابلة للسحب والتحريك</span>
                      </span>

                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-lg">
                          <GitFork className="w-3.5 h-3.5" />
                          <span>فتح الشجرة التفاعلية</span>
                        </span>
                      </div>
                    </div>
                  ) : map.imageUrl ? (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePreviewImage(map.imageUrl || null);
                      }}
                      className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
                    >
                      <img 
                        src={map.imageUrl} 
                        alt={map.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-lg">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>تكبير الخريطة</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center border-b border-slate-800">
                      <GitFork className="w-8 h-8 text-indigo-400 mb-2 opacity-80" />
                      <span className="text-xs text-slate-300 font-bold">{map.title}</span>
                      <span className="text-[10px] text-slate-500 mt-1">{map.unit || 'مخطط مفاهيمي عام'}</span>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span 
                        className="font-bold text-[10px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${subject?.color || '#4f46e5'}22`, color: subject?.color || '#818cf8' }}
                      >
                        {subject?.name}
                      </span>
                      {map.unit && (
                        <span className="text-[10px] text-slate-400">
                          {map.unit}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {map.title}
                    </h3>

                    {map.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {map.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    إشراف: {map.author || 'أ. محمود صيبعة'}
                  </span>

                  <div className="flex items-center gap-2">
                    {hasMarkdown ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveInteractiveMindMap(map);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        <GitFork className="w-3.5 h-3.5" />
                        <span>استعراض الشجرة</span>
                      </button>
                    ) : null}

                    {map.imageUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePreviewImage(map.imageUrl || null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="تكبير الصورة"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}

                    {map.pdfUrl && (
                      <a
                        href={map.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Interactive Hierarchical Mind Map Modal (NotebookLM Style) */}
      {activeInteractiveMindMap && (
        <InteractiveMindMap
          mindmap={activeInteractiveMindMap}
          subjectName={curriculum.find(s => s.id === activeInteractiveMindMap.subjectId)?.name}
          subjectColor={curriculum.find(s => s.id === activeInteractiveMindMap.subjectId)?.color}
          onClose={() => setActiveInteractiveMindMap(null)}
        />
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {activePreviewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
            <div className="relative max-w-4xl max-h-[90vh] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-2 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">معاينة الخريطة بالحجم الكامل</span>
                <button
                  onClick={() => setActivePreviewImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                <img 
                  src={activePreviewImage} 
                  alt="Mind Map High Res Preview" 
                  className="max-h-[80vh] w-auto object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
