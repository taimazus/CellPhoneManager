import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Languages, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ScanText
} from 'lucide-react';
import { Device } from '../types';

interface ScreenOcrTabProps {
  device: Device | null;
}

export const ScreenOcrTab: React.FC<ScreenOcrTabProps> = ({ device }) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExtractOcr = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/ocr/extract`);
      const data = await res.json();
      if (data.success && data.extractedText) {
        setExtractedText(data.extractedText);
        showToast('متن صفحه با موفقیت استخراج شد.', 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    showToast('متن در کلیپ‌بورد کپی شد.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right">
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
            استخراج متون غیرقابل کپی داخل عکس‌ها، استوری‌های اینستاگرام، کپشن‌ها و فایل‌های PDF بدون نیاز به تایپ دستی
          </p>
        </div>

        <button
          onClick={handleExtractOcr}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>استخراج آنی متن صفحه فعلی</span>
        </button>
      </div>

      {/* Extracted Content */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>متن استخراج‌شده از صفحه:</span>
          </h3>

          <button
            onClick={handleCopy}
            disabled={!extractedText}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold transition-all disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>کپی متن</span>
          </button>
        </div>

        <textarea
          rows={12}
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          placeholder="دکمه 'استخراج آنی متن صفحه' را بزنید تا متن‌های نمایان روی صفحه گوشی در اینجا استخراج شوند..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs font-sans text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
};
