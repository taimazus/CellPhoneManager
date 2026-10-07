import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  FileCode, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  Info,
  Lock,
  Camera,
  Mic,
  MessageSquare,
  MapPin,
  RefreshCw,
  Smartphone,
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  AppWindow,
  Filter
} from 'lucide-react';
import { Device } from '../types';

interface ApkInspectorTabProps {
  device: Device | null;
}

interface InstalledApp {
  packageName: string;
  appName: string;
  isSystem: boolean;
  apkPath?: string;
  enabled?: boolean;
}

interface AppInspection {
  packageName: string;
  versionName: string;
  versionCode: string;
  targetSdk: string;
  minSdk: string;
  riskScore: string;
  criticalCount: number;
  permissionsCount: number;
  permissions: Array<{ name: string; shortName: string; category: string; desc: string }>;
}

export const ApkInspectorTab: React.FC<ApkInspectorTabProps> = ({ device }) => {
  const [packageName, setPackageName] = useState<string>('com.whatsapp');
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [appSearch, setAppSearch] = useState<string>('');
  const [appFilter, setAppFilter] = useState<'user' | 'system' | 'all'>('user');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loadingApps, setLoadingApps] = useState<boolean>(false);
  const [inspection, setInspection] = useState<AppInspection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInstalledApps = async () => {
    if (!device) return;
    setLoadingApps(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/apps?type=${device.platform || 'android'}`);
      const data = await res.json();
      if (data.apps && Array.isArray(data.apps)) {
        setInstalledApps(data.apps);
        // Default select first user app or whatsapp
        if (data.apps.length > 0 && !packageName) {
          const firstUserApp = data.apps.find((a: InstalledApp) => !a.isSystem);
          if (firstUserApp) {
            setPackageName(firstUserApp.packageName);
            handleInspect(firstUserApp.packageName);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchInstalledApps();
  }, [device?.id]);

  const handleInspect = async (pkg = packageName) => {
    if (!device || !pkg.trim()) return;
    setLoading(true);
    setIsDropdownOpen(false);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/apps/inspect?packageName=${encodeURIComponent(pkg.trim())}`);
      const data = await res.json();
      if (data.success) {
        setInspection(data);
        setPackageName(pkg.trim());
        showToast('آنالیز امنیتی پکیج با موفقیت انجام شد.', 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = installedApps.filter(app => {
    const matchesFilter = appFilter === 'all' || (appFilter === 'user' ? !app.isSystem : app.isSystem);
    const query = appSearch.toLowerCase().trim();
    const matchesSearch = !query || app.packageName.toLowerCase().includes(query) || (app.appName && app.appName.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

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
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>آنالایزر امنیتی و اسکنر دسترسی‌های APK (Security & Permission Inspector)</span>
          </h2>
          <p className="text-xs text-slate-400">
            انتخاب مستقیم از بین تمام برنامه‌های نصب‌شده، بررسی دسترسی‌های حساس (میکروفون، دوربین، پیامک)، استخراج Target SDK و مانیفست
          </p>
        </div>

        <button
          onClick={fetchInstalledApps}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 text-xs font-bold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loadingApps ? 'animate-spin' : ''}`} />
          <span>بروزرسانی لیست برنامه‌ها ({installedApps.length})</span>
        </button>
      </div>

      {/* App Selector Card */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AppWindow className="w-4 h-4 text-cyan-400" />
            <span>انتخاب برنامه از لیست اپلیکیشن‌های نصب‌شده روی گوشی:</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredApps.length} برنامه موجود در این دسته
          </span>
        </div>

        {/* Filter Pills & App Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filter Pills */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs">
            <button
              onClick={() => setAppFilter('user')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                appFilter === 'user' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              نصب‌شده کاربر ({installedApps.filter(a => !a.isSystem).length})
            </button>
            <button
              onClick={() => setAppFilter('system')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                appFilter === 'system' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              سیستمی ({installedApps.filter(a => a.isSystem).length})
            </button>
            <button
              onClick={() => setAppFilter('all')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                appFilter === 'all' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              همه ({installedApps.length})
            </button>
          </div>

          {/* Search App Filter */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="جستجو در بین برنامه‌ها یا پکیج‌ها (مثلاً Telegram, Snapp, Camera)..."
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          </div>
        </div>

        {/* Scrollable Apps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {loadingApps ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>در حال خواندن لیست کامل برنامه‌ها از روی گوشی...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs">
              برنامه‌ای با این عبارت جستجو یافت نشد.
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = packageName === app.packageName;
              return (
                <button
                  key={app.packageName}
                  onClick={() => {
                    setPackageName(app.packageName);
                    handleInspect(app.packageName);
                  }}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-2.5 group ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-xs truncate flex items-center gap-1.5">
                      <span className={isSelected ? 'text-cyan-300' : 'text-white'}>
                        {app.appName || app.packageName.split('.').pop()}
                      </span>
                      {app.isSystem && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          سیستمی
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate text-left" dir="ltr">
                      {app.packageName}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1.5 rounded-xl bg-cyan-500 text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Manual Package Input Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              placeholder="یا نام پکیج دلخواه را دستی وارد کنید (مثلاً org.telegram.messenger)..."
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-left"
              dir="ltr"
            />
          </div>
          <button
            onClick={() => handleInspect()}
            disabled={loading || !packageName.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'در حال اسکن امنیتی...' : 'اسکن امنیتی و استخراج مجوزها'}</span>
          </button>
        </div>
      </div>

      {/* Inspection Results */}
      {inspection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Risk Card */}
          <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">امتیاز ریسک و مشخصات</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                inspection.criticalCount > 0 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {inspection.riskScore}
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">نام پکیج:</span>
                <span className="font-mono text-cyan-300 font-bold truncate max-w-[180px]" dir="ltr">{inspection.packageName}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">نسخه برنامه:</span>
                <span className="font-mono text-slate-200">{inspection.versionName} ({inspection.versionCode})</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Target SDK:</span>
                <span className="font-mono text-emerald-400 font-bold">{inspection.targetSdk}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">تعداد کل دسترسی‌ها:</span>
                <span className="font-mono text-slate-200 font-bold">{inspection.permissionsCount} مجوز</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">دسترسی‌های حساس/خطرناک:</span>
                <span className="font-mono text-rose-400 font-bold">{inspection.criticalCount} مورد</span>
              </div>
            </div>
          </div>

          {/* Permissions Breakdown List */}
          <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <span>لیست مجوزهای اعلام‌شده در Manifest ({inspection.permissions.length})</span>
            </h3>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {inspection.permissions.map((perm, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                    perm.category === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : perm.category === 'medium'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-left" dir="ltr">{perm.name}</div>
                    <div className="text-[10px] text-slate-400">{perm.desc}</div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                    perm.category === 'critical' ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {perm.category === 'critical' ? 'حساس' : 'عادی'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
