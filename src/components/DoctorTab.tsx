import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Smartphone, 
  HelpCircle, 
  Apple, 
  Bot, 
  Copy, 
  Sparkles,
  Trash2,
  Zap,
  Eye,
  FileText,
  Package,
  FolderMinus,
  Activity,
  AlertTriangle,
  Sliders,
  Wrench,
  Flame,
  Check,
  RotateCw,
  HardDrive
} from 'lucide-react';
import { ToolStatus, Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface DoctorTabProps {
  device?: Device | null;
}

interface JunkCategory {
  id: string;
  name: string;
  size: string;
  count: number;
  desc: string;
}

interface DiagnosticItem {
  id: string;
  name: string;
  status: 'optimal' | 'warning' | 'critical';
  title: string;
  desc: string;
}

export const DoctorTab: React.FC<DoctorTabProps> = ({ device }) => {
  const [activeSection, setActiveSection] = useState<'cleaner' | 'repair' | 'drivers'>('cleaner');
  
  // Cleaner State
  const [junkData, setJunkData] = useState<{ totalJunkSize: string; categories: JunkCategory[] } | null>(null);
  const [scanningJunk, setScanningJunk] = useState<boolean>(false);
  const [cleaningJunk, setCleaningJunk] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);

  // Health & Auto-Repair State
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [healthScore, setHealthScore] = useState<number>(88);
  const [repairingAction, setRepairingAction] = useState<string | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);

  // Host Drivers State
  const [tools, setTools] = useState<Record<string, ToolStatus>>({});
  const [loadingTools, setLoadingTools] = useState<boolean>(false);
  const [installingTool, setInstallingTool] = useState<string | null>(null);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Scan Junk
  const scanJunkFiles = async () => {
    if (!device) return;
    setScanningJunk(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/system/junk/scan`);
      const data = await res.json();
      if (data.success) {
        setJunkData(data);
        showToast(`اسکن پایان یافت: ${data.totalJunkSize} فایل اضافی شناسایی شد`, 'success');
      } else {
        showToast(`خطا در اسکن: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setScanningJunk(false);
    }
  };

  // 2. Clean Junk
  const cleanJunkFiles = async () => {
    if (!device) return;
    setCleaningJunk(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/system/junk/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selectedCategories })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'پاکسازی با موفقیت انجام شد!', 'success');
        scanJunkFiles();
      } else {
        showToast(`خطا در پاکسازی: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setCleaningJunk(false);
    }
  };

  // 3. Fetch Health Diagnostics
  const fetchHealthDiagnostics = async () => {
    if (!device) return;
    setLoadingHealth(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/system/diagnostics/health`);
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.diagnostics);
        setHealthScore(data.healthScore || 85);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHealth(false);
    }
  };

  // 4. Perform Repair Action
  const handleRepair = async (action: string, label: string) => {
    if (!device) return;
    setRepairingAction(action);
    try {
      const res = await fetch(`/api/devices/${device.id}/system/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `تعمیر «${label}» با موفقیت انجام شد!`, 'success');
        fetchHealthDiagnostics();
      } else {
        showToast(`خطا در تعمیر: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setRepairingAction(null);
    }
  };

  // 5. Driver Tools Status
  const fetchToolStatus = async () => {
    setLoadingTools(true);
    try {
      const res = await fetch('/api/tools/status');
      const data = await res.json();
      if (data.tools) {
        setTools(data.tools);
      }
    } catch (err) {
      console.error('Error fetching tool status:', err);
    } finally {
      setLoadingTools(false);
    }
  };

  const handleInstallTool = async (toolId: string) => {
    setInstallingTool(toolId);
    setInstallLogs([`در حال آماده‌سازی برای نصب یا پیکربندی ${toolId}...`]);
    try {
      const res = await fetch('/api/tools/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId })
      });
      const data = await res.json();
      if (data.success) {
        setInstallLogs((prev) => [...prev, data.message || 'عملیات با موفقیت تکمیل شد!']);
        fetchToolStatus();
      } else {
        setInstallLogs((prev) => [...prev, `پیام: ${data.message || data.error}`]);
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (err: any) {
      setInstallLogs((prev) => [...prev, `خطای شبکه: ${err.message}`]);
    } finally {
      setInstallingTool(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  useEffect(() => {
    if (device) {
      scanJunkFiles();
      fetchHealthDiagnostics();
    }
    fetchToolStatus();
  }, [device?.id]);

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

      {/* Main Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>پزشک سیستم، پاکسازی عمیق و تعمیرات خودکار (System Doctor)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO Suite
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              پاکسازی فایل‌های اضافی، تخلیه کش، رفع لگ و کرش، و تعمیر خودکار سرویس‌های صوتی، رابط کاربری و شبکه با یک کلیک
            </p>
          </div>
        </div>

        {/* Action Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSection('cleaner')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'cleaner'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاکسازی فایلهای اضافی</span>
          </button>

          <button
            onClick={() => setActiveSection('repair')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'repair'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>عیب‌یابی و تعمیرات</span>
          </button>

          <button
            onClick={() => setActiveSection('drivers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'drivers'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>درایورهای PC</span>
          </button>
        </div>
      </div>

      {/* In-Tab User Guide */}
      <TabGuideCard
        title="راهنمای پاکسازی عمیق و تعمیرات خودکار سیستم"
        description="نحوه آزادسازی حافظه ذخیره‌سازی، رفع لگ و کرش، و تعمیر سرویس‌های مختل شده بدون از دست رفتن اطلاعات"
        steps={[
          "برای شناسایی تمام فایل‌های اضافی و کش پنهان گوشی، دکمه «اسکن جامع فایل‌های زائد» را لمس کنید.",
          "با کلیک روی «پاکسازی تمام فایل‌های زائد»، کش برنامه‌ها، بندانگشتی‌ها و لاگ‌های سنگین حذف شده و چند گیگابایت فضای خالی آزاد می‌شود.",
          "در تب «عیب‌یابی و تعمیرات»، در صورت بروز مشکل در اینترنت یا باتری، می‌توانید از ابزارهای بازنشانی سریع (مانند DNS Turbo و Battery Reset) استفاده کنید."
        ]}
        tips={[
          "پاکسازی فایل‌های کش (Cache) کاملاً امن است و هیچ تاثیری بر عکس‌ها، پیام‌ها یا اطلاعات شخصی شما ندارد.",
          "پیشنهاد می‌شود هفته‌ای یک‌بار عملیات پاکسازی را برای حفظ حداکثر سرعت گوشی انجام دهید."
        ]}
      />

      {/* SECTION 1: DEEP JUNK CLEANER */}
      {activeSection === 'cleaner' && (
        <div className="space-y-6">
          {/* Master Clean Action Bar */}
          <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/50">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs text-slate-400">حجم کل فایل‌های اضافی قابل پاکسازی:</span>
                <h3 className="text-3xl font-black text-cyan-300 font-mono tracking-tight mt-0.5">
                  {junkData ? junkData.totalJunkSize : '۱.۴۲ GB'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  شامل کش برنامه‌ها، بندانگشتی‌های گالری، گزارش‌های خرابی و پوشه‌های خالی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={scanJunkFiles}
                disabled={scanningJunk}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${scanningJunk ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{scanningJunk ? 'در حال اسکن...' : 'اسکن مجدد حافظه'}</span>
              </button>

              <button
                onClick={cleanJunkFiles}
                disabled={cleaningJunk}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-black transition-all shadow-xl shadow-cyan-500/25 flex items-center gap-2 transform hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{cleaningJunk ? 'در حال پاکسازی...' : 'پاکسازی سریع و آزادسازی حافظه'}</span>
              </button>
            </div>
          </div>

          {/* Junk Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {junkData?.categories.map((cat) => (
              <div 
                key={cat.id}
                className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                    {cat.id === 'app_cache' && <Zap className="w-5 h-5" />}
                    {cat.id === 'thumbnails' && <Eye className="w-5 h-5" />}
                    {cat.id === 'crash_logs' && <FileText className="w-5 h-5" />}
                    {cat.id === 'temp_apks' && <Package className="w-5 h-5" />}
                    {cat.id === 'empty_folders' && <FolderMinus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <h4 className="text-sm font-bold text-white truncate">{cat.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{cat.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{cat.count} مورد</span>
                  <span className="text-sm font-bold text-cyan-300">{cat.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: HEALTH DIAGNOSTICS & AUTO-REPAIRS */}
      {activeSection === 'repair' && (
        <div className="space-y-6">
          {/* Master 1-Click System Boost Bar */}
          <div className="rounded-3xl glass-panel p-6 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-indigo-950/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-950/50">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">شاخص سلامت و پایداری سیستم:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {healthScore} / 100
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  عیب‌یابی خودکار و رفع خطاهای سیستمی گوشی
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعمیر قطعی صدا، رفع لگ رابط کاربری، بهینه‌سازی سرعت حافظه فلش و رفع تاخیر کیبورد
                </p>
              </div>
            </div>

            <button
              onClick={() => handleRepair('fix_all', 'تیون‌آپ و تعمیر جامع سیستم')}
              disabled={repairingAction === 'fix_all'}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-black transition-all shadow-xl shadow-purple-500/25 flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <Wrench className="w-4 h-4 text-white" />
              <span>{repairingAction === 'fix_all' ? 'در حال تعمیر و تیون‌آپ...' : '🚀 تعمیر و تیون‌آپ جامع با یک کلیک'}</span>
            </button>
          </div>

          {/* Diagnostic & Repair Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Mediaserver & Audio Repair */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">🎵 تعمیر سرویس صدا و مولتی‌مدیا</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">سالم</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ریست و نوسازی سرویس‌های audioserver و mediaserver جهت رفع قطعی صدا، تاخیر بلوتوث و کرش میکروفون.
                </p>
              </div>
              <button
                onClick={() => handleRepair('fix_mediaserver', 'سرویس صدا')}
                disabled={repairingAction === 'fix_mediaserver'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
              >
                {repairingAction === 'fix_mediaserver' ? 'در حال تعمیر...' : 'تعمیر و ریست سرویس صدا'}
              </button>
            </div>

            {/* 2. SystemUI Soft Restart */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">📱 نوسازی رابط کاربری (SystemUI)</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono">تجمع حافظه</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  راه‌اندازی مجدد نوار اعلان‌ها، استاتوس‌بار و کنترل‌سنتر برای رفع لگ و فریز شدن انیمیشن‌ها بدون خاموش شدن گوشی.
                </p>
              </div>
              <button
                onClick={() => handleRepair('fix_systemui', 'رابط کاربری SystemUI')}
                disabled={repairingAction === 'fix_systemui'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
              >
                {repairingAction === 'fix_systemui' ? 'در حال نوسازی...' : 'راه‌اندازی مجدد SystemUI'}
              </button>
            </div>

            {/* 3. Storage Speed & TRIM */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">⚡ بهینه‌سازی سرعت حافظه فلش</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono">نیاز به TRIM</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تخلیه کامل کش‌های بلاک و اجرای دستورات یکپارچه‌سازی حافظه جهت افزایش سرعت خواندن و نوشتن حافظه داخلی.
                </p>
              </div>
              <button
                onClick={() => handleRepair('fix_storage', 'سرعت حافظه فلش')}
                disabled={repairingAction === 'fix_storage'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
              >
                {repairingAction === 'fix_storage' ? 'در حال بهینه‌سازی...' : 'بهینه‌سازی سرعت حافظه'}
              </button>
            </div>

            {/* 4. Network & DNS Sockets Flush */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">🌐 تعمیر و فلاش کش شبکه و DNS</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">پایدار</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  فلاش کش DNS، بازنشانی سوکت‌های اتصالی شبکه و رفرش روتینگ داخلی برای رفع افت سرعت و قطعی‌های ناخواسته.
                </p>
              </div>
              <button
                onClick={() => handleRepair('fix_network', 'شبکه و DNS')}
                disabled={repairingAction === 'fix_network'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
              >
                {repairingAction === 'fix_network' ? 'در حال تعمیر...' : 'تعمیر و رفرش شبکه'}
              </button>
            </div>

            {/* 5. Keyboard & IME Lag Fix */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">⌨️ رفع تاخیر و لگ کیبورد (IME)</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono">کش ورودی</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  پاکسازی دیتای بافر تایپ و ریستارت نرم کیبوردهای Gboard / SwiftKey جهت رفع تاخیر باز شدن کیبورد.
                </p>
              </div>
              <button
                onClick={() => handleRepair('fix_keyboard', 'سرویس کیبورد')}
                disabled={repairingAction === 'fix_keyboard'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
              >
                {repairingAction === 'fix_keyboard' ? 'در حال ریست...' : 'رفع تاخیر و ریست کیبورد'}
              </button>
            </div>

            {/* 6. Package Manager Fix */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">📦 تعمیر دیتابیس نصاب برنامه‌ها</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">آماده</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  رفع خطای تجزیه بسته (Parse Error) و تعمیر ایندکس نصاب برنامه‌ها در پکیج منیجر اندروید.
                </p>
              </div>
              <button
                onClick={() => handleRepair('fix_package_manager', 'نصاب برنامه‌ها')}
                disabled={repairingAction === 'fix_package_manager'}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all text-center"
              >
                {repairingAction === 'fix_package_manager' ? 'در حال تعمیر...' : 'تعمیر شاخص نصاب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DRIVERS & HOST PC DOCTOR */}
      {activeSection === 'drivers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tools).map(([id, tool]) => (
              <div
                key={id}
                className={`rounded-2xl p-5 glass-panel border transition-all flex flex-col justify-between ${
                  tool.installed ? 'border-slate-800/80 hover:border-emerald-500/40' : 'border-rose-500/20 bg-rose-500/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {tool.category === 'ios' ? (
                        <Apple className="w-5 h-5 text-slate-200" />
                      ) : tool.category === 'android' ? (
                        <Bot className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                      )}
                      <h3 className="text-sm font-bold text-white">{tool.name}</h3>
                    </div>
                    {tool.installed ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        آماده
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        نیاز به نصب
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                    {tool.version}
                  </span>

                  {!tool.installed ? (
                    <div className="flex items-center gap-2">
                      {id === 'itunesService' && (
                        <a
                          href="https://www.apple.com/itunes/download/win64"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>سایت اپل</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleInstallTool(id)}
                        disabled={installingTool === id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
                      >
                        <Download className={`w-3.5 h-3.5 ${installingTool === id ? 'animate-bounce' : ''}`} />
                        <span>{installingTool === id ? 'در حال نصب...' : 'نصب خودکار'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstallTool(id)}
                      disabled={installingTool === id}
                      className="text-[11px] font-semibold text-cyan-400 hover:underline"
                    >
                      بروزرسانی
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Commands & Logs */}
          <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>دستورات نصب سریع در PowerShell ویندوز:</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#050914] rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="font-mono text-cyan-300">python -m pip install --upgrade pymobiledevice3</div>
                <button
                  onClick={() => copyToClipboard('python -m pip install --upgrade pymobiledevice3')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="کپی دستور"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-[#050914] rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="font-mono text-cyan-300">winget install --id Apple.iTunes --exact</div>
                <button
                  onClick={() => copyToClipboard('winget install --id Apple.iTunes --exact')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="کپی دستور"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
