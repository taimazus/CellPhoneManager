import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Flame, 
  Layers, 
  Cpu, 
  FileCode, 
  HelpCircle,
  ExternalLink,
  Unlock,
  Lock,
  Smartphone
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';

interface RootToolkitTabProps {
  device: Device | null;
}

interface RootStatus {
  isRooted: boolean;
  rootType: string;
  suVersion: string;
  selinux: string;
  bootloaderUnlocked: boolean;
  magiskInstalled: boolean;
}

export const RootToolkitTab: React.FC<RootToolkitTabProps> = ({ device }) => {
  const [status, setStatus] = useState<RootStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [patchedBootPath, setPatchedBootPath] = useState<string>('C:\\magisk_patched.img');
  const [stockBootPath, setStockBootPath] = useState<string>('C:\\stock_boot.img');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStatus = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/root/status`);
      if (data.success) {
        setStatus(data);
      }
    } catch (err: any) {
      showToast(`خطا در بررسی وضعیت روت: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [device?.id]);

  const handleInstallMagisk = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/root/magisk/install`, { method: 'POST' });
      showToast(data.message || (data.success ? 'عملیات موفق' : data.error), data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleUnroot = async () => {
    if (!device) return;
    if (!confirm('آیا از بازگشت کامل از روت (Unroot) و پاکسازی ماژول‌های سیستمی اطمینان دارید؟')) return;
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/root/unroot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockBootPath: stockBootPath || null })
      });
      if (data.success) {
        showToast(data.message || 'آنروت با موفقیت انجام شد', 'success');
        fetchStatus();
      } else {
        showToast(`خطا: ${data.error || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTempBoot = async () => {
    if (!patchedBootPath.trim()) {
      showToast('مسیر فایل boot پچ‌شده الزامی است.', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device?.id || 'default')}/root/fastboot/temp-boot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patchedBootPath })
      });
      if (data.success) {
        showToast('دستور تست بوت موقت در فست‌بوت ارسال شد.', 'success');
      } else {
        showToast(`خطا در Fastboot: ${data.error || data.stderr || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFlashBoot = async () => {
    if (!patchedBootPath.trim()) {
      showToast('مسیر فایل boot پچ‌شده الزامی است.', 'error');
      return;
    }
    if (!confirm('آیا از فلش دائمی فایل Boot پچ‌شده روی پارتیشن بوت دستگاه اطمینان دارید؟')) return;
    setLoading(true);
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device?.id || 'default')}/root/fastboot/flash-boot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patchedBootPath })
      });
      if (data.success) {
        showToast('فایل بوت با موفقیت روی دستگاه فلش شد!', 'success');
        fetchStatus();
      } else {
        showToast(`خطا در فلش: ${data.error || data.stderr || 'خطای ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
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
            <Zap className="w-6 h-6 text-amber-400" />
            <span>جعبه‌ابزار جامع روت، مجیسک و بازگشت از روت (Root, Magisk & Unroot Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            روت ایمن و استاندارد با Magisk 27+ و KernelSU، فلش و تست موقت فایل بوت، آن‌روت کامل و مخفی‌سازی روت برای برنامه‌های بانکی
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>بررسی وضعیت روت</span>
        </button>
      </div>

      {/* Root Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>وضعیت روت دستگاه:</span>
            {status?.isRooted ? <ShieldAlert className="w-4 h-4 text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className={`text-2xl font-black font-mono ${status?.isRooted ? 'text-amber-400' : 'text-emerald-400'}`}>
            {status?.isRooted ? 'روت شده (Rooted)' : 'رسمی و آن‌روت (Stock)'}
          </div>
          <div className="text-[10px] text-slate-400 font-bold">{status?.rootType}</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>وضعیت بوت‌لودر (Bootloader):</span>
            {status?.bootloaderUnlocked ? <Unlock className="w-4 h-4 text-cyan-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {status?.bootloaderUnlocked ? 'آنلاک (Unlocked)' : 'قفل (Locked)'}
          </div>
          <div className="text-[10px] text-slate-400">پیش‌نیاز روت: آنلاک بودن بوت‌لودر</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>وضعیت امنیتی SELinux:</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {status?.selinux || 'Enforcing'}
          </div>
          <div className="text-[10px] text-slate-400">محافظت کرنل و پارتیشن‌ها</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>نسخه باینری SU:</span>
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono truncate">
            {status?.suVersion || 'یافت نشد'}
          </div>
          <div className="text-[10px] text-slate-400">محیط دسترسی SuperUser</div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========================================================= */}
        {/* CARD 1: SAFE ROOTING WORKFLOW (روت ایمن با Magisk / Fastboot) */}
        {/* ========================================================= */}
        <div className="rounded-3xl glass-panel p-6 border border-amber-500/30 space-y-5 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">فرآیند روت استاندارد (Magisk 27+ / KernelSU)</h3>
                <p className="text-[11px] text-slate-400">پچ کردن فایل boot.img و فلش با Fastboot بدون بریک</p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400">گام ۱: دریافت و نصب برنامه Magisk</div>
                <p className="text-[11px] text-slate-400">برنامه رسمی Magisk را روی گوشی باز کنید تا فایل Boot را پچ کند.</p>
                <button
                  onClick={handleInstallMagisk}
                  className="mt-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold"
                >
                  دریافت آخرین نسخه Magisk APK
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-400">گام ۲: وارد کردن مسیر فایل Boot پچ‌شده</div>
                <input
                  type="text"
                  value={patchedBootPath}
                  onChange={(e) => setPatchedBootPath(e.target.value)}
                  placeholder="C:\magisk_patched.img"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleTempBoot}
              disabled={loading}
              className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
              title="تست بوت بدون ذخیره دائمی جهت اطمینان از صحت فایل"
            >
              🧪 تست بوت موقت (Safe Test)
            </button>

            <button
              onClick={handleFlashBoot}
              disabled={loading}
              className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              ⚡ فلش دائمی روت با Fastboot
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: COMPLETE UNROOT & STOCK RESTORE (بازگشت کامل از روت) */}
        {/* ========================================================= */}
        <div className="rounded-3xl glass-panel p-6 border border-emerald-500/30 space-y-5 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">حالت بازگشت کامل از روت (Complete 1-Click Unroot)</h3>
                <p className="text-[11px] text-slate-400">پاکسازی باینری su، حذف ماژول‌های مجیسک و بازگردانی Boot اصلی کارخانه</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با این قابلیت می‌توانید گوشی را به حالت کاملاً رسمی (Stock) و بدون روت بازگردانید تا آپدیت‌های رسمی OTA بدون مشکل دریافت شوند و برنامه‌های بانکی بدون هیچ اخطاری اجرا گردند.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">مسیر فایل Stock Boot اصلی (جهت فلش کارخانه‌ای):</label>
              <input
                type="text"
                value={stockBootPath}
                onChange={(e) => setStockBootPath(e.target.value)}
                placeholder="C:\stock_boot.img (اختیاری)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-300 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Unroot Trigger Button */}
          <div className="pt-2">
            <button
              onClick={handleUnroot}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>آن‌روت کامل و بازگشت به حالت رسمی کارخانه (Complete Unroot)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banking Apps & Shamiko Cloak Guide */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">راهنمای مخفی‌سازی روت برای برنامه‌های بانکی ایرانی (Zygisk / Shamiko)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-400">۱. فعال‌سازی Zygisk:</div>
            <p className="text-[11px] text-slate-400">
              در تنظیمات Magisk گزینه **Zygisk** و **Enforce DenyList** را فعال نمایید.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">۲. تنظیم DenyList:</div>
            <p className="text-[11px] text-slate-400">
              برنامه‌های بانکی (بلوبانک، همراه‌کارت، آپ، بانک ملی) و Google Play Services را در لیست DenyList تیک بزنید.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-amber-400">۳. ماژول Shamiko:</div>
            <p className="text-[11px] text-slate-400">
              با نصب ماژول Shamiko، تست Play Integrity به طور کامل Passed شده و هیچ برنامه‌ای روت را تشخیص نمی‌دهد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
