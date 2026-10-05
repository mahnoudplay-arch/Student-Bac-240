import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Map, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2,
  GitFork,
  ArrowLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TimeBlock } from '../types';

export const JourneyStats: React.FC = () => {
  const { 
    timeBlocks, 
    addTimeBlock, 
    removeTimeBlock, 
    roadmap, 
    toggleRoadmapItem,
    mindmaps,
    setActiveTab
  } = useApp();

  const [activeSection, setActiveSection] = useState<'planner' | 'roadmap'>('planner');

  // Add block state
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState(14);
  const [newEnd, setNewEnd] = useState(16);
  const [newType, setNewType] = useState<TimeBlock['type']>('study');
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Calculate 24 hour allocation
  let scheduledHours = 0;
  let studyHours = 0;
  let sleepHours = 0;
  let breakHours = 0;

  timeBlocks.forEach((b) => {
    let diff = b.endHour - b.startHour;
    if (diff < 0) diff += 24;
    scheduledHours += diff;
    if (b.type === 'study') studyHours += diff;
    else if (b.type === 'sleep') sleepHours += diff;
    else breakHours += diff;
  });

  const freeHours = Math.max(0, 24 - scheduledHours);

  const handleAddBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTimeBlock({
      title: newTitle.trim(),
      startHour: newStart,
      endHour: newEnd,
      type: newType
    });

    setNewTitle('');
    setIsAddingBlock(false);
  };

  const getBlockColor = (type: TimeBlock['type']) => {
    switch (type) {
      case 'study': return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
      case 'sleep': return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300';
      case 'school': return 'border-blue-500/40 bg-blue-500/10 text-blue-300';
      case 'break': return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
      default: return 'border-slate-700 bg-slate-800 text-slate-300';
    }
  };

  const getBlockTypeName = (type: TimeBlock['type']) => {
    switch (type) {
      case 'study': return 'مذاكرة مركزة';
      case 'sleep': return 'نوم صحي';
      case 'school': return 'دوام مدرسي';
      case 'break': return 'استراحة ونشاط';
      default: return 'عام';
    }
  };

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>الجدول الدراسي وخريطة الطريق</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            توزيع ساعات اليوم ومحطات المنهاج حتى الامتحان النهائي.
          </p>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection('planner')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                activeSection === 'planner'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الجدول اليومي
            </button>
            <button
              onClick={() => setActiveSection('roadmap')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                activeSection === 'roadmap'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              خريطة الطريق 2026
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 24-HOUR PLANNER & OFFICIAL SCHEDULE */}
      {activeSection === 'planner' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 24-Hour Utilization Dashboard Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>توزيع الـ 24 ساعة اليومية المعتمد</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  حساب الوقت الشاغر المتبقي لاستثماره في حل بنك مسائل الأتمتة
                </p>
              </div>

              <button
                onClick={() => setIsAddingBlock(!isAddingBlock)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/25 text-xs font-semibold self-start sm:self-auto transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة كتلة زمنية</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <span className="block text-[11px] text-slate-400 font-semibold">مذاكرة مركزة</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tabular-nums">{studyHours} ساعة</span>
              </div>
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                <span className="block text-[11px] text-slate-400 font-semibold">نوم صحي</span>
                <span className="text-base sm:text-lg font-black text-indigo-400 font-mono tabular-nums">{sleepHours} ساعة</span>
              </div>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                <span className="block text-[11px] text-slate-400 font-semibold">استراحة ومدرسة</span>
                <span className="text-base sm:text-lg font-black text-sky-400 font-mono tabular-nums">{breakHours} ساعة</span>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                <span className="block text-[11px] text-slate-400 font-semibold">وقت شاغر متبقٍ</span>
                <span className="text-base sm:text-lg font-black text-slate-200 font-mono tabular-nums">{freeHours} ساعة</span>
              </div>
            </div>

            {/* 24-Hour Visual Scale */}
            <div className="pt-2">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800">
                {timeBlocks.map((b) => {
                  let diff = b.endHour - b.startHour;
                  if (diff < 0) diff += 24;
                  const pct = (diff / 24) * 100;
                  const color = 
                    b.type === 'study' ? 'bg-emerald-500' :
                    b.type === 'sleep' ? 'bg-indigo-500' :
                    b.type === 'school' ? 'bg-blue-500' : 'bg-sky-400';

                  return (
                    <div
                      key={b.id}
                      style={{ width: `${pct}%` }}
                      className={`h-full ${color} opacity-80`}
                      title={`${b.title} (${diff} ساعة)`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Block Form Drawer */}
          {isAddingBlock && (
            <form onSubmit={handleAddBlockSubmit} className="rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-4 space-y-3">
              <div className="text-xs font-bold text-indigo-300">
                إضافة كتلة زمنية جديدة لجدول اليوم
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="عنوان النشاط (مثال: حل مسائل نواسات)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TimeBlock['type'])}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="study">مذاكرة مركزة</option>
                    <option value="sleep">نوم صحي</option>
                    <option value="school">دوام مدرسي</option>
                    <option value="break">استراحة ونشاط</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={newStart}
                    onChange={(e) => setNewStart(parseInt(e.target.value, 10))}
                    title="ساعة البدء (0-23)"
                    className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 text-center font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-xs">إلى</span>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={newEnd}
                    onChange={(e) => setNewEnd(parseInt(e.target.value, 10))}
                    title="ساعة الانتهاء (0-24)"
                    className="w-1/2 rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 text-center font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingBlock(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  حفظ الكتلة
                </button>
              </div>
            </form>
          )}

          {/* Time Blocks List */}
          <div className="space-y-2">
            {timeBlocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>بانتظار اعتماد ونشر جدول المذاكرة وتوزيع الحصص من قبل الإدارة</span>
                </div>
                <p className="text-slate-500 max-w-md mx-auto">
                  يقوم المشرف العام (أ. محمود صيبعة) بإدخال خطط وجداول المذاكرة الوزارية المعتمدة عبر لوحة الإدارة لتظهر هنا لحظياً. يمكنك أيضاً البدء بإضافة كتل جدولك الشخصي الآن.
                </p>
                <button
                  onClick={() => setIsAddingBlock(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                >
                  إضافة أول كتلة زمنية
                </button>
              </div>
            ) : (
              timeBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${getBlockColor(block.type)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold tabular-nums px-2.5 py-1 rounded bg-slate-950/70" dir="ltr">
                      {block.startHour.toString().padStart(2, '0')}:00 - {block.endHour.toString().padStart(2, '0')}:00
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">{block.title}</span>
                        {block.isOfficial && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                            معتمد وزارياً
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-75">{getBlockTypeName(block.type)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTimeBlock(block.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* TAB 2: ROADMAP INTERACTIVE SECTION */}
      {activeSection === 'roadmap' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Map className="w-4 h-4 text-indigo-400" />
              <span>خريطة طريق البكالوريا العلمي — دورة 2026</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              المحطات الأساسية لتقسيم الجهد على مدار العام وفق التوجيهات الوزارية والإشراف الأكاديمي للأستاذ محمود صيبعة.
            </p>
          </div>

          <div className="space-y-4">
            {roadmap.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>بانتظار نشر محطات خريطة الطريق الوزارية من قبل الإدارة</span>
                </div>
                <p className="text-slate-500 max-w-md mx-auto">
                  تتزامن محطات التقدم الأكاديمي وقوائم التحقق الامتحانية لعام 2026 لحظياً فور نشرها من المشرف العام في منصة الإدارة عبر قاعدة بيانات Firebase السحابية.
                </p>
              </div>
            ) : (
              roadmap.map((stage, idx) => {
                const checklist = stage.checklist || [];
                const completedTasks = checklist.filter(c => c.completed).length;
                const totalTasks = checklist.length;
                const isStageComplete = totalTasks > 0 && completedTasks === totalTasks;

                return (
                  <div 
                    key={stage.id}
                    className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                      isStageComplete 
                        ? 'border-emerald-500/30 bg-emerald-950/10' 
                        : 'border-slate-800 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {stage.phase}
                          </h3>
                        </div>
                        {stage.months && (
                          <span className="text-xs text-indigo-400 font-semibold block mt-1">
                            الفترة الزمنية: {stage.months}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono text-slate-400 tabular-nums self-end sm:self-auto">
                        {completedTasks} / {totalTasks} مهام مكتملة
                      </span>
                    </div>

                    {stage.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {stage.description}
                      </p>
                    )}

                    {/* Checklist Items */}
                    <div className="space-y-2 pt-1">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleRoadmapItem(stage.id, item.id)}
                          className={`cursor-pointer flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-colors ${
                            item.completed
                              ? 'border-emerald-500/30 bg-emerald-950/20 text-slate-300'
                              : 'border-slate-800/80 bg-slate-950/60 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <button className="shrink-0 text-slate-500">
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 hover:text-indigo-400" />
                            )}
                          </button>
                          <span className={item.completed ? 'line-through text-slate-500' : ''}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
};
