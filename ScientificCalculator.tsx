import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Delete, 
  Copy, 
  Check, 
  History, 
  Atom, 
  ChevronDown, 
  ChevronUp, 
  X,
  Code2,
  Sparkles
} from 'lucide-react';
import { sound } from '../../services/sound';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  latex: string;
  timestamp: Date;
}

// Baccalaureate Syllabus Constants
const BAC_CONSTANTS = [
  { name: 'g (التقريبي)', symbol: 'g₁₀', value: '10', unit: 'm/s²', desc: 'تسارع الجاذبية الشائع بالمسائل' },
  { name: 'g (الدقيق)', symbol: 'g₉.₈', value: '9.8', unit: 'm/s²', desc: 'تسارع الجاذبية المعياري' },
  { name: 'π (باي)', symbol: 'π', value: '3.14159265', unit: '', desc: 'النسبة التقريبية' },
  { name: 'c (سرعة الضوء)', symbol: 'c', value: '300000000', unit: 'm/s', desc: '3 × 10⁸ m/s' },
  { name: 'e (شحنة الإلكترون)', symbol: 'e_charge', value: '1.6e-19', unit: 'C', desc: '1.6 × 10⁻¹⁹ C' },
  { name: 'R (الغازات - جو)', symbol: 'R_atm', value: '0.082', unit: 'atm·L/mol·K', desc: 'ثابت الغازات بضغط الجو' },
  { name: 'R (الغازات - جول)', symbol: 'R_SI', value: '8.314', unit: 'J/mol·K', desc: 'ثابت الغازات بالجملة الدولية' },
  { name: 'Nₐ (أفوغادرو)', symbol: 'N_A', value: '6.022e23', unit: 'mol⁻¹', desc: '6.022 × 10²³' },
  { name: 'h (بلانك)', symbol: 'h', value: '6.63e-34', unit: 'J·s', desc: '6.63 × 10⁻³⁴ J·s' },
  { name: 'μ₀ (نفاذية الفراغ)', symbol: 'μ₀', value: '1.2566e-6', unit: 'H/m', desc: '4π × 10⁻⁷' },
];

export const ScientificCalculator: React.FC = () => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isRadMode, setIsRadMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'visual' | 'latex'>('visual');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('bac240_calc_history');
      if (saved) {
        return JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch {}
    return [];
  });
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);
  const [showConstants, setShowConstants] = useState<boolean>(false);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bac240_calc_history', JSON.stringify(history.slice(0, 30)));
    } catch {}
  }, [history]);

  // Comprehensive Mathematical & LaTeX Evaluator
  const evaluateExpression = (expr: string): string => {
    if (!expr || !expr.trim()) return '';
    try {
      let sanitized = expr;

      // 1. Convert Unicode superscripts: ⁰¹²³⁴⁵⁶⁷⁸⁹⁻
      const supMap: Record<string, string> = {
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-'
      };
      sanitized = sanitized.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (match) => {
        const num = match.split('').map(c => supMap[c] || c).join('');
        return `**(${num})`;
      });

      // 2. LaTeX Powers: ^{n} and ^n and ^(n)
      sanitized = sanitized.replace(/\^\{([^{}]+)\}/g, '**($1)');
      sanitized = sanitized.replace(/\^\(([^)]+)\)/g, '**($1)');
      sanitized = sanitized.replace(/\^([0-9a-zA-Z.]+)/g, '**($1)');

      // 3. LaTeX Fractions: \frac{a}{b}
      let fracSafety = 0;
      while (/\\frac\{([^{}]+)\}\{([^{}]+)\}/.test(sanitized) && fracSafety < 10) {
        sanitized = sanitized.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
        fracSafety++;
      }

      // 4. LaTeX Roots: \sqrt{x} and \sqrt[n]{x}
      let rootSafety = 0;
      while (/\\sqrt\{([^{}]+)\}/.test(sanitized) && rootSafety < 10) {
        sanitized = sanitized.replace(/\\sqrt\{([^{}]+)\}/g, 'Math.sqrt($1)');
        rootSafety++;
      }
      sanitized = sanitized.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, 'Math.pow($2, 1/($1))');
      sanitized = sanitized.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
      sanitized = sanitized.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');

      // 5. LaTeX standard symbols & operators
      sanitized = sanitized
        .replace(/\\times/g, '*')
        .replace(/\\cdot/g, '*')
        .replace(/\\div/g, '/')
        .replace(/\\pi/g, 'Math.PI')
        .replace(/π/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\\left\(/g, '(')
        .replace(/\\right\)/g, ')');

      // 6. Factorials: n!
      sanitized = sanitized.replace(/(\d+)!/g, (_, n) => {
        const num = parseInt(n, 10);
        if (num > 170) return 'Infinity';
        let fact = 1;
        for (let i = 2; i <= num; i++) fact *= i;
        return fact.toString();
      });

      // 7. Strip backslashes from standard functions: \sin, \cos, \tan, \ln, \log
      sanitized = sanitized
        .replace(/\\sin/g, 'sin')
        .replace(/\\cos/g, 'cos')
        .replace(/\\tan/g, 'tan')
        .replace(/\\ln/g, 'ln')
        .replace(/\\log/g, 'log');

      // 8. Trigonometric conversion based on DEG / RAD
      if (!isRadMode) {
        sanitized = sanitized.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
        sanitized = sanitized.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
        sanitized = sanitized.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
        sanitized = sanitized.replace(/asin\(([^)]+)\)/g, '(Math.asin($1) * 180 / Math.PI)');
        sanitized = sanitized.replace(/acos\(([^)]+)\)/g, '(Math.acos($1) * 180 / Math.PI)');
        sanitized = sanitized.replace(/atan\(([^)]+)\)/g, '(Math.atan($1) * 180 / Math.PI)');
      } else {
        sanitized = sanitized.replace(/sin\(/g, 'Math.sin(');
        sanitized = sanitized.replace(/cos\(/g, 'Math.cos(');
        sanitized = sanitized.replace(/tan\(/g, 'Math.tan(');
        sanitized = sanitized.replace(/asin\(/g, 'Math.asin(');
        sanitized = sanitized.replace(/acos\(/g, 'Math.acos(');
        sanitized = sanitized.replace(/atan\(/g, 'Math.atan(');
      }

      sanitized = sanitized.replace(/ln\(/g, 'Math.log(');
      sanitized = sanitized.replace(/log\(/g, 'Math.log10(');
      sanitized = sanitized.replace(/abs\(/g, 'Math.abs(');

      // Clean unclosed braces { } if left
      sanitized = sanitized.replace(/[{}]/g, '');

      // Strict allowed tokens verification
      const allowedRegex = /^[0-9+\-*/().\s,MathPIEasincoqtrlgexb**eE\-+]+$/;
      if (!allowedRegex.test(sanitized)) {
        return 'خطأ في التعبير';
      }

      const evalFn = new Function(`"use strict"; return (${sanitized});`);
      const val = evalFn();

      if (typeof val !== 'number' || isNaN(val)) {
        return 'خطأ رياضي';
      }
      if (!isFinite(val)) {
        return 'قيمة غير معرّفة (∞)';
      }

      const rounded = Math.round(val * 1e10) / 1e10;
      return rounded.toString();
    } catch {
      return 'صيغة غير صحيحة';
    }
  };

  const handleCalculate = () => {
    if (!expression.trim()) return;
    sound.button();
    const res = evaluateExpression(expression);
    setResult(res);

    if (res && res !== 'خطأ رياضي' && res !== 'صيغة غير صحيحة' && res !== 'خطأ في التعبير') {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        expression,
        result: res,
        latex: formatToLatex(expression),
        timestamp: new Date()
      };
      setHistory(prev => [newItem, ...prev.slice(0, 29)]);
    }
  };

  const appendToExpression = (val: string) => {
    sound.button();
    setExpression(prev => prev + val);
    // Explicitly NO focus() called on inputs to keep mobile keyboard hidden!
  };

  const handleClear = () => {
    sound.button();
    setExpression('');
    setResult('');
  };

  const handleDelete = () => {
    sound.button();
    setExpression(prev => {
      // If ends with a token like ^{}, remove it cleanly
      if (prev.endsWith('^{}')) return prev.slice(0, -3);
      if (prev.endsWith('10^{-}') || prev.endsWith('10^{}')) return prev.slice(0, -5);
      if (prev.endsWith('×10^{-}') || prev.endsWith('*10^{-}') || prev.endsWith('×10^{}')) return prev.slice(0, -6);
      if (prev.endsWith('\\frac{}{}') || prev.endsWith('\\sqrt{}')) return prev.slice(0, -8);
      return prev.slice(0, -1);
    });
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedResult(true);
    sound.success();
    setTimeout(() => setCopiedResult(false), 1500);
  };

  const formatToLatex = (str: string): string => {
    return str
      .replace(/×/g, '\\times ')
      .replace(/÷/g, '\\div ')
      .replace(/π/g, '\\pi ')
      .replace(/\^2/g, '^{2}')
      .replace(/\^3/g, '^{3}');
  };

  const handleCopyLatex = () => {
    const latexStr = formatToLatex(expression);
    navigator.clipboard.writeText(latexStr);
    setCopiedLatex(true);
    sound.success();
    setTimeout(() => setCopiedLatex(false), 1500);
  };

  const handleUseAns = () => {
    if (result && !result.includes('خطأ')) {
      sound.button();
      setExpression(result);
    }
  };

  // Keyboard support for PC/Laptop users without popping mobile virtual keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).inputMode !== 'none'))) {
        return;
      }

      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      } else if (e.key === '^') {
        e.preventDefault();
        appendToExpression('^{}');
      } else if (['0','1','2','3','4','5','6','7','8','9','+','-','*','/','(',')','.','{','}'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };
        appendToExpression(map[e.key] || e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression]);

  // Render Mathematical Visual with Superscripts (LaTeX style)
  const renderVisualMath = (raw: string) => {
    if (!raw) return <span className="text-slate-600 text-xs font-sans">أدخل المسألة باستخدام أزرار الأسس والأرقام...</span>;

    // Split and format powers ^{...} and ^...
    const parts = raw.split(/(\^\{[^{}]*\}|\^[0-9a-zA-Z]+|\*10\^\{[^{}]*\}|×10\^\{[^{}]*\})/g);

    return (
      <span className="inline-flex items-baseline flex-wrap gap-0.5">
        {parts.map((part, idx) => {
          if (part.startsWith('×10^{') || part.startsWith('*10^{')) {
            const exp = part.replace(/^(\*|×)10\^\{/, '').replace(/\}$/, '');
            return (
              <span key={idx} className="inline-flex items-baseline text-amber-400 font-mono">
                <span className="text-slate-400 mx-0.5">×</span>10
                <sup className="text-xs text-amber-300 font-bold -top-1 px-0.5">{exp || '□'}</sup>
              </span>
            );
          }
          if (part.startsWith('^{')) {
            const exp = part.slice(2, -1);
            return (
              <sup key={idx} className="text-xs text-amber-300 font-bold -top-1 px-0.5 font-mono">
                {exp || '□'}
              </sup>
            );
          }
          if (part.startsWith('^')) {
            const exp = part.slice(1);
            return (
              <sup key={idx} className="text-xs text-amber-300 font-bold -top-1 px-0.5 font-mono">
                {exp}
              </sup>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3" dir="rtl">
      
      {/* Main Glass Shell */}
      <div className="rounded-3xl border border-indigo-500/25 bg-slate-950/95 p-3.5 sm:p-5 shadow-2xl space-y-2.5 relative overflow-hidden backdrop-blur-xl">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-850">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">الآلة الحاسبة العلمية</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                LaTeX Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode: Visual or LaTeX Code */}
            <button
              type="button"
              onClick={() => { setViewMode(viewMode === 'visual' ? 'latex' : 'visual'); sound.button(); }}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                viewMode === 'latex'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="عرض بصيغة LaTeX الرياضية"
            >
              <Code2 className="w-3 h-3" />
              <span>{viewMode === 'latex' ? 'LaTeX نشط' : 'كود LaTeX'}</span>
            </button>

            {/* DEG / RAD Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => { setIsRadMode(false); sound.button(); }}
                className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                  !isRadMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                DEG
              </button>
              <button
                type="button"
                onClick={() => { setIsRadMode(true); sound.button(); }}
                className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                  isRadMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                RAD
              </button>
            </div>

            {/* History Toggle */}
            <button
              type="button"
              onClick={() => { setShowHistory(!showHistory); sound.button(); }}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
                showHistory 
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>السجل ({history.length})</span>
            </button>
          </div>
        </div>

        {/* Screen Display (Keyboard explicitly blocked with inputMode="none" & readOnly) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 space-y-1 select-none">
          
          {/* Expression line with LaTeX formatted superscripts */}
          <div className="min-h-[34px] flex items-center justify-end overflow-x-auto text-slate-100 font-mono text-base sm:text-xl font-bold dir-ltr tracking-wider">
            {viewMode === 'latex' ? (
              <span className="text-amber-300 font-mono text-xs sm:text-sm">
                {expression ? formatToLatex(expression) : '\\text{أدخل المسألة...}'}
              </span>
            ) : (
              renderVisualMath(expression)
            )}
          </div>

          {/* Result line */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 min-h-[36px]">
            <div className="flex items-center gap-1">
              {result && !result.includes('خطأ') && (
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 transition-all"
                  title="نسخ الناتج"
                >
                  {copiedResult ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedResult ? 'تم' : 'نسخ الناتج'}</span>
                </button>
              )}
              {expression && (
                <button
                  type="button"
                  onClick={handleCopyLatex}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 hover:text-amber-200 text-[10px] flex items-center gap-1 transition-all"
                  title="نسخ صيغة LaTeX"
                >
                  {copiedLatex ? <Check className="w-3 h-3 text-emerald-400" /> : <Code2 className="w-3 h-3" />}
                  <span>{copiedLatex ? 'تم نسخ LaTeX' : 'نسخ كـ LaTeX'}</span>
                </button>
              )}
              {result && !result.includes('خطأ') && (
                <button
                  type="button"
                  onClick={handleUseAns}
                  className="px-2 py-0.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-[10px] font-mono font-bold"
                >
                  Ans
                </button>
              )}
            </div>

            <div className="text-left font-mono font-black text-lg sm:text-2xl text-emerald-400 dir-ltr tracking-wide">
              {result ? `= ${result}` : ''}
            </div>
          </div>
        </div>

        {/* SPECIALIZED EXPONENT & LATEX BAR (شريط كتابة الأسس السريعة وقوى 10) */}
        <div className="p-1.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>أدوات كتابة الأسس والترميز العلمي السريع (Powers & Scientific):</span>
            </span>
            <span className="text-slate-500 font-mono">LaTeX Enabled</span>
          </div>

          <div className="grid grid-cols-6 gap-1 text-xs font-mono">
            {/* Quick square */}
            <button
              type="button"
              onClick={() => appendToExpression('^{2}')}
              className="py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-900/40 border border-indigo-500/30 text-amber-300 font-bold transition-all active:scale-95 text-xs flex flex-col items-center justify-center"
              title="تربيع (أس 2)"
            >
              <span>x²</span>
            </button>

            {/* Quick cube */}
            <button
              type="button"
              onClick={() => appendToExpression('^{3}')}
              className="py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-900/40 border border-indigo-500/30 text-amber-300 font-bold transition-all active:scale-95 text-xs flex flex-col items-center justify-center"
              title="تكعيب (أس 3)"
            >
              <span>x³</span>
            </button>

            {/* Custom power x^{y} */}
            <button
              type="button"
              onClick={() => appendToExpression('^{}')}
              className="py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-900/40 border border-indigo-500/30 text-amber-300 font-bold transition-all active:scale-95 text-xs flex flex-col items-center justify-center"
              title="أس مخصص xʸ"
            >
              <span>xʸ</span>
            </button>

            {/* 10^{x} Positive power */}
            <button
              type="button"
              onClick={() => appendToExpression('10^{}')}
              className="py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-900/40 border border-indigo-500/30 text-cyan-300 font-bold transition-all active:scale-95 text-xs flex flex-col items-center justify-center"
              title="قوى العشرة الموجبة 10ˣ"
            >
              <span>10ˣ</span>
            </button>

            {/* 10^{-x} Negative power (super common in physics/chemistry) */}
            <button
              type="button"
              onClick={() => appendToExpression('10^{-}')}
              className="py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-900/40 border border-indigo-500/30 text-cyan-300 font-bold transition-all active:scale-95 text-xs flex flex-col items-center justify-center"
              title="قوى العشرة السالبة 10⁻ˣ"
            >
              <span>10⁻ˣ</span>
            </button>

            {/* ×10^{-x} Scientific multiplier */}
            <button
              type="button"
              onClick={() => appendToExpression('×10^{-}')}
              className="py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/40 hover:to-orange-600/40 border border-amber-500/40 text-amber-200 font-bold transition-all active:scale-95 text-[11px] flex flex-col items-center justify-center"
              title="الترميز العلمي للمسائل الوزارية (×10⁻)"
            >
              <span>×10⁻</span>
            </button>
          </div>
        </div>

        {/* DENSE KEYPAD: All in one viewport */}
        <div className="space-y-1.5 pt-0.5">
          
          {/* Scientific Functions Row 1 */}
          <div className="grid grid-cols-6 gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => appendToExpression('sin(')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              sin
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('cos(')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              cos
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('tan(')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              tan
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('ln(')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              ln
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('log(')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              log
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('π')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              π
            </button>
          </div>

          {/* Scientific Functions Row 2 */}
          <div className="grid grid-cols-6 gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => appendToExpression('\\sqrt{}')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
              title="جذر تربيعي \sqrt{}"
            >
              √x
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('\\frac{}{}')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
              title="كسر اعتيادي \frac{a}{b}"
            >
              a/b
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('{')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold transition-all active:scale-95 text-[11px]"
              title="قوس حاصر مفتوح {"
            >
              {'{'}
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('}')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold transition-all active:scale-95 text-[11px]"
              title="قوس حاصر مغلق }"
            >
              {'}'}
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('e')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              e
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('!')}
              className="py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95 text-[11px]"
            >
              n!
            </button>
          </div>

          {/* Standard Keypad Grid */}
          <div className="grid grid-cols-5 gap-1.5 pt-1 font-mono text-sm sm:text-base">
            
            {/* Row 1 */}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 sm:py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold transition-all active:scale-95 text-xs sm:text-sm"
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 font-bold transition-all active:scale-95 flex items-center justify-center"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('(')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-bold transition-all active:scale-95"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => appendToExpression(')')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-bold transition-all active:scale-95"
            >
              )
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('÷')}
              className="py-2.5 sm:py-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => appendToExpression('7')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('8')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('9')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('×')}
              className="py-2.5 sm:py-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('asin(')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 text-indigo-400 text-[11px] font-bold transition-all active:scale-95"
            >
              sin⁻¹
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => appendToExpression('4')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('5')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('6')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('−')}
              className="py-2.5 sm:py-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('acos(')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 text-indigo-400 text-[11px] font-bold transition-all active:scale-95"
            >
              cos⁻¹
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => appendToExpression('1')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('2')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('3')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('+')}
              className="py-2.5 sm:py-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-300 font-bold transition-all active:scale-95"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('atan(')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 text-indigo-400 text-[11px] font-bold transition-all active:scale-95"
            >
              tan⁻¹
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={() => appendToExpression('0')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('.')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold transition-all active:scale-95"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => appendToExpression('-')}
              className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold transition-all active:scale-95 text-xs"
              title="إشارة السالب للأس والعدد (-)"
            >
              (-)
            </button>
            <button
              type="button"
              onClick={handleCalculate}
              className="col-span-2 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/25 border border-emerald-400/40 transition-all active:scale-95 text-sm"
            >
              = احسب
            </button>
          </div>
        </div>

        {/* Collapsible Constants Bar */}
        <div className="pt-1.5 border-t border-slate-850">
          <button
            type="button"
            onClick={() => setShowConstants(!showConstants)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white py-0.5"
          >
            <span className="flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5 text-cyan-400" />
              <span>ثوابت مسائل الفيزياء والكيمياء الوزارية (إدراج فوري)</span>
            </span>
            {showConstants ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showConstants && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2">
              {BAC_CONSTANTS.map((c) => (
                <button
                  key={c.symbol}
                  type="button"
                  onClick={() => appendToExpression(c.value)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-right group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 text-xs">{c.symbol}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{c.value}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{c.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* History Slide-In Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl glass-card border border-slate-800 bg-slate-950 p-5 space-y-3 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>سجل العمليات الحسابية</span>
              </span>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setHistory([]); sound.button(); }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1"
                  >
                    مسح
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  لا توجد عمليات سابقة بعد
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setExpression(item.expression);
                      setResult(item.result);
                      setShowHistory(false);
                      sound.button();
                    }}
                    className="p-3 rounded-2xl bg-slate-900/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/30 cursor-pointer transition-all space-y-1 group"
                  >
                    <div className="text-xs font-mono text-slate-400 truncate dir-ltr text-right">
                      {item.expression}
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400 dir-ltr text-right flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                        اضغط للاسترجاع
                      </span>
                      <span>= {item.result}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
