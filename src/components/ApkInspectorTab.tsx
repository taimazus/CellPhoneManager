import React, { useState } from 'react';
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
  MapPin
} from 'lucide-react';
import { Device } from '../types';

interface ApkInspectorTabProps {
  device: Device | null;
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
  const [packageName, setPackageName] = useState<string>('org.telegram.messenger');
  const [inspection, setInspection] = useState<AppInspection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleInspect = async (pkg = packageName) => {
    if (!device || !pkg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/apps/inspect?packageName=${pkg.trim()}`);
      const data = await res.json();
      if (data.success) {
        setInspection(data);
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
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>آنالایزر امنیتی و اسکنر دسترسی‌های APK (Security & Permission Inspector)</span>
          </h2>
          <p className="text-xs text-slate-400">
            بررسی دسترسی‌های حساس (میکروفون، دوربین، پیامک، مخاطبین)، استخراج Target SDK و مانیفست پکیج‌های نصب‌شده
          </p>
        </div>
      </div>

      {/* Search Package Input */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="نام پکیج را وارد کنید (مثال: org.telegram.messenger)..."
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
            className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
          <button
            onClick={() => handleInspect()}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>اسکن امنیتی پکیج</span>
          </button>
        </div>

        {/* Quick App Suggestions */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500">پیشنهادات سریع:</span>
          {[
            { name: 'تلگرام', pkg: 'org.telegram.messenger' },
            { name: 'واتس‌اپ', pkg: 'com.whatsapp' },
            { name: 'اینستاگرام', pkg: 'com.instagram.android' },
            { name: 'دوربین سیستم', pkg: 'com.android.camera' }
          ].map((item) => (
            <button
              key={item.pkg}
              onClick={() => {
                setPackageName(item.pkg);
                handleInspect(item.pkg);
              }}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono"
            >
              {item.name}
            </button>
          ))}
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
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between">
                <span className="text-slate-400">نام پکیج:</span>
                <span className="font-mono text-cyan-300 font-bold">{inspection.packageName}</span>
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
                    <div className="font-mono font-bold">{perm.name}</div>
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
