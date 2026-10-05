import React, { useState, useRef } from 'react';
import { 
  ScanText, 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  RotateCw, 
  Download, 
  Sparkles, 
  Languages, 
  FileText, 
  AlertCircle,
  Camera,
  Trash2
} from 'lucide-react';
import { sound } from '../../services/sound';

interface TextOcrExtractorProps {
  onSendToTranslator?: (text: string) => void;
}

export const TextOcrExtractor: React.FC<TextOcrExtractorProps> = ({ onSendToTranslator }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [ocrLang, setOcrLang] = useState<'ara' | 'eng' | 'ara+eng'>('ara+eng');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setExtractedText('');
      setError('');
      sound.button();
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setExtractedText('');
        setError('');
        sound.button();
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Tesseract OCR Process
  const handleExtractText = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressStatus('تهيئة محرك استخراج النصوص (OCR)...');
    setError('');
    sound.button();

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(ocrLang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgressStatus('جاري تحليل وقراءة النص من الصورة...');
            setProgressPercent(Math.round((m.progress || 0) * 100));
          } else if (m.status === 'loading tesseract core') {
            setProgressStatus('تحميل نواة المعالجة السريعة...');
          } else if (m.status === 'loading language traineddata') {
            setProgressStatus('تحميل حزمة لغة المنهاج...');
          }
        },
      });

      const { data: { text } } = await worker.recognize(selectedImage);
      await worker.terminate();

      if (!text || !text.trim()) {
        setError('لم يتم العثور على نصوص واضحة في هذه الصورة. يرجى التأكد من وضوح وإضاءة السؤال أو الصفحة.');
      } else {
        setExtractedText(text.trim());
        sound.success();
      }
    } catch (err: any) {
      console.warn('OCR error:', err);
      setError('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة بصورة ذات دقة أعلى.');
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressStatus('');
    }
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    sound.success();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    sound.button();
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAC240_Extracted_Text_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCleanText = () => {
    if (!extractedText) return;
    sound.button();
    // Normalize spaces and remove excessive blank lines
    const cleaned = extractedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    setExtractedText(cleaned);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl glass-card border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-amber-950/20 to-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-600/10">
            <ScanText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>قارئ ومستخرج النصوص الذكي من الصور (OCR)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                عربي & لاتيني
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              استخراج فوري للنصوص والأسئلة من صور الكتب والملازم وأوراق العمل لنسخها أو ترجمتها مباشرة
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => { setOcrLang('ara+eng'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              ocrLang === 'ara+eng'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            عربي + إنجليزي
          </button>
          <button
            onClick={() => { setOcrLang('ara'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              ocrLang === 'ara'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            عربي فقط
          </button>
          <button
            onClick={() => { setOcrLang('eng'); sound.button(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              ocrLang === 'eng'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English / Latin
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Area & Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left: Image Upload & Dropzone */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>صورة المسألة أو السؤال:</span>
              {selectedImage && (
                <button
                  onClick={() => { setSelectedImage(null); setExtractedText(''); }}
                  className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  مسح الصورة
                </button>
              )}
            </div>

            {selectedImage ? (
              <div className="w-full h-64 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center group">
                <img
                  src={selectedImage}
                  alt="Selected Study Page"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    اضغط لاختيار صورة، أو اسحبها وأفلتها هنا
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    يدعم صور أوراق العمل، الكتب، والأسئلة (PNG, JPG, WEBP)
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Action Button & Progress */}
          <div className="space-y-3 pt-2">
            {isProcessing && (
              <div className="space-y-2 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span>{progressStatus}</span>
                  <span className="font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExtractText}
              disabled={!selectedImage || isProcessing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/20 border border-amber-400/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري القراءة والتعرف...</span>
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4" />
                  <span>استخراج النص من الصورة الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Extracted Text Editor */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>النص المستخرج القابل للتعديل والنسخ:</span>
              {extractedText && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {extractedText.length} حرف
                </span>
              )}
            </div>

            {error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : (
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="سيظهر النص المستخرج هنا بمجرد الضغط على استخراج النص..."
                className="w-full h-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-amber-500/50 resize-none leading-relaxed"
              />
            )}
          </div>

          {/* Bottom Toolbar for Extracted Text */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              {extractedText && (
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              )}

              {extractedText && (
                <button
                  onClick={handleDownloadTxt}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  title="تنزيل كملف مفكرة txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">حفظ ملف (.txt)</span>
                </button>
              )}

              {extractedText && (
                <button
                  onClick={handleCleanText}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-bold transition-all"
                  title="إزالة الأسطر والمسافات الزائدة"
                >
                  تنظيف التنسيق
                </button>
              )}
            </div>

            {extractedText && onSendToTranslator && (
              <button
                onClick={() => {
                  sound.button();
                  onSendToTranslator(extractedText);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>إرسال للمترجم</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Helpful Hint Card */}
      <div className="p-4 rounded-3xl glass-card border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">نصيحة للحصول على أفضل دقة استخراج:</span> احرص على أن تكون الصورة واضحة، بدون اهتزاز، وذات إضاءة جيدة مستقيمة على الصفحة، وتجنب ميلان زاوية الكاميرا.
        </div>
      </div>
    </div>
  );
};
