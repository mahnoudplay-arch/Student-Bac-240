import React from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  BookOpen, 
  Clock, 
  Layers, 
  Sparkles,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { AIToolAction } from '../types';
import { useApp, NavTab } from '../context/AppContext';

interface AIToolActionCardsProps {
  actions: AIToolAction[];
}

export const AIToolActionCards: React.FC<AIToolActionCardsProps> = ({ actions }) => {
  const { setActiveTab } = useApp();

  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-3.5 space-y-2.5 pt-2 border-t border-slate-800/80">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>إجراءات نفذها الذكاء الاصطناعي على المنصة (Tool Actions):</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {actions.map((act) => {
          switch (act.toolName) {
            case 'complete_plan_task':
              return (
                <div 
                  key={act.id}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-200">{act.title}</div>
                      <div className="text-[11px] text-emerald-400/80 mt-0.5">{act.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="self-start sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/50 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-200 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <span>عرض الخطة</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              );

            case 'navigate_to_section':
              return (
                <div 
                  key={act.id}
                  className="rounded-xl border border-sky-500/30 bg-sky-950/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <ExternalLink className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sky-200">{act.title}</div>
                      <div className="text-[11px] text-sky-400/80 mt-0.5">{act.description}</div>
                    </div>
                  </div>
                  {act.actionPayload?.targetTab && (
                    <button
                      onClick={() => setActiveTab(act.actionPayload.targetTab as NavTab)}
                      className="self-start sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-900/50 hover:bg-sky-900 border border-sky-700/50 text-sky-200 text-[11px] font-semibold transition-colors shrink-0"
                    >
                      <span>فتح القسم</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );

            case 'add_to_mistake_bank':
              return (
                <div 
                  key={act.id}
                  className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-200">{act.title}</div>
                      <div className="text-[11px] text-amber-400/80 mt-0.5">{act.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('mistakeBank')}
                    className="self-start sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-900 border border-amber-700/50 text-amber-200 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <span>بنك الأخطاء</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              );

            case 'start_study_timer':
              return (
                <div 
                  key={act.id}
                  className="rounded-xl border border-teal-500/30 bg-teal-950/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-bold text-teal-200">{act.title}</div>
                      <div className="text-[11px] text-teal-400/80 mt-0.5">{act.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('timer')}
                    className="self-start sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-900/50 hover:bg-teal-900 border border-teal-700/50 text-teal-200 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <span>شاشة المؤقت</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              );

            case 'create_flashcards':
              return (
                <div 
                  key={act.id}
                  className="rounded-xl border border-purple-500/30 bg-purple-950/25 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-purple-200">{act.title}</div>
                      <div className="text-[11px] text-purple-400/80 mt-0.5">{act.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('flashcards')}
                    className="self-start sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-900 border border-purple-700/50 text-purple-200 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    <span>استعراض البطاقات</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              );

            default:
              return (
                <div 
                  key={act.id}
                  className="rounded-xl border border-slate-700 bg-slate-900/50 p-2.5 text-xs text-slate-300"
                >
                  <span className="font-semibold text-white">{act.title}</span>: {act.description}
                </div>
              );
          }
        })}
      </div>
    </div>
  );
};
