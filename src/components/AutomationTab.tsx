import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Circle, 
  Repeat, 
  Clock, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Zap, 
  MousePointer, 
  Keyboard, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Sliders
} from 'lucide-react';
import { Device } from '../types';

interface AutomationTabProps {
  device: Device | null;
}

interface MacroAction {
  id: string;
  type: 'tap' | 'swipe' | 'key' | 'text' | 'delay';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  keycode?: number;
  text?: string;
  duration?: number;
  delay?: number;
}

export const AutomationTab: React.FC<AutomationTabProps> = ({ device }) => {
  const [actions, setActions] = useState<MacroAction[]>([
    { id: '1', type: 'tap', x: 540, y: 1200, delay: 500 },
    { id: '2', type: 'delay', duration: 1000 },
    { id: '3', type: 'swipe', x1: 540, y1: 1800, x2: 540, y2: 600, duration: 300, delay: 500 }
  ]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [repeatCount, setRepeatCount] = useState<number>(5);
  const [speed, setSpeed] = useState<number>(1);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartRecord = async () => {
    if (!device) return;
    setIsRecording(true);
    await fetch(`/api/devices/${device.id}/automation/record/start`, { method: 'POST' });
    showToast('ضبط ماکرو آغاز شد. اکنون لمس‌های روی صفحه گوشی ذخیره می‌شوند.', 'success');
  };

  const handleStopRecord = async () => {
    if (!device) return;
    setIsRecording(false);
    const res = await fetch(`/api/devices/${device.id}/automation/record/stop`, { method: 'POST' });
    const data = await res.json();
    if (data.actions && data.actions.length > 0) {
      setActions(data.actions.map((a: any, idx: number) => ({ id: String(idx + 1), ...a })));
      showToast(`ماکرو با ${data.actions.length} عملیات ضبط و ذخیره گردید.`, 'success');
    } else {
      showToast('هیچ لمسی در بازه ضبط ثبت نشد.', 'error');
    }
  };

  const handlePlayMacro = async () => {
    if (!device || actions.length === 0) return;
    setIsPlaying(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/automation/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions, repeat: repeatCount, speed })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در اجرای ماکرو: ${err.message}`, 'error');
    } finally {
      setIsPlaying(false);
    }
  };

  const handleStopMacro = async () => {
    if (!device) return;
    await fetch(`/api/devices/${device.id}/automation/stop`, { method: 'POST' });
    setIsPlaying(false);
    showToast('اجرای ماکرو متوقف گردید.', 'success');
  };

  const handleAddAction = (type: MacroAction['type']) => {
    const newAct: MacroAction = {
      id: String(Date.now()),
      type,
      x: type === 'tap' ? 540 : undefined,
      y: type === 'tap' ? 960 : undefined,
      x1: type === 'swipe' ? 540 : undefined,
      y1: type === 'swipe' ? 1600 : undefined,
      x2: type === 'swipe' ? 540 : undefined,
      y2: type === 'swipe' ? 400 : undefined,
      duration: type === 'delay' ? 1000 : 300,
      delay: 500,
      text: type === 'text' ? 'سلام' : undefined
    };
    setActions([...actions, newAct]);
  };

  const handleDeleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const handleExportMacro = () => {
    const jsonStr = JSON.stringify(actions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Macro_${Date.now()}.json`;
    a.click();
    showToast('فایل ماکرو دانلود شد.', 'success');
  };

  // Presets
  const applyPreset = (preset: 'autotap' | 'tiktok' | 'unlock') => {
    if (preset === 'autotap') {
      setActions([
        { id: '1', type: 'tap', x: 540, y: 1100, delay: 100 },
        { id: '2', type: 'tap', x: 540, y: 1100, delay: 100 },
        { id: '3', type: 'tap', x: 540, y: 1100, delay: 100 }
      ]);
      setRepeatCount(50);
      setSpeed(2);
      showToast('پریست اتوکلیکر سریع اعمال شد.', 'success');
    } else if (preset === 'tiktok') {
      setActions([
        { id: '1', type: 'delay', duration: 4000 },
        { id: '2', type: 'swipe', x1: 540, y1: 1700, x2: 540, y2: 400, duration: 250, delay: 500 }
      ]);
      setRepeatCount(20);
      showToast('پریست اسکرول خودکار ریلز/تیک‌تاک اعمال شد.', 'success');
    } else if (preset === 'unlock') {
      setActions([
        { id: '1', type: 'key', keycode: 26, delay: 500 }, // Power
        { id: '2', type: 'swipe', x1: 540, y1: 1800, x2: 540, y2: 600, duration: 200, delay: 800 }
      ]);
      setRepeatCount(1);
      showToast('پریست روشن کردن و بازگشایی قفل صفحه اعمال شد.', 'success');
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
            <Zap className="w-6 h-6 text-cyan-400" />
            <span>استودیو اتوماسیون، ضبط ماکرو و اتوکلیکر (Macro & Automation Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            ضبط لمس‌ها، حرکات اسکرول، تایپ و اجرای خودکار به صورت لوپ بی‌نهایت با سرعت دلخواه برای بازی‌ها و وظایف تکراری
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              onClick={handleStartRecord}
              disabled={isPlaying}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Circle className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>ضبط ماکرو</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecord}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 animate-pulse active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>توقف ضبط ({actions.length})</span>
            </button>
          )}

          {!isPlaying ? (
            <button
              onClick={handlePlayMacro}
              disabled={isRecording || actions.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>اجرای ماکرو ({repeatCount} بار)</span>
            </button>
          ) : (
            <button
              onClick={handleStopMacro}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-600/40 animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>توقف اجرای ماکرو</span>
            </button>
          )}
        </div>
      </div>

      {/* Presets & Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Execution Settings & Presets */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">تنظیمات اجرای خودکار</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Repeat Count */}
            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1.5">
                <span>تعداد دفعات تکرار (Loops):</span>
                <span className="font-mono text-cyan-400">{repeatCount} بار</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={repeatCount}
                onChange={(e) => setRepeatCount(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Speed Multiplier */}
            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1.5">
                <span>سرعت اجرا (Speed Multiplier):</span>
                <span className="font-mono text-emerald-400">{speed}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      speed === s ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>پریست‌های آماده پرکاربرد:</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => applyPreset('autotap')}
                className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-right transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">اتوکلیکر سریع (Auto Tapper)</div>
                  <div className="text-[10px] text-slate-500">کلیک‌های متوالی با تاخیر 100 میلی‌ثانیه برای بازی‌ها</div>
                </div>
                <Zap className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => applyPreset('tiktok')}
                className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-right transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">اسکرول خودکار Reels / Shorts</div>
                  <div className="text-[10px] text-slate-500">اسکرول هر ۴ ثانیه به ویدیوی بعدی اینستاگرام و یوتیوب</div>
                </div>
                <Repeat className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => applyPreset('unlock')}
                className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-right transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">بازگشایی و روشن کردن صفحه</div>
                  <div className="text-[10px] text-slate-500">فشردن دکمه پاور و کشیدن صفحه به بالا</div>
                </div>
                <MousePointer className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 2-Cols: Actions Sequence Editor */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">مراحل و اکشن‌های ماکرو ({actions.length})</h3>
              </div>

              {/* Add actions bar */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddAction('tap')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 text-xs font-bold flex items-center gap-1"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>+ لمس (Tap)</span>
                </button>
                <button
                  onClick={() => handleAddAction('swipe')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 text-xs font-bold flex items-center gap-1"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>+ اسکرول</span>
                </button>
                <button
                  onClick={() => handleAddAction('delay')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 text-xs font-bold flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>+ مکث</span>
                </button>
                <button
                  onClick={handleExportMacro}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                  title="دانلود فایل ماکرو"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* List of actions */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {actions.map((act, index) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 font-mono font-bold text-cyan-400 flex items-center justify-center text-[11px]">
                      {index + 1}
                    </span>

                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {act.type === 'tap' && <span>لمس نقطه X:{act.x}, Y:{act.y}</span>}
                        {act.type === 'swipe' && <span>اسکرول از ({act.x1},{act.y1}) به ({act.x2},{act.y2})</span>}
                        {act.type === 'delay' && <span>مکث به مدت {act.duration} میلی‌ثانیه</span>}
                        {act.type === 'key' && <span>فشردن کلید کد {act.keycode}</span>}
                        {act.type === 'text' && <span>تایپ متن: "{act.text}"</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        تاخیر بعد از عملیات: {act.delay || 300}ms
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAction(act.id)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
