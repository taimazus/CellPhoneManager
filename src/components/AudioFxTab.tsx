import React, { useState } from 'react';
import { 
  Volume2, 
  Zap, 
  Music, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  Sparkles
} from 'lucide-react';
import { Device } from '../types';

interface AudioFxTabProps {
  device: Device | null;
}

export const AudioFxTab: React.FC<AudioFxTabProps> = ({ device }) => {
  const [volLevel, setVolLevel] = useState<number>(15);
  const [turboGain, setTurboGain] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSetVolume = async (lvl: number) => {
    if (!device) return;
    setVolLevel(lvl);
    try {
      await fetch(`/api/devices/${device.id}/audio/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream: 3, level: lvl })
      });
      showToast(`بلندی صدا روی سطح ${lvl} تنظیم شد.`, 'success');
    } catch {
      // quiet
    }
  };

  const handleToggleTurbo = async () => {
    if (!device) return;
    const target = !turboGain;
    try {
      const res = await fetch(`/api/devices/${device.id}/audio/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: target })
      });
      const data = await res.json();
      if (data.success) {
        setTurboGain(target);
        showToast(data.message, 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
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
            <Volume2 className="w-6 h-6 text-cyan-400" />
            <span>تقویت‌کننده صدا و اکولایزر گوشی (Audio Booster & Volume Hack)</span>
          </h2>
          <p className="text-xs text-slate-400">
            افزایش بلندی صدای بلندگوی گوشی فراتر از ۱۰۰٪، فعال‌سازی بیس قوی (Bass Boost) و اکولایزر فرکانسی
          </p>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Volume Master Slider */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <span>سطح بلندی صدای رسانه (Media Volume)</span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-300 font-bold">
              <span>سطح صدا:</span>
              <span className="font-mono text-cyan-400">{volLevel} از 15</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              value={volLevel}
              onChange={(e) => handleSetVolume(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        {/* Turbo Booster Card */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>تقویت‌کننده فوق‌العاده بلندگو (Turbo Volume Hack 200%)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تقویت سطح گین سخت‌افزاری بلندگوی گوشی برای زمانی که فیلم یا ویس ضبط‌شده صدای بسیار ضعیفی دارد.
            </p>
          </div>

          <button
            onClick={handleToggleTurbo}
            className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 ${
              turboGain 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {turboGain ? '⚡ غیرفعال‌سازی تقویت توربو' : '🚀 فعال‌سازی تقویت صدای بلندگو (Turbo Boost)'}
          </button>
        </div>
      </div>
    </div>
  );
};
