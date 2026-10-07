import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  Cpu, 
  Layers, 
  Flame, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  ShieldAlert, 
  FolderOpen, 
  FileCode, 
  HardDrive, 
  Sparkles,
  Zap,
  ExternalLink,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { Device } from '../types';

interface RomFlasherTabProps {
  device: Device | null;
}

interface RomInfo {
  codename: string;
  model: string;
  androidVersion: string;
  arch: string;
  slot: string;
  isAB: boolean;
  isDynamic: boolean;
  trebleSupported: boolean;
  securityPatch: string;
}

export const RomFlasherTab: React.FC<RomFlasherTabProps> = ({ device }) => {
  const [romInfo, setRomInfo] = useState<RomInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sideloadPath, setSideloadPath] = useState<string>('C:\\rom_update.zip');
  const [selectedPartition, setSelectedPartition] = useState<string>('boot');
  const [imagePath, setImagePath] = useState<string>('C:\\boot.img');
  const [disableVerity, setDisableVerity] = useState<boolean>(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'official' | 'custom' | 'partitions' | 'reboot'>('official');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRomInfo = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/rom/info`);
      const data = await res.json();
      if (data.success) {
        setRomInfo(data);
      } else {
        showToast(`خطا در دریافت مشخصات رام: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRomInfo();
  }, [device]);

  const handleSideload = async () => {
    if (!device) return;
    if (!sideloadPath) {
      showToast('لطفاً مسیر فایل zip را مشخص کنید.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/rom/sideload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipFilePath: sideloadPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'عملیات سایدلود با موفقیت آغاز شد.', 'success');
      } else {
        showToast(`خطا در سایدلود: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFlashPartition = async () => {
    if (!imagePath) {
      showToast('لطفاً مسیر فایل ایمیج را مشخص کنید.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device?.id || 'default'}/rom/flash-partition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partition: selectedPartition,
          imagePath,
          disableVerity
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`پارتیشن ${selectedPartition} با موفقیت فلش شد.`, 'success');
      } else {
        showToast(`خطا در فلش پارتیشن: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFastbootWipe = async () => {
    if (!confirm('هشدار: این کار تمام داده‌های کاربر (Data & Cache) را در فست‌بوت پاک می‌کند. آیا ادامه می‌دهید؟')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device?.id || 'default'}/rom/fastboot-wipe`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('وایپ و فرمت کامل فست‌بوت (fastboot -w) با موفقیت انجام شد.', 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRebootMode = async (mode: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/rom/reboot-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMode: mode })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`دستگاه به حالت ${mode} ریبوت شد.`, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
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
            <DownloadCloud className="w-6 h-6 text-cyan-400" />
            <span>استودیو آپدیت و فلش رام‌های رسمی و غیررسمی (OS & ROM Update Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            فلش آپدیت‌های رسمی کارخانه (Stock ROM / OTA)، نصب کاستوم رام‌ها (LineageOS / PixelOS)، فلش GSI و پارتیشن‌های فست‌بوت
          </p>
        </div>

        <button
          onClick={fetchRomInfo}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی مشخصات رام</span>
        </button>
      </div>

      {/* Device Architecture & ROM Specs Card */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>مشخصات فنی و پلتفرم سخت‌افزاری دستگاه</span>
          </h3>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            {romInfo?.codename || 'کدنوم ناشناخته'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">نسخه اندروید فعلی:</span>
            <p className="text-xs font-bold text-white">{romInfo?.androidVersion || 'Android 14'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">معماری پردازنده:</span>
            <p className="text-xs font-bold text-white font-mono">{romInfo?.arch || 'arm64-v8a'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">ساختار اسلات (A/B Slots):</span>
            <p className="text-xs font-bold text-cyan-400 font-mono">{romInfo?.isAB ? `فعال (Slot ${romInfo.slot})` : 'تک اسلات سنتی'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">پارتیشن پویا (Dynamic Partitions):</span>
            <p className="text-xs font-bold text-emerald-400">{romInfo?.isDynamic ? 'پشتیبانی از Super Partition' : 'پارتیشن‌های استاندارد'}</p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => setActiveSubTab('official')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'official' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>آپدیت‌های رسمی و OTA (Official Stock)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('custom')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'custom' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>کاستوم رام‌ها و GSI (LineageOS / PixelOS)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('partitions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'partitions' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>فلش دستی پارتیشن‌ها (Fastboot Partitions)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reboot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'reboot' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>محیط‌های بوت و ریکاوری (Reboot Matrix)</span>
        </button>
      </div>

      {/* SubTab 1: Official Stock ROM & OTA Sideload */}
      {activeSubTab === 'official' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADB Sideload OTA */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-cyan-400" />
                <span>نصب رسمی با ADB Sideload (فایل‌های ZIP)</span>
              </h4>
              <p className="text-xs text-slate-400">
                مناسب برای ارتقای سیستم‌عامل به صورت رسمی از طریق فایل زیپ آپدیت OTA رسمی یا ریکاوری استوک
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">مسیر فایل آپدیت (.zip):</label>
              <input
                type="text"
                value={sideloadPath}
                onChange={(e) => setSideloadPath(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
              />
            </div>

            <button
              onClick={handleSideload}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              اجرای فرآیند ADB Sideload
            </button>
          </div>

          {/* Official Stock Tools Guide */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-200">راهنمای رام‌های رسمی بر اساس برند:</h4>
            
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-amber-400">شیائومی / پوکو / ردمی (MIUI & HyperOS):</span>
                <p className="text-[11px] text-slate-400 mt-1">رام‌های Fastboot فرمت tgz با اجرای فایل‌های flash_all.bat در حالت Fastboot به طور کامل فلش می‌شوند.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-blue-400">سامسونگ (Samsung OneUI):</span>
                <p className="text-[11px] text-slate-400 mt-1">فایل‌های رسمی ۴ کاره (BL, AP, CP, CSC) در محیط Download Mode فلش می‌شوند.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="font-bold text-emerald-400">گوگل پیکسل / موتورولا (Pixel & Moto):</span>
                <p className="text-[11px] text-slate-400 mt-1">ایمیج‌های کارخانه Google Factory Images با دستور flash-all.bat در فست‌بوت فلش می‌شوند.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Custom ROMs & GSI */}
      {activeSubTab === 'custom' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>پشتیبانی از کاستوم رام‌ها و پروژه‌های متن‌باز</span>
            </h4>
            <p className="text-xs text-slate-400">
              امکان نصب انواع سیستم‌عامل‌های سفارشی بر پایه اندروید با امکانات شخصی‌سازی بالا و ارتقای گوشی‌های قدیمی به جدیدترین نسخه اندروید
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400">LineageOS & CrDroid</span>
              <p className="text-[11px] text-slate-400">محبوب‌ترین رام‌های سبک و فوق‌العاده سریع با مصرف باتری بهینه و آپدیت‌های هفتگی.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-blue-400">PixelOS & Pixel Experience</span>
              <p className="text-[11px] text-slate-400">تبدیل رابط کاربری هر گوشی به گوگل پیکسل با پشتیبانی کامل از قابلیت‌های هوش مصنوعی و دوربین گوگل.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-purple-400">Project Treble & GSI</span>
              <p className="text-[11px] text-slate-400">نصب فایل‌های Generic System Image (GSI) روی تمام گوشی‌های دارای پشتیبانی Treble بدون نیاز به پورت اختصاصی.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-cyan-200/90 leading-relaxed">
              <span className="font-bold text-cyan-300">مراحل ۳ گانه نصب استاندارد کاستوم رام:</span>
              <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-300">
                <li>آنلاک بوت‌لودر در تب «ابزارهای فست‌بوت و فلش»</li>
                <li>فلش ریکاوری کاستوم (TWRP یا OrangeFox) و اجرای فرمت دیتا (Format Data)</li>
                <li>سایدلود فایل ROM و در صورت نیاز پکیج خدمات گوگل (GApps) با ADB Sideload</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Fastboot Manual Partitions */}
      {activeSubTab === 'partitions' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>فلش مستقیم پارتیشن‌های فست‌بوت (Direct Image Flasher)</span>
            </h4>
            <p className="text-xs text-slate-400">
              فلش فایل‌های بوت، ریکاوری، سوپر و ایمیج‌های سیستمی مستقیم روی حافظه فلش گوشی
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">پارتیشن مقصد:</label>
              <select
                value={selectedPartition}
                onChange={(e) => setSelectedPartition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-cyan-500 outline-none font-mono"
              >
                <option value="boot">boot (کرنل و رام)</option>
                <option value="init_boot">init_boot (اندروید ۱۳+ جدید)</option>
                <option value="recovery">recovery (محیط بازیابی)</option>
                <option value="system">system (سیستم‌عامل و GSI)</option>
                <option value="vendor">vendor (درایورهای سازنده)</option>
                <option value="product">product (نرم‌افزارهای سیستمی)</option>
                <option value="super">super (پارتیشن تجمیعی Dynamic)</option>
                <option value="vbmeta">vbmeta (تأییدیه امنیتی بوت)</option>
                <option value="dtbo">dtbo (Device Tree Overlay)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">مسیر فایل ایمیج (.img):</label>
              <input
                type="text"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {selectedPartition === 'vbmeta' && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300">
              <input
                type="checkbox"
                checked={disableVerity}
                onChange={(e) => setDisableVerity(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-0"
              />
              <span>غیرفعال‌سازی بررسی امضای بوت (Disable AVB / Verity) جهت اجرای بدون بوت‌لوپ رام‌های غیررسمی</span>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleFlashPartition}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              فلش پارتیشن {selectedPartition}
            </button>

            <button
              onClick={handleFastbootWipe}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              فرمت و وایپ داده در فست‌بوت (fastboot -w)
            </button>
          </div>
        </div>
      )}

      {/* SubTab 4: Reboot Matrix */}
      {activeSubTab === 'reboot' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-cyan-400" />
            <span>هدایت سریع دستگاه به محیط‌های مختلف با ۱ کلیک</span>
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleRebootMode('recovery')}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 space-y-2 text-right transition-all group"
            >
              <span className="text-xs font-bold text-white group-hover:text-cyan-400">محیط Recovery</span>
              <p className="text-[11px] text-slate-400">جهت وایپ دیتا، ریست و سایدلود</p>
            </button>

            <button
              onClick={() => handleRebootMode('bootloader')}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 space-y-2 text-right transition-all group"
            >
              <span className="text-xs font-bold text-white group-hover:text-amber-400">حالت Fastboot</span>
              <p className="text-[11px] text-slate-400">جهت آنلاک و فلش ایمیج‌ها</p>
            </button>

            <button
              onClick={() => handleRebootMode('fastbootd')}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 space-y-2 text-right transition-all group"
            >
              <span className="text-xs font-bold text-white group-hover:text-blue-400">حالت FastbootD</span>
              <p className="text-[11px] text-slate-400">فلش Dynamic / Super Partitions</p>
            </button>

            <button
              onClick={() => handleRebootMode('edl')}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 space-y-2 text-right transition-all group"
            >
              <span className="text-xs font-bold text-white group-hover:text-rose-400">حالت اضطراری EDL</span>
              <p className="text-[11px] text-slate-400">کوآلکام ۹۰۰۸ جهت گوشی‌های بریک شده</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
