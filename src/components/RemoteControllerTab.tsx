import React, { useState } from 'react';
import { 
  Gamepad2, 
  MousePointer, 
  Tv, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Maximize2, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Sliders,
  Radio
} from 'lucide-react';
import { Device } from '../types';

interface RemoteControllerTabProps {
  device: Device | null;
}

export const RemoteControllerTab: React.FC<RemoteControllerTabProps> = ({ device }) => {
  const [mode, setMode] = useState<'gamepad' | 'mouse' | 'presenter'>('gamepad');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendKey = async (keycode: number, name = 'کلید') => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/control/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'key', keycode, type: device.type })
      });
      showToast(`فرمان ${name} ارسال شد.`, 'success');
    } catch {
      // quiet
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-cyan-400" />
            <span>تبدیل گوشی به دسته بازی، ماوس و تاچ‌پد کامپیوتر (Remote Gamepad & Trackpad)</span>
          </h2>
          <p className="text-xs text-slate-400">
            استفاده از گوشی به عنوان گیم‌پد ایکس‌باکس/پلی‌استیشن برای بازی‌های کامپیوتر، تاچ‌پد بی‌سیم و کنترلر ارائه‌ها
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setMode('gamepad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'gamepad' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>دسته بازی (Gamepad)</span>
          </button>
          <button
            onClick={() => setMode('mouse')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'mouse' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>تاچ‌پد و ماوس (Mouse)</span>
          </button>
          <button
            onClick={() => setMode('presenter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'presenter' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>کنترلر پرزنتیشن</span>
          </button>
        </div>
      </div>

      {/* In-Tab User Guide */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-cyan-400">
          <Sliders className="w-4 h-4" />
          <span>نحوه عملکرد کلیدهای گیم‌پد و کنترلر روی گوشی:</span>
        </div>
        <p>
          این دکمه‌ها وابسته به مختصات لمسی خاصی روی صفحه نیستند؛ بلکه کدهای سخت‌افزاری استاندارد گیم‌پد اندروید (Android KeyEvents نظیر DPAD_UP، DPAD_DOWN، BUTTON_A، BUTTON_B و...) را به گوشی ارسال می‌کنند.
        </p>
        <p className="text-[11px] text-slate-400">
          🎮 **کاربرد:** در تمام بازی‌های سازگار با دسته (مانند بازی‌های ریسینگ، فیفا، Call of Duty، شبیه‌سازهای کنسول PPSSPP / RetroArch) و منوهای اندروید، با زدن هر جهت یا دکمه، بازی دقیقاً مثل یک کنترلر واقعی واکنش نشان می‌دهد. چنانچه بازی شما لمسی خالص است، از تب **«نمایش و کنترل زنده»** مستقیماً روی تصویر گوشی کلیک کنید.
        </p>
      </div>

      {/* Main Mode Content */}
      {mode === 'gamepad' && (
        <div className="rounded-3xl glass-panel p-8 border border-amber-500/20 space-y-8 bg-gradient-to-b from-[#14151b] to-[#0c0d11]">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-4">
            <span className="font-bold text-cyan-400">طرح استاندارد کنترلر بازی (Gaming Layout)</span>
            <span>ارسال مستقیم سیگنال‌های سخت‌افزاری به بازی‌ها</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-4xl mx-auto" dir="ltr">
            {/* D-Pad (Left) */}
            <div className="flex flex-col items-center space-y-2" dir="ltr">
              <button
                onClick={() => handleSendKey(19, 'جهت بالا D-Pad')}
                className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-cyan-500/20 active:bg-cyan-500 active:text-slate-950 border border-slate-700 text-slate-200 font-bold shadow-lg transition-all"
              >
                ▲
              </button>
              <div className="flex gap-2" dir="ltr">
                <button
                  onClick={() => handleSendKey(21, 'جهت چپ D-Pad')}
                  className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-cyan-500/20 active:bg-cyan-500 active:text-slate-950 border border-slate-700 text-slate-200 font-bold shadow-lg transition-all"
                  title="جهت چپ (Left)"
                >
                  ◀
                </button>
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  D-PAD
                </div>
                <button
                  onClick={() => handleSendKey(22, 'جهت راست D-Pad')}
                  className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-cyan-500/20 active:bg-cyan-500 active:text-slate-950 border border-slate-700 text-slate-200 font-bold shadow-lg transition-all"
                  title="جهت راست (Right)"
                >
                  ▶
                </button>
              </div>
              <button
                onClick={() => handleSendKey(20, 'جهت پایین D-Pad')}
                className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-cyan-500/20 active:bg-cyan-500 active:text-slate-950 border border-slate-700 text-slate-200 font-bold shadow-lg transition-all"
              >
                ▼
              </button>
            </div>

            {/* Center Controls: Select / Start */}
            <div className="flex flex-col items-center justify-center space-y-4" dir="rtl">
              <div className="flex gap-3">
                <button
                  onClick={() => handleSendKey(82, 'Menu / Select')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700"
                >
                  SELECT
                </button>
                <button
                  onClick={() => handleSendKey(3, 'Home / Start')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700"
                >
                  START
                </button>
              </div>
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-[11px] text-slate-400">
                مناسب برای بازی‌های ریسینگ، FIFA، اکشن و شبیه‌سازها
              </div>
            </div>

            {/* ABXY Action Buttons (Right) */}
            <div className="flex flex-col items-center space-y-2" dir="ltr">
              <button
                onClick={() => handleSendKey(100, 'دکمه Y (مثلث)')}
                className="w-16 h-16 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 active:text-slate-950 border border-amber-500/40 font-black text-lg shadow-lg transition-all"
              >
                Y
              </button>
              <div className="flex gap-2" dir="ltr">
                <button
                  onClick={() => handleSendKey(99, 'دکمه X (مربع)')}
                  className="w-16 h-16 rounded-full bg-blue-500/20 hover:bg-blue-500 text-blue-300 active:text-slate-950 border border-blue-500/40 font-black text-lg shadow-lg transition-all"
                >
                  X
                </button>
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  ABXY
                </div>
                <button
                  onClick={() => handleSendKey(97, 'دکمه B (دایره)')}
                  className="w-16 h-16 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 active:text-slate-950 border border-rose-500/40 font-black text-lg shadow-lg transition-all"
                >
                  B
                </button>
              </div>
              <button
                onClick={() => handleSendKey(96, 'دکمه A (ضربدر)')}
                className="w-16 h-16 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 active:text-slate-950 border border-emerald-500/40 font-black text-lg shadow-lg transition-all"
              >
                A
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'mouse' && (
        <div className="rounded-3xl glass-panel p-8 border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white">تاچ‌پد و ماوس بی‌سیم</h3>
          <div className="h-64 rounded-3xl bg-slate-900/90 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 cursor-crosshair">
            <MousePointer className="w-10 h-10 text-cyan-400 mb-2 animate-pulse" />
            <p className="text-sm font-bold text-slate-300">محیط تاچ‌پد لمسی (Virtual Trackpad Surface)</p>
            <p className="text-xs text-slate-500 mt-1">حرکت موس و اسکرول دو‌انگشتی</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSendKey(66, 'کلیک چپ Enter')}
              className="py-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold text-white shadow-lg active:scale-95"
            >
              کلیک چپ (Left Click)
            </button>
            <button
              onClick={() => handleSendKey(82, 'کلیک راست Menu')}
              className="py-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold text-white shadow-lg active:scale-95"
            >
              کلیک راست (Right Click)
            </button>
          </div>
        </div>
      )}

      {mode === 'presenter' && (
        <div className="rounded-3xl glass-panel p-8 border border-slate-800 space-y-6 text-center max-w-xl mx-auto">
          <h3 className="text-base font-bold text-white">ریموت پرزنتیشن پاورپوینت (PowerPoint Presenter)</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSendKey(21, 'اسلاید قبلی')}
              className="py-8 rounded-3xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white border border-slate-700 shadow-xl active:scale-95 flex flex-col items-center justify-center gap-2"
            >
              <SkipBack className="w-8 h-8 text-cyan-400" />
              <span>اسلاید قبلی</span>
            </button>
            <button
              onClick={() => handleSendKey(22, 'اسلاید بعدی')}
              className="py-8 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-lg font-black shadow-xl active:scale-95 flex flex-col items-center justify-center gap-2"
            >
              <SkipForward className="w-8 h-8 fill-slate-950" />
              <span>اسلاید بعدی</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
