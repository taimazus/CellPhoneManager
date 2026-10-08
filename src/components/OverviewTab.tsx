import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Battery, 
  Smartphone, 
  Tv, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Sliders, 
  RefreshCcw,
  Sparkles,
  Layers,
  Thermometer,
  Gauge,
  Volume2,
  Volume1,
  VolumeX,
  Power,
  Home,
  ArrowLeft,
  Square,
  Bell,
  Settings2,
  ExternalLink,
  Trash2,
  ShieldAlert,
  Clock,
  Activity,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Play,
  Share2,
  Radio,
  Lock
} from 'lucide-react';
import { Device } from '../types';
import { AppIcon } from './AppIcon';

interface OverviewTabProps {
  device: Device | null;
  onNavigateTab: (tab: string) => void;
  onQuickAction: (action: string, payload?: any) => void;
}

interface DeepInfo {
  cpuAbi?: string;
  securityPatch?: string;
  bootloaderLocked?: string;
  selinux?: string;
  uptime?: string;
  socPlatform?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ device, onNavigateTab, onQuickAction }) => {
  const [deepInfo, setDeepInfo] = useState<DeepInfo | null>(null);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [launchUrl, setLaunchUrl] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!device) return;
    const fetchDeepInfo = async () => {
      setLoadingDeep(true);
      try {
        const res = await fetch(`/api/devices/${device.id}/deep-info?type=${device.type}`);
        const data = await res.json();
        setDeepInfo(data);
      } catch (err) {
        console.error('Failed to fetch deep device info', err);
      } finally {
        setLoadingDeep(false);
      }
    };
    fetchDeepInfo();
  }, [device?.id]);

  const handleDeviceControl = async (action: string, payload: any = {}) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/control/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload, type: device.type })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'عملیات با موفقیت انجام شد', 'success');
      } else {
        showToast(`خطا: ${data.error || 'عدم پاسخ‌دهی دستگاه'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در ارسال دستور: ${err.message}`, 'error');
    }
  };

  const handleCleanJunk = async () => {
    if (!device) return;
    setIsCleaning(true);
    await handleDeviceControl('clean_cache');
    setIsCleaning(false);
  };

  const handleOpenUrl = async () => {
    if (!device || !launchUrl.trim()) return;
    let url = launchUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    await handleDeviceControl('open_url', { url });
    setLaunchUrl('');
  };

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
        <Smartphone className="w-16 h-16 text-slate-600 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">دستگاهی متصل نیست</h3>
        <p className="text-sm text-slate-400 max-w-md">
          گوشی اندروید یا آیفون خود را با کابل USB یا از طریق Wi-Fi متصل کرده و از تب «پزشک درایورها» واسط‌های لازم را بررسی کنید.
        </p>
      </div>
    );
  }

  // Common quick launch apps
  const quickApps = [
    { name: 'تنظیمات', pkg: 'com.android.settings' },
    { name: 'دوربین', pkg: 'com.android.camera' },
    { name: 'کروم / وب', pkg: 'com.android.chrome' },
    { name: 'گالری', pkg: 'com.android.gallery3d' },
    { name: 'تلگرام', pkg: 'org.telegram.messenger' },
    { name: 'واتساپ', pkg: 'com.whatsapp' },
    { name: 'یوتیوب', pkg: 'com.google.android.youtube' },
    { name: 'فایل‌ها', pkg: 'com.google.android.documentsui' }
  ];

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

      {/* 1. Welcome Banner / Device Identity Hero */}
      <div className="relative overflow-hidden rounded-2xl glass-panel-glow p-6 border border-amber-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/25 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-yellow-300 shadow-xl shadow-amber-950/50">
              <Smartphone className="w-10 h-10 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-yellow-300 border border-amber-500/35">
                  {device.type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  متصل و آماده
                </span>
              </div>
              <h2 className="text-2xl font-black text-white font-sans tracking-wide">
                {device.name}
              </h2>
              <p className="text-sm text-stone-400 mt-0.5 flex items-center gap-3">
                <span>سازنده: <strong className="text-stone-200">{device.manufacturer || 'Apple / Google'}</strong></span>
                <span>•</span>
                <span>مدل: <strong className="text-stone-200">{device.model}</strong></span>
                <span>•</span>
                <span>سیستم‌عامل: <strong className="text-yellow-400">{device.osVersion}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('mirror')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-stone-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>شروع کنترل و تصویر زنده</span>
            </button>
            <button
              onClick={() => onNavigateTab('tweaks')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1a1b22] hover:bg-[#22242d] text-stone-200 border border-amber-500/25 text-sm font-semibold transition-all hover:text-yellow-300"
            >
              <Sliders className="w-4 h-4 text-yellow-400" />

              <span>تنظیمات مخفی</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid of Key Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Battery Health Card */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400">وضعیت و سلامت باتری</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Battery className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white font-mono">
              {device.battery?.level || 85}%
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {device.battery?.status === 'Charging' ? 'در حال شارژ' : 'سلامت عالی'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${device.battery?.level || 85}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              {device.battery?.temperature || 31}°C
            </span>
            <span>ولتاژ: {device.battery?.voltage || 4100} mV</span>
          </div>
        </div>

        {/* Storage Capacity Card */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400">حافظه داخلی (Storage)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white font-mono">
              {device.storage?.used || '64 GB'}
            </span>
            <span className="text-xs text-slate-400">
              از {device.storage?.total || '256 GB'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${device.storage?.usedPercentage || 40}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>فضای آزاد: <strong className="text-cyan-400 font-mono">{device.storage?.free || '192 GB'}</strong></span>
            <span>{device.storage?.usedPercentage || 40}% مصرف شده</span>
          </div>
        </div>

        {/* RAM & Performance Card */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400">حافظه موقت (RAM)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-white font-mono">
              {device.ram?.used || '4.2 GB'}
            </span>
            <span className="text-xs text-slate-400">
              از {device.ram?.total || '12 GB'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: '48%' }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>آزاد: <strong className="text-purple-400 font-mono">{device.ram?.free || '7.8 GB'}</strong></span>
            <span className="text-emerald-400 font-semibold">پایدار</span>
          </div>
        </div>

        {/* Display Resolution & DPI Card */}
        <div className="rounded-2xl glass-panel p-5 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400">صفحه نمایش و نرخ فریم</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-2xl font-black text-white font-mono">
              {device.display?.resolution || '1080x2400'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-400 font-semibold">
              {device.display?.density || 420} DPI
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-amber-400 font-semibold">
              {device.display?.refreshRate || '120Hz'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>HDR10+ / OLED</span>
            <span className="text-emerald-400 font-semibold">وضوح عالی</span>
          </div>
        </div>
      </div>

      {/* 3. Instant Remote Controls Deck (کلیدها و ابزارهای فوری کنترل گوشی) */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">مرکز کنترل فوری گوشی (Instant Remote Actions)</h3>
          </div>
          <span className="text-xs text-slate-400">کلیدهای فیزیکی، ولوم و کنترل سیستم بدون دست زدن به گوشی</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Power / Wake */}
          <button
            onClick={() => handleDeviceControl('key', { keycode: 26 })}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 text-slate-200 hover:text-rose-400 transition-all group focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            title="روشن / خاموش کردن صفحه نمایش"
            aria-label="روشن یا خاموش کردن صفحه نمایش"
          >
            <Power className="w-4 h-4 mb-1.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">صفحه / پاور</span>
          </button>

          {/* Home */}
          <button
            onClick={() => handleDeviceControl('key', { keycode: 3 })}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-400 transition-all group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="رفتن به صفحه اصلی (Home)"
            aria-label="رفتن به صفحه اصلی"
          >
            <Home className="w-4 h-4 mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">صفحه اصلی</span>
          </button>

          {/* Back */}
          <button
            onClick={() => handleDeviceControl('key', { keycode: 4 })}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-400 transition-all group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="بازگشت (Back)"
            aria-label="کلید بازگشت"
          >
            <ArrowLeft className="w-4 h-4 mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">بازگشت</span>
          </button>

          {/* App Switcher / Recents */}
          <button
            onClick={() => handleDeviceControl('key', { keycode: 187 })}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-400 transition-all group focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
            title="برنامه‌های اخیر (App Switcher)"
            aria-label="برنامه‌های باز و اخیر"
          >
            <Square className="w-4 h-4 mb-1.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">برنامه‌های باز</span>
          </button>

          {/* Volume Up */}
          <button
            onClick={() => handleDeviceControl('key', { keycode: 24 })}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400 transition-all group focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="افزایش صدا"
            aria-label="افزایش صدا"
          >
            <Volume2 className="w-4 h-4 mb-1.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">افزایش صدا</span>
          </button>

          {/* Volume Down */}
          <button
            onClick={() => handleDeviceControl('key', { keycode: 25 })}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400 transition-all group focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="کاهش صدا"
            aria-label="کاهش صدا"
          >
            <Volume1 className="w-4 h-4 mb-1.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">کاهش صدا</span>
          </button>

          {/* Notifications Shade */}
          <button
            onClick={() => handleDeviceControl('expand_notifications')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-400 transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="باز کردن پنل اعلان‌ها"
            aria-label="باز کردن پنل اعلان‌ها"
          >
            <Bell className="w-4 h-4 mb-1.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">پنل اعلان‌ها</span>
          </button>

          {/* Quick Settings */}
          <button
            onClick={() => handleDeviceControl('expand_settings')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 hover:bg-blue-500/10 border border-slate-800 hover:border-blue-500/40 text-slate-200 hover:text-blue-400 transition-all group focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            title="باز کردن تنظیمات سریع نوار وضعیت"
            aria-label="باز کردن تنظیمات سریع نوار وضعیت"
          >
            <Settings2 className="w-4 h-4 mb-1.5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">تنظیمات سریع</span>
          </button>
        </div>
      </div>

      {/* 4. Deep Hardware & Security Identity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hardware & Security Specs Card */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">شناسنامه جامع سخت‌افزاری و وضعیت امنیتی</h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-mono text-cyan-400 border border-slate-700">
              {deepInfo?.socPlatform || 'Snapdragon / Dimensity'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">معماری پردازنده (CPU ABI)</span>
              <p className="text-xs font-bold text-slate-100 font-mono">{deepInfo?.cpuAbi || 'arm64-v8a (64-Bit)'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">پچ امنیتی (Security Patch)</span>
              <p className="text-xs font-bold text-emerald-400 font-mono">{deepInfo?.securityPatch || '2024-05-01'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">وضعیت بوت‌لودر (Bootloader)</span>
              <p className="text-xs font-bold text-cyan-400 font-mono">{deepInfo?.bootloaderLocked || 'Locked (قفل ایمن)'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">سطح امنیت هسته (SELinux)</span>
              <p className="text-xs font-bold text-emerald-400 font-mono">{deepInfo?.selinux || 'Enforcing'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">مدت زمان روشن بودن (Uptime)</span>
              <p className="text-xs font-bold text-purple-300 font-mono">{deepInfo?.uptime || '48h 12m'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1">پروتکل ارتباط</span>
              <p className="text-xs font-bold text-amber-300 font-mono">
                {device.id.includes(':') ? 'Wireless TCP/IP (Wi-Fi)' : 'USB High-Speed Debugging'}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Deep Analysis & Junk Cleaner */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">تفکیک هوشمند حافظه</h3>
              </div>
              <span className="text-[11px] text-slate-400">{device.storage?.used || '64 GB'} / {device.storage?.total || '256 GB'}</span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800 mb-3">
              <div className="h-full bg-cyan-500 rounded-l-full" style={{ width: '42%' }} title="برنامه‌ها و دیتا: 42%"></div>
              <div className="h-full bg-purple-500" style={{ width: '28%' }} title="عکس و ویدیو: 28%"></div>
              <div className="h-full bg-amber-500" style={{ width: '12%' }} title="موسیقی و اسناد: 12%"></div>
              <div className="h-full bg-slate-600 rounded-r-full" style={{ width: '18%' }} title="سیستم و رام: 18%"></div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>برنامه‌ها و دیتا (42%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>عکس و فیلم (28%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>موسیقی و اسناد (12%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span>سیستم عامل (18%)</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCleanJunk}
            disabled={isCleaning}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all disabled:opacity-50"
          >
            <Trash2 className={`w-4 h-4 ${isCleaning ? 'animate-spin' : ''}`} />
            <span>{isCleaning ? 'در حال پاکسازی کش و بهینه‌سازی...' : 'پاکسازی سریع کش و فایل‌های زائد (Turbo Clean)'}</span>
          </button>
        </div>
      </div>

      {/* 5. Quick App Launcher & Direct URL Opener */}
      <div className="rounded-2xl glass-panel p-6 border border-amber-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-bold text-white">لانچر سریع برنامه‌ها و باز کردن فوری لینک در گوشی</h3>
          </div>

          {/* Open URL in Phone */}
          <div className="flex gap-2 w-full sm:w-96">
            <input
              type="text"
              placeholder="مثال: https://google.com یا آدرس وب..."
              value={launchUrl}
              onChange={(e) => setLaunchUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOpenUrl()}
              className="flex-1 bg-[#121318] border border-amber-500/20 rounded-xl px-3.5 py-1.5 text-xs text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
            />
            <button
              onClick={handleOpenUrl}
              disabled={!launchUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs transition-all disabled:opacity-40"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>باز کردن</span>
            </button>
          </div>
        </div>

        {/* Quick Launch Icons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {quickApps.map((app) => (
            <button
              key={app.pkg}
              onClick={() => handleDeviceControl('launch_app', { packageName: app.pkg })}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#14151b] hover:bg-[#1c1e28] border border-amber-500/15 hover:border-amber-500/40 transition-all text-center group shadow-sm hover:shadow-amber-500/10"
            >
              <div className="mb-2 group-hover:scale-110 transition-transform">
                <AppIcon packageName={app.pkg} appName={app.name} size="sm" deviceId={device?.id} />
              </div>
              <span className="text-xs font-bold text-stone-300 group-hover:text-yellow-300 truncate max-w-full">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Quick Operations & Maintenance Shortcuts */}
      <div className="rounded-2xl glass-panel p-6 border border-amber-500/20">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          <span>میانبرهای دسترسی سریع به ابزارهای تخصصی</span>
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <button
            onClick={() => onQuickAction('screenshot')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#14151b] hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/40 transition-all text-center group shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-yellow-400 mb-2 group-hover:scale-110 transition-transform">
              <Tv className="w-5 h-5" />
            </div>

            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">گرفتن اسکرین‌شات</span>
          </button>

          <button
            onClick={() => onNavigateTab('apps')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 transition-all text-center group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">نصب برنامه جدید</span>
          </button>

          <button
            onClick={() => onNavigateTab('tweaks')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/40 transition-all text-center group"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 mb-2 group-hover:scale-110 transition-transform">
              <Gauge className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300">سرعت انیمیشن</span>
          </button>

          <button
            onClick={() => onNavigateTab('diagnostics')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 transition-all text-center group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">بررسی لاگ زنده</span>
          </button>

          <button
            onClick={() => onQuickAction('reboot', { mode: 'recovery' })}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 transition-all text-center group"
          >
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 mb-2 group-hover:scale-110 transition-transform">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-rose-300">ریبوت به ریکاوری</span>
          </button>

          <button
            onClick={() => onNavigateTab('doctor')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 hover:bg-blue-500/10 border border-slate-800 hover:border-blue-500/40 transition-all text-center group"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mb-2 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300">بررسی درایورها</span>
          </button>
        </div>
      </div>
    </div>
  );
};

