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
  Laptop,
  Smartphone,
  Wifi,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface AudioFxTabProps {
  device: Device | null;
}

export const AudioFxTab: React.FC<AudioFxTabProps> = ({ device }) => {
  // Volume states
  const [mediaVol, setMediaVol] = useState<number>(10);
  const [ringVol, setRingVol] = useState<number>(8);
  const [alarmVol, setAlarmVol] = useState<number>(12);
  const [notifVol, setNotifVol] = useState<number>(8);
  const [turboGain, setTurboGain] = useState<boolean>(false);

  // Phone to PC Relay state
  const [isRelaying, setIsRelaying] = useState<boolean>(false);
  const [relayMode, setRelayMode] = useState<'pc_only' | 'both'>('both');

  // PC to Phone Speaker Mode state
  const [isPcSpeakerStreaming, setIsPcSpeakerStreaming] = useState<boolean>(false);
  const [pcSpeakerDevice, setPcSpeakerDevice] = useState<string>('CABLE Output (VB-Audio Virtual Cable)');
  const [pcSpeakerDevices, setPcSpeakerDevices] = useState<string[]>([]);
  const [pcSpeakerBitrate, setPcSpeakerBitrate] = useState<'128k' | '192k' | '320k'>('192k');
  const [pcSpeakerIps, setPcSpeakerIps] = useState<{ name: string; ip: string }[]>([]);
  const [pcSpeakerClients, setPcSpeakerClients] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [isSyncingVolumes, setIsSyncingVolumes] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchVolumes = async (showFeedback = false) => {
    if (!device) return;
    if (showFeedback) setIsSyncingVolumes(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/volumes`);
      const data = await res.json();
      if (data.success && data.volumes) {
        if (data.volumes.media !== undefined) setMediaVol(data.volumes.media);
        if (data.volumes.ring !== undefined) setRingVol(data.volumes.ring);
        if (data.volumes.alarm !== undefined) setAlarmVol(data.volumes.alarm);
        if (data.volumes.notification !== undefined) setNotifVol(data.volumes.notification);
        if (showFeedback) {
          showToast('سطوح صدای واقعی مستقیماً از گوشی بازخوانی شدند.', 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching volumes:', err);
      if (showFeedback) {
        showToast('خطا در خواندن سطوح صدا از گوشی', 'error');
      }
    } finally {
      if (showFeedback) setIsSyncingVolumes(false);
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

  const fetchPcSpeakerStatus = async () => {
    try {
      const res = await fetch('/api/pc-speaker/status');
      const data = await res.json();
      if (data) {
        setIsPcSpeakerStreaming(!!data.isStreaming);
        if (data.currentDevice) setPcSpeakerDevice(data.currentDevice);
        if (data.localIps) setPcSpeakerIps(data.localIps);
        if (data.clientCount !== undefined) setPcSpeakerClients(data.clientCount);
      }
    } catch (err) {
      console.error('Error fetching PC speaker status:', err);
    }
  };

  const fetchAudioDevices = async () => {
    try {
      const res = await fetch('/api/pc-speaker/devices');
      const data = await res.json();
      if (data && data.devices && Array.isArray(data.devices)) {
        setPcSpeakerDevices(data.devices);
        if (data.devices.length > 0 && !data.devices.includes(pcSpeakerDevice)) {
          setPcSpeakerDevice(data.devices[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching audio devices:', err);
    }
  };

  useEffect(() => {
    fetchVolumes();
    checkRelayStatus();
    fetchPcSpeakerStatus();
    fetchAudioDevices();

    const interval = setInterval(() => {
      fetchPcSpeakerStatus();
    }, 5000);
    return () => clearInterval(interval);
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
        // Re-sync live from device
        await fetchVolumes();
      } else {
        showToast(`خطا: ${data.error || 'خطا در تغییر صدا'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleTurbo = async () => {
    if (!device) return;
    const nextState = !turboGain;
    setTurboGain(nextState);

    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/turbo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gain: nextState })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchVolumes();
      } else {
        showToast(`خطا: ${data.error || 'خطا در حالت توربو'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleRelay = async () => {
    if (!device) return;
    setLoading(true);
    const action = isRelaying ? 'stop' : 'start';

    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/audio/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mode: relayMode })
      });
      const data = await res.json();
      if (data.success) {
        setIsRelaying(!isRelaying);
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error || 'خطا در استریم صدا'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePcSpeaker = async () => {
    if (!device) return;
    setLoading(true);
    const endpoint = isPcSpeakerStreaming 
      ? `/api/devices/${encodeURIComponent(device.id)}/pc-speaker/stop`
      : `/api/devices/${encodeURIComponent(device.id)}/pc-speaker/start`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: pcSpeakerDevice, bitrate: pcSpeakerBitrate })
      });
      const data = await res.json();
      if (data.success) {
        setIsPcSpeakerStreaming(!isPcSpeakerStreaming);
        showToast(data.message, 'success');
        fetchPcSpeakerStatus();
      } else {
        showToast(`خطا: ${data.error || 'خطا در استریم صدای کامپیوتر'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPlayerOnPhone = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/pc-speaker/open-receiver`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast('پلیر پخش صدا روی صفحه گوشی باز شد', 'success');
      } else {
        showToast(`خطا: ${data.error || 'ناموفق'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const primaryIp = pcSpeakerIps.length > 0 ? pcSpeakerIps[0].ip : '127.0.0.1';

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-500/90 text-slate-950 border border-emerald-400' 
            : 'bg-rose-500/90 text-white border border-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Guide Card */}
      <TabGuideCard
        title="استودیو صوتی، اکولایزر و انتقال دوطرفه صدا"
        description="تبدیل گوشی به بلندگوی کامپیوتر (Reverse Speaker)، پخش صدای گوشی روی اسپیکرهای سیستم و تقویت بلندی بلندگو فراتر از ۱۰۰٪."
        features={[
          "بلندگوی کامپیوتر روی گوشی: مناسب سیستم‌های بدون بلندگو یا استفاده از هندزفری گوشی برای شنیدن صدای کامپیوتر با تاخیر صفر از طریق کابل USB یا وای‌فای.",
          "پخش صدای گوشی روی کامپیوتر: گوش دادن به موزیک، پادکست و بازی‌های گوشی از طریق اسپیکرهای سیستم.",
          "تقویت صدای توربو (Turbo Boost 200%): افزایش آمپلی‌فایر سخت‌افزاری بلندگو برای ویس‌ها و فیلم‌های کم‌صدا."
        ]}
        tips={[
          "برای اتصال بدون تاخیر (زیر ۲۰ میلی‌ثانیه)، کابل USB را متصل نگه دارید.",
          "برای گوش دادن با هندزفری روی گوشی، پس از زدن دکمه شروع، دکمه «باز کردن پلیر در گوشی» را لمس کنید."
        ]}
      />

      {/* ============================================================ */}
      {/* 1. PC-to-Phone Speaker Feature Card (New Requested Feature)   */}
      {/* ============================================================ */}
      <div className="rounded-3xl glass-panel p-6 border border-blue-500/30 bg-gradient-to-b from-blue-950/25 to-slate-900/80 space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Speaker className="w-5 h-5 text-blue-400" />
              <span>تبدیل گوشی به بلندگوی کامپیوتر (PC-to-Phone Speaker Mode)</span>
            </h3>
            <p className="text-xs text-slate-400">
              سیستم شما اسپیکر ندارد یا می‌خواهید با هندزفری گوشی صدای ویندوز، بازی‌ها و فیلم‌ها را بشنوید؟ صدا درجا به گوشی استریم می‌شود.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              isPcSpeakerStreaming 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isPcSpeakerStreaming ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              <span>{isPcSpeakerStreaming ? `در حال پخش زنده (${pcSpeakerClients} گیرنده)` : 'آماده استریم'}</span>
            </span>
          </div>
        </div>

        {/* Device & Bitrate Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Audio Source Device */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>منبع ورودی صدای سیستم:</span>
              <button 
                onClick={fetchAudioDevices}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                title="بازخوانی لیست دستگاه‌های صدا"
              >
                <RefreshCw className="w-3 h-3" />
                <span>بروزرسانی</span>
              </button>
            </div>
            <select
              value={pcSpeakerDevice}
              onChange={(e) => setPcSpeakerDevice(e.target.value)}
              disabled={isPcSpeakerStreaming}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
            >
              {pcSpeakerDevices.map((d, i) => (
                <option key={i} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Quality Bitrate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">کیفیت استریم (Bitrate):</label>
            <select
              value={pcSpeakerBitrate}
              onChange={(e) => setPcSpeakerBitrate(e.target.value as any)}
              disabled={isPcSpeakerStreaming}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-60"
            >
              <option value="128k">128 kbps (حجم کم / بسیار سریع)</option>
              <option value="192k">192 kbps (پیش‌فرض / کیفیت عالی)</option>
              <option value="320k">320 kbps (کیفیت استودیویی HQ)</option>
            </select>
          </div>
        </div>

        {/* Action Controls & Fast Launch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Start/Stop Main Button */}
          <button
            onClick={handleTogglePcSpeaker}
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
              isPcSpeakerStreaming
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
            }`}
          >
            {isPcSpeakerStreaming ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>توقف استریم صدای ویندوز</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>شروع استریم صدای کامپیوتر به گوشی</span>
              </>
            )}
          </button>

          {/* Open Receiver on Phone Button */}
          <button
            onClick={handleOpenPlayerOnPhone}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500/60 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            title="باز کردن پلیر زنده روی مرورگر گوشی متصل"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>📱 باز کردن و پخش زنده روی صفحه گوشی</span>
          </button>
        </div>

        {/* Connection URL Bar */}
        {isPcSpeakerStreaming && (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>آدرس مستقیم پخش برای گوشی و سایر دستگاه‌ها:</span>
              </span>
              <a
                href="/pc-speaker-player.html"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
              >
                <span>تست در مرورگر</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                کابل USB (اتصال مستقیم): <strong className="text-blue-400">http://127.0.0.1:5000/pc-speaker-player.html</strong>
              </span>
              <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                شبکه Wi-Fi: <strong className="text-emerald-400">http://{primaryIp}:5000/pc-speaker-player.html</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. Phone-to-PC Audio Relay Feature Card                      */}
      {/* ============================================================ */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/80 space-y-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-400" />
              <span>پخش زنده صدای گوشی روی اسپیکرهای کامپیوتر (Phone Audio to PC)</span>
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
              <span>{isRelaying ? 'انتقال صدای گوشی به PC فعال است' : 'آماده به کار'}</span>
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
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-md' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Speaker className="w-4 h-4 text-blue-400" />
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
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-md' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Headphones className="w-4 h-4 text-blue-400" />
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
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
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

      {/* ============================================================ */}
      {/* 3. Multi-Stream Volume Controls & Turbo Boost                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Multi-Stream Volume Controls */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>تنظیم تفکیکی سطح بلندی صداهای گوشی</span>
            </h3>
            <button
              onClick={() => fetchVolumes(true)}
              disabled={isSyncingVolumes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="خواندن زنده سطوح ولوم از سخت‌افزار گوشی"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVolumes ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isSyncingVolumes ? 'در حال خواندن...' : 'همگام‌سازی ولوم‌ها'}</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Media Stream (Stream 3) */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-xs text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-blue-400" />
                  <span>صدای رسانه و موزیک (Media & Music):</span>
                </span>
                <span className="font-mono text-blue-400">{mediaVol} از 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={mediaVol}
                onChange={(e) => handleSetVolume(3, parseInt(e.target.value, 10))}
                className="w-full accent-blue-500 cursor-pointer"
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
                className="w-full accent-emerald-500 cursor-pointer"
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
                className="w-full accent-amber-500 cursor-pointer"
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
                className="w-full accent-purple-500 cursor-pointer"
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
