import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  Bookmark, 
  Plus, 
  Clock, 
  User, 
  FileText, 
  X, 
  PlayCircle, 
  Pause, 
  Sparkles,
  Tv,
  ListVideo,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Paperclip,
  Download,
  Headphones,
  FileCheck,
  Trash2,
  Share2,
  FolderOpen,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Music,
  FileDown,
  Timer,
  CheckSquare,
  Sparkle,
  Radio,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EducationalVideo, SubjectId, YouTubeChannel, YouTubePlaylist, VideoAttachment } from '../types';

export const YouTubeHub: React.FC = () => {
  const { 
    videos, 
    channels,
    playlists,
    libraryDocs,
    toggleVideoWatched, 
    toggleVideoFavorite, 
    updateVideoNotes, 
    addStudentVideoAttachment,
    removeStudentVideoAttachment,
    addCustomVideo, 
    curriculum,
    activeTheaterVideo,
    setActiveTheaterVideo,
    startAIChatWithVideo,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'channels' | 'playlists' | 'my_list'>('catalog');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Student attachment modal / form inside theater
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [newAttTitle, setNewAttTitle] = useState('');
  const [newAttUrl, setNewAttUrl] = useState('');
  const [newAttType, setNewAttType] = useState<VideoAttachment['type']>('pdf');

  // Add custom video modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customTeacher, setCustomTeacher] = useState('');
  const [customSubject, setCustomSubject] = useState<SubjectId>('physics');
  const [customCategory, setCustomCategory] = useState<EducationalVideo['category']>('explanation');

  // Video Theater state: tabs, notes, full-width mode & copy helpers (Timer removed as requested)
  const [theaterActiveTab, setTheaterActiveTab] = useState<'attachments' | 'notes' | 'audio_download' | 'playlist'>('attachments');
  const [theaterNotes, setTheaterNotes] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [isCinematicExpanded, setIsCinematicExpanded] = useState(false);

  useEffect(() => {
    if (activeTheaterVideo) {
      setTheaterNotes(activeTheaterVideo.notes || '');
      setTheaterActiveTab('attachments');
    } else {
      setIsCinematicExpanded(false);
    }
  }, [activeTheaterVideo?.id]);

  const handleNotesChange = (val: string) => {
    setTheaterNotes(val);
    if (activeTheaterVideo) {
      updateVideoNotes(activeTheaterVideo.id, val);
    }
  };

  const handleCopyVideoUrl = () => {
    if (!activeTheaterVideo) return;
    const url = `https://www.youtube.com/watch?v=${activeTheaterVideo.youtubeId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      showToast('تم نسخ رابط درس اليوتيوب إلى الحافظة');
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleCopyNotes = () => {
    if (!theaterNotes.trim()) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(theaterNotes);
      setCopiedNotes(true);
      showToast('تم نسخ ملاحظات الدرس إلى الحافظة');
      setTimeout(() => setCopiedNotes(false), 2500);
    }
  };

  const handleSwitchVideo = (targetVideo: EducationalVideo) => {
    setActiveTheaterVideo(targetVideo);
  };

  const handleAddAttachmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTheaterVideo || !newAttTitle.trim() || !newAttUrl.trim()) return;

    addStudentVideoAttachment(activeTheaterVideo.id, {
      title: newAttTitle.trim(),
      url: newAttUrl.trim(),
      type: newAttType || 'pdf'
    });

    showToast(`تمت إضافة المرفق "${newAttTitle.trim()}" لهذا الفيديو`);
    setNewAttTitle('');
    setNewAttUrl('');
    setIsAddingAttachment(false);
  };

  const handleCloseTheater = () => {
    setActiveTheaterVideo(null);
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    addCustomVideo({
      url: customUrl.trim(),
      title: customTitle.trim(),
      teacherName: customTeacher.trim(),
      subjectId: customSubject,
      category: customCategory
    });

    setCustomUrl('');
    setCustomTitle('');
    setCustomTeacher('');
    setIsAddModalOpen(false);
  };

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered videos for the catalog and my_list
  const filteredVideos = videos.filter(v => {
    if (activeTab === 'my_list' && !v.isFavorite && !v.isWatched && !v.id.startsWith('custom-')) {
      return false;
    }
    if (selectedSubject !== 'all' && v.subjectId !== selectedSubject) return false;
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    if (selectedChannelId && v.channelId !== selectedChannelId) return false;
    if (selectedPlaylistId && v.playlistId !== selectedPlaylistId) return false;
    return true;
  });

  // Selected Channel & its contents
  const activeChannel = channels.find(c => c.id === selectedChannelId);
  const channelPlaylists = activeChannel 
    ? playlists.filter(p => p.channelId === activeChannel.id)
    : [];
  const channelVideos = activeChannel
    ? videos.filter(v => v.channelId === activeChannel.id || channelPlaylists.some(p => p.videoIds?.includes(v.id) || p.id === v.playlistId))
    : [];

  // Selected Playlist & its contents
  const activePlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const playlistVideos = activePlaylist
    ? videos.filter(v => v.playlistId === activePlaylist.id || (activePlaylist.videoIds && (activePlaylist.videoIds.includes(v.id) || activePlaylist.videoIds.includes(v.youtubeId))))
    : [];
  const playlistChannel = activePlaylist
    ? channels.find(c => c.id === activePlaylist.channelId)
    : null;

  // Active theater navigation and related items
  const relatedSeriesVideos = activeTheaterVideo
    ? (activeTheaterVideo.playlistId 
        ? videos.filter(v => v.playlistId === activeTheaterVideo.playlistId)
        : videos.filter(v => v.subjectId === activeTheaterVideo.subjectId))
    : [];

  const currentVideoIdx = activeTheaterVideo 
    ? relatedSeriesVideos.findIndex(v => v.id === activeTheaterVideo.id) 
    : -1;
  const prevVideo = currentVideoIdx > 0 ? relatedSeriesVideos[currentVideoIdx - 1] : null;
  const nextVideo = currentVideoIdx >= 0 && currentVideoIdx < relatedSeriesVideos.length - 1 
    ? relatedSeriesVideos[currentVideoIdx + 1] 
    : null;
  const relatedLibraryFiles = activeTheaterVideo && libraryDocs
    ? libraryDocs.filter(doc => doc.subjectId === activeTheaterVideo.subjectId)
    : [];

  // Helper function to render a single video card
  const renderVideoCard = (video: EducationalVideo, index?: number) => {
    const subject = curriculum.find(s => s.id === video.subjectId);
    const channel = channels.find(c => c.id === video.channelId);
    const playlist = playlists.find(p => p.id === video.playlistId);

    return (
      <div 
        key={video.id}
        className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-rose-500/40 hover:bg-slate-900/80 transition-all shadow-sm"
      >
        {/* Thumbnail Header with Play Action */}
        <div 
          onClick={() => setActiveTheaterVideo(video)}
          className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              // Fallback to mqdefault if hqdefault is unavailable
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
          </div>

          {index !== undefined && (
            <span className="absolute top-2 left-2 bg-slate-900/90 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow">
              الدرس {index}
            </span>
          )}

          <span className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-xs text-[10px] font-mono font-semibold text-slate-200 px-2 py-0.5 rounded">
            {video.duration || `${video.durationMinutes} د`}
          </span>

          <span 
            className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
            style={{ backgroundColor: `${subject?.color || '#3B82F6'}33`, color: subject?.color || '#fff' }}
          >
            {subject?.name}
          </span>
        </div>

        {/* Content details */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h3 
              onClick={() => setActiveTheaterVideo(video)}
              className="text-xs sm:text-sm font-bold text-white hover:text-rose-300 transition-colors line-clamp-2 cursor-pointer leading-snug"
            >
              {video.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-2">
              <div className="flex items-center gap-1 text-slate-300">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span>{channel?.channelName || video.teacherName}</span>
              </div>
              {playlist && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-rose-400 truncate max-w-[150px]">
                  {playlist.playlistName}
                </span>
              )}
              {video.unit && (
                <span className="text-[10px] text-slate-500 truncate">
                  • {video.unit}
                </span>
              )}
            </div>
          </div>

          {/* AI Explanation Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              startAIChatWithVideo(video, subject?.name, video.lesson || video.unit);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 hover:from-indigo-900 hover:to-purple-900 text-indigo-200 hover:text-white border border-indigo-500/30 hover:border-indigo-400 text-xs font-bold transition-all shadow-sm active:scale-95 group/ai"
            title="تحليل وشرح هذا الفيديو بالذكاء الاصطناعي مع سلم التصحيح"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover/ai:rotate-12 transition-transform" />
            <span>✨ اشرح هذا الفيديو بالذكاء الاصطناعي</span>
          </button>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
            <button
              onClick={() => {
                toggleVideoWatched(video.id);
              }}
              className={`flex items-center gap-1 transition-colors ${
                video.isWatched ? 'text-emerald-400 font-semibold' : 'hover:text-slate-200'
              }`}
              title={video.isWatched ? 'تمت المشاهدة' : 'تعليم كمشاهد'}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{video.isWatched ? 'تمت المشاهدة' : 'لم يُشاهد'}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Attachment Badge */}
              {((video.attachments && video.attachments.length > 0) || (video.studentAttachments && video.studentAttachments.length > 0)) && (
                <span 
                  onClick={() => setActiveTheaterVideo(video)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20"
                  title="يوجد أوراق عمل وملخصات مرفقة مع هذا الفيديو"
                >
                  <Paperclip className="w-2.5 h-2.5" />
                  <span>{(video.attachments?.length || 0) + (video.studentAttachments?.length || 0)}</span>
                </span>
              )}

              <button
                onClick={() => {
                  toggleVideoFavorite(video.id);
                }}
                className={`p-1 transition-colors ${
                  video.isFavorite ? 'text-amber-400' : 'hover:text-amber-300'
                }`}
                title={video.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-rose-400" />
            <span>مسرح اليوتيوب التعليمي</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            مشاهدة دروس المنهاج بدون تشتيت.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors border border-slate-700 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فيديو إلى قائمتي</span>
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        
        {/* Main Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('channels');
              setSelectedChannelId(null);
              setSelectedPlaylistId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'channels'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>قنوات الأساتذة ({channels.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('playlists');
              setSelectedPlaylistId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'playlists'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
            }`}
          >
            <ListVideo className="w-3.5 h-3.5" />
            <span>قوائم التشغيل ({playlists.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('catalog');
              setSelectedChannelId(null);
              setSelectedPlaylistId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>كافة الدروس ({videos.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('my_list');
              setSelectedChannelId(null);
              setSelectedPlaylistId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'my_list'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-[#101622] border border-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>قائمتي ومفضلاتي</span>
          </button>
        </div>

        {/* Categories (Active in catalog tab) */}
        {activeTab === 'catalog' && (
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'explanation', label: 'شرح مفصل' },
              { id: 'problem_solving', label: 'حل مسائل' },
              { id: 'intensive', label: 'مكثفة' },
              { id: 'exam_review', label: 'مراجعة دورات' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-slate-800 text-rose-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Subject Filter Bar (for catalog & channels) */}
      {(activeTab === 'catalog' || (activeTab === 'channels' && !selectedChannelId)) && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubject === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            كافة المواد
          </button>
          {curriculum.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubject === s.id
                  ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: CHANNELS VIEW (قنوات الأساتذة) */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          {/* If a channel is selected: Show Channel Detail Page */}
          {activeChannel ? (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => setSelectedChannelId(null)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                <span>العودة لكافة قنوات الأساتذة</span>
              </button>

              {/* Channel Hero Header Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
                {activeChannel.bannerUrl && (
                  <div className="h-32 sm:h-44 w-full bg-slate-950 overflow-hidden">
                    <img 
                      src={activeChannel.bannerUrl} 
                      alt="" 
                      className="w-full h-full object-cover opacity-80" 
                    />
                  </div>
                )}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {activeChannel.logoUrl ? (
                      <img 
                        src={activeChannel.logoUrl} 
                        alt={activeChannel.channelName} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-rose-500/40 shadow-md shrink-0" 
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                        <Tv className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <span>{activeChannel.channelName}</span>
                      </h2>
                      {activeChannel.description && (
                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                          {activeChannel.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="text-rose-400 font-bold">
                          {channelPlaylists.length} قائمة تشغيل
                        </span>
                        <span>•</span>
                        <span>{channelVideos.length} فيديو تعليمي</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Playlists Section */}
              {channelPlaylists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-rose-400" />
                    <span>قوائم تشغيل القناة ({channelPlaylists.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channelPlaylists.map(playlist => {
                      const plVideosCount = playlist.videoIds?.length || 
                        videos.filter(v => v.playlistId === playlist.id).length;
                      return (
                        <div
                          key={playlist.id}
                          onClick={() => {
                            setSelectedPlaylistId(playlist.id);
                            setActiveTab('playlists');
                          }}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-rose-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                              <span className="flex items-center gap-1 text-rose-400 font-bold">
                                <ListVideo className="w-3.5 h-3.5" />
                                <span>قائمة تشغيل</span>
                              </span>
                              <span>{plVideosCount} درس</span>
                            </div>
                            <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                              {playlist.playlistName}
                            </h4>
                          </div>
                          <span className="text-xs text-slate-500 mt-3 group-hover:text-rose-400 transition-colors">
                            استعراض الدروس ←
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Channel Videos Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-rose-400" />
                  <span>كافة فيديوهات القناة ({channelVideos.length})</span>
                </h3>

                {channelVideos.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                    لم تتم إضافة فيديوهات بعد لهذه القناة من قبل الإدارة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channelVideos.map(video => renderVideoCard(video))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Channels Catalog Grid */
            <div>
              {channels.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>بانتظار قنوات الأساتذة من قبل الإدارة</span>
                  </div>
                  <p className="text-slate-500 max-w-md mx-auto">
                    يقوم المشرف العام (أ. محمود صيبعة) بربط وإضافة القنوات التعليمية الموثوقة لكل مادة، وستظهر هنا فور نشرها.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map(channel => {
                    const plCount = playlists.filter(p => p.channelId === channel.id).length;
                    const vCount = videos.filter(v => v.channelId === channel.id).length;

                    return (
                      <div
                        key={channel.id}
                        onClick={() => setSelectedChannelId(channel.id)}
                        className="group rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-rose-500/40 hover:bg-slate-900/80 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          {channel.bannerUrl ? (
                            <div className="h-24 w-full bg-slate-950 overflow-hidden">
                              <img src={channel.bannerUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          ) : (
                            <div className="h-16 w-full bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-950" />
                          )}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              {channel.logoUrl ? (
                                <img src={channel.logoUrl} alt={channel.channelName} className="w-12 h-12 rounded-xl object-cover border border-rose-500/30 shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                  <Tv className="w-6 h-6" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors truncate">
                                  {channel.channelName}
                                </h3>
                                {channel.subject && (
                                  <span className="text-[10px] text-rose-400 font-semibold">
                                    {channel.subject}
                                  </span>
                                )}
                              </div>
                            </div>

                            {channel.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {channel.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between text-xs text-slate-400">
                          <span className="text-rose-400 font-semibold">
                            {plCount} قوائم • {vCount} فيديو
                          </span>
                          <span className="text-slate-500 group-hover:text-white transition-colors flex items-center gap-1">
                            <span>استعراض الدروس</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAYLISTS VIEW (قوائم التشغيل) */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          {activePlaylist ? (
            /* Playlist Detail View */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                <span>العودة لكافة قوائم التشغيل</span>
              </button>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-bold mb-1">
                    <ListVideo className="w-4 h-4" />
                    <span>قائمة تشغيل معتمدة</span>
                    {playlistChannel && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300">{playlistChannel.channelName}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {activePlaylist.playlistName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    تتضمن {playlistVideos.length} درساً مرتباً للدراسة المتسلسلة
                  </p>
                </div>

                {playlistVideos.length > 0 && (
                  <button
                    onClick={() => setActiveTheaterVideo(playlistVideos[0])}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/20 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>بدء تشغيل القائمة</span>
                  </button>
                )}
              </div>

              {/* Videos of this playlist */}
              {playlistVideos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                  لا توجد فيديوهات مسجلة داخل قائمة التشغيل هذه حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlistVideos.map((video, idx) => renderVideoCard(video, idx + 1))}
                </div>
              )}
            </div>
          ) : (
            /* Playlists Grid */
            <div>
              {playlists.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold">
                    <ListVideo className="w-4 h-4 text-rose-400" />
                    <span>بانتظار قوائم التشغيل المعتمدة من قبل الإدارة</span>
                  </div>
                  <p className="text-slate-500 max-w-md mx-auto">
                    ستظهر هنا سلاسل الشروحات وقوائم التشغيل المنظمة حسب الوحدات والدروس فور إضافتها من قبل المشرف.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlists.map(playlist => {
                    const ch = channels.find(c => c.id === playlist.channelId);
                    const vCount = playlist.videoIds?.length || 
                      videos.filter(v => v.playlistId === playlist.id).length;

                    return (
                      <div
                        key={playlist.id}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-rose-500/40 hover:bg-slate-900/80 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                              <ListVideo className="w-4 h-4" />
                              <span>{ch?.channelName || 'قائمة تعليمية'}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                              {vCount} درس
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                            {playlist.playlistName}
                          </h3>
                        </div>

                        <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-xs text-slate-400">
                          <span className="text-[11px] text-slate-500">سلسلة شروحات متسلسلة</span>
                          <span className="text-rose-400 font-bold group-hover:underline flex items-center gap-1">
                            <span>استعراض</span>
                            <ChevronLeft className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3 & 4: CATALOG & MY LIST VIDEOS GRID */}
      {(activeTab === 'catalog' || activeTab === 'my_list') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>
                  {activeTab === 'my_list' 
                    ? 'لم تقم بحفظ أي فيديوهات في قائمتك بعد' 
                    : 'بانتظار نشر الشروحات المعتمدة من قبل الإدارة السحابية'}
                </span>
              </div>
              <p className="text-slate-500 max-w-md mx-auto">
                {activeTab === 'my_list'
                  ? 'يمكنك إضافة أي درس للمفضلة بالنقر على علامة المرجعية أو إضافة رابط يوتيوب خاص بك.'
                  : 'يقوم المشرف العام (أ. محمود صيبعة) بإضافة وترشيح الفيديوهات والشروحات وقوائم التشغيل المعتمدة للمنهاج عبر منصة الإدارة لتظهر هنا لحظياً في المسرح المعزول.'}
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/20"
              >
                إضافة فيديو يوتيوب إلى قائمتي
              </button>
            </div>
          ) : (
            filteredVideos.map(video => renderVideoCard(video))
          )}
        </div>
      )}

      {/* Advanced Video Theater Modal - Cinematic Focus Player */}
      {activeTheaterVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-1 sm:p-3 md:p-4">
          <div className={`w-full ${isCinematicExpanded ? 'max-w-[98vw] h-[98vh]' : 'max-w-5xl max-h-[96vh]'} flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-rose-950/30 overflow-hidden transition-all duration-300`}>
            
            {/* Minimalist Distraction-Free Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950 px-3 sm:px-5 py-3 shrink-0 gap-3">
              {/* Left: Clean Subject & Lesson Info */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {activeTheaterVideo.title}
                </h3>
                <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{activeTheaterVideo.teacherName}</span>
                </span>
              </div>

              {/* Right: Series Navigation & Window Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Series Navigation (Previous / Next) */}
                {prevVideo && (
                  <button
                    onClick={() => handleSwitchVideo(prevVideo)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
                    title={`السابق: ${prevVideo.title}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">السابق</span>
                  </button>
                )}

                {nextVideo && (
                  <button
                    onClick={() => handleSwitchVideo(nextVideo)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
                    title={`التالي: ${nextVideo.title}`}
                  >
                    <span className="hidden md:inline">التالي</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Cinematic Expand / Collapse */}
                <button
                  onClick={() => setIsCinematicExpanded(!isCinematicExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center"
                  title={isCinematicExpanded ? 'تصغير العرض' : 'توسيع الشاشة'}
                >
                  {isCinematicExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Close Theater */}
                <button
                  onClick={handleCloseTheater}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="إغلاق مسرح الفيديو"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Iframe Container */}
            <div className={`relative ${isCinematicExpanded ? 'h-[52vh] sm:h-[62vh]' : 'aspect-video'} w-full bg-black shrink-0 overflow-hidden`}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeTheaterVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeTheaterVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>

            {/* Clean Calm Control & Tabs Bar */}
            <div className="border-b border-slate-800/80 bg-slate-950 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Primary Actions: Watched & Favorite */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toggleVideoWatched(activeTheaterVideo.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                    activeTheaterVideo.isWatched
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{activeTheaterVideo.isWatched ? 'أتممت المشاهدة ✓' : 'تحديد كمكتمل'}</span>
                </button>

                <button
                  onClick={() => {
                    toggleVideoFavorite(activeTheaterVideo.id);
                  }}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    activeTheaterVideo.isFavorite
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-850'
                  }`}
                  title={activeTheaterVideo.isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${activeTheaterVideo.isFavorite ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleCopyVideoUrl}
                  className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors"
                  title="نسخ رابط الفيديو"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* AI Explanation in Theater */}
                <button
                  onClick={() => {
                    const subj = curriculum.find(s => s.id === activeTheaterVideo.subjectId);
                    startAIChatWithVideo(activeTheaterVideo, subj?.name, activeTheaterVideo.lesson || activeTheaterVideo.unit);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-900/40 transition-all active:scale-95"
                  title="تحليل وشرح هذا الفيديو بالذكاء الاصطناعي مع سلم التصحيح"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>اشرح لي بالفيديو مع المعلم الذكي ✨</span>
                </button>
              </div>

              {/* Quiet Focused Tabs */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setTheaterActiveTab('attachments')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    theaterActiveTab === 'attachments'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>المرفقات والملخصات</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-slate-300 font-mono">
                    {(activeTheaterVideo.attachments?.length || 0) + (activeTheaterVideo.studentAttachments?.length || 0) + relatedLibraryFiles.length}
                  </span>
                </button>

                <button
                  onClick={() => setTheaterActiveTab('notes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    theaterActiveTab === 'notes'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ملاحظاتي</span>
                  {theaterNotes.trim() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>

                {relatedSeriesVideos.length > 1 && (
                  <button
                    onClick={() => setTheaterActiveTab('playlist')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      theaterActiveTab === 'playlist'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <ListVideo className="w-3.5 h-3.5" />
                    <span>سلسلة الدروس</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-slate-300 font-mono">
                      {relatedSeriesVideos.length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents Deck */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 space-y-4">

              {/* TAB 1: Attachments & Worksheets */}
              {theaterActiveTab === 'attachments' && (
                <div className="space-y-4">
                  {/* Top Header & Add personal file toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-indigo-400" />
                        <span>الملفات وأوراق العمل المرتبطة بهذا الدرس</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">ملفات معتمدة من المنهاج وملخصات خاصة بك للدراسة المركزة</p>
                    </div>

                    <button
                      onClick={() => setIsAddingAttachment(!isAddingAttachment)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingAttachment ? 'إلغاء الإرفاق' : 'إرفاق رابط أو ملخص خاص'}</span>
                    </button>
                  </div>

                  {/* Add Student Attachment Form */}
                  {isAddingAttachment && (
                    <form onSubmit={handleAddAttachmentSubmit} className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
                      <div className="text-xs font-bold text-indigo-200">إضافة ملف أو ملخص دراسي خاص بك مرتبط بهذا الفيديو:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={newAttTitle}
                          onChange={(e) => setNewAttTitle(e.target.value)}
                          placeholder="اسم الملف (مثال: ملخص القوانين، ورقة عمل)"
                          className="sm:col-span-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          required
                        />
                        <input
                          type="url"
                          dir="ltr"
                          value={newAttUrl}
                          onChange={(e) => setNewAttUrl(e.target.value)}
                          placeholder="رابط الملف (Google Drive, Telegram, أو رابط ويب)"
                          className="sm:col-span-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          required
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={newAttType}
                            onChange={(e) => setNewAttType(e.target.value as VideoAttachment['type'])}
                            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                          >
                            <option value="pdf">مستند PDF</option>
                            <option value="summary">ملخص</option>
                            <option value="ladder">سلم تصحيح</option>
                            <option value="link">رابط ويب</option>
                          </select>
                          <button
                            type="submit"
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md whitespace-nowrap"
                          >
                            حفظ الملف
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 1. Admin Attachments */}
                  {activeTheaterVideo.attachments && activeTheaterVideo.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>الملفات المعتمدة للدرس (من إشراف أ. محمود صيبعة):</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeTheaterVideo.attachments.map((att, idx) => (
                          <a
                            key={att.id || `admin-att-${idx}`}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                                {att.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 shrink-0 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30">
                              <span>فتح</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Related Curriculum Documents from Library */}
                  {relatedLibraryFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>نماذج وسلالم وتلخيصات ذات صلة من المكتبة الإلكترونية:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {relatedLibraryFiles.slice(0, 4).map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/70 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-xs group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-200 group-hover:text-white truncate">
                                  {doc.title}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {doc.teacherOrSource} {doc.year ? `• دورة ${doc.year}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 shrink-0 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                              <span>تحميل</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Student Personal Attachments */}
                  {activeTheaterVideo.studentAttachments && activeTheaterVideo.studentAttachments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ملفاتك وملخصاتك الخاصة المرفقة:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeTheaterVideo.studentAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-500/25 bg-slate-900/90 hover:border-indigo-500/50 transition-all text-xs"
                          >
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 min-w-0 flex-1 hover:text-indigo-300"
                            >
                              <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span className="font-semibold text-slate-200 truncate">
                                {att.title}
                              </span>
                            </a>
                            <div className="flex items-center gap-1.5 shrink-0 mr-2">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30"
                              >
                                <span>عرض</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <button
                                onClick={() => removeStudentVideoAttachment(activeTheaterVideo.id, att.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                title="حذف هذا المرفق الخاص"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!activeTheaterVideo.attachments || activeTheaterVideo.attachments.length === 0) &&
                   (!activeTheaterVideo.studentAttachments || activeTheaterVideo.studentAttachments.length === 0) &&
                   relatedLibraryFiles.length === 0 && (
                    <div className="text-center py-8 rounded-2xl border border-dashed border-slate-800 p-6 space-y-2">
                      <FolderOpen className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-semibold">
                        لا توجد ملفات أو أوراق عمل مرفقة حالياً لهذا الفيديو.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        يمكنك إضافة رابط ملخصك أو دفترك على Google Drive أو Telegram بالنقر على "إرفاق رابط أو ملخص خاص" أعلاه.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Smart Lesson Notebook */}
              {theaterActiveTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span>دفتر ملاحظاتي للدرس</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">دوّن الملاحظات الدقيقة واستنتاجات الأستاذ</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyNotes}
                        disabled={!theaterNotes.trim()}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-40"
                        title="نسخ الملاحظات للحافظة"
                      >
                        {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNotes ? 'تم النسخ!' : 'نسخ الملاحظات'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={theaterNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="سجل هنا القوانين، الملاحظات الذهبية، الملاحظات على سلم التصحيح، أو أي ملاحظة مهمة تود تذكرها لاحقاً عند المراجعة..."
                      rows={7}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all font-sans leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
                      <span>💾 يتم الحفظ تلقائياً على جهازك لهذا الدرس</span>
                      <span>{theaterNotes.trim() ? `${theaterNotes.trim().split(/\s+/).length} كلمة` : 'فارغ'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Audio Converter & Offline Mode */}
              {theaterActiveTab === 'audio_download' && (
                <div className="space-y-4">
                  {/* Hero Box: Instant Direct Link Copy */}
                  <div className="p-4 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/30 via-slate-900 to-indigo-950/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-300 mb-1">
                          <Headphones className="w-4 h-4 text-rose-400" />
                          <span>تحميل الصوت MP3 للمشاهدة بدون إنترنت (أوفلاين)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
                          انسخ رابط الدرس مباشرة لتحويله إلى صوت MP3 وحفظه في هاتفك للمراجعة السريعة وتوفير باقة النت.
                        </p>
                      </div>

                      <button
                        onClick={handleCopyVideoUrl}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/25 shrink-0"
                      >
                        {copiedUrl ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedUrl ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط الفيديو فوراً'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 font-mono select-all overflow-x-auto">
                      <span className="text-slate-500 shrink-0">URL:</span>
                      <span className="text-indigo-300 truncate">https://www.youtube.com/watch?v={activeTheaterVideo.youtubeId}</span>
                    </div>
                  </div>

                  {/* Converter Portals Grid */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>خيارات ومواقع التحويل الفوري المباشر:</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Y2Mate MP3 Direct Link */}
                      <a
                        href={`https://www.y2mate.com/youtube/${activeTheaterVideo.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-rose-300">
                            محول Y2Mate السريع
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          فتح صفحة التنزيل مباشرة بصيغة MP3 صوت أو MP4 فيديو مخفف.
                        </p>
                      </a>

                      {/* Dirpy Audio Studio Link */}
                      <a
                        href={`https://dirpy.com/studio?url=https://www.youtube.com/watch?v=${activeTheaterVideo.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                            محول Dirpy المباشر
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          استخراج صوت نقي عالي الجودة ومجاني بدون إعلانات منبثقة.
                        </p>
                      </a>

                      {/* Cobalt Tools (Cleanest open downloader) */}
                      <a
                        href="https://cobalt.tools/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCopyVideoUrl}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                            أداة Cobalt النظيفة
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ينسخ الرابط ويفتح منصة Cobalt المفتوحة والمجانية 100%.
                        </p>
                      </a>
                    </div>
                  </div>

                  {/* Syrian Student Offline Tip Banner */}
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block mb-0.5">نصيحة توفير الباقة والدراسة أثناء انقطاع الكهرباء:</span>
                      تنزيل الدرس بصيغة MP3 يستهلك 4-8 ميغابايت فقط مقارنة بأكثر من 80 ميغابايت للفيديو، ويمكنك الاستماع له مع فتح الكتاب الورقي أو دفتر الملاحظات للمراجعة في أي وقت دون الحاجة لتوفر الإنترنت.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Playlist & Series */}
              {theaterActiveTab === 'playlist' && relatedSeriesVideos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ListVideo className="w-4 h-4 text-indigo-400" />
                        <span>سلسلة الدروس المترابطة ({relatedSeriesVideos.length} فيديو)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">انتقل بين دروس السلسلة بسلاسة دون الحاجة لمغادرة المسرح المعزول</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {relatedSeriesVideos.map((video, idx) => {
                      const isCurrent = video.id === activeTheaterVideo.id;
                      return (
                        <div
                          key={video.id}
                          onClick={() => !isCurrent && handleSwitchVideo(video)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                            isCurrent
                              ? 'border-indigo-500/60 bg-indigo-950/40 text-white shadow-sm ring-1 ring-indigo-500/30'
                              : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">
                                {video.title}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>{video.teacherName}</span>
                                <span>•</span>
                                <span>{video.duration || `${video.durationMinutes} د`}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 mr-2">
                            {video.isWatched && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>أُنجز</span>
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/40">
                                قيد التشغيل
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Add Custom Video Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" />
                <span>إضافة فيديو تعليمي إلى قائمتك</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVideoSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رابط يوتيوب (URL)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عنوان الفيديو أو الدرس
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="مثال: شرح درس التابع الأسي..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    اسم المدرس
                  </label>
                  <input
                    type="text"
                    value={customTeacher}
                    onChange={(e) => setCustomTeacher(e.target.value)}
                    placeholder="مثال: أ. محمود صيبعة"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المادة
                  </label>
                  <select
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value as SubjectId)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    {curriculum.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تصنيف الفيديو
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as EducationalVideo['category'])}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                >
                  <option value="explanation">شرح مفصل</option>
                  <option value="problem_solving">حل مسائل</option>
                  <option value="intensive">مكثفة</option>
                  <option value="exam_review">مراجعة دورات</option>
                </select>
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  حفظ في قائمتي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
