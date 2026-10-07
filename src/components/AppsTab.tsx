import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Upload, 
  Trash2, 
  Snowflake, 
  Play, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  DownloadCloud,
  FileCode,
  ShieldAlert,
  Eraser,
  ArrowUpDown
} from 'lucide-react';
import { Device, DeviceApp } from '../types';
import { AppIcon } from './AppIcon';

interface AppsTabProps {
  device: Device | null;
}

export const AppsTab: React.FC<AppsTabProps> = ({ device }) => {
  const [apps, setApps] = useState<DeviceApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system' | 'frozen'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'pkg_asc' | 'size_desc'>('name_asc');
  const [isInstalling, setIsInstalling] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchApps = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/apps?type=${device.type}`);
      const data = await res.json();
      if (data.apps) {
        setApps(data.apps);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [device?.id]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !device) return;

    setIsInstalling(true);
    const formData = new FormData();
    formData.append('packageFile', file);

    try {
      const res = await fetch(`/api/devices/${device.id}/apps/install?type=${device.type}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast(`نصب ${file.name} با موفقیت انجام شد!`, 'success');
        fetchApps();
      } else {
        showToast(`خطا در نصب: ${data.error || 'فایل نامعتبر است'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در آپلود: ${err.message}`, 'error');
    } finally {
      setIsInstalling(false);
      e.target.value = '';
    }
  };

  const handleUninstall = async (packageName: string) => {
    if (!device) return;
    if (!confirm(`آیا از حذف کامل برنامه ${packageName} اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/devices/${device.id}/apps/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName, type: device.type })
      });
      const data = await res.json();
      if (data.success) {
        showToast('برنامه با موفقیت حذف گردید', 'success');
        setApps(apps.filter(a => a.packageName !== packageName));
      } else {
        showToast(`خطا در حذف: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleToggleFreeze = async (packageName: string, currentEnabled: boolean) => {
    if (!device) return;
    const targetEnable = !currentEnabled;

    try {
      const res = await fetch(`/api/devices/${device.id}/apps/toggle-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName, enable: targetEnable, type: device.type })
      });
      const data = await res.json();
      if (data.success) {
        showToast(targetEnable ? 'برنامه فعال شد' : 'برنامه با موفقیت فریز (غیرفعال) شد', 'success');
        setApps(apps.map(a => a.packageName === packageName ? { ...a, enabled: targetEnable } : a));
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const filteredApps = apps
    .filter((app) => {
      const matchesSearch = app.appName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'user') return !app.isSystem;
      if (filterType === 'system') return app.isSystem;
      if (filterType === 'frozen') return !app.enabled;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.appName.localeCompare(b.appName, 'fa');
      if (sortBy === 'name_desc') return b.appName.localeCompare(a.appName, 'fa');
      if (sortBy === 'pkg_asc') return a.packageName.localeCompare(b.packageName);
      return 0;
    });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          notification.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Banner / Install Zone */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>مدیریت و نصب بسته‌های نرم‌افزاری ({device?.type === 'ios' ? 'IPA' : 'APK / XAPK'})</span>
          </h2>
          <p className="text-xs text-slate-400">
            امکان نصب بدون محدودیت، حذف برنامه‌های کاربری، فریز و غیرفعال‌سازی Bloatwareهای سیستمی سامسونگ، شیائومی، هواوی و اپل
          </p>
        </div>

        {/* Install File Button & Hidden Input */}
        <div className="relative">
          <input
            type="file"
            id="packageFileInput"
            accept={device?.type === 'ios' ? '.ipa' : '.apk,.apks,.xapk'}
            onChange={handleFileUpload}
            disabled={isInstalling}
            className="hidden"
          />
          <label
            htmlFor="packageFileInput"
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm cursor-pointer shadow-lg transition-all ${
              isInstalling
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <Upload className={`w-4 h-4 ${isInstalling ? 'animate-bounce' : ''}`} />
            <span>{isInstalling ? 'در حال نصب بسته...' : 'انتخاب و نصب فایل برنامه'}</span>
          </label>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar & Sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در نام یا پکیج برنامه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="name_asc" className="bg-slate-900 text-slate-200">نام (الف - ی)</option>
              <option value="name_desc" className="bg-slate-900 text-slate-200">نام (ی - الف)</option>
              <option value="pkg_asc" className="bg-slate-900 text-slate-200">نام پکیج</option>
            </select>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `همه (${apps.length})` },
            { id: 'user', label: `کاربری (${apps.filter(a => !a.isSystem).length})` },
            { id: 'system', label: `سیستمی (${apps.filter(a => a.isSystem).length})` },
            { id: 'frozen', label: `غیرفعال / فریز (${apps.filter(a => !a.enabled).length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filterType === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={fetchApps}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="تازه سازی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-sm">در حال بارگذاری لیست بسته‌ها...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 text-center text-slate-400 border border-slate-800">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm">برنامه‌ای با این مشخصات یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.packageName}
              className={`rounded-2xl p-4 glass-panel border transition-all flex flex-col justify-between ${
                !app.enabled 
                  ? 'border-cyan-500/30 bg-slate-950/40 opacity-70' 
                  : 'border-slate-800/80 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-start gap-3.5 mb-3">
                <AppIcon 
                  packageName={app.packageName} 
                  appName={app.appName} 
                  isSystem={app.isSystem} 
                  size="md" 
                />
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-white truncate">
                      {app.appName}
                    </h4>
                    {app.isSystem ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        System
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        User
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate" title={app.packageName}>
                    {app.packageName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    نسخه: {app.version || '1.0'} {app.size !== 'N/A' && `• حجم: ${app.size}`}
                  </p>
                </div>
              </div>

              {/* Action Buttons for App */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/60">
                {/* Freeze / Unfreeze Button */}
                <button
                  onClick={() => handleToggleFreeze(app.packageName, app.enabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    app.enabled
                      ? 'bg-slate-900 hover:bg-cyan-500/10 text-cyan-400 border-slate-700 hover:border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                  title={app.enabled ? 'فریز و غیرفعال کردن برنامه' : 'فعال‌سازی مجدد'}
                >
                  {app.enabled ? <Snowflake className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{app.enabled ? 'فریز' : 'فعال‌سازی'}</span>
                </button>

                {/* Uninstall Button */}
                <button
                  onClick={() => handleUninstall(app.packageName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition-all"
                  title="حذف کامل برنامه از دستگاه"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
