import React, { useState } from 'react';
import { 
  FlaskRound, 
  ArrowRight, 
  Check, 
  Copy, 
  Sparkles, 
  Info,
  Layers,
  Lightbulb
} from 'lucide-react';
import { sound } from '../../services/sound';

interface PresetEquation {
  title: string;
  unit: string;
  unbalanced: string;
  balanced: string;
  stoichiometryRow: string;
  examTip: string;
}

const BAC_EQUATIONS: PresetEquation[] = [
  {
    title: 'تفاعل إنتاج غاز الهيدروجين (حمض كلور الماء + زنك)',
    unit: 'سرعة التفاعل الكيميائي',
    unbalanced: 'Zn + HCl -> ZnCl2 + H2',
    balanced: '1 Zn + 2 HCl -> 1 ZnCl2 + 1 H2',
    stoichiometryRow: 'الكتل المولية: Zn (65g) + 2×HCl (73g) → ZnCl2 (136g) + H2 (2g أو 22.4L)',
    examTip: 'في شروط نظامية حجم 1 مول من أي غاز = 22.4 لتر، لذلك نكتب تحت H2 في السطر الأول 22.4 L'
  },
  {
    title: 'تفاعل احتراق الفحوم الهيدروجينية (الميثان)',
    unit: 'الكيمياء الحرارية والغازات',
    unbalanced: 'CH4 + O2 -> CO2 + H2O',
    balanced: '1 CH4 + 2 O2 -> 1 CO2 + 2 H2O',
    stoichiometryRow: 'CH4 (16g أو 22.4L) + 2×O2 (44.8L) → CO2 (44g أو 22.4L) + 2×H2O (36g)',
    examTip: 'تفاعل احتراق تام ناشر للحرارة ΔH < 0'
  },
  {
    title: 'تفاعل إرجاع أوكسيد النحاس بالهيدروجين',
    unit: 'الأكسدة والإرجاع',
    unbalanced: 'CuO + H2 -> Cu + H2O',
    balanced: '1 CuO + 1 H2 -> 1 Cu + 1 H2O',
    stoichiometryRow: 'CuO (79.5g) + H2 (22.4L) → Cu (63.5g) + H2O (18g)',
    examTip: 'الهيدروجين عامل مرجع والنحاس يترسب باللون الأحمر'
  },
  {
    title: 'تفاعل كربونات الكالسيوم مع حمض كلور الماء',
    unit: 'الأملاح والمحاليل المائية',
    unbalanced: 'CaCO3 + HCl -> CaCl2 + CO2 + H2O',
    balanced: '1 CaCO3 + 2 HCl -> 1 CaCl2 + 1 CO2 + 1 H2O',
    stoichiometryRow: 'CaCO3 (100g) + 2×HCl (73g) → CaCl2 (111g) + CO2 (22.4L) + H2O (18g)',
    examTip: 'ينطلق غاز ثنائي أوكسيد الكربون الذي يعكر ماء الكلس الرائق'
  },
  {
    title: 'تفاعل برمنغنات البوتاسيوم في وسط حمضي (أكسدة وإرجاع كبرى)',
    unit: 'الأكسدة والإرجاع والمعايرة',
    unbalanced: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O',
    balanced: '2 KMnO4 + 16 HCl -> 2 KCl + 2 MnCl2 + 5 Cl2 + 8 H2O',
    stoichiometryRow: '2×KMnO4 (316g) + 16×HCl (584g) → 2×KCl (149g) + 2×MnCl2 + 5×Cl2 (112L) + 8×H2O (144g)',
    examTip: 'يتغير عدد أكسدة المنغنيز من +7 في KMnO4 إلى +2 في MnCl2 فينقص بمقدار 5'
  },
  {
    title: 'تفاعل تصنيع النشادر (هابر - بوش)',
    unit: 'التوازن الكيميائي وعوامل لوشاتولييه',
    unbalanced: 'N2 + H2 -> NH3',
    balanced: '1 N2 + 3 H2 -> 2 NH3',
    stoichiometryRow: 'N2 (22.4L) + 3×H2 (67.2L) ⇄ 2×NH3 (44.8L)',
    examTip: 'زيادة الضغط تزيح التوازن بالاتجاه المباشر لأن عدد مولات الغاز بالطرف الثاني أقل (2 < 4)'
  }
];

export const EquationBalancer: React.FC = () => {
  const [inputReaction, setInputReaction] = useState<string>('Zn + HCl -> ZnCl2 + H2');
  const [balancedOutput, setBalancedOutput] = useState<string>('1 Zn + 2 HCl -> 1 ZnCl2 + 1 H2');
  const [stoichiometryDetails, setStoichiometryDetails] = useState<string>(
    'الكتل المولية للسطر الأول: Zn (65g) + 2×HCl (73g) → ZnCl2 (136g) + H2 (2g أو 22.4L)'
  );
  const [currentTip, setCurrentTip] = useState<string>(
    'في شروط نظامية حجم 1 مول من أي غاز = 22.4 لتر، لذلك نكتب تحت H2 في السطر الأول 22.4 L'
  );
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPreset = (preset: PresetEquation) => {
    sound.button();
    setInputReaction(preset.unbalanced);
    setBalancedOutput(preset.balanced);
    setStoichiometryDetails(preset.stoichiometryRow);
    setCurrentTip(preset.examTip);
  };

  const handleCopy = () => {
    sound.success();
    navigator.clipboard.writeText(balancedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-emerald-500/20 bg-gradient-to-r from-slate-900/90 via-emerald-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-600/10">
            <FlaskRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>موازن المعادلات ومحدد سطر المسائل الكيميائية</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                Stoichiometry Solver
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              موازنة دقيقة لمعادلات المنهاج السوري واستخراج السطر الأول لمسألة السطور الثلاثة بالجرامات واللترات
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-5">
        
        {/* Input Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <span>المعادلة الكيميائية المراد موازنتها (المتفاعلات ← النواتج):</span>
          </label>
          <input
            type="text"
            value={inputReaction}
            onChange={(e) => setInputReaction(e.target.value)}
            placeholder="e.g. Zn + HCl -> ZnCl2 + H2"
            className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-4 py-3 font-mono text-base sm:text-lg text-white font-bold outline-none focus:border-emerald-500/50 dir-ltr text-right"
          />
        </div>

        {/* Balanced Output Display */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>المعادلة الموزونة نظامياً:</span>
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ المعادلة'}</span>
            </button>
          </div>

          <div className="font-mono text-lg sm:text-2xl text-emerald-400 font-black dir-ltr text-right py-1 tracking-wide">
            {balancedOutput}
          </div>
        </div>

        {/* Stoichiometric Row Box (The famous "First Row" in Baccalaureate) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-teal-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>السطر الأول لمسألة السطور الثلاثة الامتحانية (الكتل المولية والحجوم النظامية):</span>
          </div>
          <div className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed dir-ltr text-right">
            {stoichiometryDetails}
          </div>
        </div>

        {/* Exam Tip Note */}
        {currentTip && (
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">توجيه امتحاني: </span>
              {currentTip}
            </div>
          </div>
        )}

      </div>

      {/* Preset Library Grid */}
      <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-800 space-y-3">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <span>أشهر معادلات مسائل المنهاج الوزاري المقررة (اضغط للموازنة الفورية):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {BAC_EQUATIONS.map((eq, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(eq)}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-emerald-950/20 border border-slate-800/80 hover:border-emerald-500/40 text-right group transition-all space-y-1.5"
            >
              <div className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                {eq.title}
              </div>
              <div className="font-mono text-xs text-emerald-400 dir-ltr text-right">
                {eq.unbalanced}
              </div>
              <div className="text-[10px] text-slate-500">
                {eq.unit}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
