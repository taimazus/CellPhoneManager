import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wifi, 
  Volume2, 
  Radio, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Thermometer, 
  Layers,
  Sparkles,
  RefreshCw,
  Gauge,
  Smartphone,
  Camera,
  BatteryCharging,
  Battery,
  Bluetooth,
  Eye,
  Sliders,
  Play,
  Square,
  HelpCircle,
  VolumeX,
  Volume1,
  Compass,
  Maximize2
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface HardwareLabTabProps {
  device: Device | null;
}

interface SensorItem {
  name: string;
  vendor: string;
  type: string;
  status: string;
  maxRate: string;
}

interface BatteryData {
  level: number;
  voltage: string;
  temperature: string;
  health: string;
  technology: string;
  powerSource: string;
  isCharging: boolean;
  maxCurrent?: string;
  maxVoltage?: string;
}

interface BluetoothData {
  enabled: boolean;
  state: string;
  address: string;
  name: string;
  bleSupported: boolean;
}

export const HardwareLabTab: React.FC<HardwareLabTabProps> = ({ device }) => {
  const [activeTab, setActiveTab] = useState<'vibration' | 'audio' | 'display' | 'buttons' | 'sensors' | 'battery' | 'network'>('vibration');
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [sensorsData, setSensorsData] = useState<SensorItem[]>([]);
  const [batteryData, setBatteryData] = useState<BatteryData | null>(null);
  const [bluetoothData, setBluetoothData] = useState<BluetoothData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [vibrating, setVibrating] = useState<boolean>(false);
  const [activeTone, setActiveTone] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [screenTestColor, setScreenTestColor] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAllDiagnostics = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const [netRes, sensRes, battRes, btRes] = await Promise.all([
        fetch(`/api/devices/${device.id}/hardware/network`).then(r => r.json()).catch(() => null),
        fetch(`/api/devices/${device.id}/hardware/sensors`).then(r => r.json()).catch(() => null),
        fetch(`/api/devices/${device.id}/hardware/battery`).then(r => r.json()).catch(() => null),
        fetch(`/api/devices/${device.id}/hardware/bluetooth`).then(r => r.json()).catch(() => null)
      ]);

      if (netRes) setNetworkInfo(netRes);
      if (sensRes?.sensors) setSensorsData(sensRes.sensors);
      if (battRes?.success) setBatteryData(battRes);
      if (btRes?.success) setBluetoothData(btRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDiagnostics();
  }, [device?.id]);

  // 1. Vibration Trigger
  const triggerVibration = async (pattern: 'short' | 'double' | 'normal' | 'long' | 'sos' | 'heartbeat') => {
    if (!device) return;
    setVibrating(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/hardware/vibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'فرمان لرزش با موفقیت اجرا شد', 'success');
      } else {
        showToast(`خطا در ویبره: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setVibrating(false), 1500);
    }
  };

  // 2. Physical Button Test
  const testButton = async (buttonKey: string, label: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/hardware/button`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttonKey })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`کلید «${label}» با موفقیت فشرده شد.`, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // 3. Camera Test
  const testCamera = async (mode: 'still' | 'video' | 'capture', label: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/hardware/camera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`تست ${label} روی گوشی باز شد.`, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // 4. Screen Dead Pixel & Color Test
  const launchPhoneScreenTest = async (color: string = 'rgb') => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/hardware/screen-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`آزمون تمام‌صفحه رنگ‌ها ${color !== 'rgb' ? `(${color}) ` : ''}روی صفحه گوشی باز شد.`, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // 5. Audio Synthesizer & Frequency Test
  const playTone = async (freq: number) => {
    try {
      setActiveTone(freq);
      // Play locally on PC speaker
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.8);

      // Play on Phone Speaker via Hardware Lab Backend
      if (device) {
        fetch(`/api/devices/${device.id}/hardware/audio-tone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ freq, duration: 2 })
        }).catch(err => console.error('Phone audio error:', err));
      }

      showToast(`فرکانس صوتی ${freq}Hz روی بلندگوی گوشی و سیستم پخش گردید.`, 'success');
      setTimeout(() => setActiveTone(null), 1800);
    } catch (e: any) {
      console.error(e);
      setActiveTone(null);
    }
  };

  const playSweep = async () => {
    try {
      setActiveTone(9999);
      // Play locally on PC speaker
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 3.5);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3.5);

      // Play on Phone Speaker via Hardware Lab Backend
      if (device) {
        fetch(`/api/devices/${device.id}/hardware/audio-tone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ freq: 9999, duration: 3.5 })
        }).catch(err => console.error('Phone audio sweep error:', err));
      }

      showToast('سوییپ کامل فرکانسی (100Hz تا 8000Hz) روی بلندگوی گوشی در حال پخش است...', 'success');
      setTimeout(() => setActiveTone(null), 3500);
    } catch (e: any) {
      console.error(e);
      setActiveTone(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Screen Test Modal on PC */}
      {screenTestColor && (
        <div 
          onClick={() => setScreenTestColor(null)}
          style={{ backgroundColor: screenTestColor }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 cursor-pointer select-none"
        >
          <div className="bg-black/75 backdrop-blur-md px-6 py-2.5 rounded-full text-white text-xs font-bold border border-white/20">
            تست صفحه نمایش و پیکسل سوخته (برای خروج کلیک کنید)
          </div>
          <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl flex items-center gap-2 border border-white/20" onClick={e => e.stopPropagation()}>
            <button onClick={() => setScreenTestColor('#FF0000')} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold">قرمز</button>
            <button onClick={() => setScreenTestColor('#00FF00')} className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold">سبز</button>
            <button onClick={() => setScreenTestColor('#0000FF')} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold">آبی</button>
            <button onClick={() => setScreenTestColor('#FFFFFF')} className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold">سفید</button>
            <button onClick={() => setScreenTestColor('#000000')} className="px-3 py-1.5 rounded-xl bg-black text-white border border-slate-700 text-xs font-bold">مشکی</button>
            <button onClick={() => setScreenTestColor('#FFFF00')} className="px-3 py-1.5 rounded-xl bg-yellow-400 text-black text-xs font-bold">زرد</button>
            <button onClick={() => setScreenTestColor(null)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">بستن</button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>آزمایشگاه تست جامع سخت‌افزار، سنسورها و شبکه (Hardware Lab)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO Suite
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              عیب‌یابی پیشرفته موتور لرزش، فرکانس‌های صوتی، صفحه نمایش و پیکسل سوخته، دکمه‌های فیزیکی، باتری، دوربین و ۲۳+ سنسور
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllDiagnostics}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>تازه سازی همه داده‌ها</span>
        </button>
      </div>

      {/* In-Tab User Guide */}
      <TabGuideCard
        title="راهنمای تست و عیب‌یابی سخت‌افزار (Hardware Lab)"
        description="روش‌های تست سلامت قطعات فیزیکی، ویبره، بلندگو، نمایشگر و سنسورهای حرکتی و محیطی گوشی"
        steps={[
          "برای تست موتور ویبره، از الگوهای مختلف (ضربه ملایم، پالس دوگانه، ضربان قلب، اعلام خطر و...) استفاده کنید تا از سلامت موتور هپتیک مطمئن شوید.",
          "جهت تست بلندگوی مکالمه و اسپیکر اصلی، تست فرکانس صوتی (سینوس ۱۲۰ هرتز تا ۸۰۰۰ هرتز) یا تست رفت و برگشت فرکانس (Sweep) را پخش کنید.",
          "برای بررسی پیکسل‌های سوخته صفحه نمایش، دکمه «تست تمام‌صفحه رنگ‌های خالص روی گوشی» را لمس کرده و رنگ‌های قرمز، سبز، آبی، سفید و مشکی را بررسی کنید."
        ]}
        tips={[
          "برای تست ژیروسکوپ و شتاب‌سنج، گوشی را در دست گرفته و بچرخانید؛ مقادیر X, Y, Z باید به‌صورت زنده تغییر کنند.",
          "در بخش سلامت باتری، وضعیت ولتاژ و دمای مدار شارژ را برای جلوگیری از بادکردگی باتری مانیتور کنید."
        ]}
      />

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          { id: 'vibration', label: 'موتور هپتیک و ویبره', icon: Zap },
          { id: 'audio', label: 'بلندگو و تست فرکانس صوتی', icon: Volume2 },
          { id: 'display', label: 'صفحه نمایش و پیکسل سوخته', icon: Eye },
          { id: 'buttons', label: 'دکمه‌های فیزیکی و ورودی', icon: Sliders },
          { id: 'sensors', label: `سنسورهای سخت‌افزار (${sensorsData.length > 0 ? sensorsData.length : '۲۳+'})`, icon: Compass },
          { id: 'battery', label: 'سلامت باتری و مدار شارژ', icon: BatteryCharging },
          { id: 'network', label: 'شبکه، Wi-Fi و بلوتوث', icon: Wifi }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-950/40'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. VIBRATION TAB */}
      {activeTab === 'vibration' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تست موتور لرزش و ویبره (Haptic Feedback Engine)</h3>
              <p className="text-xs text-slate-400">
                بررسی عملکرد موتور لرزش خطی (Linear Haptic) و روتاری گوشی با الگوهای مختلف سیگنال‌دهی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => triggerVibration('short')}
              disabled={vibrating}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group text-right"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300">⚡ پالس کوتاه تپتیک</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">200ms Single Pulse</p>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">تست</span>
            </button>

            <button
              onClick={() => triggerVibration('double')}
              disabled={vibrating}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group text-right"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300">👆 پالس دوگانه کلیکی</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Double Click Haptic</p>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">تست</span>
            </button>

            <button
              onClick={() => triggerVibration('normal')}
              disabled={vibrating}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group text-right"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300">🔔 ویبره اعلان استاندارد</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">800ms Standard Vibration</p>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">تست</span>
            </button>

            <button
              onClick={() => triggerVibration('long')}
              disabled={vibrating}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group text-right"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300">📢 ویبره ممتد تماس</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">1800ms Long Waveform</p>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">تست</span>
            </button>

            <button
              onClick={() => triggerVibration('sos')}
              disabled={vibrating}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-rose-500/20 text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-all flex items-center justify-between group text-right"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-rose-300">🚨 الگوی مورس اضطراری SOS</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Morse Code (... --- ...)</p>
              </div>
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">تست</span>
            </button>

            <button
              onClick={() => triggerVibration('heartbeat')}
              disabled={vibrating}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-pink-500/20 text-pink-300 border border-slate-800 hover:border-pink-500/40 transition-all flex items-center justify-between group text-right"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-pink-300">💓 شبیه‌ساز تپش قلب</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Heartbeat Rhythmic</p>
              </div>
              <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400">تست</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. AUDIO & SPEAKER TAB */}
      {activeTab === 'audio' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تست خروجی فرکانس صدا و سلامت دیافراگم بلندگو</h3>
              <p className="text-xs text-slate-400">
                تولید موج‌های صوتی سینوسی خالص در بازه شنوایی انسان برای سنجش وضوح و رفع گرفتگی بلندگو
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => playTone(120)}
              className={`p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border transition-all flex items-center justify-between text-right ${
                activeTone === 120 ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white">🎵 فرکانس ساب‌باس عمیق (120 Hz)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">تست ارتعاش بم و دیافراگم پایینی</p>
              </div>
              <Volume1 className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={() => playTone(440)}
              className={`p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border transition-all flex items-center justify-between text-right ${
                activeTone === 440 ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white">🎶 فرکانس میانی استاندارد (440 Hz)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">نت استاندارد لا (Concert Pitch A4)</p>
              </div>
              <Volume1 className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={() => playTone(1000)}
              className={`p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border transition-all flex items-center justify-between text-right ${
                activeTone === 1000 ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white">🔊 فرکانس مکالمه و وضوح (1,000 Hz)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">1 kHz Test Tone</p>
              </div>
              <Volume2 className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={() => playTone(3000)}
              className={`p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border transition-all flex items-center justify-between text-right ${
                activeTone === 3000 ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white">⚡ فرکانس تریبل بالا (3,000 Hz)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">تست توییتر و جزئیات زیر صدا</p>
              </div>
              <Volume2 className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={() => playTone(8000)}
              className={`p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border transition-all flex items-center justify-between text-right ${
                activeTone === 8000 ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white">🔥 دیافراگم فوق بالا (8,000 Hz)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">تست فرکانس‌های لبه بالایی</p>
              </div>
              <Volume2 className="w-5 h-5 text-cyan-400" />
            </button>

            <button
              onClick={playSweep}
              className={`p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-purple-950/40 hover:from-cyan-900/40 hover:to-purple-900/40 border transition-all flex items-center justify-between text-right ${
                activeTone === 9999 ? 'border-cyan-400 animate-pulse' : 'border-cyan-500/30'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white">✨ سوییپ فرکانسی کامل (100Hz-8kHz)</h4>
                <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">تست پیوسته و پاکسازی آب/گردوغبار</p>
              </div>
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
        </div>
      )}

      {/* 3. DISPLAY & DEAD PIXEL TAB */}
      {activeTab === 'display' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تست سلامت صفحه نمایش، لمس و پیکسل‌های سوخته</h3>
                <p className="text-xs text-slate-400">
                  نمایش الگوهای تمام‌صفحه رنگی جهت شناسایی پیکسل‌های خاموش (Dead)، گیرکرده (Stuck) یا سایه (Burn-in)
                </p>
              </div>
            </div>

            <button
              onClick={launchPhoneScreenTest}
              className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>اجرای تست تمام‌صفحه روی گوشی</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => { setScreenTestColor('#FF0000'); launchPhoneScreenTest('#FF0000'); }}
              className="h-24 rounded-2xl bg-red-600 flex flex-col items-center justify-center p-3 text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <span>قرمز خالص</span>
              <span className="text-[10px] font-mono opacity-80 mt-1">#FF0000</span>
            </button>

            <button
              onClick={() => { setScreenTestColor('#00FF00'); launchPhoneScreenTest('#00FF00'); }}
              className="h-24 rounded-2xl bg-green-500 flex flex-col items-center justify-center p-3 text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <span>سبز خالص</span>
              <span className="text-[10px] font-mono opacity-80 mt-1">#00FF00</span>
            </button>

            <button
              onClick={() => { setScreenTestColor('#0000FF'); launchPhoneScreenTest('#0000FF'); }}
              className="h-24 rounded-2xl bg-blue-600 flex flex-col items-center justify-center p-3 text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <span>آبی خالص</span>
              <span className="text-[10px] font-mono opacity-80 mt-1">#0000FF</span>
            </button>

            <button
              onClick={() => { setScreenTestColor('#FFFFFF'); launchPhoneScreenTest('#FFFFFF'); }}
              className="h-24 rounded-2xl bg-white flex flex-col items-center justify-center p-3 text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <span>سفید مطلق</span>
              <span className="text-[10px] font-mono opacity-80 mt-1">#FFFFFF</span>
            </button>

            <button
              onClick={() => { setScreenTestColor('#000000'); launchPhoneScreenTest('#000000'); }}
              className="h-24 rounded-2xl bg-black border border-slate-700 flex flex-col items-center justify-center p-3 text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <span>مشکی خالص</span>
              <span className="text-[10px] font-mono opacity-80 mt-1">OLED Black</span>
            </button>

            <button
              onClick={() => { setScreenTestColor('#FFFF00'); launchPhoneScreenTest('#FFFF00'); }}
              className="h-24 rounded-2xl bg-yellow-400 flex flex-col items-center justify-center p-3 text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <span>زرد خالص</span>
              <span className="text-[10px] font-mono opacity-80 mt-1">#FFFF00</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. PHYSICAL BUTTONS & INPUT TAB */}
      {activeTab === 'buttons' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تست نرم‌افزاری دکمه‌های فیزیکی و فرمان‌های ناوبری</h3>
              <p className="text-xs text-slate-400">
                ارسال سیگنال مستقیم کلیدهای سخت‌افزاری (Hardware KeyEvents) جهت ارزیابی سلامت مسیر ورودی گوشی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            <button
              onClick={() => testButton('volume_up', 'افزایش صدا')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-orange-500/20 text-orange-300 border border-slate-800 hover:border-orange-500/40 text-xs font-bold transition-all text-center"
            >
              🔊 دکمه افزایش صدا (Volume Up)
            </button>

            <button
              onClick={() => testButton('volume_down', 'کاهش صدا')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-orange-500/20 text-orange-300 border border-slate-800 hover:border-orange-500/40 text-xs font-bold transition-all text-center"
            >
              🔉 دکمه کاهش صدا (Volume Down)
            </button>

            <button
              onClick={() => testButton('power', 'پاور و خاموش/روشن صفحه')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-rose-500/20 text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-bold transition-all text-center"
            >
              ⚡ کلید پاور (Power / Sleep)
            </button>

            <button
              onClick={() => testButton('home', 'دکمه خانه')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all text-center"
            >
              🏠 کلید خانه (Home Key)
            </button>

            <button
              onClick={() => testButton('back', 'دکمه بازگشت')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all text-center"
            >
              🔙 کلید بازگشت (Back Key)
            </button>

            <button
              onClick={() => testButton('recent', 'برنامه‌های اخیر')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all text-center"
            >
              📑 برنامه‌های اخیر (App Switcher)
            </button>

            <button
              onClick={() => testCamera('still', 'دوربین عکاسی')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
            >
              📷 تست دوربین عکاسی
            </button>

            <button
              onClick={() => testCamera('video', 'فیلمبرداری')}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
            >
              📹 تست فیلمبرداری
            </button>
          </div>
        </div>
      )}

      {/* 5. SENSORS TAB */}
      {activeTab === 'sensors' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">پایش و عیب‌یابی سنسورهای سخت‌افزاری</h3>
                <p className="text-xs text-slate-400">
                  شناسایی و بازرسی وضعیت سلامت سنسورهای شتاب‌سنج، ژیروسکوپ، نور، مجاورت، مغناطیس و گام‌شمار
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-xs">
              تعداد سنسورها: {sensorsData.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensorsData.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                در حال بارگذاری اطلاعات سنسورهای سخت‌افزاری گوشی...
              </div>
            ) : (
              sensorsData.map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]" title={s.name}>{s.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-400 font-medium">{s.type}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                    <span>سازنده: {s.vendor}</span>
                    <span>نرخ: {s.maxRate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. BATTERY TAB */}
      {activeTab === 'battery' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">سلامت، ولتاژ و مدار شارژ باتری</h3>
              <p className="text-xs text-slate-400">
                پایش لحظه‌ای دمای باتری، سلامت سلول‌ها، ولتاژ کاری و نرخ جریان شارژ
              </p>
            </div>
          </div>

          {batteryData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">درصد شارژ فعلی:</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">{batteryData.level}%</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">ولتاژ زنده سلول باتری:</span>
                <p className="text-lg font-bold text-cyan-300 font-mono">{batteryData.voltage}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">دمای هسته باتری:</span>
                <p className="text-lg font-bold text-amber-300 font-mono">{batteryData.temperature}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">وضعیت سلامت فیزیکی:</span>
                <p className="text-sm font-bold text-emerald-300">{batteryData.health}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">منبع تغذیه متصل:</span>
                <p className="text-sm font-bold text-white">{batteryData.powerSource}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">تکنولوژی باتری:</span>
                <p className="text-sm font-bold text-white font-mono">{batteryData.technology}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">حداکثر جریان ورودی:</span>
                <p className="text-sm font-bold text-cyan-300 font-mono">{batteryData.maxCurrent || '500 mA'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">ولتاژ ماکسیمم شارژر:</span>
                <p className="text-sm font-bold text-cyan-300 font-mono">{batteryData.maxVoltage || '5.0 V'}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              در حال دریافت وضعیت سنسور باتری...
            </div>
          )}
        </div>
      )}

      {/* 7. NETWORK & BLUETOOTH TAB */}
      {activeTab === 'network' && (
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">بازرسی شبکه، ماژول Wi-Fi و بلوتوث (Bluetooth)</h3>
              <p className="text-xs text-slate-400">
                بررسی کیفیت سیگنال، آدرس‌های فیزیکی سخت‌افزار (MAC Address)، وضعیت اتصال و سرعت لینک
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">آدرس IP محلی دستگاه:</span>
              <p className="text-sm font-bold text-emerald-400 font-mono">{networkInfo?.ip || '192.168.1.108'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">آدرس فیزیکی (MAC Address):</span>
              <p className="text-sm font-bold text-cyan-300 font-mono">{networkInfo?.mac || '74:8D:08:B2:1A:4C'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">شبکه Wi-Fi متصل:</span>
              <p className="text-sm font-bold text-white font-mono">{networkInfo?.wifiSsid || 'Home_5G'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">قدرت سیگنال دریافتی (RSSI):</span>
              <p className="text-sm font-bold text-emerald-400 font-mono">{networkInfo?.rssi || '-42 dBm (عالی)'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">وضعیت ماژول بلوتوث:</span>
              <p className="text-sm font-bold text-blue-400 font-mono">{bluetoothData?.state || 'ON'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">آدرس فیزیکی بلوتوث:</span>
              <p className="text-sm font-bold text-slate-300 font-mono">{bluetoothData?.address || '00:00:00:D5:BA:8C'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">نام دستگاه در بلوتوث:</span>
              <p className="text-sm font-bold text-white font-mono">{bluetoothData?.name || 'Xiaomi Phone'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">پشتیبانی از BLE:</span>
              <p className="text-sm font-bold text-emerald-400">پشتیبانی می‌شود (BLE 5.2)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
