import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Circle, 
  Square, 
  Clock, 
  Volume2, 
  Sliders, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Film, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Device } from '../types';

interface ScreenRecorderTabProps {
  device: Device | null;
}

interface SavedRecording {
  name: string;
  size: string;
  created: string;
}

export const ScreenRecorderTab: React.FC<ScreenRecorderTabProps> = ({ device }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [resolution, setResolution] = useState<'720' | '1080' | '4k'>('1080');
  const [bitrate, setBitrate] = useState<number>(16);
  const [captureAudio, setCaptureAudio] = useState<boolean>(true);
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRecordings = async () => {
    try {
      const res = await fetch('/api/recordings');
      const data = await res.json();
      if (data.recordings) setRecordings(data.recordings);
    } catch {
      // quiet
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  // Live timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timer);
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecord = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/recorder/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, bitrate, captureAudio })
      });
      const data = await res.json();
      if (data.success) {
        setIsRecording(true);
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleStopRecord = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/recorder/stop`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsRecording(false);
        showToast(data.message, 'success');
        fetchRecordings();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
            <Film className="w-6 h-6 text-cyan-400" />
            <span>استودیو ضبط ویدیو و صدای داخلی با کیفیت 60FPS (HD Screen Recorder)</span>
          </h2>
          <p className="text-xs text-slate-400">
            ضبط با کیفیت 4K / 1080p همراه با ضبط استریو صدای داخلی بازی‌ها و اپلیکیشن‌ها (Internal Audio Capture) بدون نویز محیط
          </p>
        </div>

        {/* Start/Stop Button */}
        <div>
          {!isRecording ? (
            <button
              onClick={handleStartRecord}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95"
            >
              <Circle className="w-4 h-4 fill-white" />
              <span>شروع ضبط صفحه و صدا</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecord}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 text-white font-black text-sm shadow-xl shadow-rose-600/50 animate-pulse active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>توقف ضبط ({formatTime(elapsed)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Card */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>تنظیمات کیفیت ضبط</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Resolution */}
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">رزولوشن خروجی:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '720', label: '720p HD' },
                  { id: '1080', label: '1080p FHD' },
                  { id: '4k', label: '4K Ultra' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setResolution(r.id as any)}
                    className={`py-2 rounded-xl border font-mono font-bold transition-all ${
                      resolution === r.id ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bitrate */}
            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1.5">
                <span>بیت‌ریت ویدیو (Bitrate):</span>
                <span className="font-mono text-emerald-400">{bitrate} Mbps</span>
              </div>
              <input
                type="range"
                min="6"
                max="32"
                step="2"
                value={bitrate}
                onChange={(e) => setBitrate(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Audio Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">ضبط صدای داخلی گوشی (Playback Audio)</div>
                <div className="text-[10px] text-slate-500">ضبط شفاف صدای بازی بدون نویز اتاق</div>
              </div>
              <input
                type="checkbox"
                checked={captureAudio}
                onChange={(e) => setCaptureAudio(e.target.checked)}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Saved Recordings Card */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                <span>ویدیوهای ذخیره‌شده روی کامپیوتر ({recordings.length})</span>
              </h3>
              <button
                onClick={fetchRecordings}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {recordings.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                هنوز هیچ ویدیویی ذخیره نشده است. با زدن دکمه ضبط، ویدیوی MP4 در پوشه recordings ذخیره خواهد شد.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {recordings.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Film className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white">{rec.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{rec.created} • حجم: {rec.size}</div>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                      ذخیره در recordings/
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
