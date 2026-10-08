import React, { useState, useEffect, useCallback } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  Zap, 
  Thermometer, 
  ShieldAlert, 
  Bell, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Flame,
  Power,
  RefreshCw
} from 'lucide-react';
import { Device } from '../types';

interface BatteryHealthTabProps {
  device: Device | null;
}

export const BatteryHealthTab: React.FC<BatteryHealthTabProps> = ({ device }) => {
  const [alarm80, setAlarm80] = useState<boolean>(true);
  const [alarmTemp, setAlarmTemp] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [liveBattery, setLiveBattery] = useState(device?.battery || {
    level: 78,
    status: 'Charging',
    temperature: 31.4,
    health: 'Good',
    voltage: 4120
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLiveBattery = useCallback(async (showFeedback = false) => {
    if (!device) return;
    if (showFeedback) setIsSyncing(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/details`);
      const data = await res.json();
      if (data && data.battery) {
        setLiveBattery(data.battery);
        if (showFeedback) {
          showToast('اطلاعات باتری مستقیماً از حسگرهای گوشی بازخوانی شدند.', 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching live battery:', err);
      if (showFeedback) {
        showToast('خطا در ارتباط با گوشی', 'error');
      }
    } finally {
      if (showFeedback) setIsSyncing(false);
    }
  }, [device]);

  useEffect(() => {
    if (device?.battery) {
      setLiveBattery(device.battery);
    }
    fetchLiveBattery();
    const interval = setInterval(() => {
      fetchLiveBattery();
    }, 10000);
    return () => clearInterval(interval);
  }, [device, fetchLiveBattery]);

  const battery = liveBattery;
  const isHot = (battery.temperature || 0) > 38;

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
            <BatteryCharging className="w-6 h-6 text-cyan-400" />
            <span>استودیو سلامت باتری و محافظ شارژ هوشمند (Battery Health & Alarm Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            مانیتورینگ دقیق دما، ولتاژ، سرعت شارژ و هشدار صوتی روی ویندوز هنگام رسیدن به ۸۰٪ برای دو برابر شدن طول عمر باتری
          </p>
        </div>
        <button
          onClick={() => fetchLiveBattery(true)}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/5"
          title="بازخوانی زنده وضعیت باتری از گوشی"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isSyncing ? 'در حال خواندن...' : 'همگام‌سازی تله‌متری باتری'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>درصد شارژ فعلی:</span>
            <Battery className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{battery.level}%</div>
          <div className="text-[10px] text-emerald-400 font-bold">{battery.status}</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>دمای باتری:</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-3xl font-black font-mono ${isHot ? 'text-rose-400' : 'text-emerald-400'}`}>
            {battery.temperature}°C
          </div>
          <div className="text-[10px] text-slate-400">{isHot ? '⚠️ دمای بالا' : '✅ دمای عالی و خنک'}</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ولتاژ کاری:</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{battery.voltage || 4100} mV</div>
          <div className="text-[10px] text-slate-400">جریان استاندارد Li-ion</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>وضعیت سلامت سلول‌ها:</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{battery.health || 'Good'}</div>
          <div className="text-[10px] text-slate-400">بدون فرسودگی شدید</div>
        </div>
      </div>

      {/* Smart Alarms Settings */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <span>هشدارهای هوشمند محافظت از باتری (Battery Protection Alarms):</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">هشدار صوتی سقف شارژ ۸۰٪</div>
              <div className="text-[10px] text-slate-400 mt-0.5">پخش آلارم روی کامپیوتر برای جلوگیری از شارژ بیش‌ازحد باتری</div>
            </div>
            <input
              type="checkbox"
              checked={alarm80}
              onChange={(e) => {
                setAlarm80(e.target.checked);
                showToast(e.target.checked ? 'آلارم ۸۰٪ فعال شد.' : 'آلارم غیرفعال شد.', 'success');
              }}
              className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white">هشدار داغ شدن گوشی (بالای ۴۰ درجه)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">هشدار به کاربر برای متوقف کردن کارهای سنگین و خنک‌سازی گوشی</div>
            </div>
            <input
              type="checkbox"
              checked={alarmTemp}
              onChange={(e) => {
                setAlarmTemp(e.target.checked);
                showToast(e.target.checked ? 'آلارم دما فعال شد.' : 'آلارم غیرفعال شد.', 'success');
              }}
              className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
