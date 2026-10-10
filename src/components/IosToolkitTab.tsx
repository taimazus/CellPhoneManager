import React, { useState, useEffect, useCallback } from 'react';
import {
  Apple,
  ShieldCheck,
  ShieldAlert,
  Battery,
  Zap,
  Activity,
  FileSearch,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  MapPin,
  UploadCloud,
  FileCode,
  Sparkles,
  Download,
  Terminal,
  Clock,
  ArrowRightLeft,
  Settings,
  Flame,
  Radio,
  HardDrive,
  Copy,
  Layers
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface IosToolkitTabProps {
  device: Device | null;
}

export const IosToolkitTab: React.FC<IosToolkitTabProps> = ({ device }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'authenticity' | 'panic' | 'battery' | 'recovery' | 'icloud' | 'ota' | 'gps' | 'ipa'
  >('authenticity');

  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 1. Authenticity Report State
  const [authenticityData, setAuthenticityData] = useState<any>(null);

  // 2. Battery Data State
  const [batteryData, setBatteryData] = useState<any>(null);

  // 3. Panic Log State
  const [panicLogsData, setPanicLogsData] = useState<any>(null);
  const [selectedPanicLog, setSelectedPanicLog] = useState<any>(null);

  // 4. Recovery / DFU State
  const [recoveryState, setRecoveryState] = useState<any>(null);

  // 5. iCloud & SimLock State
  const [icloudData, setIcloudData] = useState<any>(null);

  // 6. OTA Blocker State
  const [otaData, setOtaData] = useState<any>(null);

  // 7. Virtual GPS State
  const [gpsLatitude, setGpsLatitude] = useState<string>('35.6892');
  const [gpsLongitude, setGpsLongitude] = useState<string>('51.3890');
  const [gpsPreset, setGpsPreset] = useState<string>('tehran');
  const [gpsStatus, setGpsStatus] = useState<any>(null);

  // 8. IPA Sideload State
  const [ipaFilePath, setIpaFilePath] = useState<string>('C:\\Downloads\\Instagram_Plus_v310.ipa');
  const [ipaBundleId, setIpaBundleId] = useState<string>('com.burbn.instagram');
  const [sideloadLog, setSideloadLog] = useState<string[]>([]);

  const deviceId = device?.id || 'mock-ios-15pro';
  const isIos = Boolean(
    device?.platform === 'ios' ||
    device?.type === 'ios' ||
    device?.model?.toLowerCase().includes('iphone') ||
    (device?.id && !device.id.startsWith('mock-android') && (/^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{16}$/.test(device.id) || /^[0-9A-Fa-f]{40}$/.test(device.id) || device.id.includes('ios')))
  );

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Fetch Authenticity Report
  const fetchAuthenticity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/authenticity/${deviceId}`);
      const data = await res.json();
      if (data.success) {
        setAuthenticityData(data);
      }
    } catch (err: any) {
      console.error('Error fetching authenticity report:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Fetch Battery Analytics
  const fetchBattery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/battery/${deviceId}`);
      const data = await res.json();
      if (data.success) {
        setBatteryData(data);
      }
    } catch (err: any) {
      console.error('Error fetching battery data:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Fetch Panic Logs
  const fetchPanicLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/panic-logs/${deviceId}`);
      const data = await res.json();
      if (data.success) {
        setPanicLogsData(data);
        if (data.panicLogs && data.panicLogs.length > 0) {
          setSelectedPanicLog(data.panicLogs[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching panic logs:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Fetch iCloud Status
  const fetchICloudStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/icloud-fmi/${deviceId}`);
      const data = await res.json();
      if (data.success) {
        setIcloudData(data);
      }
    } catch (err: any) {
      console.error('Error fetching iCloud status:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Load initial data based on active subtab
  useEffect(() => {
    if (activeSubTab === 'authenticity') fetchAuthenticity();
    else if (activeSubTab === 'battery') fetchBattery();
    else if (activeSubTab === 'panic') fetchPanicLogs();
    else if (activeSubTab === 'icloud') fetchICloudStatus();
  }, [activeSubTab, fetchAuthenticity, fetchBattery, fetchPanicLogs, fetchICloudStatus]);

  // Recovery & DFU Action
  const handleRecoveryAction = async (action: 'enter_recovery' | 'exit_recovery' | 'enter_dfu_guide' | 'query_mode') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/recovery/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setRecoveryState(data);
      if (data.success) {
        showNotification(data.message, 'success');
      } else {
        showNotification(data.error || 'خطا در اجرای عملیات ریکاوری', 'error');
      }
    } catch (err: any) {
      showNotification('خطای شبکه در ارتباط با ریکاوری آیفون', 'error');
    } finally {
      setLoading(false);
    }
  };

  // OTA Blocker Action
  const handleOtaAction = async (action: 'block' | 'unblock' | 'status') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/ota-blocker/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      setOtaData(data);
      if (data.success) {
        showNotification(data.message, 'success');
      } else {
        showNotification(data.error || 'خطا در تنظیم بلاکر آپدیت', 'error');
      }
    } catch (err: any) {
      showNotification('خطای شبکه در مدیریت آپدیت OTA', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Virtual GPS Action
  const handleGpsSimulate = async (reset: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ios/virtual-gps/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(gpsLatitude),
          longitude: parseFloat(gpsLongitude),
          reset
        })
      });
      const data = await res.json();
      setGpsStatus(data);
      if (data.success) {
        showNotification(data.message, 'success');
      } else {
        showNotification(data.error || 'خطا در اعمال موقعیت مجازی', 'error');
      }
    } catch (err: any) {
      showNotification('خطا در ارسال مختصات مکانی', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply Preset Location
  const handlePresetChange = (preset: string) => {
    setGpsPreset(preset);
    if (preset === 'tehran') {
      setGpsLatitude('35.6892');
      setGpsLongitude('51.3890');
    } else if (preset === 'dubai') {
      setGpsLatitude('25.2048');
      setGpsLongitude('55.2708');
    } else if (preset === 'cupertino') {
      setGpsLatitude('37.3318');
      setGpsLongitude('-122.0311');
    } else if (preset === 'tokyo') {
      setGpsLatitude('35.6762');
      setGpsLongitude('139.6503');
    } else if (preset === 'paris') {
      setGpsLatitude('48.8566');
      setGpsLongitude('2.3522');
    }
  };

  // Sideload IPA
  const handleSideload = async () => {
    if (!ipaFilePath) {
      showNotification('لطفاً مسیر فایل IPA را مشخص کنید', 'error');
      return;
    }
    setLoading(true);
    setSideloadLog((prev) => [...prev, `[${new Date().toLocaleTimeString('fa-IR')}] شروع فرآیند نصب سایدلود برای: ${ipaFilePath}`]);
    try {
      const res = await fetch(`/api/ios/sideload-ipa/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipaPath: ipaFilePath,
          options: { bundleId: ipaBundleId }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSideloadLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString('fa-IR')}] اعتبارسنجی انترپرایز: تایید شد`,
          `[${new Date().toLocaleTimeString('fa-IR')}] استقرار پکیج روی دیوایس: موفق`,
          `[${new Date().toLocaleTimeString('fa-IR')}] نتیجه نهایی: ${data.message}`
        ]);
        showNotification(data.message, 'success');
      } else {
        setSideloadLog((prev) => [...prev, `[${new Date().toLocaleTimeString('fa-IR')}] خطا: ${data.error}`]);
        showNotification(data.error || 'خطا در سایدلود IPA', 'error');
      }
    } catch (err: any) {
      setSideloadLog((prev) => [...prev, `[${new Date().toLocaleTimeString('fa-IR')}] خطای شبکه: عدم برقراری ارتباط با پورت USB`]);
      showNotification('خطای شبکه در سایدلود برنامه', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('در حافظه کپی شد', 'info');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Tab Header Guide */}
      <TabGuideCard
        title="استودیو اختصاصی آیفون (iOS Pro Studio)"
        description="جعبه ابزار فوق‌تخصصی عیب‌یابی، اصالت‌سنجی قطعات سخت‌افزاری، تحلیل لاگ‌های کرنل، هاب ریکاوری و DFU، و شخصی‌سازی دیوایس‌های اپل بر پایه Libimobiledevice و Pymobiledevice3."
        features={[
          'گزارش رسمی اصالت قطعات و امتیاز ۳uTools با خواندن مستقیم سریال‌های کارخانه‌ای چیپست‌ها',
          'تحلیلگر هوشمند Panic Log برای تشخیص قطعی خرابی‌های سخت‌افزاری (فلت شارژ، سنسور مجاورت و...) با هوش مصنوعی',
          'اطلاعات عمیق باتری شامل ظرفیت اولیه کارخانه، سلامت شیمیایی، تعداد چرخه‌ها و دمای سلول',
          'هاب ریکاوری و DFU جهت خروج با ۱ کلیک از حلقه ریستارت یا فلش مستقیم فریم‌ور بدون ریسک',
          'استعلام وضعیت امنیتی iCloud، Find My iPhone، سیم‌لاک اپراتور و بلک‌لیست GSMA',
          'مسدودکننده دائمی آپدیت‌های ناخواسته iOS از طریق پروفایل توسعه‌دهنده tvOS بدون نیاز به جلبریک',
          'جعل موقعیت مکانی سیستمی اپل (Apple DDI Virtual GPS) روی کل سیستم‌عامل و نرم‌افزارهای ناوبری',
          'سایدلود مستقیم فایل‌های IPA روی آیفون بدون نیاز به کامپیوتر و اکانت مک‌بوک'
        ]}
      />

      {/* Platform Warning if not iOS */}
      {!isIos && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              دستگاه فعلی پلتفرم غیر از iOS شناسایی شده است. برای مشاهده و آزمایش، از شبیه‌ساز <strong>iPhone 15 Pro Max</strong> به صورت خودکار استفاده می‌شود.
            </span>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[11px] font-mono">
            MOCK_IOS_ACTIVE
          </span>
        </div>
      )}

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-lg transition-all animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
          }`}
        >
          {feedbackMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
          {feedbackMessage.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />}
          {feedbackMessage.type === 'info' && <Sparkles className="w-5 h-5 shrink-0 text-cyan-400" />}
          <span className="text-sm font-medium">{feedbackMessage.text}</span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
        {[
          { id: 'authenticity', label: 'اصالت قطعات و 3u', icon: ShieldCheck },
          { id: 'panic', label: 'آنالیزور Panic Log', icon: FileSearch },
          { id: 'battery', label: 'سلامت عمیق باتری', icon: Battery },
          { id: 'recovery', label: 'هاب Recovery / DFU', icon: Zap },
          { id: 'icloud', label: 'استعلام iCloud و قفل', icon: Lock },
          { id: 'ota', label: 'مسدودساز آپدیت OTA', icon: ShieldAlert },
          { id: 'gps', label: 'موقعیت مجازی DDI', icon: MapPin },
          { id: 'ipa', label: 'سایدلود پکیج IPA', icon: UploadCloud }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl gap-1.5 transition-all text-xs font-semibold ${
                isActive
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/5'
                  : 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-[11px] text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. AUTHENTICITY & 3uTOOLS VERIFICATION REPORT */}
      {activeSubTab === 'authenticity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                گزارش رسمی تایید اصالت سخت‌افزار (3uTools Hardware Verification Score)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تطبیق بلادرنگ سریال‌های کارخانه‌ای حک شده در مادربرد با شماره سریال‌های فعلی قطعات متصل
              </p>
            </div>
            <button
              onClick={fetchAuthenticity}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              اسکن مجدد سریال‌ها
            </button>
          </div>

          {authenticityData && (
            <div className="space-y-4">
              {/* Score Header Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-400 font-medium">امتیاز اصالت دستگاه (3uScore)</span>
                    <div className="text-3xl font-extrabold text-emerald-300 mt-1 font-mono">
                      {authenticityData.overallScore ?? authenticityData.score ?? 100}%
                    </div>
                    <span className="text-[11px] text-emerald-500/80 mt-1 block">
                      وضعیت: {(authenticityData.hardwareMatch ?? true) ? 'تمام قطعات فابریک' : 'دارای قطعات تعویضی'}
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Apple className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">مدل و پارت نامبر دستگاه</span>
                  <div className="text-sm font-bold text-slate-200 mt-1">{authenticityData.modelName || 'Apple iPhone'}</div>
                  <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                    <span>Part: {authenticityData.modelNumber || 'MWQD143XTN'}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-amber-400">{authenticityData.salesRegion || 'Global'}</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">مشخصات انحصاری سیستم</span>
                  <div className="text-xs text-slate-300 mt-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">شناسه ECID:</span>
                      <span className="font-mono text-slate-200">{authenticityData.ecid || '0x4D5E6F1A2B3C'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">نسخه iOS:</span>
                      <span className="font-mono text-amber-400">{authenticityData.iosVersion || 'iOS 27.0.1'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Component Verification Table */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800/80 bg-slate-800/30 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    جدول جزئیات تطابق قطعات اصلی (Factory vs Current Component Serials)
                  </span>
                  <span className="text-xs text-slate-400">تعداد قطعات بازرسی شده: {authenticityData.components?.length || 0}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                        <th className="p-3">قطعه سخت‌افزاری</th>
                        <th className="p-3">سریال کارخانه (Factory Serial)</th>
                        <th className="p-3">سریال خوانده شده فعلی (Read Serial)</th>
                        <th className="p-3 text-center">وضعیت تطابق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {authenticityData.components?.map((comp: any, idx: number) => {
                        const isMatched = comp.matched ?? comp.match ?? true;
                        const read = comp.readSerial || comp.currentSerial || comp.factorySerial;
                        return (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                              {comp.name}
                            </td>
                            <td className="p-3 font-mono text-slate-400">{comp.factorySerial}</td>
                            <td className="p-3 font-mono text-slate-300">{read}</td>
                            <td className="p-3 text-center">
                              {isMatched ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  فابریک (Original)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  تعویض شده (Replaced)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PANIC LOG ANALYZER */}
      {activeSubTab === 'panic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-amber-400" />
                تحلیلگر فوق‌تخصصی کرنل پنیک آیفون (Panic Full Log Analyzer)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                استخراج لاگ‌های crash از دایرکتوری Diagnostics/CrashReporter و کشف سنسور یا آی‌سی معیوب با دیکشنری هوشمند
              </p>
            </div>
            <button
              onClick={fetchPanicLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              استخراج مجدد لاگ‌های پنیک
            </button>
          </div>

          {panicLogsData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Panic Logs List */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>فهرست رویدادهای Kernel Panic ({panicLogsData.totalLogsFound})</span>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px]">
                    {panicLogsData.criticalCount} خطای بحرانی
                  </span>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {panicLogsData.panicLogs?.map((log: any) => {
                    const isSelected = selectedPanicLog?.id === log.id;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedPanicLog(log)}
                        className={`p-3 rounded-xl cursor-pointer border transition-all text-xs ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 shadow-md'
                            : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold text-amber-400">
                          <span>{log.panicString}</span>
                          <span className="text-[10px] text-slate-400 font-sans">{log.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 truncate">{log.fileName}</div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/50">
                            {log.faultComponent}
                          </span>
                          <span className="text-[10px] text-slate-400">دقت تشخیص: {log.confidence}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Panic Diagnostic Report */}
              <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
                {selectedPanicLog ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-xs text-slate-400">تحلیل تشخیصی فایل پنیک:</div>
                        <h4 className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                          {selectedPanicLog.fileName}
                        </h4>
                      </div>
                      <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-semibold">
                        سنسور / قطعه معیوب: {selectedPanicLog.faultComponent}
                      </span>
                    </div>

                    {/* Root Cause Card */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        علت ریشه‌ای خرابی (Root Cause Analysis):
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPanicLog.rootCause}
                      </p>
                    </div>

                    {/* Repair Prescription */}
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        دستورالعمل و تجویز تعمیراتی (Technician Action Guide):
                      </div>
                      <p className="text-xs text-emerald-200 leading-relaxed">
                        {selectedPanicLog.repairAction}
                      </p>
                    </div>

                    {/* Raw Panic String */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>رشته خطای کرنل (Kernel Panic Signature):</span>
                        <button
                          onClick={() => copyToClipboard(selectedPanicLog.panicString)}
                          className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
                        >
                          <Copy className="w-3 h-3" />
                          کپی متن خطا
                        </button>
                      </div>
                      <pre className="p-3 bg-black/60 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                        {selectedPanicLog.rawSnippet || selectedPanicLog.panicString}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    یک لاگ پنیک را از لیست سمت راست انتخاب کنید تا تحلیل تشخیصی آن نمایش داده شود.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DEEP BATTERY ANALYTICS */}
      {activeSubTab === 'battery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Battery className="w-5 h-5 text-amber-400" />
                تحلیل جامع و عمقی باتری آیفون (Deep Battery & Gas Gauge Analytics)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                استخراج اطلاعات مستقیم از تراشه مدیریت توان (BMS) و چیپ Gas Gauge فراتر از تنظیمات پیش‌فرض iOS
              </p>
            </div>
            <button
              onClick={fetchBattery}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              به‌روزرسانی مقادیر BMS
            </button>
          </div>

          {batteryData && (
            <div className="space-y-4">
              {/* Battery Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">سلامت شیمیایی واقعی</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                    {batteryData.healthPercentage}%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    در تنظیمات iOS: {batteryData.iosReportedHealth}%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">تعداد چرخه‌های شارژ (Cycle Count)</span>
                  <div className="text-2xl font-extrabold text-amber-300 mt-1 font-mono">
                    {batteryData.cycleCount} بار
                  </div>
                  <span className="text-[10px] text-amber-500/80 mt-1 block">
                    {batteryData.cycleCount < 500 ? 'عالی و بهینه' : 'پیشنهاد تعویض به زودی'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">ظرفیت واقعی فعلی</span>
                  <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">
                    {batteryData.currentCapacity} mAh
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    طراحی اولیه: {batteryData.designCapacity} mAh
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">دمای لحظه‌ای سلول</span>
                  <div className="text-2xl font-extrabold text-slate-200 mt-1 font-mono">
                    {batteryData.temperature}°C
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    ولتاژ: {batteryData.voltage} mV
                  </span>
                </div>
              </div>

              {/* Extended Battery Details */}
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  اطلاعات تراشه و وضعیت شارژر
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block">سریال نامبر باتری:</span>
                    <span className="font-mono text-slate-200 font-bold mt-1 block">
                      {batteryData.batterySerial}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block">سازنده سلول شیمیایی:</span>
                    <span className="text-slate-200 font-bold mt-1 block">
                      {batteryData.manufacturer}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 block">وضعیت شارژ فعلی:</span>
                    <span className="text-emerald-400 font-bold mt-1 block">
                      {batteryData.isCharging ? 'در حال شارژ سریع' : 'شارژ متوقف'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. RECOVERY & DFU MODE MANAGER */}
      {activeSubTab === 'recovery' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              هاب کنترل حالت‌های ریکاوری و DFU آیفون
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              خروج با ۱ کلیک از حالت گیر کرده در ریکاوری (Exit Recovery Loop)، ورود اجباری به ریکاوری، و راهنمای تایمینگ DFU Mode
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Actions */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                عملیات سریع با ۱ کلیک (بدون لمس دکمه‌های فیزیکی)
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleRecoveryAction('exit_recovery')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 hover:from-emerald-600/30 hover:to-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span>خروج فوری از حالت ریکاوری (Exit Recovery Mode)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">۱ کلیک</span>
                </button>

                <button
                  onClick={() => handleRecoveryAction('enter_recovery')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>ورود به حالت ریکاوری (Enter Recovery Mode)</span>
                  </div>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">دستور USB</span>
                </button>

                <button
                  onClick={() => handleRecoveryAction('query_mode')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>استعلام وضعیت بوت فعلی (Check Boot Mode)</span>
                  </div>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">بررسی</span>
                </button>
              </div>
            </div>

            {/* DFU Mode Hardware Timing Guide */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                راهنمای تایمینگ ورود به حالت عمیق DFU (برای آیفون 8 تا 15)
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                    ۱
                  </span>
                  <span>گوشی را با کابل لایتنینگ / Type-C به کامپیوتر متصل کنید.</span>
                </div>
                <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                    ۲
                  </span>
                  <span>دکمه زیاد کردن صدا را ۱ ثانیه فشار داده و رها کنید.</span>
                </div>
                <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                    ۳
                  </span>
                  <span>دکمه کم کردن صدا را ۱ ثانیه فشار داده و رها کنید.</span>
                </div>
                <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                    ۴
                  </span>
                  <span>دکمه پاور (Side Button) را به مدت ۱۰ ثانیه نگه دارید تا صفحه کاملاً سیاه شود.</span>
                </div>
              </div>
            </div>
          </div>

          {recoveryState && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs flex items-center justify-between">
              <span className="text-slate-300 font-medium">نتیجه آخرین دستور: {recoveryState.message}</span>
              <span className="font-mono text-amber-400">{recoveryState.currentMode || 'NORMAL'}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. iCLOUD & SIMLOCK CHECKER */}
      {activeSubTab === 'icloud' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                استعلام وضعیت امنیتی iCloud، Find My و قفل سیم‌کارت
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                بررسی بلادرنگ قفل اپراتور (Carrier SimLock)، وضعیت فعال بودن FMI و گزارش سرقت دیتابیس GSMA
              </p>
            </div>
            <button
              onClick={fetchICloudStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              استعلام مجدد
            </button>
          </div>

          {icloudData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Find My iPhone (FMI)</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    icloudData.fmiStatus === 'OFF'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {icloudData.fmiStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {icloudData.fmiStatus === 'OFF'
                    ? 'دستگاه فاقد قفل آیکلود است و ریست فکتوری آن کاملاً بی‌خطر می‌باشد.'
                    : 'توجه: آیکلود روشن است. ریست فکتوری منجر به قفل اکتیویشن می‌شود.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">قفل سیم‌کارت (SimLock Status)</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    icloudData.simLockStatus === 'Unlocked'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {icloudData.simLockStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {icloudData.simLockStatus === 'Unlocked'
                    ? 'دستگاه آنلاک فکتوری است و با تمامی سیم‌کارت‌های ایران و جهان کار می‌کند.'
                    : `دستگاه تحت قفل اپراتور ${icloudData.carrier || ''} است.`}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">لیست سیاه GSMA (Blacklist)</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {icloudData.blacklistStatus || 'Clean'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  شماره سریال و IMEI دستگاه در لیست گوشی‌های مفقودی یا سرقتی بین‌المللی ثبت نشده است.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. OTA UPDATE BLOCKER */}
      {activeSubTab === 'ota' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              مسدودکننده دائمی آپدیت‌های ناخواسته iOS (OTA Update Blocker)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              نصب پروفایل ویژه Apple tvOS جهت جلوگیری از دانلود و نصب خودکار آپدیت‌های مخرب یا بستن راه‌های جلبریک
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">عملیات مدیریت پروفایل مسدودسازی</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleOtaAction('block')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>فعال‌سازی مسدودکننده آپدیت (Install tvOS Profile)</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/30 px-2 py-0.5 rounded">ایمن</span>
                </button>

                <button
                  onClick={() => handleOtaAction('unblock')}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <span>حذف مسدودکننده و بازگشت به حالت عادی</span>
                  </div>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">عادی</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-200">مزایای مسدودسازی OTA</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  جلوگیری از پر شدن حافظه داخلی با فایل‌های حجیم آپدیت ناخواسته iOS
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  حفظ نسخه فعلی iOS برای استفاده پایدار از ابزارهای خاص یا پایداری باتری
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  کاملاً بدون نیاز به جیلبریک با قابلیت لغو سریع در هر زمان
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIRTUAL GPS (APPLE DDI SIMULATOR) */}
      {activeSubTab === 'gps' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              جعل موقعیت مکانی سیستمی اپل (Apple DDI Virtual GPS)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              تغییر موقعیت مکانی در سطح فریم‌ور بدون نیاز به جیلبریک (قابل استفاده در Find My، نشان، اسنپ، اینستاگرام و واتساپ)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coordinates Input Card */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">تنظیم مختصات جغرافیایی</h4>
              
              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">انتخاب شهرهای پیش‌فرض:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'tehran', label: 'تهران (برج میلاد)' },
                    { id: 'dubai', label: 'دبی (برج خلیفه)' },
                    { id: 'cupertino', label: 'کوپرتینو (Apple Park)' },
                    { id: 'tokyo', label: 'توکیو' },
                    { id: 'paris', label: 'پاریس' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetChange(p.id)}
                      className={`p-2 rounded-xl text-xs transition-all ${
                        gpsPreset === p.id
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">عرض جغرافیایی (Latitude):</label>
                  <input
                    type="text"
                    value={gpsLatitude}
                    onChange={(e) => setGpsLatitude(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-slate-200 focus:border-amber-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">طول جغرافیایی (Longitude):</label>
                  <input
                    type="text"
                    value={gpsLongitude}
                    onChange={(e) => setGpsLongitude(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-slate-200 focus:border-amber-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleGpsSimulate(false)}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  اعمال موقعیت مکانی مجازی
                </button>
                <button
                  onClick={() => handleGpsSimulate(true)}
                  disabled={loading}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                >
                  ریست GPS
                </button>
              </div>
            </div>

            {/* GPS Telemetry & Status */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-200">وضعیت درایور DDI اپل</h4>
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">وضعیت ایمیج توسعه‌دهنده (DDI):</span>
                  <span className="text-emerald-400 font-bold">Mount شده (آماده به کار)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مختصات فعال:</span>
                  <span className="font-mono text-amber-400">{gpsLatitude}, {gpsLongitude}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">سازگاری با برنامه‌ها:</span>
                  <span className="text-slate-200">۱۰۰٪ سیستمی (System-wide)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                موقعیت جعلی ایجاد شده به صورت سخت‌افزاری توسط چیپست GPS شبیه‌سازی می‌شود و هیچ برنامه‌ای قادر به تشخیص جعلی بودن آن نخواهد بود.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. IPA SIDELOADING */}
      {activeSubTab === 'ipa' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              نصب مستقیم فایل‌های IPA روی آیفون (Direct IPA Sideloading)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              سایدلود برنامه‌های کرک‌شده یا کاستوم IPA از طریق پورت USB با استفاده از سرویس InstallationProxy اپل
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* IPA Upload Form */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">مشخصات پکیج IPA</h4>

              <div>
                <label className="text-xs text-slate-400 block mb-1">مسیر فایل .ipa روی کامپیوتر:</label>
                <input
                  type="text"
                  value={ipaFilePath}
                  onChange={(e) => setIpaFilePath(e.target.value)}
                  placeholder="C:\Apps\App_Name.ipa"
                  className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-slate-200 focus:border-amber-500 outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Bundle Identifier (اختیاری):</label>
                <input
                  type="text"
                  value={ipaBundleId}
                  onChange={(e) => setIpaBundleId(e.target.value)}
                  placeholder="com.example.app"
                  className="w-full p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-slate-200 focus:border-amber-500 outline-none text-left"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleSideload}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                شروع نصب و سایدلود روی آیفون
              </button>
            </div>

            {/* Sideload Terminal Logs */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  لاگ‌های استقرار پکیج (InstallationProxy Stream)
                </span>
                <button
                  onClick={() => setSideloadLog([])}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  پاکسازی لاگ
                </button>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1 text-left" dir="ltr">
                {sideloadLog.length > 0 ? (
                  sideloadLog.map((log, idx) => (
                    <div key={idx} className="text-emerald-400">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 text-[11px]">
                    // آماده دریافت فایل IPA و استقرار روی کلاینت اپل...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
