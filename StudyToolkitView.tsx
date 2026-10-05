import React, { useState } from 'react';
import { 
  Wrench, 
  Calculator, 
  Languages, 
  ArrowRightLeft, 
  FlaskConical, 
  ScanText, 
  LineChart,
  FlaskRound,
  Scroll,
  Activity,
  Sigma,
  PenTool,
  Zap,
  Sparkles
} from 'lucide-react';
import { ScientificCalculator } from './tools/ScientificCalculator';
import { SmartTranslator } from './tools/SmartTranslator';
import { UnitConverter } from './tools/UnitConverter';
import { ChemistryToolkit } from './tools/ChemistryToolkit';
import { TextOcrExtractor } from './tools/TextOcrExtractor';
import { FunctionGrapher } from './tools/FunctionGrapher';
import { EquationBalancer } from './tools/EquationBalancer';
import { ArabicGrammarEngine } from './tools/ArabicGrammarEngine';
import { PhysicsSimulator } from './tools/PhysicsSimulator';
import { CalculusSolver } from './tools/CalculusSolver';
import { QuickScratchpad } from './tools/QuickScratchpad';
import { sound } from '../services/sound';

export type ToolkitTab = 
  | 'calculator' 
  | 'grapher'
  | 'calculus'
  | 'converter' 
  | 'chemistry' 
  | 'equationBalancer'
  | 'physicsSim'
  | 'translator' 
  | 'arabicGrammar'
  | 'ocr'
  | 'scratchpad';

type CategoryFilter = 'all' | 'math' | 'science' | 'languages';

export const StudyToolkitView: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolkitTab>('calculator');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [initialTranslatorText, setInitialTranslatorText] = useState<string>('');

  const tools = [
    // Math category
    {
      id: 'calculator' as ToolkitTab,
      category: 'math' as CategoryFilter,
      label: 'الآلة الحاسبة العلمية (LaTeX)',
      shortLabel: 'الحاسبة العلمية',
      description: 'حسابات مثلثية، لوغاريتمات، جذور، أسس، ودعم LaTeX',
      icon: Calculator,
      color: 'from-indigo-600 to-blue-600',
      badge: 'LaTeX'
    },
    {
      id: 'grapher' as ToolkitTab,
      category: 'math' as CategoryFilter,
      label: 'راسم ومحلل التوابع والبيانات',
      shortLabel: 'راسم التوابع',
      description: 'رسم الخط البياني C_f لتوابع التحليل وجدول القيم',
      icon: LineChart,
      color: 'from-sky-600 to-cyan-600',
      badge: 'جديد'
    },
    {
      id: 'calculus' as ToolkitTab,
      category: 'math' as CategoryFilter,
      label: 'حاسبة التكامل والتفاضل والمتتاليات',
      shortLabel: 'التكامل والتفاضل',
      description: 'حساب التكامل المحدد، معادلة المماس، ونهايات u_n',
      icon: Sigma,
      color: 'from-purple-600 to-violet-600',
      badge: 'جديد'
    },
    // Science category
    {
      id: 'converter' as ToolkitTab,
      category: 'science' as CategoryFilter,
      label: 'محول الواحدات والكميات',
      shortLabel: 'محول الواحدات',
      description: 'أطوال، حجوم، مساحات، كتل، ضغط، طاقة، وأفخاخ التحويل',
      icon: ArrowRightLeft,
      color: 'from-teal-600 to-emerald-600'
    },
    {
      id: 'chemistry' as ToolkitTab,
      category: 'science' as CategoryFilter,
      label: 'الكيمياء والكتلة المولية',
      shortLabel: 'الكتلة المولية والجدول',
      description: 'حاسبة الكتلة المولية (M) ونسب العناصر والجدول الدوري',
      icon: FlaskConical,
      color: 'from-rose-600 to-pink-600'
    },
    {
      id: 'equationBalancer' as ToolkitTab,
      category: 'science' as CategoryFilter,
      label: 'موازن المعادلات وسطر المسائل',
      shortLabel: 'موازن المعادلات',
      description: 'موازنة معادلات الكيمياء واستخراج سطر الكتل والحجوم',
      icon: FlaskRound,
      color: 'from-emerald-600 to-teal-600',
      badge: 'جديد'
    },
    {
      id: 'physicsSim' as ToolkitTab,
      category: 'science' as CategoryFilter,
      label: 'محاكي النواسات والفيزياء',
      shortLabel: 'مختبر النواسات',
      description: 'محاكاة حية للنواس المرن والبسيط وتبادل الطاقة Ek, Ep',
      icon: Activity,
      color: 'from-indigo-600 to-violet-600',
      badge: 'تفاعلي'
    },
    // Languages & Tools category
    {
      id: 'translator' as ToolkitTab,
      category: 'languages' as CategoryFilter,
      label: 'المترجم وقاموس الكتاب الوزاري',
      shortLabel: 'المترجم والقاموس',
      description: 'ترجمة ونطق، وقاموس مفردات وحدات المنهاج الوزاري',
      icon: Languages,
      color: 'from-violet-600 to-purple-600'
    },
    {
      id: 'arabicGrammar' as ToolkitTab,
      category: 'languages' as CategoryFilter,
      label: 'بنك إعراب وشواهد وقواعد العربية',
      shortLabel: 'بنك إعراب العربية',
      description: 'إعراب مفردات وجمل قصائد المنهاج، المشتقات، والعلل',
      icon: Scroll,
      color: 'from-amber-600 to-orange-600',
      badge: 'وزاري'
    },
    {
      id: 'ocr' as ToolkitTab,
      category: 'languages' as CategoryFilter,
      label: 'قارئ ومستخرج النصوص (OCR)',
      shortLabel: 'استخراج النصوص',
      description: 'استخراج الأسئلة والنصوص المكتوبة من صور الأوراق والملازم',
      icon: ScanText,
      color: 'from-amber-600 to-yellow-600'
    },
    {
      id: 'scratchpad' as ToolkitTab,
      category: 'languages' as CategoryFilter,
      label: 'المسودة واللوح الرقمي',
      shortLabel: 'لوح المسودة',
      description: 'لوح رقمي سريع لخربشة المعادلات وحل المسائل يدوياً',
      icon: PenTool,
      color: 'from-teal-600 to-cyan-600',
      badge: 'جديد'
    }
  ];

  const filteredTools = tools.filter(t => 
    categoryFilter === 'all' || t.category === categoryFilter
  );

  const handleSendToTranslator = (text: string) => {
    setInitialTranslatorText(text);
    setActiveTool('translator');
    sound.button();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Main Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[#101622] p-4 sm:p-5 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-slate-850 border border-slate-750 text-slate-300 shadow-sm shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  حقيبة الأدوات والمختبر
                </h1>
                <span className="text-xs text-slate-400 font-medium">· 11 أداة</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                أدوات علمية ومخبرية مساعدة لحل المسائل والمحاكاة.
              </p>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => { setCategoryFilter('all'); sound.button(); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                categoryFilter === 'all' ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل (11)
            </button>
            <button
              onClick={() => { setCategoryFilter('math'); sound.button(); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                categoryFilter === 'math' ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الرياضيات والتحليل (3)
            </button>
            <button
              onClick={() => { setCategoryFilter('science'); sound.button(); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                categoryFilter === 'science' ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الفيزياء والكيمياء (4)
            </button>
            <button
              onClick={() => { setCategoryFilter('languages'); sound.button(); }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                categoryFilter === 'languages' ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              اللغات والأدوات (4)
            </button>
          </div>
        </div>

        {/* Tools Carousel / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-5 pt-5 border-t border-slate-800/80">
          {filteredTools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTool(t.id);
                  sound.button();
                }}
                className={`p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2.5 relative overflow-hidden group ${
                  isActive
                    ? 'bg-slate-800 border-slate-600 shadow-sm text-slate-100'
                    : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 hover:border-slate-750 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-slate-750 text-slate-100 border border-slate-650'
                      : 'bg-slate-850 border border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-semibold truncate transition-colors ${
                        isActive ? 'text-slate-100 font-bold' : 'text-slate-300 group-hover:text-slate-100'
                      }`}
                    >
                      {t.shortLabel}
                    </span>
                  </div>
                  {t.badge && (
                    <span className="text-[9px] text-slate-400 font-mono block">
                      {t.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Tool */}
      <div className="transition-all duration-300">
        {activeTool === 'calculator' && <ScientificCalculator />}
        {activeTool === 'grapher' && <FunctionGrapher />}
        {activeTool === 'calculus' && <CalculusSolver />}
        {activeTool === 'converter' && <UnitConverter />}
        {activeTool === 'chemistry' && <ChemistryToolkit />}
        {activeTool === 'equationBalancer' && <EquationBalancer />}
        {activeTool === 'physicsSim' && <PhysicsSimulator />}
        {activeTool === 'translator' && <SmartTranslator />}
        {activeTool === 'arabicGrammar' && <ArabicGrammarEngine />}
        {activeTool === 'ocr' && <TextOcrExtractor onSendToTranslator={handleSendToTranslator} />}
        {activeTool === 'scratchpad' && <QuickScratchpad />}
      </div>
    </div>
  );
};
