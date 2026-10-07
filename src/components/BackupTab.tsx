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
  Image as ImageIcon
} from 'lucide-react';
import { Device, DeviceApp } from '../types';
import { AppIcon } from './AppIcon';

interface BackupTabProps {
  device: Device | null;
}

interface BackupItem {
  id: string;
  deviceName: string;
  deviceType: string;
  serial: string;
  createdAt: string;
  items: {
    contactsCount: number;
    smsCount: number;
    callsCount: number;
    mediaFilesCount: number;
    appsCount: number;
  };
}

export const BackupTab: React.FC<BackupTabProps> = ({ device }) => {
  const [activeSection, setActiveSection] = useState<'backup_restore' | 'apks' | 'typing'>('backup_restore');
  
  // Backup state
  const [backupOptions, setBackupOptions] = useState({
    contacts: true,
    sms: true,
    calls: true,
    apps: true,
    media: false
  });
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

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
    setTimeout(() => setToast(null), 3500);
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

  const handleCreateBackup = async () => {
    if (!device) {
      showToast('لطفاً ابتدا دستگاهی را متصل و انتخاب کنید.', 'error');
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
          options: backupOptions
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

  const handleRestoreBackup = async (backupId: string) => {
    if (!device) {
      showToast('لطفاً دستگاه مقصدی را جهت بازیابی انتخاب کنید.', 'error');
      return;
    }
    if (!confirm(`آیا از بازیابی این نسخه پشتیبان روی گوشی ${device.name} اطمینان دارید؟`)) return;
    
    setIsRestoring(backupId);
    try {
      const res = await fetch(`/api/backups/${backupId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSerial: device.id,
          targetType: device.type,
          options: { contacts: true, sms: true, calls: true }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'بازیابی با موفقیت انجام شد.', 'success');
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
    if (!confirm('آیا از حذف این نسخه پشتیبان از کامپیوتر اطمینان دارید؟')) return;
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

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) || 
    app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right">
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
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Archive className="w-6 h-6 text-cyan-400" />
            <span>مرکز جامع پشتیبان‌گیری، بازیابی و انتقال داده (Universal Backup & Restore Suite)</span>
          </h2>
          <p className="text-xs text-slate-400">
            تهیه پشتیبان کامل یا سفارشی از مخاطبین، پیامک‌ها و فایل‌ها و بازیابی آسان روی هر نوع گوشی (اندروید، آیفون و PC)
          </p>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <button
            onClick={() => setActiveSection('backup_restore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'backup_restore' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span>پشتیبان‌گیری و بازیابی</span>
          </button>

          <button
            onClick={() => setActiveSection('apks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'apks' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>استخراج APK برنامه‌ها</span>
          </button>

          <button
            onClick={() => setActiveSection('typing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'typing' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>تایپ مستقیم از PC</span>
          </button>
        </div>
      </div>

      {/* Section 1: Backup & Restore Hub */}
      {activeSection === 'backup_restore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left / Create Backup Card (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl glass-panel border border-slate-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Archive className="w-5 h-5 text-cyan-400" />
                  <span>تهیه نسخه پشتیبان جدید</span>
                </h3>
                <p className="text-xs text-slate-400">
                  اطلاعات انتخابی گوشی فعلی روی هارد دیسک کامپیوتر ذخیره می‌شود.
                </p>
              </div>

              {/* Selection Checkboxes */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>مخاطبین تلفن (vCard & JSON)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.contacts}
                    onChange={(e) => setBackupOptions({ ...backupOptions, contacts: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>پیامک‌ها و چت‌های SMS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.sms}
                    onChange={(e) => setBackupOptions({ ...backupOptions, sms: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <PhoneCall className="w-4 h-4 text-purple-400" />
                    <span>تاریخچه و لاگ تماس‌ها</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.calls}
                    onChange={(e) => setBackupOptions({ ...backupOptions, calls: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>فهرست برنامه‌های نصب‌شده</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={backupOptions.apps}
                    onChange={(e) => setBackupOptions({ ...backupOptions, apps: e.target.checked })}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                </label>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-300">
                💡 این بک‌آپ با فرمت جهانی ذخیره می‌شود و قابلیت انتقال و بازیابی مستقیم به هر گوشی دیگری (سامسونگ، شیائومی یا آیفون) را دارد.
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={isBackingUp || !device}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Archive className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
              <span>{isBackingUp ? 'در حال تهیه نسخه پشتیبان...' : 'شروع پشتیبان‌گیری از گوشی فعلی'}</span>
            </button>
          </div>

          {/* Right / Backups List & Restore Card (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-cyan-400" />
                  <span>آرشیو نسخه‌های پشتیبان کامپیوتر</span>
                </h3>
                <p className="text-xs text-slate-400">
                  انتخاب و بازیابی ۱ کلیکی روی دستگاه متصل فعلی ({device?.name || 'دستگاهی انتخاب نشده'})
                </p>
              </div>

              <button
                onClick={fetchBackups}
                disabled={loadingBackups}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBackups ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Backups List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {backups.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">هنوز نسخه پشتیبانی در سیستم ثبت نشده است.</p>
                  <p className="text-[11px] text-slate-500">از کارت سمت راست برای ساخت اولین بک‌آپ اقدام کنید.</p>
                </div>
              ) : (
                backups.map((bak) => (
                  <div 
                    key={bak.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-right w-full md:w-auto">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">{bak.deviceName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {new Date(bak.createdAt).toLocaleString('fa-IR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>👤 {bak.items?.contactsCount || 0} مخاطب</span>
                        <span>💬 {bak.items?.smsCount || 0} پیامک</span>
                        <span>📞 {bak.items?.callsCount || 0} تماس</span>
                        <span>📦 {bak.items?.appsCount || 0} برنامه</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleRestoreBackup(bak.id)}
                        disabled={isRestoring === bak.id || !device}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoring === bak.id ? 'animate-spin' : ''}`} />
                        <span>بازیابی روی گوشی</span>
                      </button>

                      <button
                        onClick={() => handleDeleteBackup(bak.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                        title="حذف بک‌آپ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: APK Extractor */}
      {activeSection === 'apks' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">استخراج و ذخیره فایل‌های نصبی (APK Extractor)</h3>
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
              filteredApps.map((app) => (
                <div
                  key={app.packageName}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <AppIcon icon={app.icon} name={app.name} className="w-9 h-9 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{app.name}</p>
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
              ))
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
