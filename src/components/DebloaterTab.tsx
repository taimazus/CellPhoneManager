import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { Device } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { AppIcon } from './AppIcon';

interface DebloaterTabProps {
  device: Device | null;
}

interface BloatItem {
  packageName: string;
  appName: string;
  vendor: 'xiaomi' | 'samsung' | 'huawei' | 'oppo' | 'google' | 'universal';
  risk: string;
  desc: string;
  installed?: boolean;
  enabled?: boolean;
}

export const DebloaterTab: React.FC<DebloaterTabProps> = ({ device }) => {
  const [items, setItems] = useState<BloatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [vendorFilter, setVendorFilter] = useState<'all' | 'xiaomi' | 'samsung' | 'huawei' | 'oppo' | 'google' | 'universal'>('all');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auto-detect phone manufacturer
  const detectBrand = () => {
    if (!device) return 'all';
    const name = (device.name || '').toLowerCase();
    const model = (device.model || '').toLowerCase();
    const mfg = (device.manufacturer || '').toLowerCase();
    const all = `${name} ${model} ${mfg}`;

    if (all.includes('xiaomi') || all.includes('redmi') || all.includes('poco') || all.includes('2201116')) return 'xiaomi';
    if (all.includes('samsung') || all.includes('galaxy') || all.includes('sm-')) return 'samsung';
    if (all.includes('huawei') || all.includes('honor')) return 'huawei';
    if (all.includes('oppo') || all.includes('realme') || all.includes('oneplus')) return 'oppo';
    if (all.includes('pixel') || all.includes('google')) return 'google';
    return 'all';
  };

  const detectedVendor = detectBrand();

  const fetchBloatware = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/debloat/scan`);
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloatware();
    const brand = detectBrand();
    if (brand !== 'all') {
      setVendorFilter(brand as any);
    }
  }, [device?.id]);

  const handleUninstall = async (packageName: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/debloat/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setItems(items.map(i => i.packageName === packageName ? { ...i, enabled: false } : i));
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleRestore = async (packageName: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/debloat/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setItems(items.map(i => i.packageName === packageName ? { ...i, enabled: true, installed: true } : i));
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const filteredItems = items.filter(i => {
    if (vendorFilter === 'all') return true;
    return i.vendor === vendorFilter;
  });

  const activeCount = items.filter(i => i.installed && i.enabled !== false).length;
  const disabledCount = items.filter(i => i.installed && i.enabled === false).length;

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Trash2 className="w-6 h-6 text-rose-400" />
              <span>حذف و مسدودسازی برنامه‌های تبلیغاتی پیش‌فرض (System Debloater)</span>
            </h2>
            {detectedVendor !== 'all' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                تشخیص هوشمند: {detectedVendor.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            حذف و غیرفعال‌سازی امن سرویس‌های تبلیغاتی، ردیاب‌ها و برنامه‌های اضافی بدون نیاز به روت و بدون آسیب به سیستم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-emerald-400 font-bold">{disabledCount} مسدود شده</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">{activeCount} فعال</span>
          </div>

          <button
            onClick={fetchBloatware}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition-all"
            title="بروزرسانی وضعیت"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'همه برنامه‌ها' },
            { id: 'xiaomi', label: 'شیائومی (MIUI / HyperOS)' },
            { id: 'samsung', label: 'سامسونگ (One UI)' },
            { id: 'huawei', label: 'هواوی (EMUI)' },
            { id: 'oppo', label: 'اوپو / وان‌پلاس / ریلمی' },
            { id: 'universal', label: 'تبلیغات عمومی و فیسبوک' },
            { id: 'google', label: 'گوگل' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setVendorFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                vendorFilter === f.id ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-3">
        {loading ? (
          <div className="p-16 text-center">
            <LoadingSpinner
              size="lg"
              variant="cyan"
              text="در حال اسکن و بررسی سرویس‌های پس‌زمینه و تبلیغاتی گوشی..."
              subtext="شناسایی Bloatware و بسته‌های سیستمی غیرضروری"
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            هیچ برنامه اضافه‌ای در این دسته یافت نشد.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => {
              const isBlocked = item.installed && item.enabled === false;
              const isActive = item.installed && item.enabled !== false;
              const notFound = !item.installed;

              return (
                <div key={item.packageName} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AppIcon 
                      packageName={item.packageName} 
                      appName={item.appName} 
                      isSystem={true} 
                      size="sm" 
                      deviceId={device?.id} 
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-xs">{item.appName}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300" dir="ltr">
                          {item.packageName}
                        </span>

                        {isBlocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            <span>غیرفعال و مسدود شده</span>
                          </span>
                        )}

                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <span>در حال اجرا روی گوشی</span>
                          </span>
                        )}

                        {notFound && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          روی این رام موجود نیست
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isBlocked ? (
                      <button
                        onClick={() => handleRestore(item.packageName)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>بازیابی و فعال‌سازی مجدد</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUninstall(item.packageName)}
                        disabled={notFound}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف یا مسدودسازی امن</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
