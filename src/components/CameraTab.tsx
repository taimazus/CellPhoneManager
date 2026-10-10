import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  SwitchCamera, 
  Flashlight, 
  FlashlightOff, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Play, 
  Square, 
  RotateCw, 
  Settings2, 
  Eye, 
  ShieldCheck, 
  Layers, 
  Monitor, 
  Download, 
  RefreshCw,
  Zap,
  Grid
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';

interface CameraTabProps {
  device: Device | null;
}

export const CameraTab: React.FC<CameraTabProps> = ({ device }) => {
  const isIos = device?.platform === 'ios' || device?.model?.toLowerCase().includes('iphone');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [cameraSize, setCameraSize] = useState<string>('1920x1080');
  const [cameraFps, setCameraFps] = useState<number>(30);
  const [orientation, setOrientation] = useState<number>(0);
  const [highSpeed, setHighSpeed] = useState<boolean>(false);
  const [stayOnTop, setStayOnTop] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [gridOverlay, setGridOverlay] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  
  // Live in-browser screencap stream state
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Launch Native Scrcpy Camera Webcam
  const handleStartWebcam = async (customFacing = facing, customOrientation = orientation) => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/camera/webcam/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facing: customFacing,
          orientation: customOrientation,
          cameraSize,
          cameraFps,
          highSpeed,
          stayOnTop
        })
      });
      if (data.success) {
        setIsWebcamActive(true);
        showToast(data.message || 'وب‌کم دوربین با موفقیت فعال شد', 'success');
      } else {
        showToast(`خطا در فعال‌سازی وب‌کم: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleStopWebcam = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/camera/webcam/stop`, { method: 'POST' });
      if (data.success) {
        setIsWebcamActive(false);
        showToast('استریم وب‌کم متوقف شد', 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    if (!device) return;
    const targetState = !torchEnabled;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/camera/torch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: targetState })
      });
      if (data.success) {
        setTorchEnabled(targetState);
        showToast(targetState ? 'فلش دوربین روشن شد' : 'فلش دوربین خاموش شد', 'success');
      } else {
        showToast(`خطا در فلش: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Trigger Shutter / Photo
  const handleTakeShutter = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/camera/shutter`, { method: 'POST' });
      if (data.success) {
        showToast('عکسبرداری انجام شد و در گالری گوشی ذخیره گردید', 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Launch Stock Camera App on Device Screen
  const handleLaunchCameraApp = async (targetFacing = facing) => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/camera/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facing: targetFacing })
      });
      if (data.success) {
        showToast(data.message || `برنامه دوربین (${targetFacing === 'front' ? 'سلفی' : 'اصلی'}) باز شد`, 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleSwitchCameraFacing = async () => {
    const nextFacing = facing === 'back' ? 'front' : 'back';
    setFacing(nextFacing);
    if (isWebcamActive) {
      await handleStartWebcam(nextFacing);
    } else {
      await handleLaunchCameraApp(nextFacing);
    }
  };



  // In-browser live viewfinder polling
  useEffect(() => {
    if (!device || !isLiveStreaming) return;
    let isMounted = true;

    const refreshFrame = () => {
      if (!isMounted || !isLiveStreaming) return;
      setStreamUrl(`/api/devices/${encodeURIComponent(device.id)}/screencap.png?t=${Date.now()}`);
    };

    refreshFrame();
    const interval = setInterval(refreshFrame, 400); // 2.5 FPS lightweight preview
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [device?.id, isLiveStreaming]);

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
            <Camera className="w-6 h-6 text-cyan-400" />
            <span>استودیو دوربین و تبدیل گوشی به وب‌کم (Camera & HD Webcam Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            تبدیل دوربین جلو و پشت گوشی به وب‌کم با کیفیت 4K / 1080p با تأخیر نزدیک به صفر برای OBS، استریم، دیسکورد و جلسات آنلاین
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            isWebcamActive 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isWebcamActive ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            <span>{isWebcamActive ? 'وب‌کم فعال است' : 'آماده به کار'}</span>
          </span>
        </div>
      </div>

      {/* iOS Notice Banner */}
      {isIos && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-3 text-xs text-slate-300">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong>دستگاه متصل: Apple iPhone (iOS)</strong> — پیش‌نمایش تصویر و استریم درون‌مرورگر با پروتکل مستقیم iOS فعال است. برای استفاده از حداکثر کیفیت دوربین آیفون به عنوان وب‌کم 4K در نرم‌افزارهای OBS و ویندوز، می‌توانید از قابلیت رسمی <strong>Continuity Camera</strong> اپل یا استودیو اختصاصی آیفون استفاده فرمایید.
          </span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Viewfinder / Studio Deck */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Viewfinder Header Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  منظره‌یاب و استودیو دوربین ({facing === 'back' ? 'دوربین اصلی / پشت' : 'دوربین سلفی / جلو'})
                </h3>
              </div>

              {/* Quick Switch Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLaunchCameraApp(facing)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
                  title="باز کردن مستقیم برنامه دوربین روی صفحه گوشی"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>باز کردن دوربین در گوشی</span>
                </button>

                <button
                  onClick={handleSwitchCameraFacing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
                  title="سوئیچ بین دوربین جلو و پشت"
                >
                  <SwitchCamera className="w-4 h-4 text-cyan-400" />
                  <span>{facing === 'back' ? 'تغییر به سلفی' : 'تغییر به پشت'}</span>
                </button>

                <button
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-xl border transition-all ${
                    torchEnabled 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/20' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title={torchEnabled ? 'خاموش کردن فلاش' : 'روشن کردن فلاش / چراغ قوه'}
                >
                  {torchEnabled ? <Flashlight className="w-4 h-4 text-amber-400 fill-current" /> : <FlashlightOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setGridOverlay(!gridOverlay)}
                  className={`p-2 rounded-xl border transition-all ${
                    gridOverlay ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title="خطوط راهنمای گرید (Grid)"
                >
                  <Grid className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className={`p-2 rounded-xl border transition-all ${
                    isMirrored ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title="قرینه کردن افقی تصویر (Mirror)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewfinder Preview Box */}
            <div className="relative w-full aspect-video bg-black/90 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center group shadow-2xl">
              {isWebcamActive ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-pulse shadow-lg shadow-emerald-500/20">
                    <Video className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>استریم و وب‌کم فوق‌روان ۶۰ FPS در ویندوز فعال است</span>
                    </h4>
                    <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                      پنجره اختصاصی <strong>Sahand HD Webcam</strong> با کیفیت <strong>{cameraSize}</strong> و نرخ فریم <strong>{cameraFps} FPS</strong> روی دسکتاپ ویندوز در حال پخش مستقیم است.
                    </p>
                    <p className="text-[11px] text-cyan-400 font-mono pt-1">
                      (برای OBS Studio، پنجره بازشده در ویندوز را به عنوان Window Capture انتخاب کنید)
                    </p>
                  </div>
                </div>
              ) : isLiveStreaming && streamUrl ? (
                <img
                  src={streamUrl}
                  alt="Live Camera Feed"
                  style={{
                    transform: `scale(${zoomLevel}) ${isMirrored ? 'scaleX(-1)' : ''}`,
                    transition: 'transform 0.2s ease'
                  }}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      وب‌کم فوق‌سریع آماده اتصال است
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      برای شروع استریم مستقیم با کیفیت بالا و ۶۰ فریم بر ثانیه روی دکمه زیر کلیک کنید:
                    </p>
                  </div>
                </div>
              )}

              {/* Grid Lines Overlay */}
              {gridOverlay && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25 border border-cyan-400/20">
                  <div className="border-r border-b border-cyan-400/40"></div>
                  <div className="border-r border-b border-cyan-400/40"></div>
                  <div className="border-b border-cyan-400/40"></div>
                  <div className="border-r border-b border-cyan-400/40"></div>
                  <div className="border-r border-b border-cyan-400/40"></div>
                  <div className="border-b border-cyan-400/40"></div>
                  <div className="border-r border-cyan-400/40"></div>
                  <div className="border-r border-cyan-400/40"></div>
                  <div></div>
                </div>
              )}

              {/* Viewfinder HUD Overlays */}
              <div className="absolute top-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300">
                {cameraSize} • {cameraFps} FPS • {facing.toUpperCase()}
              </div>

              {/* Zoom Pill */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                {[1, 2, 5].map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoomLevel(z)}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      zoomLevel === z ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Studio Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Start / Stop Webcam Button */}
            {!isWebcamActive ? (
              <button
                onClick={() => handleStartWebcam()}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>شروع استریم وب‌کم دوربین</span>
              </button>
            ) : (
              <button
                onClick={handleStopWebcam}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>توقف وب‌کم</span>
              </button>
            )}

            {/* In-Browser Viewfinder Toggle */}
            <button
              onClick={() => {
                const nextState = !isLiveStreaming;
                setIsLiveStreaming(nextState);
                if (nextState) {
                  handleLaunchCameraApp();
                  showToast('پیش‌نمایش فعال شد و برنامه دوربین در گوشی باز گردید', 'success');
                }
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                isLiveStreaming 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>{isLiveStreaming ? 'بستن پیش‌نمایش زنده' : 'پیش‌نمایش زنده در مرورگر'}</span>
            </button>

            {/* Shutter / Take Photo Button */}
            <button
              onClick={handleTakeShutter}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-cyan-500/10 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-bold transition-all"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>ثبت عکس فوری (Shutter)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Camera Settings & Integration Guide */}
        <div className="space-y-6">
          {/* Settings Card */}
          <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>تنظیمات پیشرفته استریم و وب‌کم</span>
            </h3>

            {/* Resolution Selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">کیفیت و وضوح تصویر (Resolution):</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '4K UHD', val: '3840x2160' },
                  { label: '1080p FHD', val: '1920x1080' },
                  { label: '720p HD', val: '1280x720' }
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => setCameraSize(r.val)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      cameraSize === r.val 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate FPS */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">نرخ فریم (Frame Rate):</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '60 FPS (فوق روان)', val: 60 },
                  { label: '30 FPS (استاندارد)', val: 30 }
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => setCameraFps(f.val)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      cameraFps === f.val 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation / Rotation Selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">جهت و زاویه چرخش دوربین (Orientation):</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '۰° (افقی)', val: 0 },
                  { label: '۹۰° (عمودی)', val: 90 },
                  { label: '۱۸۰°', val: 180 },
                  { label: '۲۷۰° (عمودی)', val: 270 }
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => {
                      setOrientation(o.val);
                      if (isWebcamActive) handleStartWebcam(facing, o.val);
                    }}
                    className={`py-2 px-1 rounded-xl text-[11px] font-semibold transition-all border text-center ${
                      orientation === o.val 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">حالت کمترین تأخیر (Ultra Low-Latency)</span>
                <input
                  type="checkbox"
                  checked={highSpeed}
                  onChange={(e) => setHighSpeed(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">پنجره همیشه رو (Always on Top)</span>
                <input
                  type="checkbox"
                  checked={stayOnTop}
                  onChange={(e) => setStayOnTop(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* OBS / Zoom / Discord Integration Guide */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>راهنمای اتصال به OBS، Discord، Google Meet و Zoom</span>
            </h4>
            <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed text-right">
              <li>با زدن دکمه «شروع استریم وب‌کم»، پنجره وب‌کم اختصاصی با کیفیت 1080p باز می‌شود.</li>
              <li>در نرم‌افزار <strong>OBS Studio</strong>، یک منبع <strong>Window Capture</strong> اضافه کرده و پنجره وب‌کم را انتخاب کنید. سپس روی <strong>Start Virtual Camera</strong> کلیک نمایید.</li>
              <li>در <strong>Google Meet / Zoom / Discord</strong>، دوربین را روی OBS Virtual Camera بگذارید تا از کیفیت فوق‌العاده لنز گوشی خود لذت ببرید!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
