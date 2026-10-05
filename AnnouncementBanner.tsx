import React, { useState } from 'react';
import { 
  Radio, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Maximize2, 
  Archive, 
  Clock 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';

export const AnnouncementBanner: React.FC = () => {
  const { 
    announcements, 
    dismissedAnnouncementIds, 
    dismissAnnouncement, 
    restoreAnnouncements 
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Filter out dismissed announcements
  const activeList = announcements.filter(
    a => a.isActive && !dismissedAnnouncementIds.includes(a.id)
  );

  // Format relative time in Arabic
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      const diffDays = Math.floor(diffHours / 24);
      return `منذ ${diffDays} يوم`;
    } catch {
      return 'حديثاً';
    }
  };

  if (activeList.length === 0) {
    return null;
  }

  const current = activeList[currentIndex % activeList.length];

  return (
    <>
      <div className="w-full bg-gradient-to-r from-rose-950/40 via-indigo-950/30 to-slate-950 border-b border-indigo-950/50 px-3 sm:px-6 py-2.5">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Live broadcast badge and timestamp */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              <span>بث إداري مباشر • لوحة التحكم</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 flex items-center gap-1 hidden sm:flex">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatTimeAgo(current.date)}</span>
            </span>
          </div>

          {/* Headline and quick read */}
          <div className="flex-1 min-w-0 w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 text-slate-200">
            <p className="truncate font-medium max-w-xl text-right">
              <span className="text-indigo-300 font-semibold ml-1">[{current.title}]</span>
              <span className="text-slate-300 hidden md:inline">{current.content}</span>
            </p>
            <button
              onClick={() => setSelectedAnnouncement(current)}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium whitespace-nowrap text-[11px] flex items-center gap-0.5 shrink-0"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">قراءة الإعلان كاملاً</span>
              <span className="sm:hidden">التفاصيل</span>
            </button>
          </div>

          {/* Navigation & Dismiss */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {activeList.length > 1 && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-slate-400">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeList.length - 1))}
                  className="hover:text-white p-0.5"
                  title="السابق"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] px-1 tabular-nums">
                  {(currentIndex % activeList.length) + 1}/{activeList.length}
                </span>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % activeList.length)}
                  className="hover:text-white p-0.5"
                  title="التالي"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setIsArchiveOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="أرشيف الإعلانات"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => dismissAnnouncement(current.id)}
              className="text-slate-400 hover:text-red-400 p-1"
              title="إخفاء هذا الإعلان"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Expanded Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-amber-900/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-base font-bold text-amber-300">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="my-4 text-sm text-slate-200 leading-relaxed space-y-3">
              <p>{selectedAnnouncement.content}</p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
              <span>المرسل: {selectedAnnouncement.author}</span>
              <span>{formatTimeAgo(selectedAnnouncement.date)}</span>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">أرشيف التعاميم والإعلانات الإدارية</h3>
              </div>
              <button
                onClick={() => setIsArchiveOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {announcements.map((ann) => (
                <div 
                  key={ann.id} 
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-300">{ann.title}</h4>
                    <span className="text-[11px] text-slate-500">{formatTimeAgo(ann.date)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
                  <div className="text-[11px] text-slate-500">
                    {ann.author}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 p-3 flex justify-between items-center bg-slate-950/40">
              <button
                onClick={restoreAnnouncements}
                className="text-xs text-amber-400 hover:underline"
              >
                إلغاء إخفاء جميع الإعلانات
              </button>
              <button
                onClick={() => setIsArchiveOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
