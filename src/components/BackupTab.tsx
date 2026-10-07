import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Download, 
  Send, 
  Type, 
  Clipboard, 
  Smartphone, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  FileDown, 
  Trash2, 
  RotateCcw, 
  FolderSync, 
  ShieldCheck, 
  Clock, 
  HardDrive,
  Users,
  MessageSquare,
  PhoneCall,
  Image as ImageIcon,
  FolderOpen,
  Check,
  Laptop,
  CheckSquare,
  Square,
  Sliders,
  Share2
} from 'lucide-react';
import { Device, DeviceApp } from '../types';
import { AppIcon } from './AppIcon';
import { TabGuideCard } from './TabGuideCard';

interface BackupTabProps {
  device: Device | null;
}

interface BackupItem {
  id: string;
  deviceName: string;
  deviceType: string;
  serial: string;
  createdAt: string;
  backupMode?: 'full' | 'custom';
  destinationTarget?: 'pc' | 'phone' | 'both';
  items: {
    contactsCount: number;
    smsCount: number;
    callsCount: number;
    mediaFilesCount: number;
    appsCount: number;
  };
  included?: {
    contacts?: boolean;
    sms?: boolean;
    calls?: boolean;
    apps?: boolean;
    media?: boolean;
  };
}

export const BackupTab: React.FC<BackupTabProps> = ({ device }) => {
  const [activeSection, setActiveSection] = useState<'backup_restore' | 'apks' | 'typing'>('backup_restore');
  
  // Backup Creation State
  const [backupMode, setBackupMode] = useState<'full' | 'custom'>('full');
  const [destinationTarget, setDestinationTarget] = useState<'pc' | 'phone' | 'both'>('pc');
  const [backupOptions, setBackupOptions] = useState({
    contacts: true,
    sms: true,
    calls: true,
    apps: true,
    media: true
  });

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  // Custom Restore Modal State
  const [customRestoreModal, setCustomRestoreModal] = useState<BackupItem | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    contacts: true,
    sms: true,
    calls: true
  });

  // APK & Typing state
  const [apps, setApps] = useState<DeviceApp[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [extractingPkg, setExtractingPkg] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3800);
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      if (data.success && data.backups) {
        setBackups(data.backups);
      }
    } catch (err: any) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const fetchApps = async () => {
    if (!device) return;
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/apps?type=${device.type}`);
      const data = await res.json();
      if (data.apps) setApps(data.apps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    if (device) fetchApps();
  }, [device?.id]);

  // Handle Full vs Custom preset switch
  const handleModeChange = (mode: 'full' | 'custom') => {
    setBackupMode(mode);
    if (mode === 'full') {
      setBackupOptions({
        contacts: true,
        sms: true,
        calls: true,
        apps: true,
        media: true
      });
    }
  };

  const handleCreateBackup = async () => {
    if (!device) {
      showToast('لطفاً ابتدا دستگاهی را متصل و انتخاب کنید.', 'error');
      return;
    }

    const hasSelection = Object.values(backupOptions).some(Boolean);
    if (!hasSelection) {
      showToast('حداقل یک بخش را برای پشتیبان‌گیری انتخاب نمایید.', 'error');
      return;
    }

    setIsBackingUp(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/backup/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: device.type,
          deviceName: device.name || 'Phone',
          options: backupOptions,
          destinationTarget
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'پشتیبان‌گیری با موفقیت انجام شد.', 'success');
        fetchBackups();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در پشتیبان‌گیری: ${err.message}`, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (backupId: string, customOpts?: { contacts: boolean; sms: boolean; calls: boolean }) => {
    if (!device) {
      showToast('لطفاً دستگاه مقصدی را جهت بازیابی متصل و انتخاب کنید.', 'error');
      return;
    }
    
    const opts = customOpts || { contacts: true, sms: true, calls: true };
    if (!opts.contacts && !opts.sms && !opts.calls) {
      showToast('حداقل یکی از بخش‌ها را جهت بازیابی انتخاب کنید.', 'error');
      return;
    }

    if (!confirm(`آیا از بازیابی اطلاعات روی گوشی ${device.name} اطمینان دارید؟`)) return;
    
    setIsRestoring(backupId);
    try {
      const res = await fetch(`/api/backups/${backupId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSerial: device.id,
          targetType: device.type,
          options: opts
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'بازیابی با موفقیت انجام شد.', 'success');
        setCustomRestoreModal(null);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در بازیابی: ${err.message}`, 'error');
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('آیا از حذف این نسخه پشتیبان اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/backups/${backupId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('نسخه پشتیبان حذف شد.', 'success');
        fetchBackups();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleOpenBackupFolder = async () => {
    try {
      const res = await fetch('/api/backups/open-folder', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('پوشه ذخیره‌سازی نسخه‌های پشتیبان در کامپیوتر باز شد.', 'success');
      } else {
        showToast(`عدم امکان بازگشایی پوشه: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const isIos = device?.type === 'ios';
  const pkgFormat = isIos ? 'IPA' : 'APK';

  const handleExtractApk = async (packageName: string) => {
    if (!device) return;
    setExtractingPkg(packageName);
    try {
      window.open(`/api/devices/${device.id}/apps/extract?packageName=${encodeURIComponent(packageName)}&type=${device.type || 'android'}`);
      showToast(`استخراج بسته ${packageName}.${isIos ? 'ipa' : 'apk'} شروع شد!`, 'success');
    } catch (err: any) {
      showToast(`خطا در استخراج: ${err.message}`, 'error');
    } finally {
      setTimeout(() => setExtractingPkg(null), 1500);
    }
  };

  const handleSendText = async () => {
    if (!device || !inputText.trim()) return;
    setIsTyping(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/input/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await res.json();
      if (data.success) {
        showToast('متن با موفقیت به گوشی تایپ شد!', 'success');
        setInputText('');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setInputText(clipText);
        showToast('متن کلیپ‌بورد جای‌گذاری شد.', 'success');
      }
    } catch {
      showToast('عدم دسترسی به حافظه کلیپ‌بورد.', 'error');
    }
  };

  const formatPersianDate = (dateStr?: string) => {
    if (!dateStr) return 'نامشخص';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'نامشخص' : d.toLocaleString('fa-IR');
    } catch {
      return 'نامشخص';
    }
  };

  const filteredApps = (apps || []).filter(app => {
    const name = (app?.name || (app as any)?.appName || app?.packageName || '');
    const pkg = (app?.packageName || '');
    return name.toLowerCase().includes(search.toLowerCase()) || 
           pkg.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>مرکز جامع پشتیبان‌گیری و بازیابی اطلاعات (Universal Backup & Restore)</span>
              </h2>
              <p className="text-xs text-slate-400">
                پشتیبان‌گیری کامل یا سفارشی از مخاطبین، پیامک‌ها، تماس‌ها و عکس‌ها بر روی کامپیوتر یا کارت حافظه گوشی و بازگردانی سریع
              </p>
            </div>
          </div>
        </div>

        {/* Action & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenBackupFolder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            title="مشاهده پوشه backups در ویندوز"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>پوشه بکاپ‌ها در PC</span>
          </button>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveSection('backup_restore')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'backup_restore' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderSync className="w-4 h-4" />
              <span>پشتیبان‌گیری و بازیابی</span>
            </button>

            <button
              onClick={() => setActiveSection('apks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'apks' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileDown className="w-4 h-4" />
              <span>استخراج {pkgFormat}</span>
            </button>

            <button
              onClick={() => setActiveSection('typing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'typing' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>تایپ از کامپیوتر</span>
            </button>
          </div>
        </div>
      </div>

      {/* In-Tab User Guide */}
      <TabGuideCard
        title="راهنمای جامع پشتیبان‌گیری و بازیابی اطلاعات"
        description="نحوه ذخیره امن مخاطبین، پیامک‌ها، عکس‌ها و برنامه‌ها روی کامپیوتر یا گوشی و شیوه بازیابی ۱ کلیکی"
        steps={[
          "برای پشتیبان‌گیری کامل سریع، حالت «پشتیبان‌گیری کامل (۱ کلیک)» را انتخاب کرده و محل ذخیره (روی کامپیوتر یا کارت حافظه گوشی) را مشخص نمایید.",
          "اگر مایلید فقط موارد خاصی (مثلاً فقط مخاطبین یا پیامک‌ها) ذخیره شوند، حالت «پشتیبان‌گیری سفارشی» را فعال کنید.",
          "برای بازیابی نسخه پشتیبان روی گوشی متصل فعلی، از کارت سمت چپ گزینه «بازیابی کامل» یا «بازیابی سفارشی» را لمس نمایید.",
          "فایل‌های مخاطبین علاوه بر فرمت داخلی، به صورت استاندارد vCard 3.0 (.vcf) نیز ذخیره می‌شوند و می‌توانید آن را مستقیماً به جیمیل، اوت‌لوک یا آیفون منتقل کنید."
        ]}
        tips={[
          "با دکمه «پوشه بکاپ‌ها در PC» می‌توانید به پوشه محلی فایل‌ها در ویندوز دسترسی پیدا کرده و از آن روی فلش یا هارد اکسترنال آرشیو بگیرید.",
          "بازیابی اطلاعات هیچ نیازی به روت بودن گوشی ندارد و روی انواع اندروید و iOS قابل استفاده است."
        ]}
      />

      {/* Section 1: Universal Backup & Restore Hub */}
      {activeSection === 'backup_restore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create Backup Card (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl glass-panel border border-slate-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Archive className="w-5 h-5 text-cyan-400" />
                  <span>تهیه نسخه پشتیبان (Backup)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  انتخاب نحوه پشتیبان‌گیری (کامل یا سفارشی) و محل ذخیره (کامپیوتر یا گوشی)
                </p>
              </div>

              {/* Mode Selector: Full vs Custom */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نوع پشتیبان‌گیری:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('full')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      backupMode === 'full'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>پشتیبان‌گیری کامل (۱ کلیک)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('custom')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      backupMode === 'custom'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>پشتیبان‌گیری سفارشی</span>
                  </button>
                </div>
              </div>

              {/* Storage Destination Target */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">محل ذخیره‌سازی نسخه پشتیبان:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestinationTarget('pc')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center gap-1 ${
                      destinationTarget === 'pc'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span>روی کامپیوتر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestinationTarget('phone')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center gap-1 ${
                      destinationTarget === 'phone'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>روی حافظه گوشی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestinationTarget('both')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center gap-1 ${
                      destinationTarget === 'both'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <span>همزمان هر دو</span>
                  </button>
                </div>
              </div>

              {/* Items Selection */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                  <span>آیتم‌های مشمول پشتیبان‌گیری:</span>
                  {backupMode === 'custom' ? (
                    <span className="text-purple-400 font-bold">حالت سفارشی فعال است</span>
                  ) : (
                    <span className="text-cyan-400 font-bold">انتخاب کامل خودکار</span>
                  )}
                </div>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>مخاطبین تلفن (خروجی vCard استاندارد vcf و JSON)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.contacts}
                    onChange={(e) => setBackupOptions({ ...backupOptions, contacts: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>پیامک‌ها و گفتگوهای SMS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.sms}
                    onChange={(e) => setBackupOptions({ ...backupOptions, sms: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <PhoneCall className="w-4 h-4 text-purple-400" />
                    <span>تاریخچه تماس‌های ورودی، خروجی و از دست رفته</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.calls}
                    onChange={(e) => setBackupOptions({ ...backupOptions, calls: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <ImageIcon className="w-4 h-4 text-pink-400" />
                    <span>آلبوم تصاویر دوربین و گالری (DCIM)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.media}
                    onChange={(e) => setBackupOptions({ ...backupOptions, media: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>فهرست و پکیج برنامه‌های نصب‌شده</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.apps}
                    onChange={(e) => setBackupOptions({ ...backupOptions, apps: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                </label>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300 leading-relaxed">
                💡 این نسخه پشتیبان با فرمت استاندارد جهانی ذخیره می‌شود و می‌توانید آن را در آینده روی هر مدل گوشی (سامسونگ، شیائومی، هواوی یا آیفون) بازیابی کنید.
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={isBackingUp || !device}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Archive className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span>
                {isBackingUp 
                  ? 'در حال پردازش و استخراج نسخه پشتیبان...' 
                  : `شروع پشتیبان‌گیری ${backupMode === 'full' ? 'کامل' : 'سفارشی'} (${destinationTarget === 'phone' ? 'روی گوشی' : (destinationTarget === 'both' ? 'کامپیوتر و گوشی' : 'روی کامپیوتر')})`
                }
              </span>
            </button>
          </div>

          {/* Saved Backups & Restore Hub (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-cyan-400" />
                    <span>آرشیو نسخه‌های پشتیبان و استودیوی بازیابی (Restore)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    بازیابی کامل یا سفارشی روی دستگاه متصل فعلی: <span className="text-cyan-400 font-bold font-mono">{device?.name || 'دستگاهی متصل نیست'}</span>
                  </p>
                </div>

                <button
                  onClick={fetchBackups}
                  disabled={loadingBackups}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
                  title="تازه‌سازی لیست"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBackups ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Backups List */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {backups.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                    <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">هنوز نسخه پشتیبانی در سیستم ذخیره نشده است.</p>
                    <p className="text-[11px] text-slate-500">از پنل سمت راست برای ایجاد اولین پشتیبان‌گیری کامل یا سفارشی اقدام کنید.</p>
                  </div>
                ) : (
                  backups.map((bak) => (
                    <div 
                      key={bak.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white">{bak.deviceName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                            {bak.backupMode === 'full' ? 'کامل' : 'سفارشی'}
                          </span>
                          {bak.destinationTarget === 'phone' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ذخیره روی گوشی
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatPersianDate(bak.createdAt)}</span>
                        </div>
                      </div>

                      {/* Items Pills */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                        <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                          👤 {bak.items?.contactsCount || 0} مخاطب
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                          💬 {bak.items?.smsCount || 0} پیامک
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                          📞 {bak.items?.callsCount || 0} تماس
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                          📦 {bak.items?.appsCount || 0} برنامه
                        </span>
                        {bak.items?.mediaFilesCount ? (
                          <span className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                            🖼️ {bak.items.mediaFilesCount} عکس
                          </span>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={bak.id}>
                          {bak.id}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Custom Restore Trigger */}
                          <button
                            onClick={() => {
                              setCustomRestoreModal(bak);
                              setRestoreOptions({
                                contacts: (bak.items?.contactsCount || 0) > 0,
                                sms: (bak.items?.smsCount || 0) > 0,
                                calls: (bak.items?.callsCount || 0) > 0
                              });
                            }}
                            disabled={!device || isRestoring === bak.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            title="انتخاب دستی بخش‌های مورد نظر جهت بازیابی"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>بازیابی سفارشی</span>
                          </button>

                          {/* Full 1-Click Restore */}
                          <button
                            onClick={() => handleRestoreBackup(bak.id)}
                            disabled={isRestoring === bak.id || !device}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRestoring === bak.id ? 'animate-spin' : ''}`} />
                            <span>بازیابی کامل</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteBackup(bak.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                            title="حذف بک‌آپ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Restore Modal */}
      {customRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>بازیابی سفارشی روی گوشی</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{customRestoreModal.deviceName}</span>
            </div>

            <p className="text-xs text-slate-300">
              بخش‌هایی را که مایلید روی دستگاه مقصد بازیابی شوند انتخاب کنید:
            </p>

            <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/40">
                <span className="text-xs text-slate-200">👤 مخاطبین تلفن ({customRestoreModal.items?.contactsCount || 0})</span>
                <input
                  type="checkbox"
                  checked={restoreOptions.contacts}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, contacts: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/40">
                <span className="text-xs text-slate-200">💬 پیامک‌ها و گفتگوها ({customRestoreModal.items?.smsCount || 0})</span>
                <input
                  type="checkbox"
                  checked={restoreOptions.sms}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, sms: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/40">
                <span className="text-xs text-slate-200">📞 تاریخچه تماس‌ها ({customRestoreModal.items?.callsCount || 0})</span>
                <input
                  type="checkbox"
                  checked={restoreOptions.calls}
                  onChange={(e) => setRestoreOptions({ ...restoreOptions, calls: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomRestoreModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => handleRestoreBackup(customRestoreModal.id, restoreOptions)}
                disabled={isRestoring === customRestoreModal.id}
                className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoring === customRestoreModal.id ? 'animate-spin' : ''}`} />
                <span>شروع بازیابی موارد انتخابی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: APK / IPA Extractor */}
      {activeSection === 'apks' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">استخراج و ذخیره فایل‌های نصبی ({pkgFormat} Extractor)</h3>
              <p className="text-xs text-slate-400">دانلود مستقیم فایل خام نصبی هر برنامه‌ای که روی گوشی نصب است به کامپیوتر</p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی نام یا پکیج..."
                className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {loadingApps ? (
              <div className="col-span-3 p-8 text-center text-xs text-slate-400">در حال دریافت لیست برنامه‌ها...</div>
            ) : filteredApps.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-xs text-slate-400">برنامه‌ای یافت نشد.</div>
            ) : (
              filteredApps.map((app) => {
                const displayName = app?.name || (app as any)?.appName || app?.packageName || 'برنامه';
                return (
                  <div
                    key={app.packageName}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <AppIcon icon={app.icon} name={displayName} className="w-9 h-9 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{app.packageName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExtractApk(app.packageName)}
                      disabled={extractingPkg === app.packageName}
                      className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all shrink-0 active:scale-95 disabled:opacity-50"
                      title={`استخراج ${pkgFormat}`}
                    >
                      <Download className={`w-4 h-4 ${extractingPkg === app.packageName ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Section 3: Direct PC Typing */}
      {activeSection === 'typing' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-cyan-400" />
              <span>تایپ مستقیم متون طولانی از کیبورد کامپیوتر به گوشی</span>
            </h3>
            <p className="text-xs text-slate-400">
              ارسال سریع متن، رمزهای عبور پیچیده، آدرس‌های اینترنتی یا کلیپ‌بورد به فیلد متنی فعال در گوشی
            </p>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            placeholder="متن، لینک یا پیام دلخواه خود را اینجا بنویسید یا الصاق کنید..."
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePasteClipboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              <Clipboard className="w-4 h-4 text-cyan-400" />
              <span>جای‌گذاری از کلیپ‌بورد PC</span>
            </button>

            <button
              onClick={handleSendText}
              disabled={isTyping || !inputText.trim() || !device}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isTyping ? 'در حال تایپ...' : 'ارسال به گوشی'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
