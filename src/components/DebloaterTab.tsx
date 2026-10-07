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
  Info
} from 'lucide-react';
import { Device } from '../types';

interface DebloaterTabProps {
  device: Device | null;
}

interface BloatItem {
  packageName: string;
  appName: string;
  vendor: 'xiaomi' | 'samsung' | 'google';
  risk: string;
  desc: string;
  installed?: boolean;
}

export const DebloaterTab: React.FC<DebloaterTabProps> = ({ device }) => {
  const [items, setItems] = useState<BloatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [vendorFilter, setVendorFilter] = useState<'all' | 'xiaomi' | 'samsung' | 'google'>('all');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBloatware = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/debloat/scan`);
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
  }, [device?.id]);

  const handleUninstall = async (packageName: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/debloat/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setItems(items.map(i => i.packageName === packageName ? { ...i, installed: false } : i));
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
      const res = await fetch(`/api/devices/${device.id}/debloat/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setItems(items.map(i => i.packageName === packageName ? { ...i, installed: true } : i));
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
            <Trash2 className="w-6 h-6 text-rose-400" />
            <span>حذف برنامه‌های تبلیغاتی و پس‌زمینه پیش‌فرض (System Debloater & Privacy Purge)</span>
          </h2>
          <p className="text-xs text-slate-400">
            حذف امن سرویس‌های تبلیغاتی و رهگیری شیائومی (MSA, Analytics)، سامسونگ (Bixby, Pay) و گوگل بدون آسیب یا بریک شدن گوشی
          </p>
        </div>

        {/* Vendor Filter */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'همه' },
            { id: 'xiaomi', label: 'شیائومی (MIUI)' },
            { id: 'samsung', label: 'سامسونگ' },
            { id: 'google', label: 'گوگل' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setVendorFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
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
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
            <span className="text-xs">در حال اسکن سرویس‌های پس‌زمینه گوشی...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">
            هیچ برنامه Bloatware در این دسته یافت نشد.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => (
              <div key={item.packageName} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-xs">{item.appName}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                      {item.packageName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      حذف امن (Safe)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {item.installed !== false ? (
                    <button
                      onClick={() => handleUninstall(item.packageName)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف امن (Uninstall)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(item.packageName)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بازیابی و نصب مجدد</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
