import React, { useState } from 'react';
import { 
  Atom, 
  FlaskConical, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  Info, 
  X,
  PieChart,
  Layers
} from 'lucide-react';
import { sound } from '../../services/sound';

// Core Elements with precise atomic masses for Syrian Baccalaureate
const PERIODIC_ELEMENTS: Record<string, { name: string; nameEn: string; symbol: string; atomicNumber: number; atomicMass: number; group: string; valencies: string; role: string }> = {
  H: { name: 'هيدروجين', nameEn: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008, group: 'nonmetal', valencies: '+1, -1', role: 'أساس الحموض والمركبات العضوية' },
  He: { name: 'هيليوم', nameEn: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003, group: 'noble', valencies: '0', role: 'جسيم ألفا (نواة هيليوم) في النشاط الإشعاعي' },
  Li: { name: 'ليثيوم', nameEn: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94, group: 'alkali', valencies: '+1', role: 'أخف الفلزات القلوية' },
  C: { name: 'كربون', nameEn: 'Carbon', symbol: 'C', atomicNumber: 6, atomicMass: 12.011, group: 'nonmetal', valencies: '+4, -4, +2', role: 'عماد الكيمياء العضوية وسلاسل الفحوم' },
  N: { name: 'نيتروجين', nameEn: 'Nitrogen', symbol: 'N', atomicNumber: 7, atomicMass: 14.007, group: 'nonmetal', valencies: '-3, +3, +5', role: 'مركبات الأمونيا، النترات، والبروتينات' },
  O: { name: 'أكسجين', nameEn: 'Oxygen', symbol: 'O', atomicNumber: 8, atomicMass: 15.999, group: 'nonmetal', valencies: '-2', role: 'الأكسدة، الإرجاع، ومسائل الاحتراق' },
  F: { name: 'فلور', nameEn: 'Fluorine', symbol: 'F', atomicNumber: 9, atomicMass: 18.998, group: 'halogen', valencies: '-1', role: 'أعلى العناصر كهرسلبية' },
  Ne: { name: 'نيون', nameEn: 'Neon', symbol: 'Ne', atomicNumber: 10, atomicMass: 20.180, group: 'noble', valencies: '0', role: 'غاز خامل ومستقر إلكترونياً' },
  Na: { name: 'صوديوم', nameEn: 'Sodium', symbol: 'Na', atomicNumber: 11, atomicMass: 22.990, group: 'alkali', valencies: '+1', role: 'شائع بالأملاح والمعايرة (NaOH, NaCl)' },
  Mg: { name: 'مغنزيوم', nameEn: 'Magnesium', symbol: 'Mg', atomicNumber: 12, atomicMass: 24.305, group: 'alkaline-earth', valencies: '+2', role: 'مركبات غرينيار والتفاعلات الحرارية' },
  Al: { name: 'ألمنيوم', nameEn: 'Aluminium', symbol: 'Al', atomicNumber: 13, atomicMass: 26.982, group: 'post-transition', valencies: '+3', role: 'عنصر مذبذب (أمفوتيري) وخفيف' },
  Si: { name: 'سيليكون', nameEn: 'Silicon', symbol: 'Si', atomicNumber: 14, atomicMass: 28.085, group: 'metalloid', valencies: '+4', role: 'أشباه الموصلات والإلكترونيات' },
  P: { name: 'فوسفور', nameEn: 'Phosphorus', symbol: 'P', atomicNumber: 15, atomicMass: 30.974, group: 'nonmetal', valencies: '+5, +3, -3', role: 'حمض الفوسفور والأسمدة' },
  S: { name: 'كبريت', nameEn: 'Sulfur', symbol: 'S', atomicNumber: 16, atomicMass: 32.06, group: 'nonmetal', valencies: '+6, +4, -2', role: 'حمض الكبريت ومسائل المحاليل' },
  Cl: { name: 'كلور', nameEn: 'Chlorine', symbol: 'Cl', atomicNumber: 17, atomicMass: 35.45, group: 'halogen', valencies: '-1', role: 'حمض كلور الماء والأملاح (HCl, NaCl)' },
  K: { name: 'بوتاسيوم', nameEn: 'Potassium', symbol: 'K', atomicNumber: 19, atomicMass: 39.098, group: 'alkali', valencies: '+1', role: 'برمنغنات البوتاسيوم والمعايرة الأكسدية' },
  Ca: { name: 'كالسيوم', nameEn: 'Calcium', symbol: 'Ca', atomicNumber: 20, atomicMass: 40.078, group: 'alkaline-earth', valencies: '+2', role: 'عسارة الماء، كربونات وهيدروكسيد الكالسيوم' },
  Cr: { name: 'كروم', nameEn: 'Chromium', symbol: 'Cr', atomicNumber: 24, atomicMass: 51.996, group: 'transition', valencies: '+6, +3', role: 'ثنائي كرومات البوتاسيوم كعامل مؤكسد' },
  Mn: { name: 'منغنيز', nameEn: 'Manganese', symbol: 'Mn', atomicNumber: 25, atomicMass: 54.938, group: 'transition', valencies: '+7, +4, +2', role: 'KMnO4 وتفاعلات الأكسدة والإرجاع' },
  Fe: { name: 'حديد', nameEn: 'Iron', symbol: 'Fe', atomicNumber: 26, atomicMass: 55.845, group: 'transition', valencies: '+2, +3', role: 'أملاح الحديد الثنائي والثلاثي' },
  Cu: { name: 'نحاس', nameEn: 'Copper', symbol: 'Cu', atomicNumber: 29, atomicMass: 63.546, group: 'transition', valencies: '+1, +2', role: 'كاشف فهلنغ، كبريتات النحاس، والتحليل الكهربائي' },
  Zn: { name: 'زنك (توتياء)', nameEn: 'Zinc', symbol: 'Zn', atomicNumber: 30, atomicMass: 65.38, group: 'transition', valencies: '+2', role: 'أعمدة غلفانية وتفاعل إنتاج الهيدروجين' },
  Br: { name: 'بروم', nameEn: 'Bromine', symbol: 'Br', atomicNumber: 35, atomicMass: 79.904, group: 'halogen', valencies: '-1', role: 'ماء البروم للكشف عن الروابط المضاعفة' },
  Ag: { name: 'فضة', nameEn: 'Silver', symbol: 'Ag', atomicNumber: 47, atomicMass: 107.87, group: 'transition', valencies: '+1', role: 'كاشف تولنز، نترات الفضة، والترسيب' },
  I: { name: 'يود', nameEn: 'Iodine', symbol: 'I', atomicNumber: 53, atomicMass: 126.90, group: 'halogen', valencies: '-1', role: 'تفاعلات المعايرة اليودية وسرعة التفاعل' },
  Ba: { name: 'باريوم', nameEn: 'Barium', symbol: 'Ba', atomicNumber: 56, atomicMass: 137.33, group: 'alkaline-earth', valencies: '+2', role: 'أملاح كبريتات الباريوم الراسبة' },
  Pb: { name: 'رصاص', nameEn: 'Lead', symbol: 'Pb', atomicNumber: 82, atomicMass: 207.2, group: 'post-transition', valencies: '+2, +4', role: 'سلاسل النشاط الإشعاعي ومسائل الانحلال' },
};

// Common Baccalaureate Compounds Presets
const COMMON_COMPOUNDS = [
  { formula: 'H2SO4', name: 'حمض الكبريت' },
  { formula: 'HNO3', name: 'حمض الآزوت' },
  { formula: 'HCl', name: 'حمض كلور الماء' },
  { formula: 'NaOH', name: 'هيدروكسيد الصوديوم' },
  { formula: 'Ca(OH)2', name: 'ماءات الكالسيوم (ماء الكلس)' },
  { formula: 'CH3COOH', name: 'حمض الخل (الإيثانويك)' },
  { formula: 'CuSO4.5H2O', name: 'كبريتات النحاس المائية' },
  { formula: 'KMnO4', name: 'برمنغنات البوتاسيوم' },
  { formula: 'C6H12O6', name: 'الغلوكوز' },
  { formula: 'CaCO3', name: 'كربونات الكالسيوم' },
  { formula: 'AgNO3', name: 'نترات الفضة' },
  { formula: 'Al2(SO4)3', name: 'كبريتات الألمنيوم' },
];

export const ChemistryToolkit: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'molar' | 'table'>('molar');
  const [formulaInput, setFormulaInput] = useState<string>('H2SO4');
  const [selectedElement, setSelectedElement] = useState<typeof PERIODIC_ELEMENTS['H'] | null>(null);
  const [elementSearch, setElementSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Chemical Formula Parser
  const parseFormula = (raw: string): { 
    isValid: boolean; 
    totalMass: number; 
    breakdown: Array<{ symbol: string; name: string; count: number; atomicMass: number; subtotal: number; percentage: number }>;
    error?: string;
  } => {
    if (!raw.trim()) return { isValid: false, totalMass: 0, breakdown: [] };

    try {
      // Split hydrates (e.g. CuSO4.5H2O or CuSO4*5H2O)
      const parts = raw.replace(/\*/g, '.').split('.');
      const counts: Record<string, number> = {};

      const parseSubFormula = (str: string, multiplier: number = 1) => {
        // Regex to match groups like (OH)2 or elements like Na2 or Cl
        const tokenRegex = /([A-Z][a-z]?)(\d*)|(\()|(\))(\d*)/g;
        let match;
        const stack: Array<Record<string, number>> = [{}];

        while ((match = tokenRegex.exec(str)) !== null) {
          const [full, element, count, openParen, closeParen, parenCount] = match;

          if (openParen) {
            stack.push({});
          } else if (closeParen) {
            const popped = stack.pop() || {};
            const mult = parenCount ? parseInt(parenCount, 10) : 1;
            const target = stack[stack.length - 1];
            for (const el in popped) {
              target[el] = (target[el] || 0) + popped[el] * mult;
            }
          } else if (element) {
            const qty = count ? parseInt(count, 10) : 1;
            const target = stack[stack.length - 1];
            target[element] = (target[element] || 0) + qty;
          }
        }

        const top = stack[0];
        for (const el in top) {
          counts[el] = (counts[el] || 0) + top[el] * multiplier;
        }
      };

      // Parse main compound
      parseSubFormula(parts[0], 1);

      // Parse hydrate parts (e.g. .5H2O)
      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
          const hydrateStr = parts[i];
          const matchHydrate = hydrateStr.match(/^(\d*)(.*)$/);
          if (matchHydrate) {
            const hydrateMultiplier = matchHydrate[1] ? parseInt(matchHydrate[1], 10) : 1;
            const subStr = matchHydrate[2] || 'H2O';
            parseSubFormula(subStr, hydrateMultiplier);
          }
        }
      }

      // Calculate total molar mass
      let totalMass = 0;
      const breakdown: Array<{ symbol: string; name: string; count: number; atomicMass: number; subtotal: number; percentage: number }> = [];

      for (const el in counts) {
        const data = PERIODIC_ELEMENTS[el];
        if (!data) {
          return { isValid: false, totalMass: 0, breakdown: [], error: `العنصر (${el}) غير معرّف أو غير مسجل في الرموز الدورية` };
        }
        const subtotal = counts[el] * data.atomicMass;
        totalMass += subtotal;
        breakdown.push({
          symbol: el,
          name: data.name,
          count: counts[el],
          atomicMass: data.atomicMass,
          subtotal: subtotal,
          percentage: 0 // Will compute below
        });
      }

      // Add percentages
      breakdown.forEach(item => {
        item.percentage = totalMass > 0 ? (item.subtotal / totalMass) * 100 : 0;
      });

      return {
        isValid: true,
        totalMass: Math.round(totalMass * 1000) / 1000,
        breakdown
      };
    } catch {
      return { isValid: false, totalMass: 0, breakdown: [], error: 'صيغة كيميائية غير صحيحة، تأكد من كتابة الرموز بالأحرف الكبيرة والصغيرة مثل: H2SO4' };
    }
  };

  const parsed = parseFormula(formulaInput);

  const handleCopyMass = () => {
    if (!parsed.isValid) return;
    sound.success();
    navigator.clipboard.writeText(`${parsed.totalMass} g/mol`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filteredElements = Object.values(PERIODIC_ELEMENTS).filter(el => {
    return (
      el.name.includes(elementSearch) || 
      el.symbol.toLowerCase().includes(elementSearch.toLowerCase()) ||
      el.nameEn.toLowerCase().includes(elementSearch.toLowerCase())
    );
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-rose-500/20 bg-gradient-to-r from-slate-900/90 via-rose-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-600/10">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>حقيبة الكيمياء والجدول الدوري الذكي</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
                منهاج البكالوريا
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              حساب الكتلة المولية (M) ونسب العناصر للمركبات، وبنك خواص وتكافؤات العناصر
            </p>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => { setActiveSubTab('molar'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSubTab === 'molar'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            حاسبة الكتلة المولية (M)
          </button>
          <button
            onClick={() => { setActiveSubTab('table'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSubTab === 'table'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الجدول الدوري والتكافؤات
          </button>
        </div>
      </div>

      {/* View 1: Molar Mass Calculator */}
      {activeSubTab === 'molar' && (
        <div className="space-y-5">
          
          {/* Formula Input Card */}
          <div className="p-5 sm:p-7 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Atom className="w-4 h-4 text-rose-400" />
                <span>أدخل الصيغة الكيميائية للمركب (مثال: H2SO4 أو Ca(OH)2):</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Case-Sensitive</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="e.g. H2SO4, CuSO4.5H2O, Al2(SO4)3"
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 font-mono text-lg text-white font-bold outline-none focus:border-rose-500/50 dir-ltr text-right"
                dir="ltr"
              />
              <button
                onClick={() => setFormulaInput('')}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                مسح
              </button>
            </div>

            {/* Presets Chips */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] text-slate-400 font-bold block">
                مركبات شهيرة في مسائل منهاج الكيمياء السوري (اضغط للاختيار):
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMON_COMPOUNDS.map(c => (
                  <button
                    key={c.formula}
                    onClick={() => {
                      setFormulaInput(c.formula);
                      sound.button();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono border transition-all ${
                      formulaInput === c.formula
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {c.formula} <span className="text-[10px] text-slate-500 font-sans">({c.name})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Bento */}
          {parsed.error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {parsed.error}
            </div>
          ) : parsed.isValid ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Main Total Molar Mass Card */}
              <div className="md:col-span-1 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-rose-300 font-bold uppercase tracking-wider">
                    الكتلة المولية الجزيئية الكلية
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    M ({formulaInput})
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono font-black text-3xl sm:text-4xl text-white tracking-tight">
                    {parsed.totalMass}
                  </div>
                  <div className="text-xs font-bold text-rose-400 font-mono">
                    g / mol (غرام / مول)
                  </div>
                </div>

                <button
                  onClick={handleCopyMass}
                  className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم نسخ الكتلة' : 'نسخ القيمة للمسألة'}</span>
                </button>
              </div>

              {/* Elements Breakdown Table & Percentage Bars */}
              <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
                  <span>تفكيك كتل العناصر ونسبتها المئوية بالمركب:</span>
                  <span className="text-[11px] text-slate-500">
                    {parsed.breakdown.length} عنصر
                  </span>
                </div>

                <div className="space-y-3">
                  {parsed.breakdown.map((item) => (
                    <div key={item.symbol} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.symbol}</span>
                          <span className="text-slate-400 font-sans">({item.name})</span>
                          <span className="text-slate-500 text-[11px]">× {item.count} ذرة</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">{Math.round(item.subtotal * 100) / 100} g</span>
                          <span className="text-slate-500 text-[10px] mx-1.5">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exam Note */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  💡 <span className="font-bold text-slate-300">ملاحظة امتحانية:</span> يتم تعويض الكتلة المولية M في قانون عدد المولات (n = m / M) أو التركيز المولي [C = m / (M × V)].
                </div>
              </div>

            </div>
          ) : null}

        </div>
      )}

      {/* View 2: Interactive Periodic Table & Elements */}
      {activeSubTab === 'table' && (
        <div className="space-y-4">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
            <input
              type="text"
              value={elementSearch}
              onChange={(e) => setElementSearch(e.target.value)}
              placeholder="ابحث باسم العنصر أو الرمز الكيميائي (مثل: Fe, Cu, صوديوم, كلور)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-9 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500/50"
            />
          </div>

          {/* Grid of Elements */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredElements.map(el => (
              <button
                key={el.symbol}
                onClick={() => {
                  setSelectedElement(el);
                  sound.button();
                }}
                className={`p-3 rounded-2xl border text-right group transition-all relative overflow-hidden ${
                  selectedElement?.symbol === el.symbol
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] text-slate-500">Z={el.atomicNumber}</span>
                  <span className="font-mono text-[11px] text-rose-400 font-bold">{Math.round(el.atomicMass)}</span>
                </div>
                <div className="font-mono font-black text-xl text-white mt-1 group-hover:text-rose-300 transition-colors">
                  {el.symbol}
                </div>
                <div className="text-xs text-slate-300 font-bold truncate mt-0.5">{el.name}</div>
                <div className="text-[10px] text-slate-500 truncate mt-1">تـ: {el.valencies}</div>
              </button>
            ))}
          </div>

          {/* Element Detail Modal / Card */}
          {selectedElement && (
            <div className="p-5 sm:p-6 rounded-3xl glass-card border border-rose-500/30 bg-gradient-to-br from-slate-950 to-slate-900 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex flex-col items-center justify-center font-mono">
                    <span className="text-xs text-rose-300">Z={selectedElement.atomicNumber}</span>
                    <span className="text-xl font-black text-white">{selectedElement.symbol}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{selectedElement.name}</span>
                      <span className="text-xs font-mono text-slate-400">({selectedElement.nameEn})</span>
                    </h3>
                    <p className="text-xs text-rose-300 font-mono mt-0.5">
                      الكتلة الذرية المعيارية A = {selectedElement.atomicMass} g/mol
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedElement(null)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">أعداد التكافؤ والأكسدة:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{selectedElement.valencies}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">التصنيف الكيميائي:</span>
                  <span className="font-bold text-amber-300">{selectedElement.group}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">العدد الكتلي التقريبي:</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">~ {Math.round(selectedElement.atomicMass)}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>دوره وتطبيقاته في منهاج البكالوريا:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedElement.role}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
