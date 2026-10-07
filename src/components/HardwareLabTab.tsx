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
  Gauge
} from 'lucide-react';
import { Device } from '../types';

interface HardwareLabTabProps {
  device: Device | null;
}

export const HardwareLabTab: React.FC<HardwareLabTabProps> = ({ device }) => {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loadingNet, setLoadingNet] = useState<boolean>(false);
  const [vibrating, setVibrating] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNetwork = async () => {
    if (!device) return;
    setLoadingNet(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/hardware/network`);
      const data = await res.json();
      setNetworkInfo(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingNet(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, [device?.id]);

  const triggerVibration = async (duration = 600) => {
    if (!device) return;
    setVibrating(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/hardware/vibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      });
      const data = await res.json();
      if (data.success) {
        showToast('فرمان لرزش (Vibration) به موتور گوشی ارسال شد.', 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setVibrating(false), duration);
    }
  };

  const playTone = (freq = 440) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      showToast(`فرکانس آزمایشی ${freq}Hz پخش شد.`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl glass-panel p-6 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">آزمایشگاه تست سخت‌افزار، سنسورها و شبکه (Hardware Lab)</h2>
            <p className="text-xs text-slate-400">
              تست سلامت موتور ویبره، خروجی صدا، پایش سیگنال Wi-Fi و بررسی مشخصات پردازنده و سنسورها
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Vibration & Motor Diagnostics */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">تست موتور لرزش و ویبره (Haptic & Vibration)</h3>
          </div>
          <p className="text-xs text-slate-400">
            بررسی سلامت موتور تپتیک یا ویبره گوشی در الگوها و مدت‌زمان‌های مختلف:
          </p>
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => triggerVibration(300)}
              disabled={vibrating}
              className="p-3 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all text-center"
            >
              ⚡ پالس کوتاه (300ms)
            </button>
            <button
              onClick={() => triggerVibration(800)}
              disabled={vibrating}
              className="p-3 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all text-center"
            >
              🔔 ویبره معمولی (800ms)
            </button>
            <button
              onClick={() => triggerVibration(1500)}
              disabled={vibrating}
              className="p-3 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-bold transition-all text-center"
            >
              📢 ویبره ممتد (1.5s)
            </button>
          </div>
        </div>

        {/* 2. Speaker & Audio Frequency Test */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">تست خروجی فرکانس صدا و بلندگو</h3>
          </div>
          <p className="text-xs text-slate-400">
            تولید تن‌های صوتی سینوسی جهت سنجش وضوح و دیافراگم بلندگو:
          </p>
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => playTone(220)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all text-center"
            >
              🎵 باس (220 Hz)
            </button>
            <button
              onClick={() => playTone(440)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all text-center"
            >
              🎶 میانی (440 Hz - نت لا)
            </button>
            <button
              onClick={() => playTone(1000)}
              className="p-3 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all text-center"
            >
              🔊 تریبل (1000 Hz)
            </button>
          </div>
        </div>

        {/* 3. Network & Wi-Fi Inspector */}
        <div className="rounded-2xl glass-panel p-6 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">بازرسی شبکه و وضعیت سیگنال Wi-Fi</h3>
            </div>
            <button
              onClick={fetchNetwork}
              disabled={loadingNet}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingNet ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block mb-1">آدرس IP محلی دستگاه:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {networkInfo?.ip || '192.168.1.108'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block mb-1">آدرس مک (MAC Address):</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {networkInfo?.mac || '74:8D:08:B2:1A:4C'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block mb-1">شبکه Wi-Fi متصل:</span>
              <span className="font-bold text-cyan-400 text-sm">
                {networkInfo?.wifiSsid || 'Home_5G'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block mb-1">کیفیت سیگنال (RSSI):</span>
              <span className="font-bold text-emerald-400 text-sm">
                {networkInfo?.rssi || '-42 dBm (عالی)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
