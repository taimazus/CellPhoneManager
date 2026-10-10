import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff, 
  Globe, 
  Bluetooth, 
  MapPin, 
  Flashlight, 
  Vibrate, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Compass, 
  Smartphone, 
  Battery, 
  BatteryCharging,
  Send,
  Radio,
  Navigation
} from 'lucide-react';
import { Device } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface FindMyPhoneTabProps {
  device: Device | null;
}

interface DeviceLocationData {
  hasLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number;
  timestamp: string;
  rawSummary?: string;
}

interface HardwareStatus {
  wifi: boolean;
  mobileData: boolean;
  bluetooth: boolean;
  location: boolean;
  battery: {
    level: number;
    charging: boolean;
  };
}

export const FindMyPhoneTab: React.FC<FindMyPhoneTabProps> = ({ device }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [hwStatus, setHwStatus] = useState<HardwareStatus>({
    wifi: false,
    mobileData: false,
    bluetooth: false,
    location: false,
    battery: { level: 100, charging: false }
  });

  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);

  const [locationData, setLocationData] = useState<DeviceLocationData | null>(null);
  const [locatingLoading, setLocatingLoading] = useState<boolean>(false);

  const [sosMessage, setSosMessage] = useState<string>('این گوشی متعلق به من است. لطفاً با شماره زیر تماس بگیرید.');
  const [sosContactNumber, setSosContactNumber] = useState<string>('');
  const [sendingSos, setSendingSos] = useState<boolean>(false);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial hardware status
  const fetchHardwareStatus = async () => {
    if (!device) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/status`);
      const data = await res.json();
      if (data.success) {
        setHwStatus({
          wifi: data.wifi ?? false,
          mobileData: data.mobileData ?? false,
          bluetooth: data.bluetooth ?? false,
          location: data.location ?? false,
          battery: data.battery ?? { level: 100, charging: false }
        });
      }
    } catch (err: any) {
      console.warn('Failed to fetch hardware status:', err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchHardwareStatus();
  }, [device?.id]);

  // Ring Siren Alarm
  const handleToggleSiren = async () => {
    if (!device) return;
    if (isRinging) {
      // Stop
      try {
        await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/stop-ring`, { method: 'POST' });
        setIsRinging(false);
        showToast('صدای آژیر و ویبره گوشی متوقف شد', 'success');
      } catch (err: any) {
        showToast(`خطا: ${err.message}`, 'error');
      }
    } else {
      // Start Ringing at max volume
      try {
        setIsRinging(true);
        const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/ring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxVolume: true, vibrate: true })
        });
        const data = await res.json();
        if (data.success) {
          showToast('آژیر اضطراری با حداکثر ولوم صدا و لرزش ممتد روی گوشی فعال شد!', 'success');
        } else {
          setIsRinging(false);
          showToast(`خطا در پخش آژیر: ${data.error || 'ناشناخته'}`, 'error');
        }
      } catch (err: any) {
        setIsRinging(false);
        showToast(`خطا: ${err.message}`, 'error');
      }
    }
  };

  // Toggle Hardware: Wi-Fi
  const handleToggleWifi = async () => {
    if (!device) return;
    const targetState = !hwStatus.wifi;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/wifi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setHwStatus(prev => ({ ...prev, wifi: targetState }));
        showToast(targetState ? 'وای‌فای گوشی با موفقیت روشن شد' : 'وای‌فای گوشی خاموش شد', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Toggle Hardware: Mobile Data
  const handleToggleMobileData = async () => {
    if (!device) return;
    const targetState = !hwStatus.mobileData;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setHwStatus(prev => ({ ...prev, mobileData: targetState }));
        showToast(targetState ? 'اینترنت همراه (داده سیم‌کارت) فعال شد' : 'اینترنت همراه غیرفعال شد', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Toggle Hardware: Bluetooth
  const handleToggleBluetooth = async () => {
    if (!device) return;
    const targetState = !hwStatus.bluetooth;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/bluetooth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setHwStatus(prev => ({ ...prev, bluetooth: targetState }));
        showToast(targetState ? 'بلوتوث گوشی روشن شد' : 'بلوتوث گوشی خاموش شد', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Toggle Hardware: Location GPS
  const handleToggleLocation = async () => {
    if (!device) return;
    const targetState = !hwStatus.location;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/location-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setHwStatus(prev => ({ ...prev, location: targetState }));
        showToast(targetState ? 'مکان‌یابی ماهواره‌ای GPS روشن شد' : 'مکان‌یابی خاموش شد', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Toggle Flashlight / Strobe
  const handleToggleFlashlight = async () => {
    if (!device) return;
    const targetState = !isFlashlightOn;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/flashlight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setIsFlashlightOn(targetState);
        showToast(targetState ? 'چراغ‌قوه گوشی برای پیدا کردن در تاریکی روشن شد' : 'چراغ‌قوه خاموش شد', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Trigger Haptic Finder Vibration
  const handleTriggerVibrate = async () => {
    if (!device) return;
    setIsVibrating(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/vibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMs: 4000 })
      });
      const data = await res.json();
      if (data.success) {
        showToast('ویبره ممتد سخت‌افزاری ۴ ثانیه‌ای روی گوشی فعال شد!', 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setIsVibrating(false), 4000);
    }
  };

  // Fetch Live Location Coordinates
  const handleGetLocation = async () => {
    if (!device) return;
    setLocatingLoading(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/location`);
      const data = await res.json();
      if (data.success) {
        setLocationData(data);
        if (data.hasLocation) {
          showToast(`مختصات جغرافیایی با دقت تقریبی ${data.accuracy} متر دریافت شد`, 'success');
        } else {
          showToast('مختصات جدید در حافظه GPS ثبت نشده است. لطفاً GPS را فعال کنید.', 'error');
        }
      }
    } catch (err: any) {
      showToast(`خطا در دریافت موقعیت: ${err.message}`, 'error');
    } finally {
      setLocatingLoading(false);
    }
  };

  // Send SOS Lockscreen Message
  const handleSendSosMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !sosMessage) return;
    setSendingSos(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/find-my-phone/lock-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sosMessage, contactNumber: sosContactNumber })
      });
      const data = await res.json();
      if (data.success) {
        showToast('پیام اضطراری با موفقیت بر روی صفحه قفل گوشی نمایش داده شد', 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setSendingSos(false);
    }
  };

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400">
        <Smartphone className="w-16 h-16 text-stone-600 mb-4" />
        <h3 className="text-lg font-bold text-white">دستگاهی انتخاب نشده است</h3>
        <p className="text-sm mt-1 text-stone-400">برای ردیابی، پخش آژیر و کنترل سخت‌افزاری ابتدا گوشی خود را متصل کنید.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right animate-fadeIn" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-slideDown ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50' 
            : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span className="text-xs font-bold font-sans">{toast.text}</span>
        </div>
      )}

      {/* Top Banner / Device Tracking Status */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#12141c] via-[#10121a] to-[#0b0c10] border border-amber-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl border shadow-xl relative ${
              isRinging 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-siren' 
                : 'bg-amber-500/15 text-yellow-400 border-amber-500/30'
            }`}>
              <Radar className={`w-8 h-8 ${isRinging ? 'animate-spin' : 'animate-pulse'}`} />
              {isRinging && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-yellow-300 border border-amber-500/35">
                  ردیابی و امنیت اختصاصی دستگاه
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {device.model || device.name}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                سیستم هوشمند یافتن گوشی گمشده (Find My Phone)
              </h1>
              <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
                اگر گوشی خود را در خانه، محل کار یا بیرون گم کرده‌اید، از این بخش می‌توانید با حداکثر ولوم صدا آژیر پخش کنید (حتی در حالت سایلنت)، اینترنت، وای‌فای، GPS و چراغ‌قوه را از راه دور کنترل کرده و مکان دقیق جغرافیایی آن را به دست آورید.
              </p>
            </div>
          </div>

          <button
            onClick={fetchHardwareStatus}
            disabled={statusLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-bold transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin text-yellow-400' : ''}`} />
            <span>بروزرسانی وضعیت</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Siren + Quick Hardware Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Siren Button & Emergency Tools (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Loud Siren Card */}
          <div className={`rounded-3xl p-6 sm:p-8 border backdrop-blur-xl relative overflow-hidden transition-all shadow-2xl ${
            isRinging
              ? 'bg-[#1e0f14]/90 border-rose-500/60 shadow-rose-950/60 animate-siren'
              : 'bg-[#13141d]/90 border-amber-500/30'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>پخش صدا با دور زدن حالت بی‌صدا (Bypass Silent)</span>
                </div>
                <h2 className="text-xl font-black text-white">
                  {isRinging ? 'آژیر هشدار با حداکثر صدا در حال پخش است!' : 'پخش آژیر و زنگ اضطراری (Siren)'}
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed max-w-md">
                  حتی اگر گوشی در حالت بی‌صدا (Silent) یا «لطفاً مزاحم نشوید» (Do Not Disturb) باشد، ولوم زنگ و صدا به ۱۰۰٪ افزایش یافته و آژیر ممتد همراه با لرزش شدید پخش می‌شود تا به سرعت پیدا شود.
                </p>
              </div>

              {/* Siren Activation Button */}
              <button
                onClick={handleToggleSiren}
                className={`relative px-8 py-5 rounded-3xl font-black text-sm flex flex-col items-center gap-2 transition-all shadow-2xl group shrink-0 ${
                  isRinging
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-rose-600/50 scale-105'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 hover:from-amber-400 hover:to-yellow-400 shadow-amber-500/30 hover:scale-105'
                }`}
              >
                {isRinging ? (
                  <>
                    <VolumeX className="w-8 h-8 animate-bounce" />
                    <span>توقف آژیر صدا</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span>پخش آژیر با حداکثر صدا</span>
                  </>
                )}
              </button>
            </div>

            {/* Sound Wave Bars when Ringing */}
            {isRinging && (
              <div className="mt-6 pt-4 border-t border-rose-500/20 flex items-center justify-center gap-2">
                {[...Array(16)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-rose-500 to-yellow-400 rounded-full animate-pulse"
                    style={{
                      height: `${12 + ((i * 7) % 28)}px`,
                      animationDelay: `${(i * 0.08).toFixed(2)}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Smart Audio Safety Note & Reset */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
              <span className="flex items-center gap-1.5 text-stone-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>محافظ هوشمند صدا: توقف آژیر صدای مکالمات و تماس‌ها را قطع نمی‌کند.</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!device) return;
                  try {
                    const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/calls/reset-audio`, { method: 'POST' });
                    const data = await res.json();
                    showToast(data.message || 'صدای مکالمه و خروجی گوشی بازنشانی شد', 'success');
                  } catch (err: any) {
                    showToast(`خطا: ${err.message}`, 'error');
                  }
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline transition-colors"
                title="اگر صدای تماس دریافتی قطع است، با یک کلیک بدون ریستارت گوشی آن را وصل کنید"
              >
                بازنشانی فوری صدای مکالمه
              </button>
            </div>
          </div>

          {/* 2. Remote Hardware Toggles (Wi-Fi, Mobile Data, Bluetooth, GPS, Torch) */}
          <div className="rounded-3xl p-6 bg-[#12131b]/90 border border-amber-500/25 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-black text-white">کنترل از راه دور اتصالات و قطعات سخت‌افزاری</h3>
              </div>
              <span className="text-[11px] text-stone-400">سازگار با اندروید و iOS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Wi-Fi Toggle */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    hwStatus.wifi 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    {hwStatus.wifi ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">شبکه وای‌فای (Wi-Fi)</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {hwStatus.wifi ? 'روشن و فعال' : 'خاموش'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleWifi}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    hwStatus.wifi 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {hwStatus.wifi ? 'خاموش کردن' : 'روشن کردن'}
                </button>
              </div>

              {/* Mobile Data Toggle */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    hwStatus.mobileData 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">داده همراه (اینترنت سیم‌کارت)</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {hwStatus.mobileData ? 'فعال و متصل' : 'غیرفعال'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleMobileData}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    hwStatus.mobileData 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {hwStatus.mobileData ? 'قطع اینترنت' : 'فعال‌سازی اینترنت'}
                </button>
              </div>

              {/* Bluetooth Toggle */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    hwStatus.bluetooth 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/35' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">بلوتوث (Bluetooth)</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {hwStatus.bluetooth ? 'روشن' : 'خاموش'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleBluetooth}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    hwStatus.bluetooth 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                  }`}
                >
                  {hwStatus.bluetooth ? 'خاموش کردن' : 'روشن کردن'}
                </button>
              </div>

              {/* GPS / Location Services Toggle */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    hwStatus.location 
                      ? 'bg-amber-500/20 text-yellow-300 border-amber-500/35' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">مکان‌یابی ماهواره‌ای (GPS)</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {hwStatus.location ? 'دقت بالا (High Accuracy)' : 'غیرفعال'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleLocation}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    hwStatus.location 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-amber-500/20 text-yellow-300 border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  {hwStatus.location ? 'خاموش کردن' : 'روشن کردن GPS'}
                </button>
              </div>

              {/* Torch / Flashlight Strobe */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isFlashlightOn 
                      ? 'bg-yellow-400/25 text-yellow-300 border-yellow-400/50 shadow-md shadow-yellow-500/20 animate-pulse' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    <Flashlight className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">چراغ‌قوه بیکن (نور در تاریکی)</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {isFlashlightOn ? 'روشن (چراغ دوربین)' : 'خاموش'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleFlashlight}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isFlashlightOn 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30'
                  }`}
                >
                  {isFlashlightOn ? 'خاموش کردن' : 'روشن کردن نور'}
                </button>
              </div>

              {/* Vibration Haptic Finder */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isVibrating 
                      ? 'bg-purple-500/25 text-purple-300 border-purple-400/50 shadow-md shadow-purple-500/20 animate-bounce' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    <Vibrate className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">ویبره ممتد جستجو (Haptic)</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {isVibrating ? 'در حال لرزش شدید...' : 'پالس لرزشی ۴ ثانیه‌ای'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerVibrate}
                  disabled={isVibrating}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isVibrating
                      ? 'bg-purple-500/30 text-purple-200 border-purple-500/40 animate-pulse'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
                  }`}
                >
                  {isVibrating ? 'در حال ویبره...' : 'فعال‌سازی ویبره'}
                </button>
              </div>

              {/* Battery Status Indicator */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {hwStatus.battery.charging ? <BatteryCharging className="w-5 h-5" /> : <Battery className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">وضعیت باتری گوشی</h4>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {hwStatus.battery.level}٪ {hwStatus.battery.charging ? '(در حال شارژ)' : ''}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-stone-800 text-stone-300 font-mono text-xs font-bold">
                  {hwStatus.battery.level}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Location Map & Lockscreen SOS Message (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 3. Device Location & GPS Coordinates */}
          <div className="rounded-3xl p-6 bg-[#12131b]/90 border border-amber-500/25 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-black text-white">مکان‌یابی جغرافیایی گوشی</h3>
              </div>

              <button
                onClick={handleGetLocation}
                disabled={locatingLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-yellow-300 border border-amber-500/35 text-xs font-bold transition-all"
              >
                <Navigation className={`w-3.5 h-3.5 ${locatingLoading ? 'animate-spin' : ''}`} />
                <span>استخراج مختصات</span>
              </button>
            </div>

            {locationData?.hasLocation ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">عرض جغرافیایی (Latitude):</span>
                    <span className="text-white font-mono font-bold">{locationData.latitude}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">طول جغرافیایی (Longitude):</span>
                    <span className="text-white font-mono font-bold">{locationData.longitude}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">دقت موقعیت‌یابی:</span>
                    <span className="text-emerald-400 font-mono font-bold">±{locationData.accuracy} متر</span>
                  </div>
                </div>

                {/* Map Action Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
                  >
                    <span>مشاهده روی Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={`https://neshan.org/maps/@${locationData.latitude},${locationData.longitude},16z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-bold transition-all"
                  >
                    <span>نشان</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-stone-900/40 border border-dashed border-stone-800 text-center space-y-2">
                <MapPin className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="text-xs text-stone-400">
                  برای مشاهده موقعیت فعلی روی دکمه «استخراج مختصات» کلیک کنید.
                </p>
                <p className="text-[10px] text-stone-500">
                  اگر مکان‌یابی گوشی خاموش است، ابتدا دکمه «روشن کردن GPS» را بزنید.
                </p>
              </div>
            )}
          </div>

          {/* 4. SOS Lockscreen Message Card */}
          <div className="rounded-3xl p-6 bg-[#12131b]/90 border border-amber-500/25 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-black text-white">پیام اضطراری روی صفحه قفل (SOS)</h3>
              </div>
              <span className="text-[10px] text-stone-400">نمایش متن به یابنده</span>
            </div>

            <form onSubmit={handleSendSosMessage} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  شماره تماس اضطراری شما:
                </label>
                <input
                  type="text"
                  value={sosContactNumber}
                  onChange={(e) => setSosContactNumber(e.target.value)}
                  placeholder="مثال: 09123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  پیام برای شخص یابنده:
                </label>
                <textarea
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-white text-xs focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sendingSos}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-all"
              >
                <Send className={`w-3.5 h-3.5 ${sendingSos ? 'animate-spin' : ''}`} />
                <span>ارسال پیام و روشن کردن صفحه گوشی</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
