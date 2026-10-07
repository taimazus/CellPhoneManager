import React, { useState } from 'react';
import { 
  Smartphone, 
  Layers, 
  Zap, 
  RotateCw, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Share2,
  HardDrive,
  Copy
} from 'lucide-react';
import { Device } from '../types';

interface MultiDeviceTabProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (dev: Device) => void;
}

export const MultiDeviceTab: React.FC<MultiDeviceTabProps> = ({ devices, selectedDevice, onSelectDevice }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(devices.map(d => d.id));
  const [syncAction, setSyncAction] = useState<string>('home');
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: string, payload: any = {}) => {
    if (selectedIds.length === 0) {
      showToast('حداقل یک دستگاه را انتخاب کنید.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/devices/bulk/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds: selectedIds, action, payload })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`عملیات ${action} همزمان روی ${data.count} دستگاه با موفقیت اجرا شد!`, 'success');
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
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>مدیریت و کنترل همزمان چند دستگاه (Multi-Device Farm & Fleet Sync)</span>
          </h2>
          <p className="text-xs text-slate-400">
            کنترل موازی چندین گوشی، ارسال همزمان کلیک و دستورات سیستمی، ریبوت گروهی و پاکسازی کش تمام دستگاه‌ها با ۱ کلیک
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedIds(devices.map(d => d.id))}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold"
          >
            انتخاب همه ({devices.length})
          </button>
        </div>
      </div>

      {/* Bulk Controls Bar */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>فرمان‌های گروهی و همگام‌سازی (Synchronized Broadcast):</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleBulkAction('key', { keycode: 3 })} // HOME
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-white transition-all active:scale-95"
          >
            📱 دکمه Home (همه گوشی‌ها)
          </button>

          <button
            onClick={() => handleBulkAction('key', { keycode: 4 })} // BACK
            disabled={loading}
            className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-white transition-all active:scale-95"
          >
            🔙 دکمه بازگشت Back (همه)
          </button>

          <button
            onClick={() => handleBulkAction('clean_cache')}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-all active:scale-95"
          >
            ⚡ توربو پاکسازی کش گروهی
          </button>

          <button
            onClick={() => handleBulkAction('reboot', { mode: 'normal' })}
            disabled={loading}
            className="p-3.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-bold text-rose-400 transition-all active:scale-95"
          >
            🔄 ریبوت همزمان دستگاه‌ها
          </button>
        </div>
      </div>

      {/* Connected Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((dev) => {
          const isChecked = selectedIds.includes(dev.id);
          return (
            <div
              key={dev.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                isChecked 
                  ? 'glass-panel border-cyan-500/50 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-blue-950/20' 
                  : 'bg-slate-900/50 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold text-lg shadow-md shadow-cyan-500/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{dev.model}</h4>
                    <p className="text-xs text-cyan-400 font-mono mt-0.5">{dev.serial}</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(dev.id)}
                  className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>سطح باتری:</span>
                  <span className="font-mono text-emerald-400 font-bold">{dev.battery?.level || 80}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>سیستم‌عامل:</span>
                  <span className="font-mono text-cyan-300">Android {dev.androidVersion || '13'}</span>
                </div>
              </div>

              <button
                onClick={() => onSelectDevice(dev)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                انتخاب به عنوان دستگاه اصلی
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
