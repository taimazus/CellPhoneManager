import React, { useState } from 'react';
import { 
  Wifi, 
  X, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Radio, 
  Sparkles, 
  Send,
  Zap,
  HelpCircle
} from 'lucide-react';

interface WirelessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const WirelessModal: React.FC<WirelessModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [tab, setTab] = useState<'pair' | 'direct' | 'tcpip'>('pair');
  
  // Pair mode state (Android 11+)
  const [pairIp, setPairIp] = useState('');
  const [pairPort, setPairPort] = useState('');
  const [pairCode, setPairCode] = useState('');

  // Direct connect state
  const [directIp, setDirectIp] = useState('');
  const [directPort, setDirectPort] = useState('5555');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handlePair = async () => {
    if (!pairIp || !pairPort || !pairCode) {
      setStatus({ text: 'لطفاً آدرس IP، پورت و کد ۶ رقمی را وارد کنید.', type: 'error' });
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

  const handleDirectConnect = async () => {
    if (!directIp) {
      setStatus({ text: 'لطفاً آدرس IP گوشی را وارد کنید.', type: 'error' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/devices/wireless/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: directIp, port: directPort || '5555' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ text: data.message || 'اتصال بی‌سیم با موفقیت برقرار شد!', type: 'success' });
        onRefresh();
      } else {
        setStatus({ text: data.error || 'خطا در اتصال به دستگاه', type: 'error' });
      }
    } catch (err: any) {
      setStatus({ text: `خطا: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0c142b] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl shadow-cyan-950/80 glass-panel text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 text-cyan-400 border border-cyan-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                اتصال بی‌سیم گوشی از طریق Wi-Fi
              </h3>
              <p className="text-xs text-slate-400">اتصال و کنترل دستگاه‌های متصل به شبکه محلی بدون نیاز به کابل</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setTab('pair'); setStatus(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              tab === 'pair'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            روش ۱: اندروید ۱۱ به بالا (Wireless Debugging)
          </button>
          <button
            onClick={() => { setTab('direct'); setStatus(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              tab === 'direct'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            روش ۲: اتصال با IP و پورت (TCP/IP)
          </button>
        </div>

        {/* Status Toast */}
        {status && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            status.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{status.text}</span>
          </div>
        )}

        {/* Tab 1: Pair with Android 11+ */}
        {tab === 'pair' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                مراحل روی گوشی:
              </span>
              <p>۱. گوشی و کامپیوتر به یک وای‌فای (Wi-Fi) مشترک متصل باشند.</p>
              <p>۲. به <strong>Developer options &gt; Wireless debugging</strong> بروید و آن را روشن کنید.</p>
              <p>۳. گزینه <strong>Pair device with pairing code</strong> را بزنید و اطلاعات ظاهر شده را در کادرهای زیر وارد کنید:</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">آدرس IP گوشی:</label>
                <input
                  type="text"
                  placeholder="مثال: 192.168.1.150"
                  value={pairIp}
                  onChange={(e) => setPairIp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">پورت (Port):</label>
                <input
                  type="text"
                  placeholder="مثال: 37129"
                  value={pairPort}
                  onChange={(e) => setPairPort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">کد جفت‌سازی ۶ رقمی (Wi-Fi pairing code):</label>
              <input
                type="text"
                placeholder="مثال: 482910"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 tracking-widest focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handlePair}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Zap className={`w-4 h-4 fill-current ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'در حال اتصال و جفت‌سازی...' : 'جفت‌سازی و اتصال بی‌سیم'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Direct IP connect */}
        {tab === 'direct' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                اتصال مستقیم با IP:
              </span>
              <p>اگر دستگاه از قبل در شبکه فعال شده، کافیست IP محلی گوشی و پورت آن (پیش‌فرض 5555) را وارد کنید:</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">آدرس IP گوشی:</label>
                <input
                  type="text"
                  placeholder="192.168.1.100"
                  value={directIp}
                  onChange={(e) => setDirectIp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">پورت (Port):</label>
                <input
                  type="text"
                  placeholder="5555"
                  value={directPort}
                  onChange={(e) => setDirectPort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleDirectConnect}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Radio className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              <span>{loading ? 'در حال برقراری اتصال...' : 'اتصال به گوشی'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
