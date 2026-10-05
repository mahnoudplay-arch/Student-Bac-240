import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Flame, 
  Clock, 
  Award, 
  ShieldCheck, 
  BookOpen, 
  MapPin, 
  Trophy, 
  Sparkles,
  CheckCircle2,
  Calendar,
  Zap
} from 'lucide-react';
import { LeaderboardEntry } from '../data/initialData';
import { getStudentPublicDetails } from '../services/firebase';

interface StudentProfileModalProps {
  student: LeaderboardEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const [extraDetails, setExtraDetails] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !student) {
      setExtraDetails(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getStudentPublicDetails(student.id)
      .then((data) => {
        if (isMounted) {
          setExtraDetails(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  // Derive extra stats from Firestore document if available
  const completedLessons = Array.isArray(extraDetails?.progress?.completedLessons)
    ? extraDetails.progress.completedLessons.length
    : Math.min(Math.round(student.studyHours * 1.5), 180);

  const watchedVideos = Array.isArray(extraDetails?.progress?.watchedVideos)
    ? extraDetails.progress.watchedVideos.length
    : Math.min(Math.round(student.studyHours * 0.8), 95);

  const studySessionsCount = Array.isArray(extraDetails?.progress?.studySessions)
    ? extraDetails.progress.studySessions.length
    : Math.max(Math.round(student.studyHours / 1.5), student.streakDays);

  const milestones = [
    { days: 3, title: 'انطلاقة الشغف', badge: '🥉', desc: 'أول 3 أيام متتالية' },
    { days: 7, title: 'أسبوع الالتزام الخارق', badge: '🥈', desc: 'أسبوع كامل دون انقطاع' },
    { days: 14, title: 'عادة التفوق الراسخة', badge: '🥇', desc: 'أسبوعان من بناء عادات الامتياز' },
    { days: 30, title: 'محارب الـ 240', badge: '🏆', desc: 'شهر كامل من العزيمة الثابتة' },
    { days: 60, title: 'أسطورة البكالوريا', badge: '👑', desc: 'شهران من الثبات والريادة' },
    { days: 100, title: 'قمة الجمهورية', badge: '🌟', desc: '100 يوم من الإتقان التام' }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-[#0c1017] shadow-2xl"
        >
          {/* Top Banner */}
          <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Rank badge top right */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/70 text-xs font-semibold text-amber-300">
              <Trophy className="w-3.5 h-3.5 text-amber-400/90" />
              <span>المرتبة #{student.rank} على مستوى الجمهورية</span>
            </div>
          </div>

          {/* Student Profile Card Content */}
          <div className="px-6 pb-6 pt-0 space-y-6 relative">
            
            {/* Avatar & Header Info */}
            <div className="flex items-end justify-between -mt-10 gap-4">
              <div className="relative">
                <div className="h-18 w-18 rounded-2xl bg-slate-800 border-4 border-[#0c1017] text-white font-bold text-2xl flex items-center justify-center shadow-lg">
                  {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : '🎓'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-[#0c1017] flex items-center justify-center text-[9px] text-white font-bold" title="نشط على المنصة">
                  ✓
                </div>
              </div>

              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-medium">الفرع الدراسي</span>
                <span className="text-xs font-semibold text-slate-300 bg-slate-850 border border-slate-750 px-2.5 py-1 rounded-lg inline-block">
                  الثالث الثانوي العلمي (2026)
                </span>
              </div>
            </div>

            {/* Name, Governorate & Rank Title */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {student.fullName}
                </h2>
                <span title="طالب مسجل ومعتمد"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400/80" />
                  <span>محافظة {student.governorate}</span>
                </span>
                <span>·</span>
                <span className="text-amber-400/90 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{student.badge}</span>
                </span>
              </div>
            </div>

            {/* Core Statistics 4-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Streak */}
              <div className="rounded-2xl border border-slate-800 bg-[#101622] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400/90 text-xs mb-1 font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  <span>سلسلة الالتزام</span>
                </div>
                <div className="text-xl font-bold text-amber-300 font-mono tabular-nums">
                  {student.streakDays}
                </div>
                <span className="text-[10px] text-slate-400">يوماً متتالياً</span>
              </div>

              {/* Study Hours */}
              <div className="rounded-2xl border border-slate-800 bg-[#101622] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>المذاكرة</span>
                </div>
                <div className="text-xl font-bold text-slate-100 font-mono tabular-nums">
                  {student.studyHours}
                </div>
                <span className="text-[10px] text-slate-400">ساعة مسجلة</span>
              </div>

              {/* Completed Lessons */}
              <div className="rounded-2xl border border-slate-800 bg-[#101622] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-400/90 text-xs mb-1 font-medium">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>الدروس المنجزة</span>
                </div>
                <div className="text-xl font-bold text-emerald-400/90 font-mono tabular-nums">
                  {completedLessons}
                </div>
                <span className="text-[10px] text-slate-400">درساً منجزاً</span>
              </div>

              {/* Focus Sessions */}
              <div className="rounded-2xl border border-slate-800 bg-[#101622] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-indigo-400/80" />
                  <span>جلسات التركيز</span>
                </div>
                <div className="text-xl font-bold text-slate-200 font-mono tabular-nums">
                  {studySessionsCount}
                </div>
                <span className="text-[10px] text-slate-400">جلسة مكتملة</span>
              </div>

            </div>

            {/* Unlocked Milestones */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>أوسمة الإنجاز المحققة من الطالب</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {milestones.filter(m => student.streakDays >= m.days).length} من 6 أوسمة
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {milestones.map((m) => {
                  const isAchieved = student.streakDays >= m.days;
                  return (
                    <div
                      key={m.days}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                        isAchieved
                          ? 'border-amber-500/30 bg-amber-500/10 text-slate-200'
                          : 'border-slate-800 bg-slate-950/40 text-slate-600 opacity-50'
                      }`}
                    >
                      <span className="text-lg">{m.badge}</span>
                      <div className="min-w-0">
                        <span className={`block font-bold text-[11px] truncate ${isAchieved ? 'text-amber-300' : 'text-slate-500'}`}>
                          {m.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {m.days} أيام
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supervisor Official Stamp */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-300 block">منصة BAC-240 المعتمدة</span>
                <span className="text-[11px] text-slate-500">
                  الإشراف العام والتطوير: <strong className="text-slate-400">أ. محمود صيبعة</strong>
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                إغلاق الملف
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
