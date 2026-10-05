import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Ruler, 
  Scale, 
  Maximize2, 
  Box, 
  Gauge, 
  Zap, 
  Compass, 
  Thermometer, 
  Copy, 
  Check, 
  AlertTriangle,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { sound } from '../../services/sound';

type CategoryId = 
  | 'length' 
  | 'area' 
  | 'volume' 
  | 'mass' 
  | 'pressure' 
  | 'energy' 
  | 'angles' 
  | 'temperature';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
  factorNotation?: string; // e.g. "10⁻²"
}

interface CategoryDef {
  id: CategoryId;
  name: string;
  icon: React.FC<{ className?: string }>;
  baseUnit: string;
  units: UnitDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'length',
    name: 'الأطوال والأبعاد',
    icon: Ruler,
    baseUnit: 'متر (m)',
    units: [
      { id: 'm', name: 'متر', symbol: 'm', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'cm', name: 'سنتيمتر', symbol: 'cm', toBase: v => v * 1e-2, fromBase: v => v * 1e2, factorNotation: '10⁻²' },
      { id: 'mm', name: 'ميليمتر', symbol: 'mm', toBase: v => v * 1e-3, fromBase: v => v * 1e3, factorNotation: '10⁻³' },
      { id: 'um', name: 'ميكرومتر', symbol: 'μm', toBase: v => v * 1e-6, fromBase: v => v * 1e6, factorNotation: '10⁻⁶' },
      { id: 'nm', name: 'نانومتر (أطوال موجية)', symbol: 'nm', toBase: v => v * 1e-9, fromBase: v => v * 1e9, factorNotation: '10⁻⁹' },
      { id: 'angstrom', name: 'أنغستروم (أبعاد ذرية)', symbol: 'Å', toBase: v => v * 1e-10, fromBase: v => v * 1e10, factorNotation: '10⁻¹⁰' },
      { id: 'km', name: 'كيلومتر', symbol: 'km', toBase: v => v * 1e3, fromBase: v => v * 1e-3, factorNotation: '10³' },
    ]
  },
  {
    id: 'area',
    name: 'المساحات والسطوح',
    icon: Maximize2,
    baseUnit: 'متر مربع (m²)',
    units: [
      { id: 'm2', name: 'متر مربع', symbol: 'm²', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'cm2', name: 'سنتيمتر مربع (فخ شهير)', symbol: 'cm²', toBase: v => v * 1e-4, fromBase: v => v * 1e4, factorNotation: '10⁻⁴' },
      { id: 'mm2', name: 'ميليمتر مربع (مساحة مقطع السلك)', symbol: 'mm²', toBase: v => v * 1e-6, fromBase: v => v * 1e6, factorNotation: '10⁻⁶' },
      { id: 'km2', name: 'كيلومتر مربع', symbol: 'km²', toBase: v => v * 1e6, fromBase: v => v * 1e-6, factorNotation: '10⁶' },
    ]
  },
  {
    id: 'volume',
    name: 'الحجوم والسعات',
    icon: Box,
    baseUnit: 'متر مكعب (m³)',
    units: [
      { id: 'm3', name: 'متر مكعب', symbol: 'm³', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'L', name: 'لتر (L)', symbol: 'L', toBase: v => v * 1e-3, fromBase: v => v * 1e3, factorNotation: '10⁻³' },
      { id: 'mL', name: 'ميليلتر (mL)', symbol: 'mL', toBase: v => v * 1e-6, fromBase: v => v * 1e6, factorNotation: '10⁻⁶' },
      { id: 'cm3', name: 'سنتيمتر مكعب', symbol: 'cm³', toBase: v => v * 1e-6, fromBase: v => v * 1e6, factorNotation: '10⁻⁶' },
      { id: 'dm3', name: 'ديسيمتر مكعب (= لتر)', symbol: 'dm³', toBase: v => v * 1e-3, fromBase: v => v * 1e3, factorNotation: '10⁻³' },
    ]
  },
  {
    id: 'mass',
    name: 'الكتل والأوزان',
    icon: Scale,
    baseUnit: 'كيلوغرام (kg)',
    units: [
      { id: 'kg', name: 'كيلوغرام', symbol: 'kg', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'g', name: 'غرام', symbol: 'g', toBase: v => v * 1e-3, fromBase: v => v * 1e3, factorNotation: '10⁻³' },
      { id: 'mg', name: 'ميليغرام', symbol: 'mg', toBase: v => v * 1e-6, fromBase: v => v * 1e6, factorNotation: '10⁻⁶' },
      { id: 'ug', name: 'ميكروغرام', symbol: 'μg', toBase: v => v * 1e-9, fromBase: v => v * 1e9, factorNotation: '10⁻⁹' },
      { id: 'ton', name: 'طن متري', symbol: 'ton', toBase: v => v * 1e3, fromBase: v => v * 1e-3, factorNotation: '10³' },
    ]
  },
  {
    id: 'pressure',
    name: 'الضغط والغازات',
    icon: Gauge,
    baseUnit: 'باسكال (Pa)',
    units: [
      { id: 'Pa', name: 'باسكال (N/m²)', symbol: 'Pa', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'kPa', name: 'كيلوباسكال', symbol: 'kPa', toBase: v => v * 1e3, fromBase: v => v * 1e-3, factorNotation: '10³' },
      { id: 'atm', name: 'ضغط جوي نظامي (atm)', symbol: 'atm', toBase: v => v * 101325, fromBase: v => v / 101325, factorNotation: '1.013 × 10⁵' },
      { id: 'bar', name: 'بار (bar)', symbol: 'bar', toBase: v => v * 1e5, fromBase: v => v * 1e-5, factorNotation: '10⁵' },
      { id: 'mmHg', name: 'ميليمتر زئبقي (Torr)', symbol: 'mmHg', toBase: v => v * 133.322, fromBase: v => v / 133.322, factorNotation: '133.3' },
    ]
  },
  {
    id: 'energy',
    name: 'الطاقة والشغل',
    icon: Zap,
    baseUnit: 'جول (J)',
    units: [
      { id: 'J', name: 'جول', symbol: 'J', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'kJ', name: 'كيلوجول', symbol: 'kJ', toBase: v => v * 1e3, fromBase: v => v * 1e-3, factorNotation: '10³' },
      { id: 'eV', name: 'إلكترون فولت (فيزياء حديثة)', symbol: 'eV', toBase: v => v * 1.6e-19, fromBase: v => v / 1.6e-19, factorNotation: '1.6 × 10⁻¹⁹' },
      { id: 'keV', name: 'كيلو إلكترون فولت', symbol: 'keV', toBase: v => v * 1.6e-16, fromBase: v => v / 1.6e-16, factorNotation: '1.6 × 10⁻¹⁶' },
      { id: 'MeV', name: 'ميغا إلكترون فولت (طاقة الربط)', symbol: 'MeV', toBase: v => v * 1.6e-13, fromBase: v => v / 1.6e-13, factorNotation: '1.6 × 10⁻¹³' },
      { id: 'cal', name: 'حريرة (كالوري)', symbol: 'cal', toBase: v => v * 4.184, fromBase: v => v / 4.184, factorNotation: '4.184' },
      { id: 'kcal', name: 'كيلو حريرة', symbol: 'kcal', toBase: v => v * 4184, fromBase: v => v / 4184, factorNotation: '4184' },
    ]
  },
  {
    id: 'angles',
    name: 'الزوايا المثلثية',
    icon: Compass,
    baseUnit: 'راديان (rad)',
    units: [
      { id: 'rad', name: 'راديان (الجملة الدولية)', symbol: 'rad', toBase: v => v, fromBase: v => v, factorNotation: '1' },
      { id: 'deg', name: 'درجة مئوية (°)', symbol: '°', toBase: v => (v * Math.PI) / 180, fromBase: v => (v * 180) / Math.PI, factorNotation: 'π / 180' },
      { id: 'grad', name: 'غراد', symbol: 'grad', toBase: v => (v * Math.PI) / 200, fromBase: v => (v * 200) / Math.PI, factorNotation: 'π / 200' },
    ]
  },
  {
    id: 'temperature',
    name: 'درجات الحرارة',
    icon: Thermometer,
    baseUnit: 'كلفن (K)',
    units: [
      { id: 'K', name: 'كلفن (T المطلقة)', symbol: 'K', toBase: v => v, fromBase: v => v, factorNotation: 'T = θ + 273' },
      { id: 'C', name: 'مئوية سيلزيوس (θ)', symbol: '°C', toBase: v => v + 273.15, fromBase: v => v - 273.15, factorNotation: 'θ = T - 273' },
      { id: 'F', name: 'فهرنهايت', symbol: '°F', toBase: v => (v - 32) * (5/9) + 273.15, fromBase: v => (v - 273.15) * (9/5) + 32, factorNotation: '°F' },
    ]
  },
];

// Exam Trap Presets for instant practice
const EXAM_PRESETS = [
  {
    title: 'تحويل الحجم: 100 mL إلى m³',
    category: 'volume' as CategoryId,
    fromUnit: 'mL',
    toUnit: 'm3',
    value: 100,
    note: 'شائع في مسائل الكيمياء والغازات (نضرب بـ 10⁻⁶)'
  },
  {
    title: 'تحويل مساحة السطح: 20 cm² إلى m²',
    category: 'area' as CategoryId,
    fromUnit: 'cm2',
    toUnit: 'm2',
    value: 20,
    note: 'شائع في مسائل التحريض الكهرومغناطيسي والتدفق (نضرب بـ 10⁻⁴)'
  },
  {
    title: 'تحويل الكتلة: 250 g إلى kg',
    category: 'mass' as CategoryId,
    fromUnit: 'g',
    toUnit: 'kg',
    value: 250,
    note: 'شائع في مسائل النواسات والميكانيك (نضرب بـ 10⁻³)'
  },
  {
    title: 'طاقة انتزاع الإلكترون: 2.5 eV إلى J',
    category: 'energy' as CategoryId,
    fromUnit: 'eV',
    toUnit: 'J',
    value: 2.5,
    note: 'مسائل الفعل الكهرضوئي والفيزياء الذرية (نضرب بـ 1.6 × 10⁻¹⁹)'
  },
  {
    title: 'تحويل الزاوية: 60° إلى راديان (rad)',
    category: 'angles' as CategoryId,
    fromUnit: 'deg',
    toUnit: 'rad',
    value: 60,
    note: 'الزوايا في مسائل النواس المرن والثقلي يجب أن تكون بالراديان (π/3)'
  },
  {
    title: 'تحويل درجة الحرارة: 27 °C إلى كلفن (K)',
    category: 'temperature' as CategoryId,
    fromUnit: 'C',
    toUnit: 'K',
    value: 27,
    note: 'قانون الغازات العام P·V = n·R·T يتطلب T بالكلفن دائماً (27 + 273 = 300 K)'
  }
];

export const UnitConverter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('volume');
  const [inputValue, setInputValue] = useState<string>('100');
  const [fromUnitId, setFromUnitId] = useState<string>('mL');
  const [toUnitId, setToUnitId] = useState<string>('m3');
  const [copied, setCopied] = useState<boolean>(false);

  const currentCat = CATEGORIES.find(c => c.id === selectedCategory)!;
  const fromUnit = currentCat.units.find(u => u.id === fromUnitId) || currentCat.units[0];
  const toUnit = currentCat.units.find(u => u.id === toUnitId) || currentCat.units[1];

  // Perform Conversion
  const calculateResult = (): { numeric: number; formatted: string; scientific: string } => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return { numeric: 0, formatted: '0', scientific: '0' };

    const baseVal = fromUnit.toBase(val);
    const converted = toUnit.fromBase(baseVal);

    let formatted = converted.toString();
    if (Math.abs(converted) < 1e-4 || Math.abs(converted) >= 1e6) {
      formatted = converted.toExponential(4);
    } else {
      formatted = (Math.round(converted * 1e8) / 1e8).toString();
    }

    const scientific = converted.toExponential(4);
    return { numeric: converted, formatted, scientific };
  };

  const result = calculateResult();

  const handleSelectCategory = (catId: CategoryId) => {
    sound.button();
    setSelectedCategory(catId);
    const cat = CATEGORIES.find(c => c.id === catId)!;
    setFromUnitId(cat.units[1]?.id || cat.units[0].id);
    setToUnitId(cat.units[0]?.id || cat.units[0].id);
  };

  const handleSwapUnits = () => {
    sound.button();
    const prevFrom = fromUnitId;
    const prevTo = toUnitId;
    setFromUnitId(prevTo);
    setToUnitId(prevFrom);
  };

  const handleCopy = () => {
    sound.success();
    navigator.clipboard.writeText(result.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyPreset = (preset: typeof EXAM_PRESETS[0]) => {
    sound.button();
    setSelectedCategory(preset.category);
    setFromUnitId(preset.fromUnit);
    setToUnitId(preset.toUnit);
    setInputValue(preset.value.toString());
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-teal-500/20 bg-gradient-to-r from-slate-900/90 via-teal-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-lg shadow-teal-600/10">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>محول الواحدات والكميات الفيزيائية والكيميائية</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300">
                قواعد الامتحان الوزاري
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تحويلات دقيقة مع تفصيل خطوات التحويل بالأسس (10⁻²، 10⁻⁴، 10⁻⁶) لتجنب أخطاء المسائل
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = cat.id === selectedCategory;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Converter Card */}
      <div className="p-5 sm:p-7 rounded-3xl glass-card border border-slate-800/90 bg-slate-950/70 space-y-6">
        
        {/* Converter Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          
          {/* FROM Box (5 cols) */}
          <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>القيمة والواحدة الأصلية (من):</span>
              <span className="text-[11px] font-mono text-teal-400">{fromUnit.symbol}</span>
            </div>

            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-lg text-white font-bold outline-none focus:border-teal-500/50 dir-ltr text-right"
            />

            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500/50"
            >
              {currentCat.units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON (1 col) */}
          <div className="md:col-span-1 flex items-center justify-center">
            <button
              onClick={handleSwapUnits}
              title="عكس الواحدات"
              className="w-10 h-10 rounded-2xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400 transition-all active:scale-95 shadow-md"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* TO Box (5 cols) */}
          <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>الناتج بالواحدة المطلوبة (إلى):</span>
              <span className="text-[11px] font-mono text-emerald-400">{toUnit.symbol}</span>
            </div>

            <div className="relative">
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-lg text-emerald-400 font-bold dir-ltr text-right overflow-x-auto min-h-[46px] flex items-center justify-end">
                {result.formatted}
              </div>
              <button
                onClick={handleCopy}
                className="absolute left-2 top-2.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1"
                title="نسخ النتيجة"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500/50"
            >
              {currentCat.units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Mathematical Step Explanation Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/30 to-indigo-950/30 border border-teal-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <Lightbulb className="w-4 h-4 text-teal-400" />
            <span>خطوة التحويل الوزارية وطريقة التعويض في ورقة الإجابة:</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed font-mono">
            {fromUnit.symbol} → {toUnit.symbol}:
            <span className="text-emerald-400 font-bold mx-2">
              {inputValue} {fromUnit.symbol} = {result.formatted} {toUnit.symbol}
            </span>
            {result.scientific !== result.formatted && (
              <span className="text-slate-400 text-[11px] block mt-1">
                الصيغة العلمية بالأسس: ({result.scientific} {toUnit.symbol})
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Exam Trap Presets (أفخاخ التحويل الوزارية) */}
      <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>أفخاخ التحويل الأكثر تكراراً في امتحانات البكالوريا السورية (اضغط للتطبيق الفوري):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {EXAM_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="p-3 rounded-2xl bg-slate-900/70 hover:bg-amber-950/20 border border-slate-800/80 hover:border-amber-500/40 text-right group transition-all space-y-1"
            >
              <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                {p.title}
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                {p.note}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
