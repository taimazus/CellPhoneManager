import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Wifi, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Lock, 
  Unlock, 
  FileText, 
  Sparkles, 
  Smartphone, 
  Users, 
  HardDrive,
  QrCode
} from 'lucide-react';
import { Device } from '../types';

interface PasswordVaultTabProps {
  device: Device | null;
}

interface WifiNetwork {
  ssid: string;
  psk: string;
  keyMgmt: string;
  hidden: boolean;
  lastConnected: string;
}

interface AccountItem {
  type: string;
  name: string;
  syncEnabled: boolean;
  lastSync: string;
}

export const PasswordVaultTab: React.FC<PasswordVaultTabProps> = ({ device }) => {
  const [activeTab, setActiveTab] = useState<'wifi' | 'accounts' | 'generator' | 'backup'>('wifi');
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Generator state
  const [genLength, setGenLength] = useState<number>(16);
  const [genSymbols, setGenSymbols] = useState<boolean>(true);
  const [genNumbers, setGenNumbers] = useState<boolean>(true);
  const [generatedPass, setGeneratedPass] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    if (!device) return;
    setLoading(true);
    try {
      // 1. Fetch Wi-Fi Passwords
      const wifiRes = await fetch(`/api/devices/${device.id}/passwords/wifi`);
      const wifiData = await wifiRes.json();
      if (wifiData.success && wifiData.networks) {
        setWifiNetworks(wifiData.networks);
      }

      // 2. Fetch Accounts
      const accRes = await fetch(`/api/devices/${device.id}/passwords/accounts`);
      const accData = await accRes.json();
      if (accData.success && accData.accounts) {
        setAccounts(accData.accounts);
      }
    } catch (err: any) {
      showToast(`خطا در بارگذاری اطلاعات: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    generateNewPassword();
  }, [device?.id]);

  const togglePasswordVisibility = (ssid: string) => {
    setVisiblePasswords(prev => ({ ...prev, [ssid]: !prev[ssid] }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} در کلیپ‌بورد کپی شد!`, 'success');
  };

  const generateNewPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let validChars = chars;
    if (genNumbers) validChars += nums;
    if (genSymbols) validChars += syms;

    let res = '';
    for (let i = 0; i < genLength; i++) {
      res += validChars.charAt(Math.floor(Math.random() * validChars.length));
    }
    setGeneratedPass(res);
  };

  const handleExportWifi = (format: 'csv' | 'json' | 'txt') => {
    let content = '';
    let mimeType = 'text/plain';
    let fileName = `wifi_passwords_${device?.name || 'phone'}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(wifiNetworks, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = 'SSID,Password,Security,Hidden\n';
      wifiNetworks.forEach(n => {
        content += `"${n.ssid}","${n.psk}","${n.keyMgmt}",${n.hidden}\n`;
      });
      mimeType = 'text/csv';
    } else {
      content = '=== فهرست رمزهای ذخیره‌شده وای‌فای ===\n\n';
      wifiNetworks.forEach((n, idx) => {
        content += `${idx + 1}. نام شبکه (SSID): ${n.ssid}\n   رمز عبور: ${n.psk}\n   نوع امنیت: ${n.keyMgmt}\n\n`;
      });
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    showToast(`فایل رمزهای وای‌فای (${format.toUpperCase()}) با موفقیت دانلود شد.`, 'success');
  };

  const filteredWifi = wifiNetworks.filter(w => 
    w.ssid.toLowerCase().includes(search.toLowerCase())
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
            <KeyRound className="w-6 h-6 text-cyan-400" />
            <span>مدیریت رمزهای ذخیره‌شده و صندوق امن (Password & Credentials Vault)</span>
          </h2>
          <p className="text-xs text-slate-400">
            مشاهده، کپی، پشتیبان‌گیری و استخراج رمزهای وای‌فای ذخیره‌شده، حساب‌های کاربری و تولید گذرواژه‌های قدرتمند
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => setActiveTab('wifi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'wifi' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>رمزهای ذخیره‌شده Wi-Fi ({wifiNetworks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'accounts' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>حساب‌ها و اکانت‌های ذخیره‌شده ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'generator' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>تولید گذرواژه فوق‌امن</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'backup' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>خروجی و پشتیبان‌گیری فایل رمزها</span>
        </button>
      </div>

      {/* Tab 1: Wi-Fi Passwords */}
      {activeTab === 'wifi' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>شبکه‌های وای‌فای ذخیره‌شده در گوشی</span>
              </h3>
              <p className="text-xs text-slate-400">تمام شبکه‌هایی که تاکنون به آن‌ها متصل شده‌اید به همراه رمز عبور واقعی</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی نام شبکه (SSID)..."
                  className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleExportWifi('csv')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
                  title="خروجی CSV"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  onClick={() => handleExportWifi('json')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
                  title="خروجی JSON"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {loading ? (
              <div className="col-span-2 p-8 text-center text-xs text-slate-400">در حال خواندن رمزهای وای‌فای...</div>
            ) : filteredWifi.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-xs text-slate-400">شبکه‌ای یافت نشد.</div>
            ) : (
              filteredWifi.map((net) => {
                const isVisible = visiblePasswords[net.ssid] || false;
                return (
                  <div
                    key={net.ssid}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Wifi className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-mono">{net.ssid}</p>
                          <span className="text-[10px] text-slate-400">{net.keyMgmt} {net.hidden ? '• مخفی' : ''}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(net.ssid, 'نام شبکه (SSID)')}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
                        title="کپی SSID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Password Field */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {isVisible ? net.psk : '••••••••••••'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => togglePasswordVisibility(net.ssid)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                          title={isVisible ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                        </button>

                        <button
                          onClick={() => handleCopy(net.psk, 'رمز عبور')}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                          title="کپی رمز عبور"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: System Accounts */}
      {activeTab === 'accounts' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>اکانت‌ها و حساب‌های ذخیره‌شده روی دستگاه</span>
            </h3>
            <p className="text-xs text-slate-400">حساب‌های کاربری متصل به سیستم و وضعیت همگام‌سازی اطلاعات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
            {accounts.map((acc, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                    {acc.type}
                  </span>
                  <p className="text-xs font-bold text-white font-mono">{acc.name}</p>
                  <span className="text-[10px] text-slate-400">آخرین همگام‌سازی: {acc.lastSync}</span>
                </div>

                <button
                  onClick={() => handleCopy(acc.name, 'نام کاربری')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  title="کپی"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Password Generator */}
      {activeTab === 'generator' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>تولیدکننده گذرواژه‌های قدرتمند و غیرقابل نفوذ</span>
            </h3>
            <p className="text-xs text-slate-400">تولید رمزهای تصادفی با انتروپی بالا برای اکانت‌ها و شبکه‌های وای‌فای</p>
          </div>

          {/* Generated Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <span className="text-base font-mono font-bold text-cyan-400 tracking-wider break-all select-all">
              {generatedPass}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={generateNewPassword}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all"
                title="تولید رمز جدید"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleCopy(generatedPass, 'گذرواژه')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>کپی گذرواژه</span>
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>طول گذرواژه: {genLength} کاراکتر</span>
              <input
                type="range"
                min={8}
                max={32}
                value={genLength}
                onChange={(e) => {
                  setGenLength(Number(e.target.value));
                  generateNewPassword();
                }}
                className="w-48 accent-cyan-400"
              />
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genNumbers}
                  onChange={(e) => {
                    setGenNumbers(e.target.checked);
                    generateNewPassword();
                  }}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span>شامل اعداد (0-9)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genSymbols}
                  onChange={(e) => {
                    setGenSymbols(e.target.checked);
                    generateNewPassword();
                  }}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span>شامل نشانه‌ها (!@#$)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Backup Vault Export */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <span>پشتیبان‌گیری و خروجی کامل صندوق گذرواژه‌ها</span>
            </h3>
            <p className="text-xs text-slate-400">
              استخراج تمامی رمزهای وای‌فای و اکانت‌ها در قالب فایل‌های استاندارد جهت انتقال به سایر دستگاه‌ها یا برنامه‌های مدیریت پسورد (Bitwarden, KeePass, Google)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400">خروجی اکسل و CSV</span>
                <p className="text-[11px] text-slate-400">سازگار با تمامی نرم‌افزارهای Password Manager نظیر Bitwarden و 1Password</p>
              </div>

              <button
                onClick={() => handleExportWifi('csv')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                دانلود فایل CSV
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-cyan-400">خروجی JSON ساختاریافته</span>
                <p className="text-[11px] text-slate-400">فرمت استاندارد برنامه‌نویسی جهت وارد کردن به سایر گوشی‌ها و ابزارها</p>
              </div>

              <button
                onClick={() => handleExportWifi('json')}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                دانلود فایل JSON
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-400">خروجی متن ساده (TXT)</span>
                <p className="text-[11px] text-slate-400">جهت پرینت، بایگانی متنی یا ذخیره در یادداشت‌های آفلاین</p>
              </div>

              <button
                onClick={() => handleExportWifi('txt')}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                دانلود فایل TXT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
