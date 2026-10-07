import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ScanText,
  Eye,
  Layers,
  Sparkles,
  Trash2,
  Filter,
  Check
} from 'lucide-react';
import { Device } from '../types';

interface ScreenOcrTabProps {
  device: Device | null;
}

export const ScreenOcrTab: React.FC<ScreenOcrTabProps> = ({ device }) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [mode, setMode] = useState<'hybrid' | 'ocr' | 'ui'>('hybrid');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleExtractOcr = async (selectedMode: 'hybrid' | 'ocr' | 'ui' = mode) => {
    if (!device) {
      showToast('لطفاً ابتدا یک دستگاه را متصل یا انتخاب کنید.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/ocr/extract?mode=${selectedMode}`);
      const data = await res.json();
      if (data.success && data.extractedText) {
        setExtractedText(data.extractedText);
        showToast('متن صفحه با موفقیت بدون کدهای اضافه استخراج شد.', 'success');
      } else {
        showToast(`خطا: ${data.error || 'متنی یافت نشد'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در پردازش: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    showToast('متن با موفقیت در کلیپ‌بورد کپی شد.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCleanJunk = () => {
    if (!extractedText) return;
    const lines = extractedText.split('\n');
    const cleaned = lines.filter(l => {
      const t = l.trim();
      if (!t || t.length < 2) return false;
      if (/^(utm_|gclid=|fbclid=|gad_source=|_ga=)/i.test(t)) return false;
      if (/^https?:\/\/[^\s]+(utm_|gclid|gad_source|pixel)/i.test(t)) return false;
      if (/^[a-zA-Z0-9_-]{30,}$/.test(t) && !t.includes(' ')) return false;
      return true;
    });
    setExtractedText(cleaned.join('\n'));
    showToast('کدهای فنی و ردگیری حذف شدند.', 'success');
  };

  const lineCount = extractedText ? extractedText.split('\n').filter(Boolean).length : 0;
  const charCount = extractedText ? extractedText.length : 0;

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <ScanText className="w-6 h-6 text-cyan-400" />
            <span>استخراج هوشمند متن از صفحه گوشی (Screen OCR & Text Grabber)</span>
          </h2>
          <p className="text-xs text-slate-400">
            استخراج متون بدون کدهای ردگیری، مناسب برای کپشن‌های اینستاگرام، عکس‌ها، استوری‌ها، پی‌دی‌اف و پیام‌ها
          </p>
        </div>

        <button
          onClick={() => handleExtractOcr(mode)}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'در حال پردازش و تشخیص...' : 'استخراج آنی متن صفحه فعلی'}</span>
        </button>
      </div>

      {/* Mode Switcher & Tools */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400">حالت پردازش:</span>
          <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('hybrid');
                handleExtractOcr('hybrid');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'hybrid' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>هوشمند ترکیبی (پیشنهادی)</span>
            </button>
            <button
              onClick={() => {
                setMode('ocr');
                handleExtractOcr('ocr');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'ocr' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>بینایی تصویر (Vision OCR)</span>
            </button>
            <button
              onClick={() => {
                setMode('ui');
                handleExtractOcr('ui');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'ui' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>لایه‌های رابط کاربری</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {extractedText && (
            <>
              <button
                onClick={handleCleanJunk}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="پاکسازی کدهای ردگیری و لینک‌های طولانی"
              >
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>حذف کدهای زائد</span>
              </button>
              <button
                onClick={() => setExtractedText('')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="پاک کردن متن"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاک کردن</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Extracted Content Box */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>متن استخراج‌شده از صفحه:</span>
            </h3>
            {extractedText && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {lineCount} خط • {charCount} کاراکتر
              </span>
            )}
          </div>

          <button
            onClick={handleCopy}
            disabled={!extractedText}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
          </button>
        </div>

        <textarea
          rows={14}
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          placeholder="دکمه 'استخراج آنی متن صفحه فعلی' را بزنید تا متن‌های نمایان روی صفحه گوشی به صورت تفکیک‌شده و تمیز استخراج شوند..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs font-sans text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>
    </div>
  );
};
