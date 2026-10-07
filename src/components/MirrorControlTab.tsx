import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Camera, 
  Video, 
  ArrowLeft, 
  Home, 
  Menu, 
  Power, 
  Smartphone,
  Sliders,
  Settings,
  Sparkles,
  Zap,
  Radio,
  EyeOff,
  RefreshCw,
  MonitorPlay
} from 'lucide-react';
import { Device } from '../types';

interface MirrorControlTabProps {
  device: Device | null;
  onSendKey: (keycode: number | string) => void;
  onSendTap: (x: number, y: number) => void;
  onScreenshot: () => void;
}

export const MirrorControlTab: React.FC<MirrorControlTabProps> = ({
  device,
  onSendKey,
  onSendTap,
  onScreenshot
}) => {
  const [isMirroring, setIsMirroring] = useState(false);
  const [bitrate, setBitrate] = useState(8);
  const [maxFps, setMaxFps] = useState(60);
  const [turnScreenOff, setTurnScreenOff] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  
  // Real In-Browser Stream State
  const [liveScreenBase64, setLiveScreenBase64] = useState<string | null>(null);
  const [isStreamingWeb, setIsStreamingWeb] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(750);
  
  const [touchFeedback, setTouchFeedback] = useState<{ x: number; y: number } | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // Fetch real frame from device
  const fetchLiveFrame = useCallback(async () => {
    if (!device || device.id.startsWith('mock-')) return;
    try {
      setIsCapturing(true);
      const res = await fetch(`/api/devices/${device.id}/screencap-base64`);
      const data = await res.json();
      if (data.success && data.base64) {
        setLiveScreenBase64(data.base64);
      }
    } catch (err) {
      console.error('Error fetching live screencap:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [device?.id]);

  // Continuous background refresh loop
  useEffect(() => {
    if (!device || device.id.startsWith('mock-') || !isStreamingWeb) return;

    fetchLiveFrame();
    const interval = setInterval(fetchLiveFrame, streamIntervalMs);
    return () => clearInterval(interval);
  }, [device?.id, isStreamingWeb, streamIntervalMs, fetchLiveFrame]);

  const startScrcpyMirror = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/mirror/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bitRate: `${bitrate}M`,
          maxFps,
          turnScreenOff,
          stayOnTop: alwaysOnTop
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsMirroring(true);
      } else {
        alert(`خطا: ${data.error || 'عدم امکان اجرای Scrcpy'}`);
      }
    } catch (err) {
      console.error('Scrcpy launch error:', err);
    }
  };

  const stopScrcpyMirror = async () => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/mirror/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setIsMirroring(false);
    } catch (err) {
      console.error('Scrcpy stop error:', err);
    }
  };

  const handleScreenClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenRef.current) return;
    const rect = screenRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Parse real display resolution or default 1080x2400
    let widthRes = 1080;
    let heightRes = 2400;
    if (device?.display?.resolution) {
      const parts = device.display.resolution.split('x');
      if (parts.length === 2) {
        widthRes = parseInt(parts[0], 10) || 1080;
        heightRes = parseInt(parts[1], 10) || 2400;
      }
    }

    const normalizedX = Math.round((clickX / rect.width) * widthRes);
    const normalizedY = Math.round((clickY / rect.height) * heightRes);

    setTouchFeedback({ x: clickX, y: clickY });
    setTimeout(() => setTouchFeedback(null), 300);

    onSendTap(normalizedX, normalizedY);
    // Instant frame grab after touch
    setTimeout(fetchLiveFrame, 250);
  };

  const handleNavKey = (keycode: number | string) => {
    onSendKey(keycode);
    setTimeout(fetchLiveFrame, 300);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      {/* Left / Center Phone Screen Mockup & Interactive Frame (7 cols) */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center p-4">
        {/* Smartphone Bezel */}
        <div className="relative w-[340px] sm:w-[380px] h-[680px] sm:h-[720px] bg-[#14151b] rounded-[48px] p-3.5 border-4 border-amber-500/25 shadow-2xl shadow-amber-950/60 ring-1 ring-amber-500/30 flex flex-col">
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full flex items-center justify-end px-3 gap-2 z-20 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1e2029] border border-amber-500/20"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500/60 animate-pulse"></div>
          </div>

          {/* Quick Refresh Live Badge on Phone */}
          <div className="absolute top-6 right-8 z-30 flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); fetchLiveFrame(); }}
              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-amber-500/20 transition-all shadow-md"
              title="بروزرسانی لحظه‌ای تصویر"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Screen Content Area */}
          <div 
            ref={screenRef}
            onClick={handleScreenClick}
            className="w-full h-full bg-slate-950 rounded-[36px] overflow-hidden relative flex flex-col justify-between cursor-pointer select-none group"
            style={{
              backgroundImage: !liveScreenBase64 ? 'radial-gradient(ellipse at center, #1a1b24 0%, #0c0d11 100%)' : undefined
            }}
          >
            {/* Real In-Browser Stream Image */}
            {liveScreenBase64 ? (
              <img
                src={`data:image/png;base64,${liveScreenBase64}`}
                alt="Live Phone Screen"
                className="absolute inset-0 w-full h-full object-contain bg-black z-0 pointer-events-none"
              />
            ) : null}

            {/* Status Bar Overlay (only if not real screen image) */}
            {!liveScreenBase64 && (
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono px-4 pt-3 z-10">
                <span className="font-bold">09:41</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>5G</span>
                  <span>📶</span>
                  <span className="text-emerald-400 font-bold">{device?.battery?.level || 88}%</span>
                </div>
              </div>
            )}

            {/* Screen Touch Visual Feedback */}
            {touchFeedback && (
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-cyan-400/50 border-2 border-cyan-300 pointer-events-none animate-ping z-30"
                style={{ left: touchFeedback.x, top: touchFeedback.y }}
              />
            )}

            {/* Fallback Placeholder Content if no real frame available */}
            {!liveScreenBase64 && (
              <div className="my-auto flex flex-col items-center justify-center text-center p-6 space-y-4 z-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-10 h-10 animate-pulse" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white tracking-wide">
                    {device?.name || 'گوشی همراه'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    صفحه تعاملی آماده دریافت کلیک، سوایپ و کلیدهای ناوبری
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    وضوح: {device?.display?.resolution || '1080x2400'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); fetchLiveFrame(); }}
                    className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20"
                  >
                    <MonitorPlay className="w-3 h-3" />
                    <span>دریافت تصویر زنده</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Android Navigation Bar */}
            <div className="flex items-center justify-around py-2 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md text-slate-400 z-10 mt-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); handleNavKey(4); }} 
                className="p-2 rounded-xl hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                title="بازگشت (Back)"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNavKey(3); }} 
                className="p-2 rounded-xl hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                title="صفحه اصلی (Home)"
              >
                <Home className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNavKey(187); }} 
                className="p-2 rounded-xl hover:bg-slate-800 hover:text-cyan-400 transition-colors"
                title="برنامه‌های اخیر (Recent Apps)"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hardware Control Strip Below Phone */}
        <div className="mt-5 flex items-center gap-2.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 glass-panel">
          <button
            onClick={() => handleNavKey(24)}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-all text-xs flex items-center gap-1.5"
            title="افزایش صدا"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">افزایش صدا</span>
          </button>
          <button
            onClick={() => handleNavKey(25)}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-all text-xs flex items-center gap-1.5"
            title="کاهش صدا"
          >
            <VolumeX className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">کاهش صدا</span>
          </button>
          <button
            onClick={() => handleNavKey(26)}
            className="p-2.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-all text-xs flex items-center gap-1.5"
            title="قفل / روشن صفحه (Power Key)"
          >
            <Power className="w-4 h-4" />
            <span className="hidden sm:inline">کلید پاور</span>
          </button>
          <button
            onClick={onScreenshot}
            className="p-2.5 rounded-xl hover:bg-emerald-500/20 text-emerald-400 transition-all text-xs flex items-center gap-1.5"
            title="گرفتن اسکرین‌شات"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">اسکرین‌شات</span>
          </button>
        </div>
      </div>

      {/* Right Side Settings & Scrcpy Launch Controls (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* In-Browser Live Stream Controls Card */}
        {/* In-Browser Live Stream Controls Card */}
        <div className="rounded-2xl glass-panel p-6 border border-amber-500/25 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/30">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">پخش زنده مستقیم درون مرورگر</h3>
              <p className="text-xs text-stone-400">نمایش تصویر واقعی گوشی با قابلیت کلیک و لمس زنده</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-300">وضعیت استریم مرورگر:</span>
              <button
                onClick={() => setIsStreamingWeb(!isStreamingWeb)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isStreamingWeb
                    ? 'bg-amber-500/20 text-yellow-300 border-amber-500/40 shadow-sm shadow-amber-500/15'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {isStreamingWeb ? '🟢 پخش خودکار فعال' : '⏸️ متوقف شده'}
              </button>
            </div>

            {/* Comprehensive Refresh Rate Slider & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <span>سرعت تازه‌سازی تصویر (Refresh Rate):</span>
                <span className="font-mono text-yellow-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {streamIntervalMs} ms ({streamIntervalMs <= 1000 ? `~${(1000 / streamIntervalMs).toFixed(1)} FPS` : `هر ${(streamIntervalMs / 1000).toFixed(1)} ثانیه`})
                </span>
              </div>

              <input 
                type="range" 
                min="50" 
                max="5000" 
                step="50" 
                value={streamIntervalMs} 
                onChange={(e) => setStreamIntervalMs(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-stone-800 rounded-lg"
              />

              <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                <span>🚀 50ms (فوق سریع)</span>
                <span>⚡ 500ms (نرمال)</span>
                <span>🔋 5000ms (کم‌مصرف)</span>
              </div>

              {/* Quick Speed Presets Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { ms: 100, label: '۱۰۰ms (۱۰fps)' },
                  { ms: 250, label: '۲۵۰ms (۴fps)' },
                  { ms: 500, label: '۵۰۰ms (۲fps)' },
                  { ms: 750, label: '۷۵۰ms (روان)' },
                  { ms: 1000, label: '۱ ثانیه (بهینه)' },
                  { ms: 2000, label: '۲ ثانیه (باتری)' },
                  { ms: 3000, label: '۳ ثانیه' },
                  { ms: 5000, label: '۵ ثانیه (اکو)' }
                ].map((item) => (
                  <button
                    key={item.ms}
                    onClick={() => setStreamIntervalMs(item.ms)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all truncate text-center ${
                      streamIntervalMs === item.ms 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black border-amber-400 shadow-sm shadow-amber-500/20' 
                        : 'bg-[#14151b] text-stone-400 border-amber-500/15 hover:border-amber-500/35 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchLiveFrame}
              disabled={isCapturing}
              className="w-full py-2.5 rounded-xl bg-[#14151b] hover:bg-[#1d1f2a] text-stone-200 border border-amber-500/25 hover:border-amber-500/50 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-yellow-400' : ''}`} />
              <span>دریافت فوری فریم جدید</span>
            </button>
          </div>
        </div>

        {/* Scrcpy Ultra HD Mirror Launcher Card */}
        <div className="rounded-2xl glass-panel p-6 border border-amber-500/25 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">پنجره مستقل با Scrcpy (تا 144 FPS)</h3>
              <p className="text-xs text-stone-400">نمایش فوق روان با تأخیر زیر ۳۰ میلی‌ثانیه، ماوس و کیبورد کامل</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Bitrate Setting */}
            <div>
              <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5">
                <span>بیت‌ریت ویدیو (Bitrate):</span>
                <span className="font-mono text-yellow-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">{bitrate} Mbps</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="48" 
                step="2" 
                value={bitrate} 
                onChange={(e) => setBitrate(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-stone-800 rounded-lg"
              />
            </div>

            {/* Max FPS Setting */}
            <div>
              <div className="flex items-center justify-between text-xs text-stone-300 mb-1.5">
                <span>حداکثر نرخ فریم (FPS):</span>
                <span className="font-mono text-yellow-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">{maxFps} FPS</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[15, 30, 60, 90, 120, 144].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setMaxFps(fps)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all text-center ${
                      maxFps === fps 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black border-amber-400 shadow-sm shadow-amber-500/20' 
                        : 'bg-[#14151b] text-stone-400 border-amber-500/15 hover:border-amber-500/35 hover:text-stone-200'
                    }`}
                  >
                    {fps}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Checkboxes */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-3 text-xs text-stone-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={turnScreenOff} 
                  onChange={(e) => setTurnScreenOff(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-0 w-4 h-4 bg-stone-900"
                />
                <span className="flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                  خاموش کردن صفحه فیزیکی گوشی حین کار برای صرفه‌جویی باتری
                </span>
              </label>

              <label className="flex items-center gap-3 text-xs text-stone-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={alwaysOnTop} 
                  onChange={(e) => setAlwaysOnTop(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-0 w-4 h-4 bg-stone-900"
                />
                <span>پنجره Scrcpy همیشه روی سایر برنامه‌ها بماند (Always on Top)</span>
              </label>
            </div>

            {/* Launch / Terminate Buttons */}
            <div className="pt-2 flex gap-3">
              {!isMirroring ? (
                <button
                  onClick={startScrcpyMirror}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>اجرای پنجره زنده در ویندوز</span>
                </button>
              ) : (
                <button
                  onClick={stopScrcpyMirror}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold text-sm transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>بستن پنجره Scrcpy</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
