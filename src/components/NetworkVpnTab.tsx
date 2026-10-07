import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Globe, 
  ShieldCheck, 
  Cable, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  ExternalLink, 
  Radio, 
  Share2, 
  Activity, 
  Lock, 
  Unlock, 
  Cpu, 
  HelpCircle,
  Laptop,
  Smartphone,
  ArrowLeftRight
} from 'lucide-react';
import { Device } from '../types';

interface NetworkVpnTabProps {
  device: Device | null;
}

interface ForwardedPort {
  serial: string;
  local: string;
  remote: string;
}

export const NetworkVpnTab: React.FC<NetworkVpnTabProps> = ({ device }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // VPN Bridge State
  const [selectedPreset, setSelectedPreset] = useState<'v2ray' | 'clash' | 'everyproxy' | 'custom'>('v2ray');
  const [customPort, setCustomPort] = useState<string>('10809');
  const [activePort, setActivePort] = useState<number>(10809);
  const [forwardedList, setForwardedList] = useState<ForwardedPort[]>([]);
  const [proxyEnabled, setProxyEnabled] = useState<boolean>(false);
  const [proxyServer, setProxyServer] = useState<string>('127.0.0.1:10809');

  // Diagnostics State
  const [pingResult, setPingResult] = useState<{ pingGoogle?: string; pingCf?: string; status?: string } | null>(null);
  const [publicIp, setPublicIp] = useState<string>('در حال بررسی...');
  const [testingPing, setTestingPing] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch current status
  const fetchStatus = async () => {
    if (!device) return;
    try {
      // Forward list
      const fRes = await fetch(`/api/devices/${device.id}/network/vpn/forwards`);
      const fData = await fRes.json();
      if (fData.forwards) setForwardedList(fData.forwards);

      // Windows Proxy status
      const pRes = await fetch('/api/network/proxy/status');
      const pData = await pRes.json();
      if (pData) {
        setProxyEnabled(pData.enabled);
        if (pData.proxyServer) setProxyServer(pData.proxyServer);
      }

      // Public IP
      fetchPublicIp();
    } catch {
      // quiet
    }
  };

  const fetchPublicIp = async () => {
    try {
      const res = await fetch('/api/network/public-ip');
      const data = await res.json();
      if (data.ip) setPublicIp(data.ip);
    } catch {
      setPublicIp('نامشخص');
    }
  };

  const testPings = async () => {
    setTestingPing(true);
    try {
      const [gRes, cfRes] = await Promise.all([
        fetch('/api/network/ping?host=8.8.8.8').then(r => r.json()),
        fetch('/api/network/ping?host=1.1.1.1').then(r => r.json())
      ]);
      setPingResult({
        pingGoogle: gRes.avgTime || 'تایم‌اوت',
        pingCf: cfRes.avgTime || 'تایم‌اوت',
        status: gRes.success || cfRes.success ? 'متصل و فعال' : 'قطع ارتباط'
      });
      fetchPublicIp();
      showToast('تست پینگ و سلامت شبکه با موفقیت انجام شد', 'success');
    } catch (err: any) {
      showToast(`خطا در تست پینگ: ${err.message}`, 'error');
    } finally {
      setTestingPing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [device?.id]);

  // Preset Handler
  const handlePresetSelect = (preset: 'v2ray' | 'clash' | 'everyproxy' | 'custom') => {
    setSelectedPreset(preset);
    let port = 10809;
    if (preset === 'v2ray') port = 10809;
    if (preset === 'clash') port = 7890;
    if (preset === 'everyproxy') port = 8080;
    if (preset === 'custom') port = parseInt(customPort, 10) || 10809;
    setActivePort(port);
  };

  // 2. USB Tethering Actions
  const handleEnableTether = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/network/tether/enable`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTether = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/network/tether/disable`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTetherSettings = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/network/tether/settings`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // 3. 1-Click VPN to PC Proxy Bridge
  const handleStartVpnBridge = async () => {
    if (!device) return;
    setLoading(true);
    const portToUse = selectedPreset === 'custom' ? parseInt(customPort, 10) : activePort;
    try {
      // 1. ADB Forward
      const fRes = await fetch(`/api/devices/${device.id}/network/vpn/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portToUse })
      });
      const fData = await fRes.json();

      if (!fData.success) {
        showToast(`خطا در فوروارد پورت: ${fData.error}`, 'error');
        setLoading(false);
        return;
      }

      // 2. Set Windows System Proxy
      const pRes = await fetch('/api/network/proxy/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, proxyServer: `127.0.0.1:${portToUse}` })
      });
      const pData = await pRes.json();

      if (pData.success) {
        setProxyEnabled(true);
        setProxyServer(`127.0.0.1:${portToUse}`);
        showToast(`✅ فیلترشکن گوشی با موفقیت به کامپیوتر متصل شد! (پروکسی 127.0.0.1:${portToUse})`, 'success');
        fetchStatus();
      } else {
        showToast(`خطا در تنظیم پروکسی ویندوز: ${pData.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStopVpnBridge = async () => {
    if (!device) return;
    setLoading(true);
    const portToUse = selectedPreset === 'custom' ? parseInt(customPort, 10) : activePort;
    try {
      // 1. Disable Windows System Proxy
      await fetch('/api/network/proxy/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false })
      });
      setProxyEnabled(false);

      // 2. Remove ADB Forward
      await fetch(`/api/devices/${device.id}/network/vpn/remove-forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portToUse })
      });

      showToast('اشتراک VPN و پروکسی ویندوز غیرفعال شد.', 'success');
      fetchStatus();
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span>اشتراک اینترنت و فیلترشکن گوشی روی کامپیوتر (Network & VPN Bridge)</span>
          </h2>
          <p className="text-xs text-slate-400">
            انتقال اینترنت کابل USB (Tethering)، هدایت تونل VPN گوشی (v2rayNG, Clash, Shadowsocks) به ویندوز با تنظیم خودکار پروکسی سیستمی
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی وضعیت</span>
          </button>
        </div>
      </div>

      {/* Main Grid: VPN Bridge & USB Tethering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========================================================= */}
        {/* CARD 1: PHONE VPN TO PC BRIDGE (فیلترشکن گوشی به سیستم) */}
        {/* ========================================================= */}
        <div className="rounded-3xl glass-panel p-6 border border-cyan-500/30 space-y-5 bg-gradient-to-br from-cyan-950/20 via-slate-900 to-blue-950/20 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">انتقال فیلترشکن گوشی به ویندوز</h3>
                  <p className="text-[11px] text-slate-400">اشتراک تونل V2Ray / Clash / Shadowsocks با کامپیوتر</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                proxyEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${proxyEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                <span>{proxyEnabled ? 'پروکسی ویندوز فعال است' : 'غیرفعال'}</span>
              </div>
            </div>

            {/* Presets Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block text-right">
                انتخاب نوع اپلیکیشن فیلترشکن فعال روی گوشی:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'v2ray', label: 'v2rayNG / Xray', port: 10809, desc: 'Port 10809' },
                  { id: 'clash', label: 'Clash / Mihomo', port: 7890, desc: 'Port 7890' },
                  { id: 'everyproxy', label: 'EveryProxy', port: 8080, desc: 'Port 8080' },
                  { id: 'custom', label: 'پورت دلخواه', port: customPort, desc: 'سفارشی' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id as any)}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      selectedPreset === p.id 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50' 
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold text-white">{p.label}</span>
                    <span className="text-[10px] font-mono text-cyan-400 mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Port Input */}
            {selectedPreset === 'custom' && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-right">
                <span className="text-xs text-slate-400">شماره پورت HTTP پروکسی گوشی:</span>
                <input
                  type="number"
                  value={customPort}
                  onChange={(e) => {
                    setCustomPort(e.target.value);
                    setActivePort(parseInt(e.target.value, 10) || 10809);
                  }}
                  className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-center font-mono text-cyan-300 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Architecture Flow Diagram */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-around text-center text-xs">
              <div className="space-y-1">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mx-auto w-fit">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-[11px]">گوشی (VPN فعال)</div>
                <div className="text-[10px] text-slate-500 font-mono">Port {selectedPreset === 'custom' ? customPort : activePort}</div>
              </div>

              <div className="flex flex-col items-center justify-center text-cyan-400 animate-pulse">
                <ArrowLeftRight className="w-5 h-5" />
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">ADB Tunnel</span>
              </div>

              <div className="space-y-1">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mx-auto w-fit">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-[11px]">ویندوز (پروکسی خودکار)</div>
                <div className="text-[10px] text-slate-500 font-mono">127.0.0.1:{selectedPreset === 'custom' ? customPort : activePort}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {!proxyEnabled ? (
              <button
                onClick={handleStartVpnBridge}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-5 h-5" />
                <span>اتصال و فعال‌سازی پروکسی ویندوز (1-Click Bridge)</span>
              </button>
            ) : (
              <button
                onClick={handleStopVpnBridge}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <Unlock className="w-5 h-5" />
                <span>قطع اتصال و بازگردانی تنظیمات پروکسی ویندوز</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: USB TETHERING & HOTSPOT (اشتراک اینترنت با کابل) */}
        {/* ========================================================= */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Cable className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">اشتراک اینترنت مستقیم با کابل (USB Tethering)</h3>
                  <p className="text-[11px] text-slate-400">استفاده از اینترنت سیم‌کارت به عنوان کارت شبکه کامپیوتر</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed text-right">
              اشتراک‌گذاری اینترنت از طریق کابل USB با پروتکل **RNDIS**، پینگ به شدت پایین‌تر و پایداری بالاتری نسبت به وای‌فای ارائه می‌دهد و همزمان گوشی را نیز شارژ نگه می‌دارد.
            </p>

            <div className="space-y-2 text-right">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">نوع اتصال:</span>
                <span className="font-bold text-emerald-400">USB Ethernet (RNDIS)</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">مزیت:</span>
                <span className="font-bold text-slate-200">صفر درصد اتلاف بسته (0% Packet Loss) مناسب گیم</span>
              </div>
            </div>
          </div>

          {/* Tether Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleEnableTether}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>فعال‌سازی USB Tethering</span>
            </button>

            <button
              onClick={handleDisableTether}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Cable className="w-4 h-4" />
              <span>غیرفعال‌سازی کابل</span>
            </button>

            <button
              onClick={handleOpenTetherSettings}
              className="sm:col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>باز کردن صفحه تنظیمات Tethering و هات‌اسپات در گوشی</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CARD 3: DIAGNOSTICS & PUBLIC IP & INSTRUCTIONS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Network Diagnostics */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">تست سلامت، پینگ و آی‌پی</h3>
            </div>
            <button
              onClick={testPings}
              disabled={testingPing}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold"
              title="تست پینگ مجدد"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">آی‌پی عمومی کامپیوتر (Public IP):</span>
              <span className="font-mono font-bold text-cyan-300">{publicIp}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">پینگ Google (8.8.8.8):</span>
              <span className="font-mono font-bold text-emerald-400">
                {pingResult?.pingGoogle || 'تست نشده'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">پینگ Cloudflare (1.1.1.1):</span>
              <span className="font-mono font-bold text-emerald-400">
                {pingResult?.pingCf || 'تست نشده'}
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Configuration Guide */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 text-right">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">نکات بسیار مهم جهت اشتراک بی‌نقص فیلترشکن</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>تنظیم v2rayNG:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                در منوی سه‌خط برنامه v2rayNG وارد Settings شوید و گزینه **"Allow connection from the LAN"** یا **"Share VPN within local network"** را فعال نمایید.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>تنظیم Clash / Mihomo:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                در برنامه کلش وارد Settings شوید و گزینه **"Allow LAN"** را روی حالت روشن (ON) قرار دهید. پورت پیش‌فرض 7890 است.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>برنامه EveryProxy (پیشنهاد ویژه):</span>
              </div>
              <p className="text-[11px] text-slate-400">
                اگر فیلترشکن شما پورت باز نمی‌کند، برنامه رایگان **EveryProxy** را از بازار یا گوگل‌پلی نصب کرده و سوییچ HTTP را روشن کنید (پورت 8080).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>پشتیبانی از تلگرام، دیسکورد و مرورگرها:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                با زدن دکمه 1-Click Bridge، کل ترافیک ویندوز از پروکسی گوشی رد می‌شود و برنامه‌ها بدون نیاز به تنظیم دستی متصل می‌شوند.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
