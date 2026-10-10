import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Radio, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Search,
  RefreshCw,
  Cable,
  BookOpen,
  Copy,
  Check,
  Shield,
  Activity,
  ArrowLeft,
  Apple,
  Printer,
  Laptop,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';
import { safeFetchJson } from '../utils/api';

interface WirelessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface ScannedDevice {
  ip: string;
  mac: string;
  category?: 'phones' | 'printers' | 'pcs' | 'routers' | 'other';
  deviceType: 'Android' | 'iOS' | 'Smartphone' | 'Printer' | 'PC' | 'Router' | 'Smart Device';
  vendor: string;
  status: string;
  isAdbOpen: boolean;
  isAdbConnected?: boolean;
}

export const WirelessModal: React.FC<WirelessModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [tab, setTab] = useState<'scan' | 'qr' | 'pair' | 'direct' | 'guide'>('scan');
  
  // Auto-scan state
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'phones' | 'printers' | 'pcs'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // QR Pairing state (Android 11+)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSession, setQrSession] = useState<{ serviceName: string; password: string; qrString: string } | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [isQrPairingSuccess, setIsQrPairingSuccess] = useState(false);

  // Pair mode state (Android 11+)
  const [pairIp, setPairIp] = useState('');
  const [pairPort, setPairPort] = useState('');
  const [pairCode, setPairCode] = useState('');

  // Direct connect state
  const [directIp, setDirectIp] = useState('');
  const [directPort, setDirectPort] = useState('5555');

  const [loading, setLoading] = useState(false);
  const [connectingIp, setConnectingIp] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && tab === 'scan') {
      triggerScan();
    }
  }, [isOpen, tab]);

  const triggerScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    setStatus(null);
    try {
      const data = await safeFetchJson<{ success: boolean; totalFound: number; devices: ScannedDevice[]; error?: string }>('/api/devices/wireless/scan');
      if (data && data.success) {
        setScannedDevices(data.devices || []);
        if (data.devices.length === 0) {
          setScanMessage('هیچ دستگاه فعالی در زیرشبکه جاری یافت نشد. اطمینان حاصل کنید گوشی به همین وای‌فای متصل است.');
        }
      } else {
        setScanMessage(data?.error || 'خطا در اسکن شبکه محلی');
      }
    } catch (err: any) {
      setScanMessage(`خطای اسکن: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const initQrSession = async () => {
    setIsQrLoading(true);
    setQrStatus('در حال تولید نشست امن جفت‌سازی QR...');
    setIsQrPairingSuccess(false);
    try {
      const res = await safeFetchJson('/api/devices/wireless/qr-session');
      if (res?.success && res.session) {
        setQrSession(res.session);
        const url = await QRCode.toDataURL(res.session.qrString, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrDataUrl(url);
        setQrStatus('آماده برای اسکن توسط دوربین گوشی...');
      } else {
        setQrStatus('خطا در ایجاد بارکد جفت‌سازی');
      }
    } catch (err: any) {
      setQrStatus(`خطا: ${err.message}`);
    } finally {
      setIsQrLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'qr' && !qrSession && !isQrLoading) {
      initQrSession();
    }
  }, [isOpen, tab]);

  useEffect(() => {
    if (!isOpen || tab !== 'qr' || !qrSession || isQrPairingSuccess) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/devices/wireless/qr-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceName: qrSession.serviceName,
            password: qrSession.password
          })
        });
        const data = await res.json();
        if (!isMounted) return;

        if (data.status === 'success') {
          setIsQrPairingSuccess(true);
          setQrStatus(`✅ ${data.message}`);
          setStatus({ text: data.message, type: 'success' });
          onRefresh();
          clearInterval(interval);
        } else if (data.status === 'error') {
          setQrStatus(`⚠️ ${data.error}`);
        } else {
          setQrStatus(data.message || 'در انتظار اسکن بارکد توسط دوربین گوشی...');
        }
      } catch {
        // network polling retry
      }
    }, 1800);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tab, qrSession, isQrPairingSuccess]);

  const handlePair = async () => {
    if (!pairIp || !pairPort || !pairCode) {
      setStatus({ text: 'لطفاً آدرس IP، پورت و کد ۶ رقمی را وارد کنید.', type: 'error' });
      return;
    }
    if (pairPort.trim() === '5555') {
      setStatus({ 
        text: '⚠️ پورت جفت‌سازی ۵۵۵۵ نیست! لطفاً پورت ۵ رقمی موقتی (مانند ۳۷۲۱۴) که در پنجره پاپ‌آپ گوشی کنار IP نمایش داده شده است را وارد نمایید.', 
        type: 'error' 
      });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/devices/wireless/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: pairIp, port: pairPort, code: pairCode })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ text: data.message || 'جفت‌سازی با موفقیت انجام شد! اکنون می‌توانید متصل شوید.', type: 'success' });
        onRefresh();
      } else {
        setStatus({ text: data.error || 'خطا در جفت‌سازی بی‌سیم', type: 'error' });
      }
    } catch (err: any) {
      setStatus({ text: `خطا: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectConnect = async (targetIp?: string, targetPort?: string) => {
    const ip = targetIp || directIp;
    const port = targetPort || directPort || '5555';

    if (!ip) {
      setStatus({ text: 'لطفاً آدرس IP گوشی را وارد کنید.', type: 'error' });
      return;
    }
    setLoading(true);
    setConnectingIp(ip);
    setStatus(null);
    try {
      const res = await fetch('/api/devices/wireless/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ text: data.message || `اتصال بی‌سیم به ${ip}:${port} با موفقیت برقرار شد!`, type: 'success' });
        onRefresh();
      } else {
        setStatus({ text: data.error || `خطا در اتصال به ${ip}:${port}`, type: 'error' });
      }
    } catch (err: any) {
      setStatus({ text: `خطا: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setConnectingIp(null);
    }
  };

  const fillPairFromScanned = (device: ScannedDevice) => {
    setPairIp(device.ip);
    setTab('pair');
  };

  const filteredDevices = scannedDevices.filter(d => {
    if (deviceFilter === 'all') return true;
    if (deviceFilter === 'phones') return d.category === 'phones' || d.deviceType === 'Android' || d.deviceType === 'iOS' || d.deviceType === 'Smartphone';
    if (deviceFilter === 'printers') return d.category === 'printers' || d.deviceType === 'Printer';
    if (deviceFilter === 'pcs') return d.category === 'pcs' || d.deviceType === 'PC';
    return true;
  });

  const countPhones = scannedDevices.filter(d => d.category === 'phones' || d.deviceType === 'Android' || d.deviceType === 'iOS' || d.deviceType === 'Smartphone').length;
  const countPrinters = scannedDevices.filter(d => d.category === 'printers' || d.deviceType === 'Printer').length;
  const countPcs = scannedDevices.filter(d => d.category === 'pcs' || d.deviceType === 'PC').length;

  const renderDeviceIcon = (dev: ScannedDevice) => {
    if (dev.deviceType === 'iOS') {
      return (
        <div className="p-2.5 rounded-xl border mt-0.5 bg-sky-500/20 text-sky-400 border-sky-500/40">
          <Apple className="w-4 h-4" />
        </div>
      );
    }
    if (dev.deviceType === 'Printer') {
      return (
        <div className="p-2.5 rounded-xl border mt-0.5 bg-violet-500/20 text-violet-400 border-violet-500/40">
          <Printer className="w-4 h-4" />
        </div>
      );
    }
    if (dev.deviceType === 'PC') {
      return (
        <div className="p-2.5 rounded-xl border mt-0.5 bg-blue-500/20 text-blue-400 border-blue-500/40">
          <Laptop className="w-4 h-4" />
        </div>
      );
    }
    if (dev.deviceType === 'Router') {
      return (
        <div className="p-2.5 rounded-xl border mt-0.5 bg-amber-500/20 text-amber-400 border-amber-500/40">
          <Wifi className="w-4 h-4" />
        </div>
      );
    }
    if (dev.isAdbOpen) {
      return (
        <div className="p-2.5 rounded-xl border mt-0.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
          <Smartphone className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2.5 rounded-xl border mt-0.5 bg-stone-800/60 text-stone-400 border-stone-700/60">
        <Smartphone className="w-4 h-4" />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#121319] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/90 glass-panel text-right flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/15 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/25 to-amber-600/30 text-yellow-300 border border-amber-500/35 shadow-lg shadow-amber-500/10">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                مرکز شناسایی و اتصال بی‌سیم گوشی‌ها (Wi-Fi ADB & iOS)
              </h3>
              <p className="text-xs text-stone-400">کشف خودکار گوشی‌ها، آیفون‌ها و تجهیزات فعال در شبکه محلی بدون کابل</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-[#181922] hover:bg-[#22242f] text-stone-400 hover:text-yellow-300 border border-amber-500/15 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="بستن پنجره"
            aria-label="بستن پنجره اتصال وای‌فای"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 my-4 p-1.5 bg-[#0a0a0f] rounded-2xl border border-amber-500/20 flex-shrink-0">
          <button
            onClick={() => { setTab('scan'); setStatus(null); }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'scan'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">کشف خودکار</span>
            <span>شبکه</span>
          </button>
          <button
            onClick={() => { setTab('qr'); setStatus(null); }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'qr'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>اسکن QR Code</span>
          </button>
          <button
            onClick={() => { setTab('pair'); setStatus(null); }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'pair'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>کد ۶ رقمی</span>
          </button>
          <button
            onClick={() => { setTab('direct'); setStatus(null); }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'direct'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>اتصال مستقیم</span>
          </button>
          <button
            onClick={() => { setTab('guide'); setStatus(null); }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'guide'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>راهنمای گام‌به‌گام</span>
          </button>
        </div>

        {/* Status Toast */}
        {status && (
          <div className={`mb-3 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 flex-shrink-0 animate-fadeIn ${
            status.type === 'success' 
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' 
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />}
            <span className="leading-relaxed">{status.text}</span>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-4">
          {/* TAB 1: AUTO-SCAN NETWORK */}
          {tab === 'scan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-yellow-400 animate-spin" />
                  <div>
                    <h4 className="text-xs font-bold text-yellow-300">رادار پویش زیرشبکه Wi-Fi و Bonjour</h4>
                    <p className="text-[11px] text-stone-300">
                      پویش هوشمند IPها، آیفون‌ها، گوشی‌های اندروید، پرینترها و سیستم‌های فعال در شبکه
                    </p>
                  </div>
                </div>
                <button
                  onClick={triggerScan}
                  disabled={isScanning}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'در حال اسکن...' : 'اسکن مجدد شبکه'}</span>
                </button>
              </div>

              {scanMessage && (
                <div className="p-3 rounded-xl bg-stone-900/90 border border-amber-500/20 text-xs text-stone-300 text-center">
                  {scanMessage}
                </div>
              )}

              {/* Category Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setDeviceFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    deviceFilter === 'all'
                      ? 'bg-amber-500/25 text-yellow-300 border border-amber-500/40'
                      : 'bg-stone-900/60 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <span>همه دستگاه‌ها</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
                    {scannedDevices.length}
                  </span>
                </button>

                <button
                  onClick={() => setDeviceFilter('phones')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    deviceFilter === 'phones'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'bg-stone-900/60 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>گوشی‌ها و آیفون</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
                    {countPhones}
                  </span>
                </button>

                <button
                  onClick={() => setDeviceFilter('printers')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    deviceFilter === 'printers'
                      ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                      : 'bg-stone-900/60 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>پرینترها</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
                    {countPrinters}
                  </span>
                </button>

                <button
                  onClick={() => setDeviceFilter('pcs')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    deviceFilter === 'pcs'
                      ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                      : 'bg-stone-900/60 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>سیستم‌ها و PC</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
                    {countPcs}
                  </span>
                </button>
              </div>

              {/* Discovered devices list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    دستگاه‌های کشف‌شده در شبکه ({filteredDevices.length})
                  </span>
                  <span className="text-[11px] text-stone-400">زیرشبکه محلی (LAN / Wi-Fi)</span>
                </div>

                {filteredDevices.length === 0 && !isScanning ? (
                  <div className="p-8 text-center rounded-2xl bg-[#15161f] border border-stone-800 text-stone-400 space-y-2">
                    <Radio className="w-8 h-8 mx-auto text-amber-500/40 animate-pulse" />
                    <p className="text-xs font-medium">هیچ دستگاهی در این دسته‌بندی کشف نشد.</p>
                    <p className="text-[11px] text-stone-500">
                      دستگاه را به همان مودم Wi-Fi متصل کرده و دکمه اسکن مجدد را بزنید یا فیلتر را روی «همه دستگاه‌ها» بگذارید.
                    </p>
                  </div>
                ) : (
                  filteredDevices.map((dev, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        dev.isAdbOpen 
                          ? 'bg-gradient-to-r from-emerald-950/30 via-[#161d19] to-[#121319] border-emerald-500/40 shadow-lg shadow-emerald-950/30' 
                          : dev.deviceType === 'iOS'
                            ? 'bg-gradient-to-r from-sky-950/30 via-[#131a22] to-[#121319] border-sky-500/30 hover:border-sky-500/50'
                            : dev.deviceType === 'Printer'
                              ? 'bg-gradient-to-r from-violet-950/30 via-[#181524] to-[#121319] border-violet-500/30 hover:border-violet-500/50'
                              : dev.deviceType === 'PC'
                                ? 'bg-[#15161f] border-blue-500/20 hover:border-blue-500/40'
                                : 'bg-[#15161f] border-stone-800/80 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {renderDeviceIcon(dev)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{dev.vendor}</span>
                            {dev.isAdbOpen && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                ADB پورت ۵۵۵۵ باز
                              </span>
                            )}
                            {dev.deviceType === 'Smartphone' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                گوشی هوشمند (Wi-Fi)
                              </span>
                            )}
                            {dev.deviceType === 'Android' && !dev.isAdbOpen && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                اندروید
                              </span>
                            )}
                            {dev.deviceType === 'iOS' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                Apple iOS
                              </span>
                            )}
                            {dev.deviceType === 'Printer' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                                پرینتر تحت شبکه
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono flex-wrap">
                            <span>IP: <strong className="text-amber-300">{dev.ip}</strong></span>
                            <span>MAC: <strong className="text-stone-300">{dev.mac}</strong></span>
                          </div>
                          <p className="text-[10px] text-stone-400">{dev.status}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        {dev.isAdbOpen ? (
                          <button
                            onClick={() => handleDirectConnect(dev.ip, '5555')}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                          >
                            <Zap className={`w-3.5 h-3.5 ${connectingIp === dev.ip ? 'animate-spin' : ''}`} />
                            <span>{connectingIp === dev.ip ? 'اتصال...' : 'اتصال فوری'}</span>
                          </button>
                        ) : dev.deviceType === 'Android' || dev.deviceType === 'Smartphone' ? (
                          <button
                            onClick={() => fillPairFromScanned(dev)}
                            className="px-3 py-1.5 rounded-xl bg-[#20222f] hover:bg-[#2a2c3d] text-yellow-300 hover:text-yellow-200 border border-amber-500/25 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span>جفت‌سازی با این IP</span>
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        ) : dev.deviceType === 'iOS' ? (
                          <button
                            onClick={() => setTab('guide')}
                            className="px-3 py-1.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 hover:text-sky-200 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Apple className="w-3 h-3" />
                            <span>راهنمای همگام‌سازی</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCopy(dev.ip, `copy_${dev.ip}`)}
                            className="px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-medium transition-all flex items-center gap-1 font-mono"
                          >
                            {copiedKey === `copy_${dev.ip}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">کپی شد</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>کپی IP</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PAIR WITH QR CODE (Android 11+) */}
          {tab === 'qr' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-stone-200 space-y-1.5 leading-relaxed">
                <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  مراحل جفت‌سازی آسان با اسکن بارکد QR (اندروید ۱۱ و بالاتر):
                </span>
                <p>۱. گوشی و این کامپیوتر را به یک شبکه <strong>وای‌فای مشترک</strong> متصل کنید.</p>
                <p>۲. در گوشی به مسیر <strong>تنظیمات &gt; گزینه‌های توسعه‌دهنده (Developer Options) &gt; خطایابی بی‌سیم (Wireless debugging)</strong> بروید.</p>
                <p>۳. گزینه <strong>Pair device with QR code (جفت‌سازی دستگاه با کد QR)</strong> را لمس کنید تا دوربین فعال شود.</p>
                <p>۴. دوربین گوشی را مقابل بارکد زیر بگیرید؛ سیستم به‌طور خودکار دستگاه را شناسایی، جفت و متصل خواهد کرد!</p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-[#0a0a0f] border border-amber-500/20 rounded-2xl relative overflow-hidden">
                {isQrLoading ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <span className="text-xs text-stone-400">در حال تولید نشست امن جفت‌سازی QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/10 border-4 border-amber-500/30 relative">
                      <img 
                        src={qrDataUrl} 
                        alt="ADB Wireless Pairing QR Code" 
                        className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                      />
                      {isQrPairingSuccess && (
                        <div className="absolute inset-0 bg-emerald-950/90 rounded-xl flex flex-col items-center justify-center gap-2 text-emerald-300 backdrop-blur-sm">
                          <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
                          <span className="text-sm font-black">جفت‌سازی با موفقیت انجام شد!</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                        <Activity className={`w-3.5 h-3.5 ${isQrPairingSuccess ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                        <span>{qrStatus || 'در انتظار اسکن توسط دوربین گوشی...'}</span>
                      </div>
                      {qrSession && (
                        <p className="text-[11px] text-stone-400 font-mono">
                          شناسه سرویس: <span className="text-yellow-400 font-bold">{qrSession.serviceName}</span> | رمز: <span className="text-yellow-400 font-bold">{qrSession.password}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={initQrSession}
                      disabled={isQrLoading}
                      className="px-4 py-2 rounded-xl bg-stone-900 border border-amber-500/30 hover:border-amber-400 text-stone-300 hover:text-amber-300 text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isQrLoading ? 'animate-spin' : ''}`} />
                      <span>تولید مجدد بارکد جدید</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                    <p className="text-xs text-rose-300 mb-3">{qrStatus || 'خطا در بارگذاری بارکد'}</p>
                    <button
                      onClick={initQrSession}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-bold rounded-xl text-xs"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAIR WITH ANDROID 11+ (PIN) */}
          {tab === 'pair' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-stone-200 space-y-1.5 leading-relaxed">
                <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  مراحل فعال‌سازی روی گوشی (اندروید ۱۱ و بالاتر):
                </span>
                <p>۱. گوشی و این کامپیوتر را به یک شبکه <strong>وای‌فای مشترک</strong> متصل کنید.</p>
                <p>۲. در گوشی به مسیر <strong>تنظیمات &gt; گزینه‌های توسعه‌دهنده (Developer Options) &gt; خطایابی بی‌سیم (Wireless debugging)</strong> بروید.</p>
                <p>۳. گزینه <strong>Pair device with pairing code</strong> را لمس کنید تا کد ۶ رقمی و پورت اختصاصی نمایان شود.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] text-stone-400 block mb-1 font-semibold">آدرس IP گوشی:</label>
                  <input
                    type="text"
                    placeholder="مثال: 192.168.1.150"
                    value={pairIp}
                    onChange={(e) => setPairIp(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-yellow-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1 font-semibold">پورت جفت‌سازی (پورت ۵ رقمی):</label>
                  <input
                    type="text"
                    placeholder="مثال: 37129 (نه 5555)"
                    value={pairPort}
                    onChange={(e) => setPairPort(e.target.value)}
                    className={`w-full bg-[#0a0a0f] border ${pairPort === '5555' ? 'border-red-500 text-red-300' : 'border-amber-500/30 text-yellow-300'} rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400`}
                  />
                  {pairPort === '5555' && (
                    <p className="text-[10px] text-red-400 mt-1">⚠️ پورت ۵۵۵۵ اشتباه است! پورت ۵ رقمی داخل پاپ‌آپ گوشی را وارد کنید.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1 font-semibold">کد جفت‌سازی ۶ رقمی (Pairing Code):</label>
                <input
                  type="text"
                  placeholder="مثال: 482910"
                  value={pairCode}
                  onChange={(e) => setPairCode(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-yellow-300 tracking-widest focus:outline-none focus:border-amber-400 text-center font-black"
                />
              </div>

              <button
                onClick={handlePair}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 fill-current ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'در حال اتصال و جفت‌سازی امن...' : 'جفت‌سازی و برقراری اتصال بی‌سیم'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: DIRECT IP / PORT */}
          {tab === 'direct' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/20 text-xs text-stone-300 space-y-1.5 leading-relaxed">
                <span className="font-bold text-yellow-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-yellow-400" />
                  اتصال مستقیم با IP و پورت TCP/IP:
                </span>
                <p>اگر پورت ۵۵۵۵ گوشی شما قبلاً فعال شده، IP آن را وارد کرده و دکمه اتصال را بزنید:</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] text-stone-400 block mb-1 font-semibold">آدرس IP گوشی:</label>
                  <input
                    type="text"
                    placeholder="192.168.1.100"
                    value={directIp}
                    onChange={(e) => setDirectIp(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-yellow-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1 font-semibold">پورت (پیش‌فرض 5555):</label>
                  <input
                    type="text"
                    placeholder="5555"
                    value={directPort}
                    onChange={(e) => setDirectPort(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-yellow-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                onClick={() => handleDirectConnect()}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Radio className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                <span>{loading ? 'در حال برقراری اتصال...' : 'اتصال مستقیم به گوشی'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: COMPREHENSIVE CONNECTION GUIDE */}
          {tab === 'guide' && (
            <div className="space-y-3.5 text-xs text-stone-300">
              {/* Method A: Android 11+ No cable */}
              <div className="p-4 rounded-2xl bg-[#161720] border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-yellow-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    روش اول: اندروید ۱۱، ۱۲، ۱۳، ۱۴ و ۱۵ (بدون نیاز به کابل)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-yellow-300 font-bold">پیشنهادی</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-300 leading-relaxed pr-1">
                  <li>گوشی و لپ‌تاپ را به <strong>یک وای‌فای مشترک</strong> متصل نمایید.</li>
                  <li>در گوشی به منوی <strong>تنظیمات &gt; درباره گوشی</strong> رفته و ۷ بار روی <strong>Build Number</strong> بزنید تا Developer Options باز شود.</li>
                  <li>وارد <strong>Developer Options</strong> شده و گزینه <strong>Wireless Debugging</strong> را روشن کنید.</li>
                  <li>روی نام Wireless Debugging ضربه بزنید و گزینه <strong>Pair device with pairing code</strong> را انتخاب کنید.</li>
                  <li>کد ۶ رقمی و IP/Port ظاهرشده را در تب <strong>«جفت‌سازی»</strong> همین پنجره وارد کرده و دکمه اتصال را بزنید.</li>
                </ol>
              </div>

              {/* Method B: 1-Click Cable Initial Setup */}
              <div className="p-4 rounded-2xl bg-[#161720] border border-amber-500/25 space-y-2">
                <h4 className="font-bold text-yellow-300 flex items-center gap-2">
                  <Cable className="w-4 h-4 text-yellow-400" />
                  روش دوم: تمام نسخه‌های اندروید (راه‌اندازی با ۱ بار اتصال کابل)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-300 leading-relaxed pr-1">
                  <li>برای بار اول گوشی را با کابل USB به سیستم متصل نمایید و تأییدیه <strong>Allow USB Debugging</strong> را روی گوشی بزنید.</li>
                  <li>دستور زیر را در ترمینال یا پنجره ابزار اجرا نمایید (یا از تب اتصال مستقیم دکمه فعال‌سازی را بزنید):</li>
                </ol>
                <div className="p-2.5 rounded-xl bg-[#0a0a0f] border border-stone-800 flex items-center justify-between font-mono text-[11px] text-amber-300">
                  <span>adb tcpip 5555</span>
                  <button
                    onClick={() => handleCopy('adb tcpip 5555', 'cmd_tcpip')}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                    title="کپی دستور"
                  >
                    {copiedKey === 'cmd_tcpip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  پس از اجرای دستور، کابل را جدا کرده و در نرم‌افزار دکمه <strong>«کشف خودکار شبکه»</strong> را بزنید تا گوشی بلافاصله شناسایی شود!
                </p>
              </div>

              {/* Method C: Apple iOS Devices */}
              <div className="p-4 rounded-2xl bg-[#161720] border border-amber-500/25 space-y-2">
                <h4 className="font-bold text-yellow-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-yellow-400" />
                  روش سوم: دستگاه‌های اپل آیفون و آیپد (iOS Wi-Fi Sync)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-300 leading-relaxed pr-1">
                  <li>آیفون را برای بار اول با کابل به کامپیوتر متصل کرده و روی صفحه آیفون <strong>Trust This Computer</strong> را بزنید.</li>
                  <li>سرویس Apple Mobile Device و Bonjour به طور خودکار همگام‌سازی بی‌سیم را در شبکه محلی فعال می‌کنند.</li>
                  <li>سپس در همین نرم‌افزار از تب <strong>«کشف خودکار شبکه»</strong> می‌توانید وضعیت آیفون را مشاهده و همگام نمایید.</li>
                </ol>
              </div>

              {/* Troubleshooting Tips */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <h5 className="font-bold text-yellow-300 flex items-center gap-1.5 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-yellow-400" />
                  نکات مهم رفع اشکال و فایروال:
                </h5>
                <ul className="list-disc list-inside text-[11px] text-stone-300 space-y-1">
                  <li>اطمینان حاصل فرمایید گزینه AP Isolation یا Guest Mode در مودم Wi-Fi شما غیرفعال باشد تا دستگاه‌ها یکدیگر را ببینند.</li>
                  <li>فایروال ویندوز نباید پورت‌های ADB (۵۰۳۷ و ۵۵۵۵) را بلاک کرده باشد.</li>
                  <li>در گوشی‌های شیائومی (MIUI/HyperOS)، علاوه بر USB Debugging باید گزینه <strong>Wireless Debugging (Security Settings)</strong> نیز روشن باشد.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-amber-500/15 flex items-center justify-between flex-shrink-0 text-[11px] text-stone-400">
          <span>شرکت راهکار الکترونیک سهند (Sahand Solutions)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition-all"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
