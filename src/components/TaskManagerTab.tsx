import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Power, 
  Sparkles, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  Play, 
  Square, 
  Layers, 
  BatteryCharging, 
  Clock, 
  Radio, 
  Flame, 
  X,
  Gauge
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface TaskManagerTabProps {
  device: Device | null;
}

interface ProcessItem {
  pid: number;
  packageName: string;
  appName: string;
  ramMb: number;
  cpu: number;
  isSystem: boolean;
  user: string;
  status: string;
}

interface StartupAppItem {
  packageName: string;
  appName: string;
  receiver: string;
  bootEnabled: boolean;
  isSystem: boolean;
  impact: string;
}

interface BackgroundServiceItem {
  packageName: string;
  appName: string;
  serviceCount: number;
  backgroundAllowed: boolean;
  batteryOptimized: boolean;
  ramMb: number;
}

export const TaskManagerTab: React.FC<TaskManagerTabProps> = ({ device }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'startup' | 'background'>('tasks');
  const [tasks, setTasks] = useState<ProcessItem[]>([]);
  const [startupApps, setStartupApps] = useState<StartupAppItem[]>([]);
  const [backgroundServices, setBackgroundServices] = useState<BackgroundServiceItem[]>([]);
  
  const [summary, setSummary] = useState<{ totalCount: number; userCount: number; systemCount: number; totalRamUsedMb: number }>({
    totalCount: 0,
    userCount: 0,
    systemCount: 0,
    totalRamUsedMb: 0
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('all');
  const [sortBy, setSortBy] = useState<'ram' | 'cpu' | 'name'>('ram');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTasks = useCallback(async (showFeedback = false) => {
    if (!device) return;
    if (showFeedback) setIsSyncing(true);
    else setLoading(true);

    try {
      const [tasksRes, startupRes, bgRes] = await Promise.all([
        fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/running`),
        fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/startup`),
        fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/background`)
      ]);

      const [tasksData, startupData, bgData] = await Promise.all([
        tasksRes.json(),
        startupRes.json(),
        bgRes.json()
      ]);

      if (tasksData.success && tasksData.tasks) {
        setTasks(tasksData.tasks);
        if (tasksData.summary) setSummary(tasksData.summary);
      }
      if (startupData.success && startupData.startupApps) {
        setStartupApps(startupData.startupApps);
      }
      if (bgData.success && bgData.backgroundServices) {
        setBackgroundServices(bgData.backgroundServices);
      }

      if (showFeedback) {
        showToast('لیست پردازش‌ها و وضعیت استارت‌آپ مستقیماً از گوشی بازخوانی شد.', 'success');
      }
    } catch (err: any) {
      console.error('Error fetching task manager data:', err);
      if (showFeedback) {
        showToast(`خطا در دریافت اطلاعات: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [device]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleKillProcess = async (item: ProcessItem) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: item.pid, packageName: item.packageName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `پردازش ${item.appName} متوقف شد.`, 'success');
        setTasks(prev => prev.filter(p => p.pid !== item.pid && p.packageName !== item.packageName));
      } else {
        showToast(`خطا: ${data.error || 'عدم دسترسی'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleKillAll = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/kill-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'رم با موفقیت پاکسازی شد.', 'success');
        fetchTasks();
      } else {
        showToast(`خطا: ${data.error || 'عملیات ناموفق بود'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleStartup = async (item: StartupAppItem) => {
    if (!device) return;
    const nextState = !item.bootEnabled;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/startup/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: item.packageName,
          receiver: item.receiver,
          enabled: nextState
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'وضعیت استارت‌آپ تغییر کرد.', 'success');
        setStartupApps(prev => prev.map(a => a.packageName === item.packageName ? { ...a, bootEnabled: nextState } : a));
      } else {
        showToast(`خطا: ${data.error || 'خطا در تغییر وضعیت'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleBackground = async (item: BackgroundServiceItem) => {
    if (!device) return;
    const nextState = !item.backgroundAllowed;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/background/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: item.packageName,
          allowBackground: nextState
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'محدودیت پس‌زمینه تغییر کرد.', 'success');
        setBackgroundServices(prev => prev.map(s => s.packageName === item.packageName ? { ...s, backgroundAllowed: nextState } : s));
      } else {
        showToast(`خطا: ${data.error || 'خطا در اعمال محدودیت'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleBatteryWhitelist = async (item: BackgroundServiceItem) => {
    if (!device) return;
    const nextWhitelist = item.batteryOptimized; // if optimized, whitelist will disable optimization
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/tasks/battery/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: item.packageName,
          whitelist: nextWhitelist
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'وضعیت باتری به‌روزرسانی شد.', 'success');
        setBackgroundServices(prev => prev.map(s => s.packageName === item.packageName ? { ...s, batteryOptimized: !nextWhitelist } : s));
      } else {
        showToast(`خطا: ${data.error || 'خطا در اعمال'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Filter and sort running tasks
  const filteredTasks = tasks
    .filter(t => {
      if (filterType === 'user' && t.isSystem) return false;
      if (filterType === 'system' && !t.isSystem) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return t.appName.toLowerCase().includes(q) || t.packageName.toLowerCase().includes(q) || String(t.pid).includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'ram') return b.ramMb - a.ramMb;
      if (sortBy === 'cpu') return b.cpu - a.cpu;
      return a.appName.localeCompare(b.appName);
    });

  const filteredStartupApps = startupApps.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q);
  });

  const filteredBgServices = backgroundServices.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.appName.toLowerCase().includes(q) || s.packageName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right pb-12" dir="rtl">
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
        title="مدیریت تسک‌ها، پردازش‌های رم و برنامه‌های استارت‌آپ"
        description="مشاهده و بستن پردازش‌های سنگین و فعال گوشی، غیرفعال کردن اجرای خودکار برنامه‌ها هنگام روشن شدن گوشی و کنترل مصرف پس‌زمینه باتری."
        features={[
          "تسک منیجر زنده: پایش پردازش‌های فعال سیستم، میزان مصرف رم و سی‌پی‌یو هر برنامه با امکان بستن اجباری (Force Stop).",
          "مدیریت استارت‌آپ (Auto-Start): جلوگیری از راه‌اندازی خودکار برنامه‌ها پس از روشن شدن گوشی جهت افزایش چشمگیر سرعت بوت و کاهش مصرف باتری.",
          "کنترل سرویس‌های پس‌زمینه: محدودسازی فعالیت برنامه‌ها در پس‌زمینه و مدیریت معافیت از خواب عمیق باتری (Doze Mode)."
        ]}
        tips={[
          "برای آزاد کردن فوری چند گیگابایت رم، از دکمه «بوست و پاکسازی فوری رم» استفاده کنید.",
          "برنامه‌هایی مانند تلگرام و واتساپ در صورت غیرفعال شدن استارت‌آپ، تا زمان باز شدن نوتیفیکیشن دریافت نخواهند کرد."
        ]}
      />

      {/* Header Banner & Live Hardware Stats */}
      <div className="rounded-3xl glass-panel p-6 border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-900/80 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-amber-400" />
              <span>مرکز مدیریت تسک‌ها، استارت‌آپ و پردازش‌ها (Task & Startup Manager)</span>
            </h2>
            <p className="text-xs text-slate-400">
              کنترل جامع پردازش‌های فعال در رم، جلوگیری از اجرای خودکار در بوت گوشی و بهینه‌سازی مصرف باتری
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleKillAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>بوست و پاکسازی فوری رم</span>
            </button>

            <button
              onClick={() => fetchTasks(true)}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="بازخوانی زنده لیست پردازش‌ها از گوشی"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isSyncing ? 'در حال خواندن...' : 'همگام‌سازی زنده'}</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>کل پردازش‌های فعال:</span>
            </div>
            <div className="text-xl font-black text-white font-mono">{summary.totalCount || tasks.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>برنامه‌های کاربر (Apps):</span>
            </div>
            <div className="text-xl font-black text-blue-400 font-mono">{summary.userCount || tasks.filter(t => !t.isSystem).length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>سرویس‌های سیستم:</span>
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">{summary.systemCount || tasks.filter(t => t.isSystem).length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>رم مصرفی کل پردازش‌ها:</span>
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono">{summary.totalRamUsedMb} MB</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'tasks' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>پردازش‌های فعال در رم ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('startup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'startup' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>برنامه‌های استارت‌آپ و بوت ({startupApps.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('background')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'background' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سرویس‌های پس‌زمینه و باتری ({backgroundServices.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی برنامه یا پردازش..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. RUNNING TASKS VIEW                                        */}
      {/* ============================================================ */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters & Sorters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">فیلتر:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  filterType === 'all' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                همه ({tasks.length})
              </button>
              <button
                onClick={() => setFilterType('user')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  filterType === 'user' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                برنامه‌های کاربر ({tasks.filter(t => !t.isSystem).length})
              </button>
              <button
                onClick={() => setFilterType('system')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  filterType === 'system' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                سیستمی ({tasks.filter(t => t.isSystem).length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">مرتب‌سازی:</span>
              <button
                onClick={() => setSortBy('ram')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  sortBy === 'ram' ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                بیشترین رم (RAM)
              </button>
              <button
                onClick={() => setSortBy('cpu')}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  sortBy === 'cpu' ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                بیشترین CPU
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold">
                    <th className="p-4">نام برنامه و پکیج</th>
                    <th className="p-4">شناسه (PID)</th>
                    <th className="p-4">نوع</th>
                    <th className="p-4">مصرف رم (RAM)</th>
                    <th className="p-4">مصرف پردازنده (CPU)</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        هیچ پردازشی با این مشخصات یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => (
                      <tr key={`${t.pid}-${t.packageName}`} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{t.appName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.packageName}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-300 font-bold">{t.pid}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            t.isSystem 
                              ? 'bg-slate-800/80 text-slate-300 border-slate-700' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {t.isSystem ? 'سیستمی' : 'برنامه کاربر'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-cyan-400 font-bold text-sm">
                          {t.ramMb} MB
                        </td>
                        <td className="p-4 font-mono text-amber-400 font-bold">
                          {t.cpu}%
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleKillProcess(t)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
                            title="بستن اجباری این برنامه"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>توقف اجباری</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. STARTUP APPS VIEW                                         */}
      {/* ============================================================ */}
      {activeSubTab === 'startup' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
            <Power className="w-4 h-4 shrink-0" />
            <span>با خاموش کردن تیک هر برنامه، از اجرای خودکار و مصرف منابع گوشی هنگام روشن شدن جلوگیری می‌شود.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStartupApps.map((a) => (
              <div key={a.packageName} className="p-5 rounded-3xl glass-panel border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{a.appName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      a.isSystem ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {a.isSystem ? 'سیستمی' : 'برنامه کاربر'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{a.packageName}</div>
                  <div className="text-[10px] text-slate-500">
                    تاثیر بر سرعت بوت: <span className="text-amber-400 font-bold">{a.impact}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={a.bootEnabled}
                      onChange={() => handleToggleStartup(a)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className={`text-[10px] font-bold ${a.bootEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {a.bootEnabled ? 'اجرای خودکار فعال' : 'غیرفعال و مسدود'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. BACKGROUND SERVICES & BATTERY VIEW                        */}
      {/* ============================================================ */}
      {activeSubTab === 'background' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>مدیریت برنامه‌هایی که در پس‌زمینه سرویس فعال نگه می‌دارند و تنظیم خواب عمیق (Doze Mode) برای افزایش ماندگاری شارژ باتری.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBgServices.map((s) => (
              <div key={s.packageName} className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-sm">{s.appName}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{s.packageName}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-mono font-bold">
                    {s.serviceCount} سرویس فعال
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                  {/* Background Permission Toggle */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[11px]">اجرای پس‌زمینه</div>
                      <div className="text-[9px] text-slate-400">{s.backgroundAllowed ? 'مجاز' : 'محدودشده'}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={s.backgroundAllowed}
                      onChange={() => handleToggleBackground(s)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Battery Optimization Toggle */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-[11px]">خواب عمیق باتری</div>
                      <div className="text-[9px] text-slate-400">{s.batteryOptimized ? 'بهینه‌سازی فعال' : 'فعالیت دائم'}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={s.batteryOptimized}
                      onChange={() => handleToggleBatteryWhitelist(s)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
