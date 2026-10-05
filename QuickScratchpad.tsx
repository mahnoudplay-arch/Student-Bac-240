import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Eraser, 
  Trash2, 
  Download, 
  Grid, 
  Sparkles, 
  RotateCcw,
  RotateCw,
  Hand,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Minus,
  MoveRight,
  Circle,
  Square,
  Type,
  Check,
  X
} from 'lucide-react';
import { sound } from '../../services/sound';
import { useApp } from '../../context/AppContext';

type ActiveTool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'pan';
type GridType = 'math' | 'dots' | 'lined' | 'none';

export const QuickScratchpad: React.FC = () => {
  const { theme } = useApp();
  const isLight = theme === 'light';

  const [tool, setTool] = useState<ActiveTool>('pen');
  const [color, setColor] = useState<string>(isLight ? '#0f172a' : '#ffffff');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [gridType, setGridType] = useState<GridType>('math');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  // When theme switches, adjust active default color if it matches the opposite theme background
  useEffect(() => {
    if (isLight && color === '#ffffff') {
      setColor('#0f172a');
    } else if (!isLight && color === '#0f172a') {
      setColor('#ffffff');
    }
  }, [isLight]);

  // Text modal state for clean mobile & desktop text insertion
  const [showTextModal, setShowTextModal] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [textCoords, setTextCoords] = useState<{ x: number; y: number }>({ x: 100, y: 100 });

  // History stack (Data URLs for reliable undo/redo)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const colors = isLight
    ? [
        { hex: '#0f172a', name: 'أسود كحلي' },
        { hex: '#0284c7', name: 'أزرق' },
        { hex: '#d97706', name: 'برتقالي' },
        { hex: '#059669', name: 'أخضر' },
        { hex: '#e11d48', name: 'أحمر' },
        { hex: '#7c3aed', name: 'بنفسجي' },
      ]
    : [
        { hex: '#ffffff', name: 'أبيض' },
        { hex: '#38bdf8', name: 'سماوي' },
        { hex: '#fbbf24', name: 'أصفر' },
        { hex: '#34d399', name: 'أخضر' },
        { hex: '#f43f5e', name: 'وردي' },
        { hex: '#a855f7', name: 'بنفسجي' },
      ];

  // Save current canvas to undo stack
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => {
      const next = [...prev.slice(0, historyIndex + 1), dataUrl];
      return next.slice(-25); // Keep last 25 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 24));

    try {
      localStorage.setItem('bac240_scratchpad_data', dataUrl);
    } catch {}
  }, [historyIndex]);

  // Initial load
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load saved drawing
    try {
      const saved = localStorage.getItem('bac240_scratchpad_data');
      if (saved) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          setHistory([saved]);
          setHistoryIndex(0);
        };
        img.src = saved;
        return;
      }
    } catch {}

    // Initial blank state
    const blank = canvas.toDataURL();
    setHistory([blank]);
    setHistoryIndex(0);
  }, []);

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sound.button();
    const newIdx = historyIndex - 1;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIdx];
    setHistoryIndex(newIdx);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sound.button();
    const newIdx = historyIndex + 1;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIdx];
    setHistoryIndex(newIdx);
  };

  // Mathematically exact coordinate translation taking into account bounding rect, scale, and pan
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Since canvas has CSS transform (translate + scale), rect.left already accounts for pan,
    // and rect.width is (canvas.width * zoom).
    // The exact internal canvas coordinates are:
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    return { x, y };
  };

  // Pointer Down (Mouse or Touch)
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Middle click or Pan tool: start panning
    if (tool === 'pan' || e.button === 1 || e.buttons === 4) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (e.button !== 0) return; // Only primary mouse button

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    lastPointRef.current = coords;
    startPosRef.current = coords;

    if (tool === 'text') {
      setTextCoords(coords);
      setShowTextModal(true);
      return;
    }

    setIsDrawing(true);

    // Save snapshot for real-time shapes preview
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      // Draw initial dot
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? '#000000' : color;
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = tool === 'highlighter' ? 0.4 : 1.0;
      }
      ctx.fill();
    }
  };

  // Pointer Move (Mouse or Touch)
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastPointRef.current = coords;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = strokeWidth * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastPointRef.current = coords;
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastPointRef.current = coords;
    } else if (['line', 'arrow', 'rect', 'circle'].includes(tool)) {
      // Restore previous state to preview live dragging shape
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sx = startPosRef.current.x;
      const sy = startPosRef.current.y;
      const ex = coords.x;
      const ey = coords.y;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (tool === 'arrow') {
        // Vector Arrow
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        const angle = Math.atan2(ey - sy, ex - sx);
        const headLength = 14 + strokeWidth;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLength * Math.cos(angle - Math.PI / 6), ey - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ex - headLength * Math.cos(angle + Math.PI / 6), ey - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (tool === 'rect') {
        ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  // Pointer Up
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  // Insert Text on Canvas
  const handleInsertText = () => {
    if (!textInput.trim()) {
      setShowTextModal(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.font = `bold ${Math.max(16, strokeWidth * 6)}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textCoords.x, textCoords.y);

    setTextInput('');
    setShowTextModal(false);
    saveToHistory();
    sound.button();
  };

  const handleClear = () => {
    sound.button();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    try {
      localStorage.removeItem('bac240_scratchpad_data');
    } catch {}
  };

  const handleDownload = () => {
    sound.success();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Fill canvas background
    tempCtx.fillStyle = isLight ? '#ffffff' : '#090d16';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const a = document.createElement('a');
    a.href = tempCanvas.toDataURL('image/png');
    a.download = `BAC240_Whiteboard_${Date.now()}.png`;
    a.click();
  };

  const handleResetView = () => {
    sound.button();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full max-w-5xl mx-auto space-y-3 transition-all ${
        isFullscreen ? `fixed inset-0 z-50 max-w-none p-3 ${isLight ? 'bg-slate-100' : 'bg-slate-950'} flex flex-col justify-between` : ''
      }`} 
      dir="rtl"
    >
      {/* Top Banner (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'glass-card border-teal-500/20 bg-gradient-to-r from-slate-900/90 via-teal-950/20 to-slate-900/90'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isLight ? 'bg-teal-50 border border-teal-200 text-teal-600' : 'bg-teal-600/20 border border-teal-500/30 text-teal-400'
            }`}>
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>اللوح الرقمي المتقدم (Interactive Whiteboard PRO)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isLight ? 'bg-teal-100 text-teal-700' : 'bg-teal-500/20 text-teal-300'
                }`}>
                  معايرة دقيقة
                </span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                لوح تفاعلي خالٍ من الانزياح، يدعم سحب الشاشة بحرية (Pan)، متجهات القوى، والأشكال الهندسية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullscreen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="توسيع لملء الشاشة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>ملء الشاشة</span>
            </button>
            <button
              onClick={handleDownload}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' 
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="تنزيل اللوح كصورة PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>حفظ كصورة</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Board Container */}
      <div className={`rounded-3xl border p-3 sm:p-4 space-y-3 relative shadow-md flex flex-col ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
      } ${isFullscreen ? 'flex-1 overflow-hidden' : ''}`}>
        
        {/* Top Floating Control Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl border backdrop-blur-md ${
          isLight ? 'bg-slate-50/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
        }`}>
          
          {/* Group 1: Tools */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setTool('pen'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'pen' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="قلم عادي"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">قلم</span>
            </button>
            <button
              onClick={() => { setTool('highlighter'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'highlighter' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="قلم تظليل فسفوري"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تظليل</span>
            </button>
            <button
              onClick={() => { setTool('arrow'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'arrow' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="سهم شعاعي (لمتجهات القوى والسرعة)"
            >
              <MoveRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شعاع</span>
            </button>
            <button
              onClick={() => { setTool('line'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'line' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="خط مستقيم"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setTool('circle'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'circle' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="دائرة"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setTool('rect'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'rect' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="مستطيل"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setTool('text'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="إدراج نص ورموز"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setTool('eraser'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                tool === 'eraser' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="ممحاة"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            {/* HAND / PAN TOOL */}
            <button
              onClick={() => { setTool('pan'); sound.button(); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                tool === 'pan' 
                  ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow' 
                  : 'bg-slate-800 border-slate-750 text-slate-300 hover:text-white'
              }`}
              title="أداة سحب وتحريك الشاشة"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>سحب الشاشة</span>
            </button>
          </div>

          {/* Group 2: Palette & Width */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {colors.map(c => (
                <button
                  key={c.hex}
                  onClick={() => { 
                    setColor(c.hex); 
                    if (tool === 'eraser' || tool === 'pan') setTool('pen'); 
                    sound.button(); 
                  }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c.hex && tool !== 'eraser' && tool !== 'pan'
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
              {[2, 4, 8].map(w => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`px-1.5 py-0.5 rounded ${strokeWidth === w ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: History, Zoom & Grid */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-all"
              title="تراجع"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-all"
              title="إعادة"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[10px]">
              <button
                onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.2) * 10) / 10))}
                className="p-1 text-slate-400 hover:text-white"
                title="تصغير"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="px-1 font-mono text-teal-400 font-bold">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(2.5, Math.round((z + 0.2) * 10) / 10))}
                className="p-1 text-slate-400 hover:text-white"
                title="تكبير"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Grid Pattern Toggle */}
            <button
              onClick={() => {
                const patterns: GridType[] = ['math', 'dots', 'lined', 'none'];
                const next = patterns[(patterns.indexOf(gridType) + 1) % patterns.length];
                setGridType(next);
                sound.button();
              }}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 font-bold"
              title="تبديل شبكة الكراس"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {gridType === 'math' ? 'شبكة' : gridType === 'dots' ? 'نقاط' : gridType === 'lined' ? 'مسطر' : 'فارغ'}
              </span>
            </button>

            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-rose-400 hover:text-rose-300"
                title="إغلاق ملء الشاشة"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleClear}
              className="p-1.5 rounded-xl bg-slate-800 text-rose-400 hover:text-rose-300"
              title="مسح اللوح بالكامل"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Viewport Box */}
        <div 
          className={`w-full ${isFullscreen ? 'flex-1 h-full' : 'h-[460px] sm:h-[540px]'} rounded-2xl overflow-hidden relative border ${
            isLight ? 'border-slate-200 shadow-inner' : 'border-slate-850'
          } select-none touch-none ${
            tool === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
          }`}
          style={{
            backgroundColor: isLight ? '#ffffff' : '#090d16',
            backgroundImage: 
              gridType === 'math' 
                ? (isLight
                    ? 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)'
                    : 'linear-gradient(to right, #1a2234 1px, transparent 1px), linear-gradient(to bottom, #1a2234 1px, transparent 1px)')
                : gridType === 'dots'
                ? (isLight
                    ? 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)'
                    : 'radial-gradient(#334155 1.5px, transparent 1.5px)')
                : gridType === 'lined'
                ? (isLight
                    ? 'linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)'
                    : 'linear-gradient(to bottom, #1a2234 1px, transparent 1px)')
                : 'none',
            backgroundSize: gridType === 'lined' ? `100% ${28 * zoom}px` : `${28 * zoom}px ${28 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          {/* Zoom / Pan Transformed Wrapper */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '1200px',
              height: '800px',
            }}
          >
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="block touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Floating Pan Indicator & Reset Button */}
          {(pan.x !== 0 || pan.y !== 0 || zoom !== 1) && (
            <button
              onClick={handleResetView}
              className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-750 text-xs text-amber-300 font-mono flex items-center gap-1.5 shadow-xl hover:bg-slate-850 transition-all"
              title="إعادة موضع الشاشة والتقريب للأصل"
            >
              <span>إعادة الضبط ({Math.round(pan.x)}, {Math.round(pan.y)}) [{Math.round(zoom * 100)}%]</span>
            </button>
          )}
        </div>

        {/* Text Input Modal */}
        {showTextModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl glass-card border border-slate-800 bg-slate-950 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-teal-400" />
                  <span>إدراج نص أو قانون رياضي على اللوح</span>
                </span>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="مثال: F = m·a, θ = 0.2 rad, Δt = 5s"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInsertText();
                  }}
                  className="w-full bg-slate-900 border border-slate-750 rounded-2xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowTextModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleInsertText}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow"
                >
                  إدراج على اللوح
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
          <span>💡 اختر <strong>سحب الشاشة</strong> للتحرك بحرية في أي اتجاه، أو أداة <strong>الشعاع</strong> لرسم متجهات القوى الفيزيائية بدقة تامة.</span>
          <span className="font-mono text-emerald-400">حفظ تلقائي محلي</span>
        </div>

      </div>
    </div>
  );
};
