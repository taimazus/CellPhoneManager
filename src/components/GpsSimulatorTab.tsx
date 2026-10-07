import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  Sliders
} from 'lucide-react';
import { Device } from '../types';

interface GpsSimulatorTabProps {
  device: Device | null;
}

export const GpsSimulatorTab: React.FC<GpsSimulatorTabProps> = ({ device }) => {
  const [lat, setLat] = useState<number>(35.7448);
  const [lng, setLng] = useState<number>(51.3753);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState<boolean>(false);
  const [speedKmH, setSpeedKmH] = useState<number>(40);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSetGps = async (latitude = lat, longitude = lng) => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/gps/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`موقعیت مکانی روی (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) تنظیم شد.`, 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleClearGps = async () => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/gps/clear`, { method: 'POST' });
      showToast('موقعیت مکانی جعلی غیرفعال و به GPS واقعی بازگشت.', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleStartRoute = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/gps/route/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLat: lat,
          startLng: lng,
          endLat: lat + 0.05,
          endLng: lng + 0.05,
          speedKmH
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsSimulatingRoute(true);
        showToast(data.message, 'success');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleStopRoute = async () => {
    if (!device) return;
    try {
      await fetch(`/api/devices/${device.id}/gps/route/stop`, { method: 'POST' });
      setIsSimulatingRoute(false);
      showToast('شبیه‌سازی حرکت متوقف شد.', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const cityPresets = [
    { name: 'تهران (برج میلاد)', lat: 35.7448, lng: 51.3753 },
    { name: 'تهران (میدان آزادی)', lat: 35.6997, lng: 51.3380 },
    { name: 'دبی (برج خلیفه)', lat: 25.1972, lng: 55.2744 },
    { name: 'پاریس (برج ایفل)', lat: 48.8584, lng: 2.2945 },
    { name: 'نیویورک (تایمز اسکوئر)', lat: 40.7580, lng: -73.9855 },
    { name: 'استانبول (میدان تکسیم)', lat: 41.0370, lng: 28.9850 }
  ];

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
            <Compass className="w-6 h-6 text-cyan-400" />
            <span>جعل موقعیت مکانی و شبیه‌ساز حرکت زنده روی نقشه (GPS Spoofing & Route Simulator)</span>
          </h2>
          <p className="text-xs text-slate-400">
            تغییر لوکیشن GPS گوشی به هر نقطه از دنیا و شبیه‌سازی حرکت با سرعت پیاده‌روی، دوچرخه یا خودرو بدون نیاز به روت
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GPS Coordinates Input */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>مختصات جغرافیایی GPS</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">عرض جغرافیایی (Latitude):</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-cyan-300 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">طول جغرافیایی (Longitude):</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-cyan-300 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleSetGps()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                اعمال موقعیت مکانی جدید
              </button>

              <button
                onClick={handleClearGps}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
              >
                بازنشانی به GPS واقعی گوشی
              </button>
            </div>
          </div>
        </div>

        {/* Route Simulation & Presets */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-400" />
              <span>شبیه‌ساز حرکت زنده (Live Route Simulation)</span>
            </h3>

            {!isSimulatingRoute ? (
              <button
                onClick={handleStartRoute}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>شروع شبیه‌سازی حرکت</span>
              </button>
            ) : (
              <button
                onClick={handleStopRoute}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-black text-xs animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>توقف حرکت</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-300 font-bold">
              <span>سرعت حرکت شبیه‌سازی شده:</span>
              <span className="font-mono text-emerald-400 font-bold">{speedKmH} km/h ({speedKmH <= 7 ? 'پیاده‌روی' : speedKmH <= 20 ? 'دوچرخه' : 'خودرو'})</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              value={speedKmH}
              onChange={(e) => setSpeedKmH(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400"
            />
          </div>

          {/* City Presets Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300">موقعیت‌های مکانی آماده (Quick City Presets):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {cityPresets.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setLat(c.lat);
                    setLng(c.lng);
                    handleSetGps(c.lat, c.lng);
                  }}
                  className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-right transition-all"
                >
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{c.lat.toFixed(2)}, {c.lng.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
