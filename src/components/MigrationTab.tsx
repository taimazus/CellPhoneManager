import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  PhoneCall, 
  Film, 
  Zap,
  RefreshCw
} from 'lucide-react';
import { Device } from '../types';

interface MigrationTabProps {
  devices: Device[];
  selectedDevice: Device | null;
}

export const MigrationTab: React.FC<MigrationTabProps> = ({ devices, selectedDevice }) => {
  const [sourceId, setSourceId] = useState<string>(selectedDevice?.id || devices[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(devices[1]?.id || devices[0]?.id || '');
  const [options, setOptions] = useState({ contacts: true, sms: true, calls: true, photos: false });
  const [loading, setLoading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartMigration = async () => {
    if (sourceId === targetId) {
      showToast('گوشی مبدأ و مقصد نباید یکسان باشند.', 'error');
      return;
    }

    setLoading(true);
    setProgressText('در حال استخراج اطلاعات از گوشی مبدأ و انتقال مستقیم به گوشی جدید...');
    try {
      const res = await fetch('/api/devices/migration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceSerial: sourceId, targetSerial: targetId, options })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setProgressText(data.message);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
        setProgressText('');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
      setProgressText('');
    } finally {
      setLoading(false);
    }
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
            <ArrowLeftRight className="w-6 h-6 text-cyan-400" />
            <span>انتقال مستقیم اطلاعات بین دو گوشی (Phone-to-Phone Smart Migration)</span>
          </h2>
          <p className="text-xs text-slate-400">
            انتقال ۱ کلیکه مخاطبین، پیامک‌ها، تماس‌ها و عکس‌ها از گوشی قدیمی به گوشی جدید با حداکثر سرعت کابل بدون نیاز به اینترنت
          </p>
        </div>
      </div>

      {/* Migration Wizard Card */}
      <div className="rounded-3xl glass-panel p-8 border border-slate-800 space-y-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Source Device */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <Smartphone className="w-4 h-4" />
              <span>گوشی مبدأ (قدیمی):</span>
            </div>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-bold focus:outline-none"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.model} ({d.serial})</option>
              ))}
            </select>
          </div>

          {/* Transfer Animation Arrow */}
          <div className="flex flex-col items-center justify-center text-cyan-400">
            <ArrowLeftRight className="w-8 h-8 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 mt-1">Direct USB High-Speed</span>
          </div>

          {/* Target Device */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Smartphone className="w-4 h-4" />
              <span>گوشی مقصد (جدید):</span>
            </div>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-bold focus:outline-none"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.model} ({d.serial})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transfer Options */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300">اطلاعات مورد نظر برای انتقال:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'contacts', label: 'دفترچه مخاطبین', icon: Users },
              { id: 'sms', label: 'پیامک‌ها و گفتگوها', icon: MessageSquare },
              { id: 'calls', label: 'تاریخچه تماس‌ها', icon: PhoneCall },
              { id: 'photos', label: 'گالری و تصاویر', icon: Film }
            ].map(opt => (
              <label key={opt.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <opt.icon className="w-4 h-4 text-cyan-400" />
                  <span>{opt.label}</span>
                </span>
                <input
                  type="checkbox"
                  checked={(options as any)[opt.id]}
                  onChange={(e) => setOptions({ ...options, [opt.id]: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Start Button & Progress */}
        <div className="space-y-3">
          <button
            onClick={handleStartMigration}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            <span>شروع انتقال هوشمند به گوشی جدید</span>
          </button>

          {progressText && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 text-center animate-fadeIn">
              {progressText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
