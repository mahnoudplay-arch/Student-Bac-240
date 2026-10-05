import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Medal, 
  ShieldCheck, 
  Filter, 
  Award, 
  CheckCircle2, 
  Lock,
  UserCheck,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SYRIAN_GOVERNORATES, LeaderboardEntry } from '../data/initialData';
import { StudentProfileModal } from './StudentProfileModal';

export const ChallengeView: React.FC = () => {
  const { user, leaderboard } = useApp();
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<LeaderboardEntry | null>(null);

  // Insert current user into leaderboard if logged in
  const allEntries: LeaderboardEntry[] = [...leaderboard];
  if (user) {
    const currentUserHours = Math.round((user.totalStudyMinutes || 0) / 60);
    const existingIndex = allEntries.findIndex(e => 
      (user.docId && e.id === user.docId) ||
      e.id === user.studentCode || 
      e.id === user.id ||
      e.fullName === user.fullName ||
      e.fullName === `${user.fullName} (أنت)`
    );

    const userEntry: LeaderboardEntry = {
      id: user.docId || user.studentCode || user.id,
      fullName: `${user.fullName} (أنت)`,
      governorate: user.governorate,
      streakDays: user.streakDays || 0,
      studyHours: currentUserHours,
      rank: 0,
      badge: user.rankTitle
    };

    if (existingIndex >= 0) {
      allEntries[existingIndex] = userEntry;
    } else {
      allEntries.push(userEntry);
    }
  }

  // Sort: streakDays desc, then studyHours desc
  allEntries.sort((a, b) => {
    if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
    return b.studyHours - a.studyHours;
  });

  // Assign updated ranks
  allEntries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  const filteredEntries = allEntries.filter(e => {
    if (selectedGovernorate === 'all') return true;
    return e.governorate === selectedGovernorate;
  });

  const topThree = filteredEntries.slice(0, 3);

  // Milestones list
  const milestones = [
    { days: 3, title: 'انطلاقة الشغف', badge: '🥉', desc: 'أول 3 أيام متتالية من المذاكرة المنضبطة' },
    { days: 7, title: 'أسبوع الالتزام الخارق', badge: '🥈', desc: 'إتمام أسبوع كامل دون انقطاع' },
    { days: 14, title: 'عادة التفوق الراسخة', badge: '🥇', desc: 'أسبوعان من بناء عادات الامتياز' },
    { days: 30, title: 'محارب الـ 240', badge: '🏆', desc: 'شهر كامل من العزيمة الثابتة نحو التامة' },
    { days: 60, title: 'أسطورة البكالوريا', badge: '👑', desc: 'شهران من الثبات والريادة الأكاديمية' },
    { days: 100, title: 'قمة الجمهورية', badge: '🌟', desc: '100 يوم من الإتقان والوصول لأعلى المراتب' }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>لوحة المتصدرين وتحدي الاستمرارية</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ترتيب الطلاب حسب ساعات المذاكرة وسلسلة الالتزام.
          </p>
        </div>

        {/* Filter by governorate */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">كافة المحافظات السورية</option>
            {SYRIAN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>محافظة {g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Honor Podium for Top 3 Students (When available) */}
      {topThree.length >= 3 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          
          {/* 2nd Place (Silver) */}
          <div 
            onClick={() => setSelectedStudentForModal(topThree[1])}
            className="cursor-pointer group rounded-2xl border border-slate-800 bg-[#101622] hover:border-slate-700 transition-all p-5 flex flex-col items-center justify-between text-center relative order-2 sm:order-1 sm:mt-6 shadow-sm"
            title="انقر لعرض الملف الأكاديمي والإحصائيات"
          >
            <span className="text-3xl mb-1 group-hover:scale-105 transition-transform">🥈</span>
            <div className="h-6 w-6 rounded-full bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center mb-2">
              2
            </div>
            <h3 className="font-semibold text-sm text-slate-100 truncate max-w-full">
              {topThree[1].fullName}
            </h3>
            <span className="text-xs text-slate-400 mt-0.5">محافظة {topThree[1].governorate}</span>

            <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex justify-around text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">السلسلة</span>
                <span className="font-semibold text-slate-200 font-mono tabular-nums">{topThree[1].streakDays} يوم</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">المذاكرة</span>
                <span className="font-semibold text-slate-200 font-mono tabular-nums">{topThree[1].studyHours} ساعة</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 font-medium">
              عرض الملف الشخصي ←
            </span>
          </div>

          {/* 1st Place (Gold) */}
          <div 
            onClick={() => setSelectedStudentForModal(topThree[0])}
            className="cursor-pointer group rounded-2xl border border-slate-700 bg-[#101622] hover:border-slate-600 p-6 flex flex-col items-center justify-between text-center relative order-1 sm:order-2 shadow-md transition-all"
            title="انقر لعرض الملف الأكاديمي والإحصائيات"
          >
            <span className="text-4xl mb-1 group-hover:scale-105 transition-transform">🥇</span>
            <div className="h-7 w-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center mb-2">
              1
            </div>
            <h3 className="font-bold text-base text-slate-100 truncate max-w-full">
              {topThree[0].fullName}
            </h3>
            <span className="text-xs text-slate-400 mt-0.5">متصدر الجمهورية • محافظة {topThree[0].governorate}</span>

            <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex justify-around text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">السلسلة</span>
                <span className="font-bold text-amber-400/90 font-mono text-base tabular-nums">{topThree[0].streakDays} يوم</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">إجمالي المذاكرة</span>
                <span className="font-bold text-slate-100 font-mono text-base tabular-nums">{topThree[0].studyHours} ساعة</span>
              </div>
            </div>
            <span className="text-[11px] text-amber-300/90 group-hover:text-amber-200 mt-2 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>عرض الملف الشخصي والإحصائيات ←</span>
            </span>
          </div>

          {/* 3rd Place (Bronze) */}
          <div 
            onClick={() => setSelectedStudentForModal(topThree[2])}
            className="cursor-pointer group rounded-2xl border border-slate-800 bg-[#101622] hover:border-slate-700 transition-all p-5 flex flex-col items-center justify-between text-center relative order-3 sm:mt-8 shadow-sm"
            title="انقر لعرض الملف الأكاديمي والإحصائيات"
          >
            <span className="text-3xl mb-1 group-hover:scale-105 transition-transform">🥉</span>
            <div className="h-6 w-6 rounded-full bg-slate-800 text-amber-500/80 font-bold text-xs flex items-center justify-center mb-2 border border-slate-700">
              3
            </div>
            <h3 className="font-semibold text-sm text-slate-100 truncate max-w-full">
              {topThree[2].fullName}
            </h3>
            <span className="text-xs text-slate-400 mt-0.5">محافظة {topThree[2].governorate}</span>

            <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex justify-around text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">السلسلة</span>
                <span className="font-semibold text-slate-200 font-mono tabular-nums">{topThree[2].streakDays} يوم</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">المذاكرة</span>
                <span className="font-semibold text-slate-200 font-mono tabular-nums">{topThree[2].studyHours} ساعة</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 font-medium">
              عرض الملف الشخصي ←
            </span>
          </div>

        </div>
      ) : null}

      {/* Leaderboard Table List */}
      <div className="rounded-2xl border border-slate-800 bg-[#101622] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-400/90" />
            <span>قائمة شرف طلاب البكالوريا العلمي</span>
          </h2>
          <span className="text-xs text-slate-500">
            خصوصية تامة: أرقام الهواتف مشفرة ومحمية
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <p>لا يوجد متصدرين مسجلين في هذا التصنيف حتى الآن.</p>
            <p className="text-slate-500">قم بتفعيل حسابك وسجل جلسة تركيز لتكون أول المتصدرين في محافظتك!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredEntries.map((student) => {
              const isCurrentUser = user && (
                student.id === user.studentCode ||
                student.id === user.id ||
                (user.docId && student.id === user.docId) ||
                student.fullName.includes('(أنت)')
              );

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentForModal(student)}
                  className={`cursor-pointer group flex items-center justify-between p-3.5 sm:px-6 transition-all ${
                    isCurrentUser
                      ? 'bg-indigo-950/20 border-r-2 border-indigo-400 hover:bg-indigo-950/30'
                      : 'hover:bg-slate-800/40'
                  }`}
                  title="انقر لعرض الملف الأكاديمي وإحصائيات الطالب"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      student.rank === 1 ? 'bg-amber-400/90 text-slate-950 font-black' :
                      student.rank === 2 ? 'bg-slate-700 text-slate-100' :
                      student.rank === 3 ? 'bg-slate-800 text-amber-400/90 border border-slate-700' :
                      'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-slate-200'
                    }`}>
                      {student.rank}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isCurrentUser ? 'text-indigo-300' : 'text-slate-200 group-hover:text-indigo-300 transition-colors'}`}>
                          {student.fullName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-bold px-1.5 py-0.5 rounded">
                            أنت
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
                          (عرض الملف)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>محافظة {student.governorate}</span>
                        <span>·</span>
                        <span className="text-amber-400/80">{student.badge}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="flex items-center gap-1 font-mono font-bold text-amber-400/90 tabular-nums">
                        <Flame className="w-3.5 h-3.5 text-amber-400/90" />
                        <span>{student.streakDays} يوم</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block">{student.studyHours} ساعة مذاكرة</span>
                    </div>

                    <div className="p-1 rounded-lg text-slate-500 group-hover:text-slate-300 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievement Milestones Showcase */}
      <div className="rounded-2xl border border-slate-800 bg-[#101622] p-5 sm:p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400/90" />
            <span>أوسمة إنجاز السلسلة (Milestones)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تُفتح الأوسمة تلقائياً عند مواصلة المذاكرة المتتالية دون انقطاع
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {milestones.map((m) => {
            const currentStreak = user?.streakDays || 0;
            const isUnlocked = currentStreak >= m.days;

            return (
              <div
                key={m.days}
                className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                  isUnlocked
                    ? 'border-amber-900/30 bg-amber-950/20 text-slate-200'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-500 opacity-60'
                }`}
              >
                <span className="text-2xl">{m.badge}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isUnlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                      {m.title}
                    </span>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {m.desc} ({m.days} يوماً)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Profile Modal for viewing other students */}
      <StudentProfileModal
        student={selectedStudentForModal}
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
      />

    </div>
  );
};
