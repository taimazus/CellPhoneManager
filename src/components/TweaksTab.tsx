import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Tv, 
  Zap, 
  MapPin, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RotateCcw,
  ShieldCheck,
  Send,
  Eye,
  Globe,
  BatteryCharging,
  Moon,
  Sun,
  Flame,
  Clock,
  Fingerprint,
  Layers,
  Cpu,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface TweaksTabProps {
  device: Device | null;
}

export const TweaksTab: React.FC<TweaksTabProps> = ({ device }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'display' | 'network' | 'battery' | 'dev' | 'location'>('all');
  
  // States
  const [dpi, setDpi] = useState<number>(device?.display?.density || 420);
  const [animScale, setAnimScale] = useState<number>(1.0);
  const [refreshRate, setRefreshRate] = useState<string>('auto');
  const [selectedDns, setSelectedDns] = useState<string>('off');
  const [customDns, setCustomDns] = useState<string>('');
  const [customRes, setCustomRes] = useState<string>('1080x2400');
  
  // Toggles
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showTouches, setShowTouches] = useState<boolean>(false);
  const [pointerLocation, setPointerLocation] = useState<boolean>(false);
  const [showFps, setShowFps] = useState<boolean>(false);
  const [stayAwake, setStayAwake] = useState<boolean>(false);
  const [clockSeconds, setClockSeconds] = useState<boolean>(false);
  const [forceMsaa, setForceMsaa] = useState<boolean>(false);

  // GPS Spoofer
  const [lat, setLat] = useState<string>('35.6892');
  const [lng, setLng] = useState<string>('51.3890');

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Terminal
  const [customCmd, setCustomCmd] = useState<string>('getprop ro.build.version.release');
  const [cmdOutput, setCmdOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load real device tweaks on mount & sync
  const fetchCurrentTweaks = React.useCallback(async (showFeedback = false) => {
    if (!device) return;
    if (showFeedback) setIsSyncing(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/tweaks`);
      const data = await res.json();
      if (data.success && data.tweaks) {
        const t = data.tweaks;
        if (t.dpi) setDpi(t.dpi);
        if (t.animScale !== undefined) setAnimScale(t.animScale);
        if (t.refreshRate) setRefreshRate(t.refreshRate);
        if (t.customRes) setCustomRes(t.customRes);
        if (t.privateDns) setSelectedDns(t.privateDns);
        if (t.showTouches !== undefined) setShowTouches(t.showTouches);
        if (t.pointerLocation !== undefined) setPointerLocation(t.pointerLocation);
        if (t.showFps !== undefined) setShowFps(t.showFps);
        if (t.stayAwake !== undefined) setStayAwake(t.stayAwake);
        if (t.clockSeconds !== undefined) setClockSeconds(t.clockSeconds);
        if (t.darkMode !== undefined) setDarkMode(t.darkMode);
        if (t.demoMode !== undefined) setDemoMode(t.demoMode);
        if (t.forceMsaa !== undefined) setForceMsaa(t.forceMsaa);
        if (showFeedback) {
          showToast('تنظیمات واقعی با موفقیت مستقیماً از گوشی بازخوانی شدند.', 'success');
        }
      }
    } catch (e) {
      console.error('Error fetching current tweaks:', e);
      if (showFeedback) {
        showToast('خطا در خواندن تنظیمات از گوشی', 'error');
      }
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  }, [device]);

  useEffect(() => {
    fetchCurrentTweaks();
  }, [fetchCurrentTweaks]);

  const applyTweak = async (action: string, value: any) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/tweaks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value, type: device.type || 'android' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'تنظیم با موفقیت روی دستگاه اعمال شد!', 'success');
        // Live verify from device
        await fetchCurrentTweaks();
      } else {
        showToast(`خطا: ${data.error || 'عدم دسترسی'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const runCustomCommand = async () => {
    if (!device || !customCmd.trim()) return;
    setIsExecuting(true);
    setCmdOutput('در حال ارسال و اجرای دستور روی گوشی...');
    try {
      const res = await fetch(`/api/devices/${device.id}/tweaks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'shell', value: customCmd, type: device.type || 'android' })
      });
      const data = await res.json();
      if (data.success || data.stdout) {
        setCmdOutput(data.stdout || data.message || 'دستور با کد صفر پایان یافت.');
      } else {
        setCmdOutput(data.stderr || data.error || 'خطا در اجرا');
      }
    } catch (err: any) {
      setCmdOutput(`خطا در ارتباط: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'همه تنظیمات' },
    { id: 'display', label: '📺 نمایشگر و رفرش‌ریت' },
    { id: 'network', label: '🌐 شبکه و DNS خصوصی' },
    { id: 'battery', label: '🔋 باتری و پرفورمنس' },
    { id: 'dev', label: '🛠️ توسعه‌دهنده و رابط' },
    { id: 'location', label: '📍 مکان‌یابی و دمو' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {notification && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          notification.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            <span>تنظیمات مخفی، شخصی‌سازی و بهینه‌سازی سیستمی</span>
          </h2>
          <p className="text-xs text-slate-400">
            تغییر پارامترهای گرافیکی، نرخ نوسازی 120Hz، دی‌ان‌اس ضدتحریم و ضدتبلیغ، بهینه‌سازی باتری و خط فرمان ADB
          </p>
        </div>
        <button
          onClick={() => fetchCurrentTweaks(true)}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-500/5"
          title="بازخوانی زنده مقادیر واقعی از گوشی"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-purple-400' : ''}`} />
          <span>{isSyncing ? 'در حال همگام‌سازی با گوشی...' : 'همگام‌سازی زنده از گوشی'}</span>
        </button>
      </div>

      {/* Guidance Card */}
      <TabGuideCard
        title="راهنمای تنظیمات مخفی و بهینه‌سازی سیستمی"
        description="نحوه قفل رفرش‌ریت، فعال‌سازی دی‌ان‌اس ضدتحریم و ضدتبلیغ، خواب عمیق باتری و سوئیچ‌های توسعه‌دهنده"
        steps={[
          'دی‌ان‌اس خصوصی (Private DNS): با انتخاب Shecan یا AdGuard، کل سیستم‌عامل و همه برنامه‌ها بدون نیاز به فیلترشکن از اینترنت ضدتحریم یا ضدتبلیغ استفاده می‌کنند.',
          'خواب عمیق باتری (Doze Mode): گوشی را فوراً به حالت Deep Idle می‌برد تا در شب و ساعات بی‌کاری مصرف باتری به حداقل برسد.',
          'کلیدهای توسعه‌دهنده: گزینه‌هایی مثل نمایش نقطه لمس (Show Touches)، خط‌کش مختصات تاچ (Pointer Location) و نمایشگر فریم بلافاصله روی نمایشگر گوشی پدیدار می‌شوند.',
          'سرعت انیمیشن و DPI: با تنظیم مقیاس انیمیشن روی 0.5x یا 0x سرعت پاسخگویی و جابجایی بین منوها تا دو برابر سریع‌تر حس می‌شود.'
        ]}
        tips={[
          'وضعیت فعلی تنظیمات گوشی به صورت خودکار هنگام ورود به این تب بارگذاری و همگام‌سازی می‌شود.',
          'هرگونه تغییر بلافاصله با فرمان‌های بهینه ADB روی سیستم‌عامل ثبت شده و نیازی به ریستارت گوشی ندارد.'
        ]}
      />

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === c.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid of Tweaks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Display Density (DPI) Modifier */}
        {(activeCategory === 'all' || activeCategory === 'display') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">تراکم پیکسلی صفحه (DPI Density)</h3>
              </div>
              <span className="font-mono text-cyan-400 font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs">
                {dpi} DPI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تغییر اندازه نمایش محتوا و فونت‌ها بدون افت کیفیت:
            </p>
            <input
              type="range"
              min="320"
              max="640"
              step="10"
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => { setDpi(420); applyTweak('density', 'reset'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی پیش‌فرض</span>
              </button>
              <button
                onClick={() => applyTweak('density', dpi)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
              >
                اعمال DPI
              </button>
            </div>
          </div>
        )}

        {/* 2. Force Refresh Rate (90Hz / 120Hz / 144Hz) */}
        {(activeCategory === 'all' || activeCategory === 'display') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gauge className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">اجبار به حداکثر نرخ نوسازی (Force Peak Hz)</h3>
              </div>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs">
                {refreshRate.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              قفل کردن رفرش‌ریت روی بالاترین مقدار در همه برنامه‌ها بدون افت به ۶۰ هرتز:
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {['60', '90', '120', 'auto'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => { setRefreshRate(rate); applyTweak('refresh_rate', rate); }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    refreshRate === rate
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {rate === 'auto' ? 'خودکار / پیش‌فرض' : `${rate} Hz`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. System Animation Speed */}
        {(activeCategory === 'all' || activeCategory === 'display') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">سرعت انیمیشن و پاسخ‌دهی رابط کاربری</h3>
              </div>
              <span className="font-mono text-amber-400 font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                {animScale}x
              </span>
            </div>
            <p className="text-xs text-slate-400">
              افزایش چشمگیر سرعت با کاهش انیمیشن‌ها به 0.5x یا 0x (خاموش):
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[0, 0.25, 0.5, 1.0].map((scale) => (
                <button
                  key={scale}
                  onClick={() => { setAnimScale(scale); applyTweak('animation', scale); }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    animScale === scale 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {scale === 0 ? 'خاموش (0x)' : `${scale}x`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Private DNS (Anti-Sanction & Adblocker) */}
        {(activeCategory === 'all' || activeCategory === 'network') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">تنظیم دی‌ان‌اس خصوصی (Private DNS)</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              تنظیم DNS تحریم‌شکن (Shecan) یا ضد تبلیغات (AdGuard) برای کل گوشی بدون نیاز به فیلترشکن:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: '🛡️ ضد تبلیغ (AdGuard)', host: 'dns.adguard-dns.com' },
                { label: '🔓 تحریم‌شکن شکن (Shecan)', host: 'free.shecan.ir' },
                { label: '⚡ کلودفلر (1.1.1.1)', host: '1dot1dot1dot1.cloudflare-dns.com' },
                { label: '❌ خاموش / پیش‌فرض', host: 'off' },
              ].map((dns) => (
                <button
                  key={dns.host}
                  onClick={() => { setSelectedDns(dns.host); applyTweak('private_dns', dns.host); }}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-right transition-all truncate ${
                    selectedDns === dns.host
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {dns.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Custom Resolution (FPS Booster) */}
        {(activeCategory === 'all' || activeCategory === 'display') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">تغییر رزولوشن صفحه (افزایش شدید FPS بازی)</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              کاهش وضوح رندر برای افزایش نرخ فریم و خنک ماندن گوشی در بازی‌های سنگین:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: '720x1600 (HD+ گیمینگ)', res: '720x1600' },
                { label: '1080x2400 (FHD+ استاندارد)', res: '1080x2400' },
                { label: 'بازنشانی به حالت کارخانه', res: 'reset' },
              ].map((r) => (
                <button
                  key={r.res}
                  onClick={() => applyTweak('custom_resolution', r.res)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-800 text-xs font-semibold text-center transition-all"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Battery & Doze Mode */}
        {(activeCategory === 'all' || activeCategory === 'battery') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BatteryCharging className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">خواب عمیق باتری (Aggressive Doze Mode)</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              اجبار گوشی به رفتن سریع به حالت آماده‌باش عمیق (Deep Sleep) جهت جلوگیری از خالی شدن باتری در شب:
            </p>
            <div className="pt-1">
              <button
                onClick={() => applyTweak('doze_mode', true)}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <BatteryCharging className="w-4 h-4" />
                <span>فعال‌سازی فوری حالت خواب عمیق (Force Deep Sleep)</span>
              </button>
            </div>
          </div>
        )}

        {/* 7. Developer & UI Debug Switches */}
        {(activeCategory === 'all' || activeCategory === 'dev') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3 lg:col-span-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>کلیدهای سریع اشکال‌زدایی و گزینه‌های توسعه‌دهنده (Developer Quick Toggles)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Show Touches */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span>نمایش نقطه لمس انگشت (Show Touches)</span>
                <button
                  onClick={() => { const next = !showTouches; setShowTouches(next); applyTweak('show_touches', next); }}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    showTouches ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {showTouches ? 'روشن' : 'خاموش'}
                </button>
              </div>

              {/* Show Pointer Location */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span>مختصات دقیق تاچ (Pointer Location)</span>
                <button
                  onClick={() => { const next = !pointerLocation; setPointerLocation(next); applyTweak('pointer_location', next); }}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    pointerLocation ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {pointerLocation ? 'روشن' : 'خاموش'}
                </button>
              </div>

              {/* Show FPS Overlay */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span>نمایشگر نرخ فریم روی صفحه (FPS Overlay)</span>
                <button
                  onClick={() => { const next = !showFps; setShowFps(next); applyTweak('show_fps', next); }}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    showFps ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {showFps ? 'روشن' : 'خاموش'}
                </button>
              </div>

              {/* Stay Awake */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span>روشن ماندن صفحه حین اتصال به برق</span>
                <button
                  onClick={() => { const next = !stayAwake; setStayAwake(next); applyTweak('stay_awake', next); }}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    stayAwake ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {stayAwake ? 'روشن' : 'خاموش'}
                </button>
              </div>

              {/* Clock with seconds */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span>ساعت نوار وضعیت همراه با ثانیه</span>
                <button
                  onClick={() => { const next = !clockSeconds; setClockSeconds(next); applyTweak('clock_seconds', next); }}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    clockSeconds ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {clockSeconds ? 'روشن' : 'خاموش'}
                </button>
              </div>

              {/* Force 4x MSAA */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span>گرافیک بازی: اجبار 4x MSAA Anti-aliasing</span>
                <button
                  onClick={() => { const next = !forceMsaa; setForceMsaa(next); applyTweak('force_msaa', next); }}
                  className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                    forceMsaa ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {forceMsaa ? 'روشن' : 'خاموش'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. Demo Mode */}
        {(activeCategory === 'all' || activeCategory === 'location') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">حالت دمو و عکاسی (Demo Mode)</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              تمیز کردن خودکار نوار وضعیت بالای صفحه گوشی (ساعت 10:00، باتری 100% و آنتن 5G کامل):
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">وضعیت: {demoMode ? 'فعال' : 'غیرفعال'}</span>
              <button
                onClick={() => {
                  const next = !demoMode;
                  setDemoMode(next);
                  applyTweak('demo_mode', next);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  demoMode
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {demoMode ? 'غیرفعال کردن حالت دمو' : 'فعال‌سازی حالت دمو'}
              </button>
            </div>
          </div>
        )}

        {/* 9. Location Spoofer */}
        {(activeCategory === 'all' || activeCategory === 'location') && (
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">شبیه‌سازی موقعیت مکانی (GPS Spoofer)</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              تغییر موقعیت جغرافیایی بدون نیاز به روت:
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">عرض جغرافیایی (Latitude):</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">طول جغرافیایی (Longitude):</label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => applyTweak('simulate_location', null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                پاک کردن
              </button>
              <button
                onClick={() => applyTweak('simulate_location', { lat: parseFloat(lat), lng: parseFloat(lng) })}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20"
              >
                تنظیم موقعیت GPS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 10. Custom Command Terminal */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">ترمینال مستقیم پوسته گوشی (ADB / Device Shell)</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runCustomCommand()}
            placeholder="مثال: getprop ro.build.version.release یا pm list packages"
            className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={runCustomCommand}
            disabled={isExecuting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
          >
            <Send className="w-4 h-4" />
            <span>اجرا</span>
          </button>
        </div>

        {cmdOutput && (
          <pre className="bg-[#0e0f14] p-4 rounded-xl border border-amber-500/20 text-xs font-mono text-amber-100/90 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {cmdOutput}
          </pre>
        )}
      </div>
    </div>
  );
};
