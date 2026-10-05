import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  LineChart, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Table, 
  Sparkles, 
  Info,
  Maximize2,
  TrendingUp,
  Check
} from 'lucide-react';
import { sound } from '../../services/sound';

interface PresetFunction {
  name: string;
  formula: string;
  unit: string;
  notes: string;
}

const PRESET_FUNCTIONS: PresetFunction[] = [
  { name: 'تابع لوغاريتمي شهير', formula: 'ln(x) - x', unit: 'التحليل - التابع اللوغاريتمي', notes: 'يظهر دوماً لدراسة إشارة المشتق وتعيين القيمة الحدية الكبرى' },
  { name: 'تابع أسي كسري', formula: 'x * exp(-x)', unit: 'التحليل - التابع الأسي', notes: 'له مقارب أفقي y = 0 عند +∞ وقيمة حدية عند x = 1' },
  { name: 'كسر من الدرجة الثانية على الأولى', formula: '(x^2 - 1) / (x + 2)', unit: 'التحليل - دراسة التغيرات والمقاربات', notes: 'له مقارب شاقولي x = -2 ومقارب مائل y = x - 2' },
  { name: 'تابع جذري تركيبي', formula: 'sqrt(x + 4) - x', unit: 'التحليل - التوابع الجذرية', notes: 'معرّف على [-4, +∞[، مستخدم في مسائل التقاطع وحساب المساحات' },
  { name: 'تابع جيبي توافقي (فيزياء)', formula: 'sin(x)', unit: 'الفيزياء - النواس المرن x(t)', notes: 'حركة جيبية انسحابية دورية ذات سعة 1 ودور 2π' },
];

export const FunctionGrapher: React.FC = () => {
  const [formula, setFormula] = useState<string>('ln(x) - x');
  const [xMin, setXMin] = useState<number>(-2);
  const [xMax, setXMax] = useState<number>(8);
  const [yMin, setYMin] = useState<number>(-6);
  const [yMax, setYMax] = useState<number>(4);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compile expression to JS function safely
  const compileMath = useCallback((expr: string): ((x: number) => number) => {
    let sanitized = expr
      .replace(/\^/g, '**')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/exp\(/g, 'Math.exp(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    // Handle multiplication like 2x or x(x+1)
    sanitized = sanitized.replace(/(\d)x/g, '$1*x');
    sanitized = sanitized.replace(/x\(/g, 'x*(');
    sanitized = sanitized.replace(/\)x/g, ')*x');

    const fn = new Function('x', `"use strict"; try { return (${sanitized}); } catch { return NaN; }`);
    return fn as (x: number) => number;
  }, []);

  // Draw plot on canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversions
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';

    // Vertical grid
    const xStep = Math.max(0.5, Math.pow(10, Math.floor(Math.log10((xMax - xMin) / 8))));
    const startX = Math.floor(xMin / xStep) * xStep;
    for (let x = startX; x <= xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();

      // Label
      if (Math.abs(x) > 0.001) {
        ctx.fillStyle = '#475569';
        ctx.font = '10px monospace';
        ctx.fillText(x.toFixed(xStep < 1 ? 1 : 0), sx + 2, toScreenY(0) + 12);
      }
    }

    // Horizontal grid
    const yStep = Math.max(0.5, Math.pow(10, Math.floor(Math.log10((yMax - yMin) / 8))));
    const startY = Math.floor(yMin / yStep) * yStep;
    for (let y = startY; y <= yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();

      // Label
      if (Math.abs(y) > 0.001) {
        ctx.fillStyle = '#475569';
        ctx.font = '10px monospace';
        ctx.fillText(y.toFixed(yStep < 1 ? 1 : 0), toScreenX(0) + 4, sy - 2);
      }
    }

    // Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#64748b';

    // X Axis
    const axisY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    // Y Axis
    const axisX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.stroke();

    // Axis Arrows & Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('X', width - 15, axisY - 6);
    ctx.fillText('Y', axisX + 6, 15);
    ctx.fillText('0', axisX - 10, axisY + 12);

    // Plot Function Curve
    try {
      const evalFn = compileMath(formula);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8'; // Cyan
      ctx.beginPath();

      let isDrawing = false;
      const stepPixels = 1;
      const numPoints = width;

      for (let px = 0; px <= numPoints; px += stepPixels) {
        const x = xMin + (px / width) * (xMax - xMin);
        const y = evalFn(x);

        if (isNaN(y) || !isFinite(y) || y < yMin - 10 || y > yMax + 10) {
          isDrawing = false;
          continue;
        }

        const py = toScreenY(y);

        if (!isDrawing) {
          ctx.moveTo(px, py);
          isDrawing = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      setEvalError('');
    } catch (e: any) {
      setEvalError('صيغة التابع غير صحيحة، يرجى كتابتها مثل: ln(x) - x أو x^2 - 4');
    }
  }, [formula, xMin, xMax, yMin, yMax, compileMath]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const handleZoom = (factor: number) => {
    sound.button();
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xSpan = (xMax - xMin) * factor;
    const ySpan = (yMax - yMin) * factor;

    setXMin(xCenter - xSpan / 2);
    setXMax(xCenter + xSpan / 2);
    setYMin(yCenter - ySpan / 2);
    setYMax(yCenter + ySpan / 2);
  };

  const handleResetView = () => {
    sound.button();
    setXMin(-5);
    setXMax(5);
    setYMin(-5);
    setYMax(5);
  };

  // Generate Table of Values
  const getTableValues = () => {
    try {
      const evalFn = compileMath(formula);
      const rows = [];
      const step = 0.5;
      for (let x = -3; x <= 5; x += step) {
        const val = evalFn(x);
        rows.push({
          x: Math.round(x * 10) / 10,
          y: isNaN(val) || !isFinite(val) ? 'غير معرّف' : (Math.round(val * 1000) / 1000).toString()
        });
      }
      return rows;
    } catch {
      return [];
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-sky-500/20 bg-gradient-to-r from-slate-900/90 via-sky-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-lg shadow-sky-600/10">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>راسم ومحلل التوابع والبيانات الرياضية</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono">
                C_f Plotter
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              رسم الخطوط البيانية لتوابع التحليل والفيزياء، وتعيين المقاربات وجداول القيم بضغطة زر
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowTable(!showTable); sound.button(); }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showTable
                ? 'bg-sky-600 text-white border-sky-500'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>{showTable ? 'إخفاء جدول القيم' : 'جدول القيم (x, y)'}</span>
          </button>
        </div>
      </div>

      {/* Formula Input & Presets */}
      <div className="p-4 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>معادلة التابع f(x):</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">يدعم: ln, exp, sqrt, sin, cos, ^</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute right-3.5 top-3 text-sky-400 font-mono font-bold text-sm">f(x) =</span>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. ln(x) - x, x*exp(-x), sin(x)"
              className="w-full bg-slate-900 border border-slate-750 rounded-2xl pr-18 pl-4 py-2.5 font-mono text-base text-white font-bold outline-none focus:border-sky-500/50 dir-ltr text-right"
            />
          </div>
        </div>

        {evalError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {evalError}
          </div>
        )}

        {/* Baccalaureate Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-bold block">
            توابع نموذجية من امتحانات التحليل السورية (اضغط للرسم الفوري):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_FUNCTIONS.map(p => (
              <button
                key={p.formula}
                onClick={() => {
                  setFormula(p.formula);
                  if (p.formula.includes('ln')) {
                    setXMin(-1); setXMax(6); setYMin(-5); setYMax(2);
                  } else if (p.formula.includes('exp')) {
                    setXMin(-2); setXMax(5); setYMin(-2); setYMax(1.5);
                  } else if (p.formula.includes('sin')) {
                    setXMin(-7); setXMax(7); setYMin(-2); setYMax(2);
                  } else {
                    setXMin(-6); setXMax(6); setYMin(-6); setYMax(6);
                  }
                  sound.button();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs border transition-all text-right ${
                  formula === p.formula
                    ? 'bg-sky-600/30 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-mono font-bold text-sky-400 ml-1.5">f(x) = {p.formula}</span>
                <span className="text-[10px] text-slate-500 font-sans">({p.name})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Graph Display */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-3 relative shadow-2xl">
        
        {/* Floating Zoom & Controls */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-md shadow-lg">
          <button
            onClick={() => handleZoom(0.7)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.4)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title="إعادة ضبط المحاور"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-850 relative">
          <canvas
            ref={canvasRef}
            width={750}
            height={380}
            className="w-full h-full block"
          />
        </div>

        {/* Graph Footer Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>المجال الأفقي: [{xMin.toFixed(1)}, {xMax.toFixed(1)}]</span>
            <span>•</span>
            <span>المجال الشاقولي: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]</span>
          </div>
          <div className="text-[11px] text-sky-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منحنى الخط البياني C_f مميز باللون الأزرق السماوي</span>
          </div>
        </div>
      </div>

      {/* Table of Values (Collapsible) */}
      {showTable && (
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-800 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
            <span>جدول قيم التابع للمساعدة في رسم الجدول بالامتحان:</span>
            <span className="font-mono text-sky-400">f(x) = {formula}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {getTableValues().map((row, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono space-y-0.5"
              >
                <div className="text-[11px] text-slate-400">x = {row.x}</div>
                <div className="text-xs font-bold text-sky-300">{row.y}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
