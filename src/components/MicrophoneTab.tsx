import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Play, 
  Square, 
  Headphones, 
  Layers, 
  Monitor, 
  Download, 
  RefreshCw, 
  Disc, 
  Cpu, 
  Zap,
  Flame,
  Volume1
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';

interface MicrophoneTabProps {
  device: Device | null;
}

export const MicrophoneTab: React.FC<MicrophoneTabProps> = ({ device }) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [source, setSource] = useState<'mic' | 'playback'>('mic');
  const [codec, setCodec] = useState<'opus' | 'aac' | 'raw'>('opus');
  const [bitRate, setBitRate] = useState<string>('128K');
  const [bufferMs, setBufferMs] = useState<number>(20);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [volumeGain, setVolumeGain] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Recording Timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartMic = async (record = false) => {
    if (!device) return;
    try {
      const options: any = {
        source,
        codec,
        bitRate,
        buffer: bufferMs
      };

      if (record) {
        options.recordPath = `mic_record_${Date.now()}.opus`;
      }

      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/mic/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (data.success) {
        setIsStreaming(true);
        if (record) setIsRecording(true);
        showToast(data.message || 'استریم میکروفون فعال شد', 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleStopMic = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/mic/stop`, { method: 'POST' });
      if (data.success) {
        setIsStreaming(false);
        setIsRecording(false);
        showToast('استریم میکروفون متوقف شد', 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-cyan-400" />
            <span>استودیو میکروفون و صدای گوشی (Microphone & Audio Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            استفاده از میکروفون فوق‌العاده باکیفیت گوشی به عنوان میکروفون کامپیوتر در دیسکورد، زوم، گوگل‌میت، تلگرام و گیمینگ
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            isStreaming 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            <span>{isStreaming ? (isRecording ? 'در حال ضبط و استریم...' : 'میکروفون فعال است') : 'آماده به کار'}</span>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Visualizer & Live Mic Control Center */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Visualizer Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  طیف‌سنج و مانیتورینگ زنده میکروفون ({source === 'mic' ? 'میکروفون اصلی' : 'صدای داخلی دستگاه'})
                </h3>
              </div>

              {/* Source Switcher */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setSource('mic')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    source === 'mic' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  میکروفون گوشی
                </button>
                <button
                  onClick={() => setSource('playback')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    source === 'playback' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  صدای داخلی سیستم
                </button>
              </div>
            </div>

            {/* Dynamic VU Meter / Animated Spectrum Display */}
            <div className="relative w-full h-56 bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl">
              {/* Glowing Ambient Halo */}
              <div className={`absolute w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all ${
                isStreaming ? 'bg-cyan-500/20 scale-125' : 'bg-slate-800/10'
              }`}></div>

              {/* Mic Icon Centerpiece */}
              <div className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center transition-all mb-4 ${
                isStreaming 
                  ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-xl shadow-cyan-500/30 animate-pulse' 
                  : 'bg-slate-900 border border-slate-800 text-slate-500'
              }`}>
                {isMuted ? <MicOff className="w-10 h-10 text-rose-400" /> : <Mic className="w-10 h-10" />}
              </div>

              {/* Spectrum Frequency Bars */}
              <div className="relative z-10 flex items-end justify-center gap-1.5 h-16 w-full max-w-md">
                {[18, 35, 60, 85, 45, 95, 70, 40, 65, 90, 80, 55, 30, 75, 50, 65, 88, 42, 20].map((h, i) => (
                  <div
                    key={i}
                    style={{ 
                      height: isStreaming ? `${Math.max(15, (h * (volumeGain / 100)) % 100)}%` : '15%',
                      transition: 'height 0.15s ease'
                    }}
                    className={`w-2.5 rounded-full transition-all ${
                      isStreaming 
                        ? i % 3 === 0 ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : i % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500' 
                        : 'bg-slate-800'
                    }`}
                  ></div>
                ))}
              </div>

              {/* Live HUD telemetry */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 px-3 py-1 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300">
                {codec.toUpperCase()} • {bitRate} • {bufferMs}ms Buffer
              </div>

              {isRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-rose-500/20 border border-rose-500/40 text-rose-400 px-3 py-1 rounded-xl text-xs font-mono font-bold animate-pulse">
                  <Disc className="w-4 h-4 animate-spin" />
                  <span>REC {formatTimer(recordSeconds)}</span>
                </div>
              )}
            </div>

            {/* Live Gain / Volume Booster Slider */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl border transition-all ${
                  isMuted ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={isMuted ? 'فعال کردن صدا' : 'بی‌صدا کردن (Mute)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>تقویت صدای ورودی (Gain / Volume Boost):</span>
                  <span className="font-mono text-cyan-400 font-bold">{isMuted ? '0%' : `${volumeGain}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={isMuted ? 0 : volumeGain}
                  onChange={(e) => setVolumeGain(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Quick Studio Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {!isStreaming ? (
              <button
                onClick={() => handleStartMic(false)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>شروع استریم میکروفون روی ویندوز</span>
              </button>
            ) : (
              <button
                onClick={handleStopMic}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>توقف استریم میکروفون</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isRecording) {
                  handleStopMic();
                } else {
                  handleStartMic(true);
                }
              }}
              className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                isRecording 
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse' 
                  : 'bg-slate-900 hover:bg-purple-500/10 text-purple-300 border-slate-700 hover:border-purple-500/40'
              }`}
            >
              <Disc className="w-4 h-4" />
              <span>{isRecording ? `توقف و ذخیره ضبط (${formatTimer(recordSeconds)})` : 'شروع ضبط زنده صدا به فایل (Record)'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Audio Codec & Integration Guide */}
        <div className="space-y-6">
          {/* Audio Codec Settings */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>تنظیمات کدک و کیفیت صدا</span>
            </h3>

            {/* Codec */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">کدک صوتی (Audio Codec):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Opus (کمترین تأخیر)', val: 'opus' },
                  { label: 'AAC (استودیویی)', val: 'aac' },
                  { label: 'RAW PCM', val: 'raw' }
                ].map(c => (
                  <button
                    key={c.val}
                    onClick={() => setCodec(c.val as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      codec === c.val 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bitrate */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">بیت‌ریت و شفافیت صدا (Bitrate):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '64 Kbps', val: '64K' },
                  { label: '128 Kbps (استاندارد)', val: '128K' },
                  { label: '256 Kbps (Hi-Fi)', val: '256K' }
                ].map(b => (
                  <button
                    key={b.val}
                    onClick={() => setBitRate(b.val)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      bitRate === b.val 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buffer Latency */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">بافر تأخیر (Buffer Latency):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '10ms (گیمینگ)', val: 10 },
                  { label: '20ms (پیش‌فرض)', val: 20 },
                  { label: '50ms (پایدار)', val: 50 }
                ].map(buf => (
                  <button
                    key={buf.val}
                    onClick={() => setBufferMs(buf.val)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      bufferMs === buf.val 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {buf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Noise Suppression */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">حذف نویز محیطی و هوای پس‌زمینه (Noise Gate)</span>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* PC Virtual Mic Integration Guide */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>چگونه از میکروفون گوشی در دیسکورد، زوم و بازی‌ها استفاده کنیم؟</span>
            </h4>
            <ol className="text-[11px] text-slate-400 space-y-2 list-decimal list-inside leading-relaxed text-right">
              <li>روی <strong>«شروع استریم میکروفون روی ویندوز»</strong> کلیک کنید تا صدای میکروفون گوشی وارد کامپیوتر شود.</li>
              <li>برای استفاده به عنوان دیوایس ورودی (Input Device)، درایور رایگان <strong>VB-CABLE Virtual Audio Device</strong> را در ویندوز نصب کنید.</li>
              <li>در بخش تنظیمات Voice نرم‌افزارهای <strong>Discord / Zoom / Telegram / Games</strong>، ورودی میکروفون (Input Device) را روی <strong>CABLE Output</strong> تنظیم نمایید.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
