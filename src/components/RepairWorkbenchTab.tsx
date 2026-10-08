import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, 
  FileText, 
  Unlock, 
  Smartphone, 
  Radio, 
  Cpu, 
  Zap, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  X, 
  Plus, 
  RefreshCw, 
  Layers, 
  HardDrive, 
  Flame, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Download, 
  QrCode, 
  ExternalLink,
  BatteryCharging,
  Trash2,
  Lock,
  Phone,
  User,
  Clock,
  KeyRound
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface RepairWorkbenchTabProps {
  device: Device | null;
}

interface JobSheet {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  deviceSerial: string;
  deviceImei: string;
  deviceBatteryHealth: string;
  problemDescription: string;
  estimatedCost: number;
  depositAmount: number;
  technicianNotes: string;
  status: 'pending' | 'in_repair' | 'ready' | 'delivered';
  shopName: string;
  shopPhone: string;
  shopAddress: string;
}

interface SecretCodeItem {
  brand: string;
  code: string;
  title: string;
  desc: string;
  intent: string;
}

export const RepairWorkbenchTab: React.FC<RepairWorkbenchTabProps> = ({ device }) => {
  const [activeSubTab, setActiveSubTab] = useState<'jobsheet' | 'frp' | 'brokenscreen' | 'codes' | 'imei' | 'charging' | 'glitches'>('jobsheet');

  // Job Sheets State
  const [jobSheets, setJobSheets] = useState<JobSheet[]>([]);
  const [selectedSheetForPrint, setSelectedSheetForPrint] = useState<JobSheet | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [problemDesc, setProblemDesc] = useState<string>('تعویض ال‌سی‌دی و بررسی باتری');
  const [estimatedCost, setEstimatedCost] = useState<string>('1500000');
  const [depositAmount, setDepositAmount] = useState<string>('500000');
  const [technicianNotes, setTechnicianNotes] = useState<string>('دستگاه دارای خط و خش روی فریم است.');

  // FRP State
  const [mtpUrl, setMtpUrl] = useState<string>('https://www.google.com');
  const [xiaomiStatus, setXiaomiStatus] = useState<any>(null);

  // Broken Screen State
  const [pinCode, setPinCode] = useState<string>('');
  const [extractedStats, setExtractedStats] = useState<any>(null);

  // Secret Codes State
  const [secretCodes, setSecretCodes] = useState<SecretCodeItem[]>([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [codesSearch, setCodesSearch] = useState<string>('');

  // IMEI & Baseband Diagnostics
  const [imeiDiag, setImeiDiag] = useState<any>(null);

  // Charging Meter
  const [chargingTelemetry, setChargingTelemetry] = useState<any>(null);

  // Global State
  const [loading, setLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch initial data
  const loadJobSheets = async () => {
    try {
      const res = await fetch('/api/repair/jobsheets');
      const data = await res.json();
      if (data.success && data.jobSheets) {
        setJobSheets(data.jobSheets);
      }
    } catch (err) {
      console.error('Error fetching job sheets:', err);
    }
  };

  const loadSecretCodes = async () => {
    try {
      const res = await fetch('/api/repair/secret-codes');
      const data = await res.json();
      if (data.success && data.codes) {
        setSecretCodes(data.codes);
      }
    } catch (err) {
      console.error('Error fetching secret codes:', err);
    }
  };

  const loadDiagnostics = useCallback(async () => {
    if (!device) return;
    try {
      const [imeiRes, chargeRes, miRes] = await Promise.all([
        fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/diagnostics/imei-baseband`),
        fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/diagnostics/charging-power`),
        fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/frp/xiaomi-status`)
      ]);

      const [imeiData, chargeData, miData] = await Promise.all([
        imeiRes.json(),
        chargeRes.json(),
        miRes.json()
      ]);

      if (imeiData.success) setImeiDiag(imeiData);
      if (chargeData.success) setChargingTelemetry(chargeData);
      if (miData.success) setXiaomiStatus(miData);
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
    }
  }, [device]);

  useEffect(() => {
    loadJobSheets();
    loadSecretCodes();
    loadDiagnostics();
  }, [loadDiagnostics]);

  // =========================================================================
  // Actions
  // =========================================================================
  const handleCreateJobSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/repair/jobsheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deviceModel: device?.model || device?.name || 'گوشی همراه',
          deviceSerial: device?.serial || 'N/A',
          deviceImei: imeiDiag?.imei1 || 'N/A',
          deviceBatteryHealth: `${device?.battery?.level || 85}% (${device?.battery?.health || 'Good'})`,
          problemDescription: problemDesc,
          estimatedCost: parseInt(estimatedCost, 10) || 0,
          depositAmount: parseInt(depositAmount, 10) || 0,
          technicianNotes
        })
      });
      const data = await res.json();
      if (data.success && data.jobSheet) {
        showToast('قبض پذیرش با موفقیت صادر و ثبت شد!', 'success');
        setJobSheets(prev => [data.jobSheet, ...prev]);
        setSelectedSheetForPrint(data.jobSheet);
        setShowNewJobModal(false);
      } else {
        showToast(`خطا: ${data.error || 'خطا در ثبت'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: JobSheet['status']) => {
    try {
      const res = await fetch(`/api/repair/jobsheets/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast('وضعیت تعمیر قبض به‌روزرسانی شد.', 'success');
        setJobSheets(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDeleteSheet = async (id: string) => {
    try {
      const res = await fetch(`/api/repair/jobsheets/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('قبض با موفقیت حذف شد.', 'success');
        setJobSheets(prev => prev.filter(j => j.id !== id));
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleLaunchMtpBrowser = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/frp/mtp-browser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: mtpUrl })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, 'success');
      else showToast(`خطا: ${data.error}`, 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleTriggerSamsungAdb = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/frp/samsung-adb`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) showToast(data.message, 'success');
      else showToast(`خطا: ${data.error}`, 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleExtractBrokenScreen = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/broken-screen/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: ['contacts', 'sms', 'photos', 'downloads'] })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setExtractedStats(data.stats);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInjectPin = async () => {
    if (!device || !pinCode) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/broken-screen/inject-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setPinCode('');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleExecuteCode = async (codeItem: SecretCodeItem) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/secret-codes/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeItem })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, 'success');
      else showToast(`خطا: ${data.error}`, 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleFixGlitch = async (glitchType: string) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(device.id)}/repair/glitch-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glitchType })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, 'success');
      else showToast(`خطا: ${data.error}`, 'error');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Filter secret codes
  const filteredCodes = secretCodes.filter(c => {
    if (selectedBrandFilter !== 'all' && c.brand !== selectedBrandFilter) return false;
    if (!codesSearch.trim()) return true;
    const q = codesSearch.toLowerCase().trim();
    return c.title.toLowerCase().includes(q) || c.code.includes(q) || c.desc.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right pb-12" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-500/90 text-slate-950 border border-emerald-400' 
            : 'bg-rose-500/90 text-white border border-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Guide Card */}
      <TabGuideCard
        title="جعبه‌ابزار تخصصی و میزکار تعمیرکاران موبایل (Technician Workbench)"
        description="سیستم اتوماتیک پذیرش و صدور فاکتور مشتری، نجات اطلاعات گوشی‌های تاچ شکسته، ابزارهای حذف FRP، بانک کدهای مهندسی و تستر مدار شارژ."
        features={[
          "صدور قبض و فاکتور چاپی: خواندن خودکار مشخصات گوشی با کابل و صدور رسید رسمی با بارکد و قوانین تحویل برای مشتری.",
          "نجات اطلاعات تاچ شکسته: تخلیه ۱-کلیکه تمام عکس‌ها، پیام‌ها، مخاطبین و دانلودها و آنلاک پین با کیبورد کامپیوتر.",
          "بانک کدهای مخفی و مهندسی: باز کردن مستقیم منوهای تست سامسونگ (*#0*#)، شیائومی (CIT) و هواوی بدون نیاز به تاچ صفحه.",
          "تستر مدار شارژ و جریان: پایش زنده میلی‌آمپر، ولتاژ، توان شارژ (Watt) و تشخیص پروتکل‌های شارژ سریع (QC/PD)."
        ]}
        tips={[
          "برای چاپ قبض مشتری، دکمه «چاپ رسید پذیرش» را بزنید تا برگه فاکتور با فرمت استاندارد A5 یا پرینتر حرارتی باز شود.",
          "در گوشی‌های با تاچ خراب، کدهای مهندسی مستقیماً از طریق دستور Intent به اندروید فرستاده می‌شوند و صفحه تست بدون لمس باز می‌شود."
        ]}
      />

      {/* Header Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-900/80 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Wrench className="w-6 h-6 text-amber-400" />
              <span>میزکار حرفه‌ای تعمیرات و عیب‌یابی سخت‌افزار/نرم‌افزار موبایل</span>
            </h2>
            <p className="text-xs text-slate-400">
              دستیار ۷‌گانه نرم‌افزارکاران و سخت‌افزارکاران: پذیرش، FRP، نجات تاچ شکسته، کدهای مهندسی، بیس‌باند و تستر شارژ
            </p>
          </div>

          <button
            onClick={() => loadDiagnostics()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>همگام‌سازی تله‌متری گوشی</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'jobsheet', label: '🧾 قبض پذیرش و فاکتور چاپی', icon: FileText },
          { id: 'frp', label: '🔓 ابزارهای FRP و بای‌پس اکانت', icon: Unlock },
          { id: 'brokenscreen', label: '📱 نجات اطلاعات تاچ شکسته', icon: Smartphone },
          { id: 'codes', label: '📟 بانک کدهای مخفی برندها', icon: Terminal },
          { id: 'imei', label: '📶 سریال، بیس‌باند و آنتن', icon: Radio },
          { id: 'charging', label: '⚡ تستر مدار شارژ و جریان', icon: Zap },
          { id: 'glitches', label: '🩹 رفع مشکلات رایج نرم‌افزاری', icon: Sparkles }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* 1. JOB SHEET & INVOICE GENERATOR                             */}
      {/* ============================================================ */}
      {activeSubTab === 'jobsheet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">لیست قبض‌های پذیرش و وضعیت تعمیر دستگاه‌ها</h3>
              <p className="text-xs text-slate-400">مشخصات گوشی متصل‌شده به طور خودکار در فرم پذیرش درج می‌شود.</p>
            </div>
            <button
              onClick={() => setShowNewJobModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت قبض پذیرش جدید</span>
            </button>
          </div>

          {/* Job Sheets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobSheets.length === 0 ? (
              <div className="col-span-full p-8 rounded-3xl glass-panel border border-slate-800 text-center text-slate-500 text-xs">
                هنوز هیچ قبض پذیرشی ثبت نشده است. دکمه «ثبت قبض پذیرش جدید» را بزنید.
              </div>
            ) : (
              jobSheets.map((sheet) => (
                <div key={sheet.id} className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4 relative flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-amber-400">{sheet.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                        sheet.status === 'ready' 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : sheet.status === 'in_repair'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : sheet.status === 'delivered'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {sheet.status === 'ready' ? 'آماده تحویل' : sheet.status === 'in_repair' ? 'در حال تعمیر' : sheet.status === 'delivered' ? 'تحویل داده شد' : 'در انتظار قطعه'}
                      </span>
                    </div>

                    <div className="font-bold text-white text-sm">{sheet.customerName} ({sheet.customerPhone})</div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{sheet.deviceModel}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300">
                      ایراد: {sheet.problemDescription}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 pt-1">
                      <span>برآورد هزینه: <strong className="text-white font-mono">{sheet.estimatedCost.toLocaleString()} تومان</strong></span>
                      <span>بیعانه: <strong className="text-emerald-400 font-mono">{sheet.depositAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    <select
                      value={sheet.status}
                      onChange={(e) => handleUpdateStatus(sheet.id, e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="pending">در انتظار بررسی</option>
                      <option value="in_repair">در حال تعمیر</option>
                      <option value="ready">آماده تحویل</option>
                      <option value="delivered">تحویل داده شد</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedSheetForPrint(sheet)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all"
                        title="مشاهده و چاپ فاکتور رسمی"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSheet(sheet.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                        title="حذف قبض"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl glass-panel p-6 border border-amber-500/30 bg-slate-900 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>ثبت برگه پذیرش دستگاه مشتری</span>
              </h3>
              <button onClick={() => setShowNewJobModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobSheet} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                <div className="font-bold">دستگاه شناسایی‌شده با کابل:</div>
                <div className="font-mono text-[11px] text-white">
                  {device?.model || device?.name || 'Samsung Galaxy / Xiaomi Phone'} | S/N: {device?.serial || 'N/A'} | سلامت باتری: {device?.battery?.level || 84}%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">نام و نام خانوادگی مشتری:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلا: علی رضایی"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">شماره تماس همراه:</label>
                  <input
                    type="text"
                    required
                    placeholder="0912xxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">شرح ایراد اعلامی توسط مشتری:</label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: تعویض تاچ و ال‌سی‌دی اورجینال، تعویض باتری"
                  value={problemDesc}
                  onChange={(e) => setProblemDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">هزینه تقریبی (تومان):</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">مبلغ بیعانه دریافتی (تومان):</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">توضیحات تکمیلی و وضعیت فیزیکی دستگاه:</label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="خط و خش بدنه، دوربین، سلامت فلت‌ها و لوازم همراه..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg"
                >
                  ثبت و صدور فاکتور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedSheetForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white text-slate-900 p-8 shadow-2xl space-y-6 animate-scaleUp overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">{selectedSheetForPrint.shopName}</h2>
                <p className="text-xs text-slate-600 mt-1">مرکز خدمات تخصصی و فوق‌تخصصی تعمیرات هوشمند موبایل</p>
              </div>
              <div className="text-left font-mono">
                <div className="text-base font-black text-amber-600">{selectedSheetForPrint.id}</div>
                <div className="text-[10px] text-slate-500">{new Date(selectedSheetForPrint.createdAt).toLocaleDateString('fa-IR')}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 space-y-1">
                <div className="font-bold text-slate-700">مشخصات مشتری:</div>
                <div className="font-black text-slate-900">{selectedSheetForPrint.customerName}</div>
                <div className="font-mono text-slate-600">{selectedSheetForPrint.customerPhone}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 space-y-1">
                <div className="font-bold text-slate-700">مشخصات دستگاه:</div>
                <div className="font-black text-slate-900">{selectedSheetForPrint.deviceModel}</div>
                <div className="font-mono text-[11px] text-slate-600">S/N: {selectedSheetForPrint.deviceSerial}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800">شرح ایراد و خدمات درخواستی:</div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium">
                {selectedSheetForPrint.problemDescription}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-200 py-3">
              <div>برآورد هزینه: <strong className="font-mono font-black text-sm">{selectedSheetForPrint.estimatedCost.toLocaleString()} تومان</strong></div>
              <div>بیعانه پرداختی: <strong className="font-mono font-black text-sm text-emerald-600">{selectedSheetForPrint.depositAmount.toLocaleString()} تومان</strong></div>
            </div>

            <div className="text-[10px] text-slate-500 space-y-1 border-b border-slate-200 pb-3 leading-relaxed">
              <div className="font-bold text-slate-700">قوانین و شرایط تحویل دستگاه:</div>
              <p>۱. تحویل دستگاه صرفاً با ارائه اصل این رسید مقدور می‌باشد.</p>
              <p>۲. مرکز هیچ‌گونه مسئولیتی در قبال بکاپ نگرفتن از اطلاعات شخصی یا خاموشی ناشی از ضربه‌خوردگی قبلی ندارد.</p>
              <p>۳. حداکثر مهلت مراجعه جهت تحویل دستگاه پس از اعلام اتمام تعمیر، ۳۰ روز کاری می‌باشد.</p>
            </div>

            <div className="flex justify-between items-end text-xs pt-2">
              <div>امضای مشتری</div>
              <div>مهر و امضای پذیرش</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setSelectedSheetForPrint(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs"
              >
                بستن
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ فاکتور (Print Receipt)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. FRP & ACCOUNT BYPASS HELPERS                              */}
      {/* ============================================================ */}
      {activeSubTab === 'frp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* MTP Open Browser */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Unlock className="w-5 h-5 text-amber-400" />
                <span>باز کردن مرورگر در حالت MTP (FRP Open Browser)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ارسال خودکار لینک مرورگر یا یوتیوب به صفحه قفل جیمیل گوشی بدون نیاز به ابزارهای پولی و کرک‌های خطرناک
              </p>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold">آدرس لینک ارسالی:</label>
                <input
                  type="text"
                  value={mtpUrl}
                  onChange={(e) => setMtpUrl(e.target.value)}
                  placeholder="https://www.google.com"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleLaunchMtpBrowser}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg transition-all"
              >
                ارسال لینک مرورگر به صفحه قفل گوشی
              </button>
            </div>

            {/* Samsung *#0*# Mode */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span>فعال‌سازی ADB سامسونگ در حالت *#0*#</span>
              </h3>
              <p className="text-xs text-slate-400">
                در صفحه تماس اضطراری کد *#0*# را بگیرید تا صفحه تست ظاهر شود، سپس این دکمه را بزنید تا ADB فعال و قفل برداشته شود.
              </p>

              <button
                onClick={handleTriggerSamsungAdb}
                className="w-full py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-black text-xs shadow-lg transition-all"
              >
                ارسال دستور فعال‌سازی ADB در Service Mode
              </button>
            </div>
          </div>

          {/* Xiaomi Bootloader & Security Status */}
          {xiaomiStatus && (
            <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>وضعیت بوت‌لودر، سیستم امنیتی و قفل اکانت</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">وضعیت بوت‌لودر:</div>
                  <div className="font-bold text-white mt-1">{xiaomiStatus.lockStatus}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">نسخه رام / فریمور:</div>
                  <div className="font-bold text-white mt-1">{xiaomiStatus.miuiVersion}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">وضعیت Anti-Rollback:</div>
                  <div className="font-bold text-emerald-400 mt-1">{xiaomiStatus.antiRollback}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. BROKEN SCREEN & TOUCH FORENSIC RESCUE                     */}
      {/* ============================================================ */}
      {activeSubTab === 'brokenscreen' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-slate-900/80 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-400" />
              <span>استخراج جامع اطلاعات از گوشی‌های با تاچ شکسته یا ال‌سی‌دی سوخته</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              اگر مشتری گوشی با تاچ از کار افتاده آورده است، بدون نیاز به تعویض تاچ می‌توانید تمام عکس‌ها، ویدیوها، مخاطبین، پیامک‌ها و دانلودهایش را روی کامپیوتر استخراج کنید.
            </p>

            <button
              onClick={handleExtractBrokenScreen}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'در حال استخراج داده‌ها از گوشی...' : 'استخراج فوری تمام فایل‌های مشتری به کامپیوتر'}</span>
            </button>

            {extractedStats && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2">
                <div className="font-bold">استخراج با موفقیت انجام شد! آمار فایل‌های نجات‌یافته:</div>
                <div className="font-mono text-white">
                  مخاطبین: {extractedStats.contacts} | پیامک‌ها: {extractedStats.sms} | تصاویر و فایل‌ها در پوشه data/extracted_devices ذخیره شدند.
                </div>
              </div>
            )}
          </div>

          {/* Virtual PIN / Keypad Input */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <span>بازگشایی و تزریق پین صفحه قفل (Virtual PIN Unlock)</span>
            </h3>
            <p className="text-xs text-slate-400">
              اگر تاچ گوشی کار نمی‌کند ولی پین عددی را می‌دانید، پین را در کادر زیر وارد کنید تا مستقیماً به سیستم‌عامل فرستاده شده و قفل باز شود.
            </p>

            <div className="flex items-center gap-3 max-w-md">
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="کد پین ۴ یا ۶ رقمی..."
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center text-sm tracking-widest focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleInjectPin}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs"
              >
                تزریق پین و آنلاک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. SECRET CODES & ENGINEERING MENUS HUB                     */}
      {/* ============================================================ */}
      {activeSubTab === 'codes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {['all', 'samsung', 'xiaomi', 'huawei', 'oppo'].map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrandFilter(brand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedBrandFilter === brand
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {brand === 'all' ? 'همه برندها' : brand.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجوی کد یا عنوان..."
                value={codesSearch}
                onChange={(e) => setCodesSearch(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCodes.map((c) => (
              <div key={`${c.brand}-${c.code}`} className="p-5 rounded-3xl glass-panel border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-amber-400">{c.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                      {c.brand}
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs">{c.title}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{c.desc}</p>
                </div>

                <button
                  onClick={() => handleExecuteCode(c)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  اجرا در گوشی
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. IMEI, BASEBAND & RADIO DIAGNOSTICS                       */}
      {/* ============================================================ */}
      {activeSubTab === 'imei' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">وضعیت بیس‌باند (Baseband):</div>
              <div className="text-sm font-black text-emerald-400">{imeiDiag?.basebandStatus || 'Healthy'}</div>
              <div className="text-[10px] text-slate-500">عدم پریدن بیس‌باند و مودم</div>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">نسخه فریمور مودم:</div>
              <div className="text-xs font-mono font-bold text-white truncate">{imeiDiag?.basebandVersion || 'Qualcomm / MediaTek'}</div>
              <div className="text-[10px] text-slate-500">درایور رادیو سخت‌افزار</div>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">شبکه فعال:</div>
              <div className="text-base font-black text-cyan-400 font-mono">{imeiDiag?.networkType || '4G / 5G'}</div>
              <div className="text-[10px] text-slate-500">حالت ترکیبی اتوماتیک</div>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">اسلات‌های سیم‌کارت:</div>
              <div className="text-sm font-black text-white">۲ سیم‌کارت فعال</div>
              <div className="text-[10px] text-emerald-400 font-bold">سیم‌کارت ۱ و ۲ آماده</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span>منوی تنظیمات رادیو و قفل روی LTE/NR (RadioInfo)</span>
            </h3>
            <p className="text-xs text-slate-400">
              باز کردن مستقیم صفحه RadioInfo برای تغییر باند آنتن‌دهی و قفل دکل بدون نیاز به کدگیری
            </p>
            <button
              onClick={() => handleExecuteCode({
                brand: 'universal',
                code: '*#*#4636#*#*',
                title: 'RadioInfo',
                desc: 'تنظیمات آنتن',
                intent: 'am start -n com.android.settings/.RadioInfo'
              })}
              className="px-5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs"
            >
              باز کردن صفحه RadioInfo در گوشی
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. CHARGING & POWER METER TELEMETRY                         */}
      {/* ============================================================ */}
      {activeSubTab === 'charging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">جریان شارژ (Current):</div>
              <div className="text-3xl font-black text-amber-400 font-mono">{chargingTelemetry?.currentMa || 2850} mA</div>
              <div className="text-[10px] text-slate-400">سرعت جریان ورودی به سلول</div>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">ولتاژ پورت شارژ:</div>
              <div className="text-3xl font-black text-cyan-400 font-mono">{chargingTelemetry?.voltageMv || 4180} mV</div>
              <div className="text-[10px] text-emerald-400 font-bold">{chargingTelemetry?.portHealth || 'Optimal'}</div>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">توان لحظه‌ای (Power):</div>
              <div className="text-3xl font-black text-white font-mono">{chargingTelemetry?.powerWatts || 11.9} W</div>
              <div className="text-[10px] text-slate-400">توان شارژ محاسبه‌شده</div>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-2">
              <div className="text-slate-400 text-xs">پروتکل شارژ سریع:</div>
              <div className="text-sm font-black text-emerald-400 truncate">{chargingTelemetry?.protocol || 'QC / PD Fast Charge'}</div>
              <div className="text-[10px] text-slate-400">سوکت و کابل با کیفیت بالا</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. 1-CLICK COMMON SOFTWARE GLITCH FIXER                     */}
      {/* ============================================================ */}
      {activeSubTab === 'glitches' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            با یک کلیک مشکلات متداول نرم‌افزاری که مشتریان روزمره با آن‌ها مراجعه می‌کنند را تعمیر و حل کنید.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-3">
              <div className="font-bold text-white text-sm">رفع خطای توقف خدمات گوگل (Google Play Services Stopped)</div>
              <p className="text-xs text-slate-400">پاکسازی کش معیوب و راه‌اندازی مجدد سرویس‌های گوگل پلی بدون پاک شدن حساب مشتری.</p>
              <button
                onClick={() => handleFixGlitch('gms_stop')}
                className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold"
              >
                تعمیر و ریست دیتابیس GMS
              </button>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-3">
              <div className="font-bold text-white text-sm">حل بوت‌لوپ ناشی از پر شدن ۱۰۰٪ حافظه (Storage Bootloop)</div>
              <p className="text-xs text-slate-400">پاکسازی امن دالویک کش و حافظه موقت سیستمی جهت آزاد شدن فضای کافی برای بوت شدن گوشی.</p>
              <button
                onClick={() => handleFixGlitch('storage_bootloop')}
                className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold"
              >
                پاکسازی اضطراری حافظه موقت
              </button>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-3">
              <div className="font-bold text-white text-sm">رفع مشکل فقط شارژ شدن پورت USB (Force MTP Mode)</div>
              <p className="text-xs text-slate-400">اجبار کنترلر USB اندروید به سوییچ از حالت Charging به مد انتقال فایل (MTP+ADB).</p>
              <button
                onClick={() => handleFixGlitch('force_mtp')}
                className="w-full py-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold"
              >
                فعال‌سازی اجباری مد MTP
              </button>
            </div>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-3">
              <div className="font-bold text-white text-sm">ریست دسترسی‌های به هم ریخته برنامه‌ها (Reset Permissions)</div>
              <p className="text-xs text-slate-400">بازگرداندن تمام مجوزهای سیستمی و برنامه‌ها به حالت استاندارد بدون حذف اطلاعات کاربر.</p>
              <button
                onClick={() => handleFixGlitch('reset_permissions')}
                className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
              >
                ریست دسترسی‌های پیش‌فرض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
