import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Device } from '../types';

interface AppClonerTabProps {
  device: Device | null;
}

interface UserProfile {
  id: string;
  name: string;
  isWork: boolean;
}

export const AppClonerTab: React.FC<AppClonerTabProps> = ({ device }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [clonePkg, setClonePkg] = useState<string>('org.telegram.messenger');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfiles = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/cloner/profiles`);
      const data = await res.json();
      if (data.users) setProfiles(data.users);
    } catch {
      // quiet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [device?.id]);

  const handleCreateProfile = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/cloner/create-profile`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchProfiles();
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleCloneApp = async (pkg = clonePkg) => {
    if (!device || !pkg.trim()) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/cloner/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: pkg, userId: '10' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
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
            <Copy className="w-6 h-6 text-cyan-400" />
            <span>شبیه‌ساز و ساخت نسخه دوم برنامه‌ها (Dual Apps & Work Profile Cloner)</span>
          </h2>
          <p className="text-xs text-slate-400">
            داشتن دو اکانت مجزا و مستقل از تلگرام، واتس‌اپ، ایتا، بله و بازی‌ها روی یک گوشی بدون نیاز به روت
          </p>
        </div>

        <button
          onClick={handleCreateProfile}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>ساخت فضای دوم (Dual Space Profile)</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Profiles */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>پروفایل‌های کاربری فعال ({profiles.length})</span>
          </h3>

          <div className="space-y-2 text-xs">
            {profiles.map((p) => (
              <div key={p.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">User ID: {p.id}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  p.isWork ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {p.isWork ? 'فضای دوم' : 'اصلی'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clone App Form */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Copy className="w-5 h-5 text-emerald-400" />
            <span>نصب و کلون نسخه دوم برنامه</span>
          </h3>

          <div className="space-y-3">
            <label className="text-xs text-slate-300 font-bold block">نام پکیج جهت ساخت نسخه دوم:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={clonePkg}
                onChange={(e) => setClonePkg(e.target.value)}
                placeholder="مثال: org.telegram.messenger"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleCloneApp()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                فعال‌سازی نسخه دوم
              </button>
            </div>

            {/* Quick App Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">برنامه‌های پیشنهادی برای داشتن ۲ اکانت:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { name: 'تلگرام (اکانت ۲)', pkg: 'org.telegram.messenger' },
                  { name: 'واتس‌اپ (شماره ۲)', pkg: 'com.whatsapp' },
                  { name: 'ایتا (Eitaa)', pkg: 'ir.eitaa.messenger' },
                  { name: 'روبیکا (Rubika)', pkg: 'ir.resaneh1.iptv' }
                ].map((item) => (
                  <button
                    key={item.pkg}
                    onClick={() => {
                      setClonePkg(item.pkg);
                      handleCloneApp(item.pkg);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-right transition-all"
                  >
                    <div className="font-bold text-white text-xs">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.pkg}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
