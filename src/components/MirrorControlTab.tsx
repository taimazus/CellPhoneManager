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
        <div className="relative w-[340px] sm:w-[380px] h-[680px] sm:h-[720px] bg-[#0f172a] rounded-[48px] p-3.5 border-4 border-slate-700 shadow-2xl shadow-cyan-950/60 ring-1 ring-cyan-500/30 flex flex-col">
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full flex items-center justify-end px-3 gap-2 z-20 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1e293b] border border-slate-700"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500/60 animate-pulse"></div>
          </div>

          {/* Quick Refresh Live Badge on Phone */}
          <div className="absolute top-6 right-8 z-30 flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); fetchLiveFrame(); }}
              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/80 transition-all shadow-md"
              title="بروزرسانی لحظه‌ای تصویر"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Screen Content Area */}
          <div 
            ref={screenRef}
            onClick={handleScreenClick}
            className="w-full h-full bg-slate-950 rounded-[36px] overflow-hidden relative flex flex-col justify-between cursor-pointer select-none group"
            style={{
              backgroundImage: !liveScreenBase64 ? 'radial-gradient(ellipse at center, #111d38 0%, #070c18 100%)' : undefined
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
        <div className="rounded-2xl glass-panel p-6 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">پخش زنده مستقیم درون مرورگر</h3>
              <p className="text-xs text-slate-400">نمایش تصویر واقعی گوشی با قابلیت کلیک و لمس زنده</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">وضعیت استریم مرورگر:</span>
              <button
                onClick={() => setIsStreamingWeb(!isStreamingWeb)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isStreamingWeb
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isStreamingWeb ? '🟢 پخش خودکار فعال' : '⏸️ متوقف شده'}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span>فاصله تازه‌سازی فریم (Refresh Rate):</span>
                <span className="font-mono text-emerald-400 font-bold">{streamIntervalMs} ms</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[500, 750, 1500].map((ms) => (
                  <button
                    key={ms}
                    onClick={() => setStreamIntervalMs(ms)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      streamIntervalMs === ms 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ms} ms
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchLiveFrame}
              disabled={isCapturing}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>دریافت فوری فریم جدید</span>
            </button>
          </div>
        </div>

        {/* Scrcpy Ultra HD Mirror Launcher Card */}
        <div className="rounded-2xl glass-panel p-6 border border-cyan-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">پنجره مستقل با Scrcpy (تا 120 FPS)</h3>
              <p className="text-xs text-slate-400">نمایش با تأخیر زیر ۳۰ میلی‌ثانیه و موس و کیبورد کامل</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Bitrate Setting */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span>بیت‌ریت ویدیو (Bitrate):</span>
                <span className="font-mono text-cyan-400 font-bold">{bitrate} Mbps</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="32" 
                step="2" 
                value={bitrate} 
                onChange={(e) => setBitrate(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Max FPS Setting */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span>حداکثر نرخ فریم (FPS):</span>
                <span className="font-mono text-cyan-400 font-bold">{maxFps} FPS</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 120].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setMaxFps(fps)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      maxFps === fps 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Options Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={turnScreenOff} 
                  onChange={(e) => setTurnScreenOff(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 bg-slate-900"
                />
                <span className="flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  خاموش کردن صفحه فیزیکی گوشی حین کار برای صرفه‌جویی باتری
                </span>
              </label>

              <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={alwaysOnTop} 
                  onChange={(e) => setAlwaysOnTop(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 bg-slate-900"
                />
                <span>پنجره Scrcpy همیشه روی سایر برنامه‌ها بماند (Always on Top)</span>
              </label>
            </div>

            {/* Launch / Terminate Buttons */}
            <div className="pt-3 flex gap-3">
              {!isMirroring ? (
                <button
                  onClick={startScrcpyMirror}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
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
