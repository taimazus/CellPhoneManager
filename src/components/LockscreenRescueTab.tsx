import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Phone, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Key
} from 'lucide-react';
import { Device } from '../types';
import { safeFetchJson } from '../utils/api';

interface LockscreenRescueTabProps {
  device: Device | null;
}

export const LockscreenRescueTab: React.FC<LockscreenRescueTabProps> = ({ device }) => {
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDismissLock = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/rescue/dismiss-lock`, { method: 'POST' });
      showToast(data.message || (data.success ? 'عملیات موفق' : data.error), data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleSafeMode = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/rescue/safemode`, { method: 'POST' });
      showToast(data.message || (data.success ? 'عملیات موفق' : data.error), data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleEmergencyDialer = async () => {
    if (!device) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/rescue/emergency-dialer`, { method: 'POST' });
      showToast(data.message || (data.success ? 'عملیات موفق' : data.error), data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleWipeRecovery = async () => {
    if (!device) return;
    if (!confirm('توجه: این عملیات گوشی را به منوی ریکاوری جهت ریست کارخانه و حذف کامل رمز هدایت می‌کند. آیا ادامه می‌دهید؟')) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/rescue/wipe-recovery`, { method: 'POST' });
      showToast(data.message || (data.success ? 'عملیات موفق' : data.error), data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleRemoveRootKeys = async () => {
    if (!device) return;
    if (!confirm('آیا از حذف فایل‌های کلید قفل (locksettings.db / key files) با دسترسی روت مطمئن هستید؟')) return;
    try {
      const data = await safeFetchJson(`/api/devices/${encodeURIComponent(device.id)}/rescue/remove-root-keys`, { method: 'POST' });
      showToast(data.message || (data.success ? 'عملیات موفق' : data.error), data.success ? 'success' : 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
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
            <Key className="w-6 h-6 text-cyan-400" />
            <span>جعبه‌ابزار بازیابی و حذف رمز فراموش‌شده (Lockscreen & Forensic Rescue Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            راهکارهای تخصصی بازگشایی قفل‌های بدون رمز، حذف فایل‌های الگوی قفل در گوشی‌های روت‌شده و بازیابی اضطراری کارخانه
          </p>
        </div>
      </div>

      {/* Hardware Encryption Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
          <p className="font-bold text-amber-300">نکته فنی درباره رمز فراموش‌شده در اندروید‌های مدرن (Android 7 تا 15+):</p>
          <p>
            گوشی‌های جدید مجهز به رمزنگاری سخت‌افزاری بر پایه فایل (FBE / File-Based Encryption) و تراشه‌های امنیتی (Samsung Knox / Titan M) هستند. در صورت فراموشی کامل PIN یا پسورد و نداشتن روت/ADB، ایمن‌ترین و استانداردترین روش حذف رمز، انجام <strong>Wipe Data / Factory Reset</strong> از طریق ریکاوری یا فست‌بوت است.
          </p>
        </div>
      </div>

      {/* Rescue Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Dismiss Swipe Lock */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 w-fit">
              <Unlock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">رد کردن قفل صفحه (Dismiss Keyguard)</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ارسال فرمان سیستمی جهت باز کردن قفل‌های کشیدنی یا روشن کردن صفحه بدون نیاز به لمس دکمه پاور.
            </p>
          </div>

          <button
            onClick={handleDismissLock}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            بازگشایی قفل کشیدنی
          </button>
        </div>

        {/* Safe Mode Reboot */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">ریبوت به حالت امن (Safe Mode)</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              غیرفعال‌سازی موقت تمام اپلیکیشن‌های قفل‌کننده شخص‌ثالث (AppLocker) و بدافزارها بدون حذف اطلاعات.
            </p>
          </div>

          <button
            onClick={handleSafeMode}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            ریبوت اضطراری به Safe Mode
          </button>
        </div>

        {/* Root Lock Keys Removal */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 w-fit">
              <RotateCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">حذف کلیدهای رمز با Root / TWRP</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              پاکسازی دیتابیس locksettings.db و فایل‌های pattern.key / password.key در دستگاه‌های روت‌شده یا ریکاوری کاستوم.
            </p>
          </div>

          <button
            onClick={handleRemoveRootKeys}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            حذف کلیدهای دیتابیس قفل
          </button>
        </div>

        {/* Factory Reset / Wipe Recovery */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">ریست کامل و حذف قطعی رمز</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ریبوت سریع به منوی Recovery جهت اجرای Wipe Data / Factory Reset و بازگرداندن دسترسی به گوشی قفل‌شده.
            </p>
          </div>

          <button
            onClick={handleWipeRecovery}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            ریبوت به Recovery جهت ریست
          </button>
        </div>
      </div>
    </div>
  );
};

