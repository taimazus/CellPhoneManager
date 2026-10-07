import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  MousePointer, 
  Tv, 
  Sparkles,
  ExternalLink,
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Sliders,
  Radio,
  Zap,
  Flame,
  Volume2,
  RefreshCw,
  Crown,
  QrCode,
  Copy,
  Check,
  HelpCircle,
  Play
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';
import { TabGuideCard } from './TabGuideCard';
import QRCode from 'qrcode';

interface RemoteControllerTabProps {
  device: Device | null;
}

interface GamepadProfile {
  id: string;
  name: string;
  desc: string;
  mappings: Record<string, string>;
}

export const RemoteControllerTab: React.FC<RemoteControllerTabProps> = ({ device }) => {
  const [activeTabMode, setActiveTabMode] = useState<'pc_gamepad' | 'phone_control' | 'trackpad'>('pc_gamepad');
  const [profiles, setProfiles] = useState<GamepadProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<string>('racing');
  const [latestInputs, setLatestInputs] = useState<any>({});
  const [localIps, setLocalIps] = useState<{ name: string; ip: string }[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchGamepadStatus();
    const interval = setInterval(fetchGamepadStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const fetchGamepadStatus = async () => {
    const data = await safeFetchJson<{
      success: boolean;
      profiles?: GamepadProfile[];
      activeProfile?: string;
      latestInputs?: any;
      localIps?: { name: string; ip: string }[];
    }>('/api/gamepad/status');
    if (data && data.success) {
      if (data.profiles) setProfiles(data.profiles);
      if (data.activeProfile) setActiveProfile(data.activeProfile);
      if (data.latestInputs) setLatestInputs(data.latestInputs);
      if (data.localIps) setLocalIps(data.localIps);
    }
  };

  const handleSelectProfile = async (profileId: string) => {
    setActiveProfile(profileId);
    const res = await safeFetchJson<{ success: boolean; profile?: GamepadProfile }>('/api/gamepad/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    });
    if (res && res.success) {
      showToast(`پروفایل دسته بازی به «${res.profile?.name || profileId}» تغییر یافت.`, 'success');
    }
  };

  const handleLaunchOnPhone = async () => {
    if (!device) {
      showToast('لطفاً ابتدا دستگاه را به کامپیوتر متصل کنید.', 'error');
      return;
    }
    setIsLaunching(true);
    try {
      const res = await safeFetchJson<{ success: boolean; url?: string; lanUrl?: string; message?: string; error?: string }>(`/api/devices/${device.id}/gamepad/launch`, {
        method: 'POST'
      });
      if (res && res.success) {
        showToast('فرمان باز کردن دسته بازی به گوشی ارسال شد! صفحه گوشی را چک کنید یا QR کد را اسکن نمایید.', 'success');
      } else {
        showToast(res?.error || 'خطا در ارسال به گوشی. می‌توانید از QR کد یا آدرس مستقیم استفاده کنید.', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendPhoneKey = async (keycode: number, name = 'کلید') => {
    if (!device) return;
    try {
      await safeFetchJson(`/api/devices/${device.id}/control/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'key', keycode, type: device.type })
      });
      showToast(`فرمان ${name} به گوشی ارسال شد.`, 'success');
    } catch {
      // quiet
    }
  };

  const primaryIp = localIps.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.') || i.ip.startsWith('172.'))?.ip || '127.0.0.1';
  const phoneLanUrl = `http://${primaryIp}:3001/gamepad.html`;

  useEffect(() => {
    if (phoneLanUrl) {
      QRCode.toDataURL(phoneLanUrl, {
        margin: 1,
        width: 240,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Error:', err));
    }
  }, [phoneLanUrl]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-amber-500/20' 
            : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Tab Guide Banner */}
      <TabGuideCard
        icon={Gamepad2}
        title="تبدیل گوشی به دسته بازی کامپیوتر (PC Virtual Gamepad)"
        subtitle="استفاده از گوشی به عنوان دسته بازی حرفه‌ای ویندوز (Xbox/PS)، شبیه‌ساز فرمان مسابقه‌ای و تاچ‌پد لمسی با تاخیر صفر"
      >
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button
            onClick={() => setActiveTabMode('pc_gamepad')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'pc_gamepad'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            🎮 دسته بازی برای ویندوز
          </button>
          <button
            onClick={() => setActiveTabMode('trackpad')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'trackpad'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            🖱️ ماوس و تاچ‌پد PC
          </button>
          <button
            onClick={() => setActiveTabMode('phone_control')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabMode === 'phone_control'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            📱 کنترل از روی PC
          </button>
        </div>
      </TabGuideCard>

      {/* MODE 1: PC VIRTUAL GAMEPAD */}
      {activeTabMode === 'pc_gamepad' && (
        <div className="space-y-6">
          {/* Main Action Launcher Card */}
          <div className="p-6 rounded-3xl bg-[#12131c] border border-amber-500/30 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-3 text-right flex-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-yellow-300 font-bold border border-amber-500/30">
                  <Zap className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">راه‌اندازی اتصال دسته لمسی روی گوشی</h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                با زدن دکمه زیر، صفحه دسته بازی مستقیماً روی گوشی باز می‌شود. همچنین با اسکن بارکد QR یا وارد کردن لینک زیر در مرورگر گوشی می‌توانید بازی کنید:
              </p>
              
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="p-2.5 px-3.5 rounded-xl bg-[#0a0a0f] border border-stone-800 font-mono text-amber-300 flex items-center gap-2">
                  <span className="font-bold">{phoneLanUrl}</span>
                  <button
                    onClick={() => handleCopy(phoneLanUrl, 'lan_url')}
                    className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                    title="کپی آدرس"
                  >
                    {copied === 'lan_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <a
                  href="/gamepad.html"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 px-3.5 rounded-xl bg-[#1c1d2c] hover:bg-[#25273b] border border-amber-500/25 text-yellow-300 hover:text-yellow-200 font-bold flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>تست در مرورگر کامپیوتر</span>
                </a>
              </div>
            </div>

            {/* Offline High-Contrast QR Code Card */}
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0">
              <div className="p-2 bg-white rounded-2xl border-2 border-amber-500/50 shadow-2xl text-center space-y-1">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QR Code Gamepad" 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-contain block"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center text-black text-xs">در حال ساخت QR...</div>
                )}
                <span className="text-[10px] text-stone-800 font-black block tracking-tight">اسکن فوری با دوربین گوشی</span>
              </div>

              <button
                onClick={handleLaunchOnPhone}
                disabled={isLaunching || !device}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Gamepad2 className="w-5 h-5" />
                <span>{isLaunching ? 'در حال باز کردن...' : '🚀 راه‌اندازی دسته روی گوشی'}</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Step-by-Step Guide Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#181a28] to-[#10111a] border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>📖 راهنمای کامل راه‌اندازی، رفع مشکل و بازی با دسته گوشی:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-stone-300">
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-yellow-300 flex items-center justify-center text-[11px] font-black">۱</span>
                  <span>ریستارت سرور (بسیار مهم):</span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  فایل <strong className="text-stone-200">cpmRestart.bat</strong> در پوشه پروژه را اجرا کنید تا موتور جدید سخت‌افزاری DirectInput لود شود.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-yellow-300 flex items-center justify-center text-[11px] font-black">۲</span>
                  <span>کلیک روی پنجره بازی (Focus):</span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  با ماوس روی پنجره بازی <strong className="text-stone-200">FIFA 18</strong> یک بار کلیک کنید تا پنجره در حالت فعال قرار گیرد و کلیدها دریافت شوند.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-yellow-300 flex items-center justify-center text-[11px] font-black">۳</span>
                  <span>رد کردن منوها با ENTER:</span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  برای رد کردن صفحات راهنما و پاپ‌آپ‌ها، دکمه <strong className="text-emerald-400">↵ ENTER</strong> یا <strong className="text-amber-400">START (Space)</strong> وسط گوشی را بزنید.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-stone-300 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span><strong>بازی دونفره:</strong> برای گوشی دوم، کافیست دکمه آبی بالای دسته را بزنید تا به <strong>«بازیکن ۲ (صورتی)»</strong> تبدیل شود.</span>
              </span>
            </div>
          </div>

          {/* Game Profiles Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-yellow-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>پروفایل‌های نگاشت کلیدها برای بازی‌های ویندوز (Key Mappings):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profiles.map((prof) => {
                const isSelected = activeProfile === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => handleSelectProfile(prof.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                        : 'bg-[#12131c] border-stone-800 text-stone-400 hover:border-amber-500/30 hover:text-stone-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${isSelected ? 'text-yellow-300' : 'text-stone-200'}`}>
                          {prof.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-yellow-300 font-bold border border-amber-500/40">
                            فعال
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 leading-5">
                        {prof.desc}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-stone-800 text-[10px] font-mono text-stone-400 space-y-1">
                      <div className="flex justify-between"><span>A / B / X / Y:</span> <span className="text-yellow-400">{prof.mappings['BTN_A']}, {prof.mappings['BTN_B']}, {prof.mappings['BTN_X']}, {prof.mappings['BTN_Y']}</span></div>
                      <div className="flex justify-between"><span>D-Pad:</span> <span className="text-yellow-400">کلیدهای جهت‌نما / WASD</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Signal Monitoring Area */}
          <div className="p-5 rounded-2xl bg-[#12131c] border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>پایش زنده سیگنال‌های دریافتی از گوشی (Live Telemetry):</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                آخرین کلید لمس شده: <strong className="text-yellow-300">{latestInputs.button || 'آماده دریافت'}</strong>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0e0f16] border border-amber-500/20 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-stone-500 block text-[10px]">دکمه لمس شده</span>
                <span className="text-yellow-300 font-mono font-bold text-sm">{latestInputs.button || '—'}</span>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <div>
                <span className="text-stone-500 block text-[10px]">وضعیت (State)</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">{latestInputs.state || 'Idle'}</span>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <div>
                <span className="text-stone-500 block text-[10px]">تاخیر ارتباطی</span>
                <span className="text-yellow-400 font-mono font-bold text-sm">~۲ میلی‌ثانیه</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: TRACKPAD & MOUSE */}
      {activeTabMode === 'trackpad' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#12131c] border border-amber-500/30 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-yellow-300 shadow-lg shadow-amber-500/10">
              <MousePointer className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">تبدیل گوشی به تاچ‌پد بی‌سیم کامپیوتر</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                با باز کردن صفحه روی گوشی، با کشیدن انگشت نشانگر ماوس ویندوز حرکت کرده و با دو انگشت اسکرول انجام می‌شود.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleLaunchOnPhone}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                🚀 باز کردن تاچ‌پد روی گوشی
              </button>
              <a
                href="/gamepad.html"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>تست روی PC</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: PHONE CONTROL FROM PC */}
      {activeTabMode === 'phone_control' && (
        <div className="p-6 rounded-3xl bg-[#12131c] border border-stone-800 space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>ارسال مستقیم کلیدهای کنترلی به گوشی متصل (Android KeyEvents):</span>
            </h3>
            <p className="text-xs text-stone-400">
              با فشردن هر دکمه زیر، سیگنال سخت‌افزاری متناظر مستقیماً روی گوشی اجرا می‌شود:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => handleSendPhoneKey(3, 'خانه (Home)')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">🏠 دکمه خانه (Home)</button>
            <button onClick={() => handleSendPhoneKey(4, 'بازگشت (Back)')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">🔙 بازگشت (Back)</button>
            <button onClick={() => handleSendPhoneKey(187, 'برنامه‌های اخیر (Recents)')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">📑 برنامه‌های اخیر</button>
            <button onClick={() => handleSendPhoneKey(26, 'قفل صفحه (Power)')} className="p-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all">🔒 قفل صفحه (Power)</button>
            <button onClick={() => handleSendPhoneKey(24, 'افزایش صدا')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">🔊 افزایش صدا</button>
            <button onClick={() => handleSendPhoneKey(25, 'کاهش صدا')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">🔉 کاهش صدا</button>
            <button onClick={() => handleSendPhoneKey(164, 'بی‌صدا / Mute')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">🔇 بی‌صدا (Mute)</button>
            <button onClick={() => handleSendPhoneKey(82, 'منو (Menu)')} className="p-3 rounded-xl bg-[#171824] hover:bg-amber-500/20 hover:border-amber-500/40 border border-stone-800 text-xs font-bold text-stone-200 transition-all">📋 دکمه منو</button>
          </div>
        </div>
      )}
    </div>
  );
};
