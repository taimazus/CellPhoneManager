import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX,
  Volume1,
  Zap, 
  Music, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  Sparkles,
  Speaker,
  Headphones,
  Play,
  Square,
  RefreshCw,
  Bell,
  Clock,
  Laptop
} from 'lucide-react';
import { Device } from '../types';

interface AudioFxTabProps {
  device: Device | null;
}

export const AudioFxTab: React.FC<AudioFxTabProps> = ({ device }) => {
  const [mediaVol, setMediaVol] = useState<number>(10);
  const [ringVol, setRingVol] = useState<number>(8);
  const [alarmVol, setAlarmVol] = useState<number>(12);
  const [notifVol, setNotifVol] = useState<number>(8);
  const [turboGain, setTurboGain] = useState<boolean>(false);
  const [isRelaying, setIsRelaying] = useState<boolean>(false);
  const [relayMode, setRelayMode] = useState<'pc_only' | 'both'>('both');
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchVolumes = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/volumes`);
      const data = await res.json();
      if (data.success && data.volumes) {
        if (data.volumes.media !== undefined) setMediaVol(data.volumes.media);
        if (data.volumes.ring !== undefined) setRingVol(data.volumes.ring);
        if (data.volumes.alarm !== undefined) setAlarmVol(data.volumes.alarm);
        if (data.volumes.notification !== undefined) setNotifVol(data.volumes.notification);
      }
    } catch (err) {
      console.error('Error fetching volumes:', err);
    }
  };

  const checkRelayStatus = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/relay/status`);
      const data = await res.json();
      if (data.isRelaying !== undefined) {
        setIsRelaying(data.isRelaying);
        if (data.mode) setRelayMode(data.mode);
      }
    } catch (err) {
      console.error('Error fetching relay status:', err);
    }
  };

  useEffect(() => {
    fetchVolumes();
    checkRelayStatus();
  }, [device]);

  const handleSetVolume = async (stream: number, level: number) => {
    if (!device) return;
    if (stream === 3) setMediaVol(level);
    if (stream === 2) setRingVol(level);
    if (stream === 4) setAlarmVol(level);
    if (stream === 5) setNotifVol(level);

    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream, level })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطا در تغییر صدا'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleTurbo = async () => {
    if (!device) return;
    const target = !turboGain;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: target })
      });
      const data = await res.json();
      if (data.success) {
        setTurboGain(target);
        if (target) {
          setMediaVol(15);
          setRingVol(15);
        }
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleRelay = async () => {
    if (!device) return;
    setLoading(true);
    try {
      if (isRelaying) {
        const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/relay/stop`, {
          method: 'POST'
        });
        const data = await res.json();
        setIsRelaying(false);
        showToast(data.message || 'انتقال صدای گوشی به کامپیوتر متوقف شد', 'success');
      } else {
        const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/relay/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: relayMode, codec: 'opus', buffer: 20 })
        });
        const data = await res.json();
        if (data.success) {
          setIsRelaying(true);
          showToast(data.message, 'success');
        } else {
          showToast(`خطا: ${data.error}`, 'error');
        }
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

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
            <Volume2 className="w-6 h-6 text-cyan-400" />
            <span>تقویت‌کننده صدا، اکولایزر و انتقال صدای گوشی به کامپیوتر</span>
          </h2>
          <p className="text-xs text-slate-400">
            کنترل دقیق ولوم تمام بخش‌های گوشی، تقویت سخت‌افزاری صدای بلندگو و پخش زنده آهنگ و بازی روی اسپیکرهای کامپیوتر
          </p>
        </div>

        <button
          onClick={fetchVolumes}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 text-xs font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>بروزرسانی سطح صدا</span>
        </button>
      </div>

      {/* Phone-to-PC Audio Relay Feature Card */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/60 space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-400" />
              <span>پخش زنده صدای گوشی روی اسپیکرهای کامپیوتر (Phone Audio to PC Relay)</span>
            </h3>
            <p className="text-xs text-slate-400">
              آهنگ، فیلم یا صدای بازی گوشی را با کیفیت استریو بدون نویز روی بلندگوهای کامپیوتر یا هدفون لپ‌تاپ بشنوید.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              isRelaying 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRelaying ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              <span>{isRelaying ? 'انتقال صدا به کامپیوتر فعال است' : 'آماده به کار'}</span>
            </span>
          </div>
        </div>

        {/* Mode Selector & Relay Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">نحوه پخش صدا:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRelayMode('both')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-right space-y-1 ${
                  relayMode === 'both' 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Speaker className="w-4 h-4 text-cyan-400" />
                  <span>پخش همزمان از هر دو</span>
                </div>
                <div className="text-[10px] text-slate-500 font-normal">
                  صدای آهنگ هم از گوشی و هم از کامپیوتر پخش می‌شود
                </div>
              </button>

              <button
                onClick={() => setRelayMode('pc_only')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-right space-y-1 ${
                  relayMode === 'pc_only' 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Headphones className="w-4 h-4 text-cyan-400" />
                  <span>فقط از اسپیکر کامپیوتر</span>
                </div>
                <div className="text-[10px] text-slate-500 font-normal">
                  صدای اسپیکر خود گوشی قطع و فقط از سیستم پخش می‌شود
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <button
              onClick={handleToggleRelay}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                isRelaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isRelaying ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>توقف انتقال صدای گوشی به کامپیوتر</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>شروع انتقال و پخش صدای گوشی روی سیستم</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Multi-Stream Volume Controls */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>تنظیم تفکیکی سطح بلندی صداها</span>
          </h3>

          <div className="space-y-4">
            {/* Media Stream (Stream 3) */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-cyan-400" />
                  <span>صدای رسانه و موزیک (Media & Music):</span>
                </span>
                <span className="font-mono text-cyan-400">{mediaVol} از 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={mediaVol}
                onChange={(e) => handleSetVolume(3, parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Ringtone Stream (Stream 2) */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>صدای زنگ و تماس (Ringtone):</span>
                </span>
                <span className="font-mono text-emerald-400">{ringVol} از 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={ringVol}
                onChange={(e) => handleSetVolume(2, parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Alarm Stream (Stream 4) */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>صدای آلارم و ساعت (Alarm):</span>
                </span>
                <span className="font-mono text-amber-400">{alarmVol} از 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={alarmVol}
                onChange={(e) => handleSetVolume(4, parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Notification Stream (Stream 5) */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Volume1 className="w-4 h-4 text-purple-400" />
                  <span>صدای اعلان‌ها و پیامک (Notification):</span>
                </span>
                <span className="font-mono text-purple-400">{notifVol} از 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={notifVol}
                onChange={(e) => handleSetVolume(5, parseInt(e.target.value, 10))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Turbo Booster Card */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>تقویت‌کننده فوق‌العاده بلندگو (Turbo Volume Hack 200%)</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                افزایش سطح آمپلی‌فایر سخت‌افزاری بلندگوی گوشی فراتر از ۱۰۰٪ به همراه تنظیم حداکثری کلیه استریم‌های صوتی با نمایش زنده پنل ولوم گوشی.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>کاربردهای حالت توربو:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/80">
                <li>پخش واضح ویس‌ها یا ویدیوهای ضبط‌شده با صدای بسیار ضعیف</li>
                <li>افزایش توان صدای خروجی بلندگو در محیط‌های شلوغ</li>
                <li>تنظیم همزمان صدای رسانه، زنگ و سیستم روی حداکثر توان</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleToggleTurbo}
            className={`w-full py-4 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 ${
              turboGain 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {turboGain ? '⚡ غیرفعال‌سازی تقویت توربو' : '🚀 فعال‌سازی تقویت حداکثری صدای بلندگو (Turbo Boost 200%)'}
          </button>
        </div>
      </div>
    </div>
  );
};
