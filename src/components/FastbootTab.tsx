import React, { useState } from 'react';
import { 
  Zap, 
  Flame, 
  RotateCcw, 
  Unlock, 
  Lock, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  ShieldAlert,
  HardDrive,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Device } from '../types';

interface FastbootTabProps {
  device: Device | null;
}

export const FastbootTab: React.FC<FastbootTabProps> = ({ device }) => {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPartition, setSelectedPartition] = useState<string>('boot');
  const [customFastbootCmd, setCustomFastbootCmd] = useState<string>('getvar all');

  const runFastboot = async (command: string) => {
    setLoading(true);
    setOutput(`در حال اجرای: fastboot ${command}...`);
    try {
      const res = await fetch('/api/fastboot/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.success || data.stdout) {
        setOutput(data.stdout || data.stderr || 'دستور با موفقیت پایان یافت.');
      } else {
        setOutput(`خطا: ${data.stderr || data.error || 'دستگاه در حالت Fastboot یافت نشد'}`);
      }
    } catch (err: any) {
      setOutput(`خطای ارتباطی: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const rebootTo = async (mode: string) => {
    if (!device) return;
    if (!confirm(`آیا از راه‌اندازی دستگاه در حالت ${mode} اطمینان دارید؟`)) return;
    try {
      await fetch(`/api/devices/${device.id}/control/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reboot', mode, type: device.type })
      });
      setOutput(`دستور راه‌اندازی مجدد به ${mode} ارسال شد.`);
    } catch (err: any) {
      setOutput(`خطا: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400" />
            <span>جعبه‌ابزار تخصصی فلشینگ و فست‌بوت (Fastboot Toolkit)</span>
          </h2>
          <p className="text-xs text-slate-400">
            فلش ایمیج‌های بوت، ریکاوری (TWRP/OrangeFox)، بررسی وضعیت بوت‌لودر و ریبوت پیشرفته
          </p>
        </div>

        <button
          onClick={() => runFastboot('devices')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>بررسی دستگاه‌های متصل در Fastboot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Advanced Reboot Modes */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <span>راه‌اندازی مجدد در حالت‌های ویژه (Advanced Reboots)</span>
          </h3>
          <p className="text-xs text-slate-400">
            انتقال مستقیم گوشی به حالت‌های نرم‌افزاری و تعمیراتی با یک کلیک:
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => rebootTo('bootloader')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-semibold text-xs transition-all text-center"
            >
              🔄 ریبوت به Bootloader / Fastboot
            </button>
            <button
              onClick={() => rebootTo('recovery')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-300 font-semibold text-xs transition-all text-center"
            >
              🛠️ ریبوت به ریکاوری (Recovery)
            </button>
            <button
              onClick={() => rebootTo('fastbootd')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 font-semibold text-xs transition-all text-center"
            >
              ⚡ ریبوت به FastbootD (داینامیک)
            </button>
            <button
              onClick={() => rebootTo('edl')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 font-semibold text-xs transition-all text-center"
            >
              🔥 ریبوت به EDL (کوالکام ۹۰۰۸)
            </button>
          </div>
        </div>

        {/* 2. Bootloader & Fastboot Info */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Unlock className="w-5 h-5 text-emerald-400" />
            <span>بررسی وضعیت بوت‌لودر و متغیرها</span>
          </h3>
          <p className="text-xs text-slate-400">
            استخراج اطلاعات کامل سخت‌افزار، اسلات‌های فعال (Slot A/B) و وضعیت قفل بوت‌لودر:
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => runFastboot('getvar unlocked')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 font-semibold text-xs transition-all text-center"
            >
              🔓 وضعیت آنلاک بوت‌لودر
            </button>
            <button
              onClick={() => runFastboot('getvar current-slot')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 font-semibold text-xs transition-all text-center"
            >
              🔀 بررسی اسلات فعال (A / B)
            </button>
            <button
              onClick={() => runFastboot('getvar product')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-300 font-semibold text-xs transition-all text-center"
            >
              📱 مدل محصول (Product Name)
            </button>
            <button
              onClick={() => runFastboot('getvar all')}
              className="p-3 rounded-xl bg-slate-900 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-semibold text-xs transition-all text-center"
            >
              📋 استخراج تمام متغیرها (getvar all)
            </button>
          </div>
        </div>
      </div>

      {/* Fastboot Custom Command & Output Terminal */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <span>ترمینال مستقیم Fastboot CLI</span>
        </h3>
        
        <div className="flex gap-2">
          <span className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 flex items-center">
            fastboot
          </span>
          <input
            type="text"
            value={customFastbootCmd}
            onChange={(e) => setCustomFastbootCmd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runFastboot(customFastbootCmd)}
            placeholder="دستور فست‌بوت (مثال: reboot یا oem device-info)"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={() => runFastboot(customFastbootCmd)}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
          >
            اجرا
          </button>
        </div>

        {output && (
          <pre className="bg-[#050914] p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap">
            {output}
          </pre>
        )}
      </div>
    </div>
  );
};
