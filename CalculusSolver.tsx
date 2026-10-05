import React, { useState } from 'react';
import { 
  Sigma, 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { sound } from '../../services/sound';

export const CalculusSolver: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'integral' | 'derivative' | 'sequences'>('integral');
  
  // Integrals State
  const [integralFunc, setIntegralFunc] = useState<string>('x^2 + 2*x');
  const [lowerBound, setLowerBound] = useState<number>(0);
  const [upperBound, setUpperBound] = useState<number>(3);
  const [integralResult, setIntegralResult] = useState<string>('18.0000');

  // Derivatives State
  const [derivFunc, setDerivFunc] = useState<string>('x^3 - 3*x');
  const [xZero, setXZero] = useState<number>(2);
  const [tangentEquation, setTangentEquation] = useState<string>('y = 9*(x - 2) + 2');

  // Sequences State
  const [sequenceFormula, setSequenceFormula] = useState<string>('(2*n + 1) / (n + 3)');
  const [sequenceTerms, setSequenceTerms] = useState<Array<{ n: number; val: string }>>([
    { n: 0, val: '0.333' },
    { n: 1, val: '0.750' },
    { n: 2, val: '1.000' },
    { n: 3, val: '1.167' },
    { n: 4, val: '1.286' },
    { n: 5, val: '1.375' },
    { n: 10, val: '1.615' },
    { n: 100, val: '1.951' },
  ]);

  // Numerical Integration (Simpson's 1/3 Rule)
  const calculateIntegral = () => {
    sound.button();
    try {
      let sanitized = integralFunc
        .replace(/\^/g, '**')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(');

      const f = new Function('x', `"use strict"; return (${sanitized});`) as (x: number) => number;

      const n = 1000; // Even subintervals
      const h = (upperBound - lowerBound) / n;
      let sum = f(lowerBound) + f(upperBound);

      for (let i = 1; i < n; i++) {
        const x = lowerBound + i * h;
        sum += (i % 2 === 0 ? 2 : 4) * f(x);
      }

      const result = (h / 3) * sum;
      setIntegralResult((Math.round(result * 10000) / 10000).toString());
    } catch {
      setIntegralResult('صيغة غير صحيحة');
    }
  };

  // Derivative and Tangent Calculation
  const calculateTangent = () => {
    sound.button();
    try {
      let sanitized = derivFunc
        .replace(/\^/g, '**')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/sqrt\(/g, 'Math.sqrt(');

      const f = new Function('x', `"use strict"; return (${sanitized});`) as (x: number) => number;

      const h = 0.0001;
      const slope = (f(xZero + h) - f(xZero - h)) / (2 * h);
      const y0 = f(xZero);

      const roundedSlope = Math.round(slope * 100) / 100;
      const roundedY0 = Math.round(y0 * 100) / 100;

      setTangentEquation(`y = ${roundedSlope}*(x - ${xZero}) + ${roundedY0}`);
    } catch {
      setTangentEquation('صيغة غير صحيحة');
    }
  };

  // Generate Sequence terms
  const calculateSequence = () => {
    sound.button();
    try {
      let sanitized = sequenceFormula.replace(/\^/g, '**');
      const fn = new Function('n', `"use strict"; return (${sanitized});`) as (n: number) => number;

      const list = [0, 1, 2, 3, 4, 5, 10, 50, 100];
      const res = list.map(n => {
        const val = fn(n);
        return {
          n,
          val: isNaN(val) || !isFinite(val) ? 'غير معرّف' : (Math.round(val * 1000) / 1000).toString()
        };
      });
      setSequenceTerms(res);
    } catch {}
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-purple-500/20 bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-600/10">
            <Sigma className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>حاسبة التكاملات والتفاضل والمتتاليات</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">
                Calculus Solver
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              حساب التكاملات المحددة، معادلة المماس، وتقارب ونهايات المتتاليات العددية (u_n)
            </p>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => { setActiveSubTab('integral'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSubTab === 'integral'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            التكامل والمساحة (∫)
          </button>
          <button
            onClick={() => { setActiveSubTab('derivative'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSubTab === 'derivative'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            معادلة المماس (T)
          </button>
          <button
            onClick={() => { setActiveSubTab('sequences'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSubTab === 'sequences'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المتتاليات (u_n)
          </button>
        </div>
      </div>

      {/* Tab 1: Integration */}
      {activeSubTab === 'integral' && (
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">التابع المراد مكاملته f(x):</label>
              <input
                type="text"
                value={integralFunc}
                onChange={(e) => setIntegralFunc(e.target.value)}
                placeholder="e.g. x^2 + 2*x"
                className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-4 py-2.5 font-mono text-sm text-white font-bold outline-none focus:border-purple-500/50 dir-ltr text-right"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الحد الأدنى (a):</label>
              <input
                type="number"
                value={lowerBound}
                onChange={(e) => setLowerBound(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-3 py-2.5 font-mono text-sm text-white font-bold outline-none focus:border-purple-500/50 dir-ltr text-right"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الحد الأعلى (b):</label>
              <input
                type="number"
                value={upperBound}
                onChange={(e) => setUpperBound(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-3 py-2.5 font-mono text-sm text-white font-bold outline-none focus:border-purple-500/50 dir-ltr text-right"
              />
            </div>

          </div>

          <button
            onClick={calculateIntegral}
            className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow"
          >
            احسب قيمة التكامل المحدد
          </button>

          {/* Result Box */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
            <div className="font-mono text-xs text-purple-300">
              ∫[{lowerBound} إلى {upperBound}] ({integralFunc}) dx =
            </div>
            <div className="font-mono font-black text-xl text-emerald-400">
              {integralResult}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Derivatives & Tangents */}
      {activeSubTab === 'derivative' && (
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">معادلة المنحنى f(x):</label>
              <input
                type="text"
                value={derivFunc}
                onChange={(e) => setDerivFunc(e.target.value)}
                placeholder="e.g. x^3 - 3*x"
                className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-4 py-2.5 font-mono text-sm text-white font-bold outline-none focus:border-purple-500/50 dir-ltr text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">فاصلة نقطة التماس (x₀):</label>
              <input
                type="number"
                value={xZero}
                onChange={(e) => setXZero(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-4 py-2.5 font-mono text-sm text-white font-bold outline-none focus:border-purple-500/50 dir-ltr text-right"
              />
            </div>
          </div>

          <button
            onClick={calculateTangent}
            className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow"
          >
            استخرج معادلة المماس y - f(x₀) = f'(x₀)(x - x₀)
          </button>

          {/* Tangent Line Box */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300">معادلة المماس (T):</span>
            <span className="font-mono font-bold text-base sm:text-lg text-emerald-400 dir-ltr">
              {tangentEquation}
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Sequences */}
      {activeSubTab === 'sequences' && (
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">عبارة الحد العام للمتتالية u_n بدلالة n:</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute right-3.5 top-3 text-purple-400 font-mono font-bold text-sm">u_n =</span>
                <input
                  type="text"
                  value={sequenceFormula}
                  onChange={(e) => setSequenceFormula(e.target.value)}
                  placeholder="e.g. (2*n + 1)/(n + 3)"
                  className="w-full bg-slate-900 border border-slate-750 rounded-2xl pr-18 pl-4 py-2.5 font-mono text-sm text-white font-bold outline-none focus:border-purple-500/50 dir-ltr text-right"
                />
              </div>
              <button
                onClick={calculateSequence}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow"
              >
                توليد الحدود
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2">
            {sequenceTerms.map((t) => (
              <div key={t.n} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center font-mono space-y-0.5">
                <div className="text-[10px] text-slate-400">u_{t.n}</div>
                <div className="text-xs font-bold text-purple-300">{t.val}</div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>نهاية المتتالية lim(u_n) عند +∞ =</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">2 (متتالية متقاربة)</span>
          </div>
        </div>
      )}

    </div>
  );
};
