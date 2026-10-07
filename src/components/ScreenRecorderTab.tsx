import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Circle, 
  Square, 
  Folder, 
  FolderOpen, 
  Sliders, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Film, 
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Edit3,
  Check,
  Maximize2
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface ScreenRecorderTabProps {
  device: Device | null;
}

interface SavedRecording {
  name: string;
  size: string;
  sizeBytes?: number;
  created: string;
  path?: string;
}

export const ScreenRecorderTab: React.FC<ScreenRecorderTabProps> = ({ device }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [resolution, setResolution] = useState<'720' | '1080' | '4k'>('1080');
  const [bitrate, setBitrate] = useState<number>(16);
  const [captureAudio, setCaptureAudio] = useState<boolean>(true);
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [saveDirectory, setSaveDirectory] = useState<string>('');
  const [isEditingDir, setIsEditingDir] = useState<boolean>(false);
  const [customDirInput, setCustomDirInput] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<SavedRecording | null>(null);
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
      if (data.directory) {
        setSaveDirectory(data.directory);
        setCustomDirInput(data.directory);
      }
    } catch (err: any) {
      console.error('Error fetching recordings:', err);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  // Live recording timer
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
    if (!device) {
      showToast('لطفاً ابتدا یک دستگاه را انتخاب کنید.', 'error');
      return;
    }
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

  const handleSaveDirectory = async () => {
    if (!customDirInput.trim()) {
      showToast('لطفاً مسیر معتبری وارد کنید.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/recordings/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: customDirInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSaveDirectory(data.recordingsDir);
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
      const res = await fetch('/api/recordings/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPath: saveDirectory })
      });
      const data = await res.json();
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
      const res = await fetch('/api/recordings/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDeleteRecording = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`آیا از حذف فایل "${filename}" اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/recordings/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        if (selectedVideo?.name === filename) {
          setSelectedVideo(null);
        }
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

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base font-mono truncate max-w-md">
                    {selectedVideo.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    حجم: {selectedVideo.size} • تاریخ ضبط: {selectedVideo.created}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleOpenFileInExplorer(selectedVideo.name, e)}
                  title="نمایش در فایل اکسپلورر"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>پوشه فایل</span>
                </button>
                <a
                  href={`/api/recordings/download/${encodeURIComponent(selectedVideo.name)}`}
                  download
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود MP4</span>
                </a>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="bg-black flex items-center justify-center p-2 relative flex-1 min-h-[360px]">
              <video
                key={selectedVideo.name}
                controls
                autoPlay
                className="w-full max-h-[60vh] rounded-xl shadow-lg"
                src={`/api/recordings/stream/${encodeURIComponent(selectedVideo.name)}`}
              >
                مرورگر شما از پخش مستقیم این ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] truncate max-w-lg">
                مسیر فایل: {selectedVideo.path || `${saveDirectory}\\${selectedVideo.name}`}
              </span>
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Main Card */}
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

      {/* In-Tab User Guide */}
      <TabGuideCard
        title="راهنمای استودیوی ضبط فیلم و صدای داخلی گوشی"
        description="نکات مربوط به ضبط ۶۰ فریم با انکودر سخت‌افزاری، پخش مستقیم در برنامه و رفع مشکل پلیرها"
        steps={[
          "برای شروع، دکمه قرمز «شروع ضبط صفحه و صدا» را بزنید. ضبط با بالاترین کیفیت شروع می‌شود.",
          "پس از اتمام کار، دکمه «توقف ضبط» را بزنید. سیستم به‌صورت خودکار فایل MP4 نهایی را با ساختار استاندارد Moov کامل کرده و در کامپیوتر ذخیره می‌نماید.",
          "برای تماشای آنی ویدیوی ضبط شده، روی آیکون «پخش» در لیست ویدیوها کلیک کنید تا داخل پلیر اختصاصی همین برنامه باز شود.",
          "با دکمه «پوشه ذخیره‌سازی» می‌توانید محل ذخیره ویدیوها را به درایو دلخواه (مثل D:\\Recordings) تغییر دهید."
        ]}
        tips={[
          "برای ضبط گیم‌پلی بازی‌ها، بیت‌ریت ۱۶ تا ۲۰ مگابیت و رزولوشن 1080p بهترین توازن کیفیت و حجم را ارائه می‌دهد.",
          "ویدیوهای ضبط شده با فرمت استاندارد H.264/MP4 هستند و روی تمام پلیرها (Windows Media Player, VLC, PotPlayer, مرورگرها) پخش می‌شوند."
        ]}
      />

      {/* Save Directory Control Bar */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Folder className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-slate-400">محل ذخیره‌سازی ویدیوهای ضبط شده:</div>
            {isEditingDir ? (
              <div className="flex items-center gap-2 mt-1 w-full">
                <input
                  type="text"
                  value={customDirInput}
                  onChange={(e) => setCustomDirInput(e.target.value)}
                  placeholder="مسیر پوشه مورد نظر مثلاً: D:\PhoneRecordings"
                  className="flex-1 bg-slate-900 border border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
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
              <div className="font-mono text-xs font-bold text-cyan-300 mt-0.5 truncate select-all" dir="ltr">
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
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>تغییر محل ذخیره</span>
            </button>
          )}

          <button
            onClick={handleOpenFolder}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-950"
          >
            <FolderOpen className="w-4 h-4 text-cyan-300" />
            <span>رفتن به محل ذخیره در ویندوز (Explorer)</span>
          </button>
        </div>
      </div>

      {/* Settings & Videos Grid */}
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

        {/* Saved Recordings List */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                <span>ویدیوهای ذخیره‌شده روی کامپیوتر ({recordings.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenFolder}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="باز کردن پوشه فایل‌ها در ویندوز"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>پوشه ذخیره</span>
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
              <div className="p-16 text-center text-slate-500 text-xs space-y-2">
                <Video className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p>هنوز هیچ ویدیویی در این مسیر ضبط نشده است.</p>
                <p className="text-[11px] text-slate-600 font-mono">مسیر فعلی: {saveDirectory}</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {recordings.map((rec, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedVideo(rec)}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 border border-cyan-500/20 transition-all">
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
                          setSelectedVideo(rec);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-all"
                        title="پخش ویدیو در برنامه"
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
                        href={`/api/recordings/download/${encodeURIComponent(rec.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        download
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                        title="دانلود فایل"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={(e) => handleDeleteRecording(rec.name, e)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                        title="حذف ویدیو"
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
      </div>
    </div>
  );
};
