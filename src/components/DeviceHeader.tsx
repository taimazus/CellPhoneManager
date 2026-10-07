import React from 'react';
import { 
  Smartphone, 
  RotateCw, 
  Camera, 
  Power, 
  BatteryCharging, 
  Battery, 
  Wifi, 
  Usb, 
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Apple,
  BookOpen,
  Menu,
  Shield,
  Activity
} from 'lucide-react';
import { Device } from '../types';

interface DeviceHeaderProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onRefreshDevices: () => void;
  onQuickAction: (action: string, payload?: any) => void;
  onOpenWirelessModal: () => void;
  onOpenGuideModal: (topic?: string) => void;
  isRefreshing: boolean;
  onToggleSidebar?: () => void;
}

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefreshDevices,
  onQuickAction,
  onOpenWirelessModal,
  onOpenGuideModal,
  isRefreshing,
  onToggleSidebar
}) => {
  const getOemBadge = () => {
    if (!selectedDevice) return null;
    if (selectedDevice.type === 'ios') {
      return { label: 'Apple iOS', color: 'bg-slate-800/90 text-slate-200 border-slate-700' };
    }
    const all = `${selectedDevice.name} ${selectedDevice.model || ''} ${selectedDevice.manufacturer || ''}`.toLowerCase();
    if (all.includes('xiaomi') || all.includes('redmi') || all.includes('poco') || all.includes('2201116')) {
      return { label: 'Xiaomi HyperOS / MIUI', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
    }
    if (all.includes('samsung') || all.includes('galaxy') || all.includes('sm-')) {
      return { label: 'Samsung One UI', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
    }
    if (all.includes('huawei') || all.includes('honor')) {
      return { label: 'Huawei EMUI', color: 'bg-red-500/10 text-red-300 border-red-500/30' };
    }
    if (all.includes('oppo') || all.includes('realme') || all.includes('oneplus')) {
      return { label: 'ColorOS / OxygenOS', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
    }
    if (all.includes('pixel') || all.includes('google')) {
      return { label: 'Google Pixel', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    }
    return { label: 'Android AOSP', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  const oemBadge = getOemBadge();

  return (
    <header className="h-16 bg-[#0c1220]/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between backdrop-blur-xl sticky top-0 z-30 select-none">
      {/* Device Selector & Left Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            title="منوی ناوبری"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Device Dropdown Card */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-sm">
            <div className={`p-1.5 rounded-lg ${
              selectedDevice?.type === 'ios' ? 'bg-slate-800 text-slate-100' : 'bg-blue-500/15 text-blue-400'
            }`}>
              {selectedDevice?.type === 'ios' ? <Apple className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className="text-right">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  {selectedDevice ? selectedDevice.name : 'در حال جستجو...'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>{selectedDevice?.osVersion || 'Android'}</span>
                <span>•</span>
                <span className="text-blue-400 truncate max-w-[90px]">{selectedDevice?.serial || 'Disconnected'}</span>
              </div>
            </div>

            {/* Hidden Native Select */}
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={selectedDevice?.id || ''}
              onChange={(e) => {
                const dev = devices.find(d => d.id === e.target.value);
                if (dev) onSelectDevice(dev);
              }}
            >
              {devices.map((d) => {
                const isWifiDev = d.id.includes(':') || d.id.includes('.');
                return (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.type.toUpperCase()}: {d.name} ({isWifiDev ? 'Wi-Fi' : 'USB'}) - {d.serial}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* OEM Badge */}
        {oemBadge && (
          <div className={`hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${oemBadge.color}`}>
            <span>{oemBadge.label}</span>
          </div>
        )}

        {/* Connection Type Badge */}
        {selectedDevice && (
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
            selectedDevice.id.includes(':') || selectedDevice.id.includes('.')
              ? 'bg-blue-500/10 text-blue-300 border-blue-500/25'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
          }`}>
            {selectedDevice.id.includes(':') || selectedDevice.id.includes('.') ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-blue-400" />
                <span>بی‌سیم (Wi-Fi)</span>
              </>
            ) : (
              <>
                <Usb className="w-3.5 h-3.5 text-emerald-400" />
                <span>کابل (USB)</span>
              </>
            )}
          </div>
        )}

        {/* Refresh Devices */}
        <button
          onClick={onRefreshDevices}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all disabled:opacity-50"
          title="بروزرسانی وضعیت و اتصال‌ها"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Add Wireless Device */}
        <button
          onClick={onOpenWirelessModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all group"
          title="اتصال دستگاه جدید با وای‌فای"
        >
          <Wifi className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>اتصال Wi-Fi</span>
        </button>
      </div>

      {/* Telemetry Badges & Quick Action Tools */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {selectedDevice?.battery && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
            {selectedDevice.battery.status === 'Charging' ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="font-mono font-bold text-xs text-emerald-400">
              {selectedDevice.battery.level}%
            </span>
            <span className="text-slate-500 text-[10px] hidden md:inline">| {selectedDevice.battery.temperature}°C</span>
          </div>
        )}

        {/* User Guide Button */}
        <button
          onClick={() => onOpenGuideModal()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm"
          title="مرکز راهنما و آموزش جامع"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">راهنما</span>
        </button>

        {/* Quick Screenshot */}
        <button
          onClick={() => onQuickAction('screenshot')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          title="اسکرین‌شات و ذخیره در سیستم"
        >
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">اسکرین‌شات</span>
        </button>

        {/* Quick Reboot */}
        <button
          onClick={() => onQuickAction('reboot')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
          title="راه‌اندازی مجدد (Reboot)"
        >
          <Power className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">ری‌استارت</span>
        </button>
      </div>
    </header>
  );
};
