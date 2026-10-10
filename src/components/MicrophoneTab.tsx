import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Activity, 
  Sliders, 
  Play, 
  Square, 
  Headphones, 
  Download, 
  RefreshCw, 
  Disc, 
  CheckCircle2, 
  AlertCircle,
  Folder,
  FolderOpen,
  Music,
  Trash2,
  X,
  Edit3,
  Check
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';

interface MicrophoneTabProps {
  device: Device | null;
}

interface SavedAudio {
  name: string;
  size: string;
  sizeBytes?: number;
  created: string;
  path?: string;
}

export const MicrophoneTab: React.FC<MicrophoneTabProps> = ({ device }) => {
  const isIos = device?.platform === 'ios' || device?.model?.toLowerCase().includes('iphone');
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
  const [recordings, setRecordings] = useState<SavedAudio[]>([]);
  const [saveDirectory, setSaveDirectory] = useState<string>('');
  const [isEditingDir, setIsEditingDir] = useState<boolean>(false);
  const [customDirInput, setCustomDirInput] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<SavedAudio | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRecordings = async () => {
    try {
      const data = await safeFetchJson('/api/audio-recordings');
      if (data.recordings) setRecordings(data.recordings);
      if (data.directory) {
        setSaveDirectory(data.directory);
        setCustomDirInput(data.directory);
      }
    } catch (err: any) {
      console.error('Error fetching audio recordings:', err);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

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
    if (!device) {
      showToast('لطفاً ابتدا یک دستگاه را انتخاب کنید.', 'error');
      return;
    }
    try {
      const options: any = {
        source,
        codec,
        bitRate,
        buffer: bufferMs,
        record
      };

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
        showToast(data.message || 'استریم میکروفون متوقف شد', 'success');
        fetchRecordings();
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleSaveDirectory = async () => {
    if (!customDirInput.trim()) {
      showToast('لطفاً مسیر معتبری وارد کنید.', 'error');
      return;
    }
    try {
      const data = await safeFetchJson('/api/audio-recordings/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: customDirInput.trim() })
      });
      if (data.success) {
        setSaveDirectory(data.audioDir);
        setIsEditingDir(false);
        showToast(data.message, 'success');
        fetchRecordings();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleOpenFolder = async () => {
    try {
      const data = await safeFetchJson('/api/audio-recordings/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPath: saveDirectory })
      });
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleOpenFileInExplorer = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const data = await safeFetchJson('/api/audio-recordings/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDeleteAudio = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`آیا از حذف فایل صوتی "${filename}" اطمینان دارید؟`)) return;
    try {
      const data = await safeFetchJson(`/api/audio-recordings/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (data.success) {
        showToast(data.message, 'success');
        if (selectedAudio?.name === filename) {
          setSelectedAudio(null);
        }
        fetchRecordings();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
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
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Audio Player Modal */}
      {selectedAudio && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate-scaleIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-mono truncate max-w-xs">
                    {selectedAudio.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    حجم: {selectedAudio.size} • تاریخ ضبط: {selectedAudio.created}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleOpenFileInExplorer(selectedAudio.name, e)}
                  title="نمایش در پوشه ویندوز"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>پوشه</span>
                </button>
                <a
                  href={`/api/audio-recordings/download/${encodeURIComponent(selectedAudio.name)}`}
                  download
                  className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-100 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود</span>
                </a>
                <button
                  onClick={() => setSelectedAudio(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="p-6 bg-slate-950 flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10 animate-pulse">
                <Music className="w-10 h-10" />
              </div>

              <audio
                key={selectedAudio.name}
                controls
                autoPlay
                className="w-full mt-2"
                src={`/api/audio-recordings/stream/${encodeURIComponent(selectedAudio.name)}`}
              >
                مرورگر شما از پخش مستقیم این فایل صوتی پشتیبانی نمی‌کند.
              </audio>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] truncate max-w-sm" dir="ltr">
                {selectedAudio.path || `${saveDirectory}\\${selectedAudio.name}`}
              </span>
              <button
                onClick={() => setSelectedAudio(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
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

      {/* iOS Notice Banner */}
      {isIos && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3 text-xs text-slate-300">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong>دستگاه متصل: Apple iPhone (iOS)</strong> — ضبط مستقیم و مدیریت فایل‌های صوتی فعال است. برای اتصال آیفون به عنوان میکروفون فوق‌العاده باکیفیت ویندوز، اتصال از طریق بلوتوث hands-free یا کابل لایتنینگ/تایپ‌سی فراهم است.
          </span>
        </div>
      )}

      {/* Save Directory Control Bar */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Folder className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-slate-400">محل ذخیره‌سازی صداهای ضبط شده روی سیستم:</div>
            {isEditingDir ? (
              <div className="flex items-center gap-2 mt-1 w-full">
                <input
                  type="text"
                  value={customDirInput}
                  onChange={(e) => setCustomDirInput(e.target.value)}
                  placeholder="مسیر پوشه مورد نظر مثلاً: D:\AudioRecordings"
                  className="flex-1 bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
                  dir="ltr"
                />
                <button
                  onClick={handleSaveDirectory}
                  className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                  title="تایید و ذخیره مسیر"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingDir(false);
                    setCustomDirInput(saveDirectory);
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  title="انصراف"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="font-mono text-xs font-bold text-purple-300 mt-0.5 truncate select-all" dir="ltr">
                {saveDirectory || 'در حال دریافت مسیر...'}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {!isEditingDir && (
            <button
              onClick={() => setIsEditingDir(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>تغییر محل ذخیره</span>
            </button>
          )}

          <button
            onClick={handleOpenFolder}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-950"
          >
            <FolderOpen className="w-4 h-4 text-purple-300" />
            <span>رفتن به محل ذخیره در ویندوز (Explorer)</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Visualizer & Live Mic Control Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-5">
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
            <div className="relative w-full h-52 bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl">
              {/* Glowing Ambient Halo */}
              <div className={`absolute w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all ${
                isStreaming ? 'bg-cyan-500/20 scale-125' : 'bg-slate-800/10'
              }`}></div>

              {/* Mic Icon Centerpiece */}
              <div className={`relative z-10 w-16 h-16 rounded-3xl flex items-center justify-center transition-all mb-3 ${
                isStreaming 
                  ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-xl shadow-cyan-500/30 animate-pulse' 
                  : 'bg-slate-900 border border-slate-800 text-slate-500'
              }`}>
                {isMuted ? <MicOff className="w-8 h-8 text-rose-400" /> : <Mic className="w-8 h-8" />}
              </div>

              {/* Spectrum Frequency Bars */}
              <div className="relative z-10 flex items-end justify-center gap-1.5 h-14 w-full max-w-md">
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

          {/* Saved Audio Recordings List */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span>صداهای ضبط‌شده روی کامپیوتر ({recordings.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenFolder}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-400 hover:text-purple-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="باز کردن پوشه فایل‌ها در ویندوز"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>پوشه صداها</span>
                </button>
                <button
                  onClick={fetchRecordings}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
                  title="بروزرسانی لیست"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {recordings.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs space-y-2">
                <Music className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p>هنوز هیچ صدای ضبط‌شده‌ای در این مسیر ذخیره نشده است.</p>
                <p className="text-[11px] text-slate-600 font-mono" dir="ltr">{saveDirectory}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {recordings.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAudio(rec)}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 border border-purple-500/20 transition-all">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono font-bold text-white truncate text-left" dir="ltr">
                          {rec.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {rec.created} • حجم: <span className="text-emerald-400">{rec.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAudio(rec);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 transition-all"
                        title="پخش صدا در برنامه"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>پخش</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenFileInExplorer(rec.name, e)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                        title="نمایش در فایل اکسپلورر ویندوز"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={`/api/audio-recordings/download/${encodeURIComponent(rec.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        download
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                        title="دانلود فایل صوتی"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={(e) => handleDeleteAudio(rec.name, e)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                        title="حذف فایل صوتی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <li>با زدن <strong>«شروع استریم میکروفون»</strong>، صدای گوشی با کمترین تأخیر (Ultra Low Latency) مستقیماً از طریق کابل یا وای‌فای به اسپیکرها یا کابل مجازی ویندوز هدایت می‌شود.</li>
              <li>برای ضبط صدا در کامپیوتر، دکمه <strong>«شروع ضبط زنده صدا»</strong> را بزنید تا فایل صوتی مستقیماً در پوشه <code>audio_recordings</code> ذخیره شده و در لیست پایین قرار گیرد.</li>
              <li>برای استفاده به عنوان دیوایس ورودی (میکروفون سیستم)، درایور <strong>VB-CABLE</strong> را در تب مدیریت ابزارها نصب کنید و در برنامه‌های صوتی ورودی را روی <strong>CABLE Output</strong> تنظیم نمایید.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
