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
  Activity,
  Crown
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
      return { label: 'Apple iOS', color: 'bg-stone-800/90 text-stone-200 border-amber-500/20' };
    }
    const all = `${selectedDevice.name} ${selectedDevice.model || ''} ${selectedDevice.manufacturer || ''}`.toLowerCase();
    if (all.includes('xiaomi') || all.includes('redmi') || all.includes('poco') || all.includes('2201116')) {
      return { label: 'Xiaomi HyperOS / MIUI', color: 'bg-amber-500/15 text-yellow-300 border-amber-500/35' };
    }
    if (all.includes('samsung') || all.includes('galaxy') || all.includes('sm-')) {
      return { label: 'Samsung One UI', color: 'bg-yellow-500/15 text-amber-200 border-yellow-500/30' };
    }
    if (all.includes('huawei') || all.includes('honor')) {
      return { label: 'Huawei EMUI', color: 'bg-amber-600/15 text-amber-300 border-amber-600/30' };
    }
    if (all.includes('oppo') || all.includes('realme') || all.includes('oneplus')) {
      return { label: 'ColorOS / OxygenOS', color: 'bg-amber-500/15 text-yellow-200 border-amber-500/30' };
    }
    if (all.includes('pixel') || all.includes('google')) {
      return { label: 'Google Pixel', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
    return { label: 'Android AOSP', color: 'bg-stone-800 text-stone-300 border-stone-700' };
  };

  const oemBadge = getOemBadge();

  return (
    <header className="h-16 bg-[#0d0e13]/95 border-b border-amber-500/15 px-4 sm:px-6 flex items-center justify-between backdrop-blur-2xl sticky top-0 z-30 select-none">
      {/* Device Selector & Left Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-[#14151b] text-stone-400 hover:text-yellow-300 border border-amber-500/20"
            title="منوی ناوبری"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Device Dropdown Card */}
        <div className="relative group">
          <div className="flex items-center gap-2.5 bg-[#14151b] hover:bg-[#1a1b22] px-3 py-1.5 rounded-xl border border-amber-500/25 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm">
            <div className={`p-1.5 rounded-lg ${
              selectedDevice?.type === 'ios' ? 'bg-stone-800 text-stone-100' : 'bg-amber-500/20 text-yellow-300'
            }`}>
              {selectedDevice?.type === 'ios' ? <Apple className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className="text-right">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="truncate max-w-[130px] sm:max-w-[200px] text-amber-100">
                  {selectedDevice ? selectedDevice.name : 'در حال جستجو...'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-yellow-300 transition-colors" />
              </div>
              <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1.5">
                <span className="text-amber-300/80">{selectedDevice?.osVersion || 'Android'}</span>
                <span>•</span>
                <span className="text-yellow-400/90 truncate max-w-[90px]">{selectedDevice?.serial || 'Disconnected'}</span>
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
                  <option key={d.id} value={d.id} className="bg-[#14151b] text-stone-100">
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
            <Crown className="w-3.5 h-3.5 text-yellow-400/80" />
            <span>{oemBadge.label}</span>
          </div>
        )}

        {/* Connection Type Badge */}
        {selectedDevice && (
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
            selectedDevice.id.includes(':') || selectedDevice.id.includes('.')
              ? 'bg-amber-500/15 text-yellow-300 border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            {selectedDevice.id.includes(':') || selectedDevice.id.includes('.') ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-yellow-400" />
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
          className="p-2 rounded-xl bg-[#14151b] hover:bg-[#1a1b22] text-stone-400 hover:text-yellow-300 border border-amber-500/20 transition-all disabled:opacity-50"
          title="بروزرسانی وضعیت و اتصال‌ها"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-yellow-400' : ''}`} />
        </button>

        {/* Add Wireless Device */}
        <button
          onClick={onOpenWirelessModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 border border-amber-500/30 text-xs font-bold transition-all group"
          title="اتصال دستگاه جدید با وای‌فای"
        >
          <Wifi className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span>اتصال Wi-Fi</span>
        </button>
      </div>

      {/* Telemetry Badges & Quick Action Tools */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {selectedDevice?.battery && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#14151b] border border-amber-500/20 text-xs text-stone-200">
            {selectedDevice.battery.status === 'Charging' ? (
              <BatteryCharging className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span className="font-mono font-bold text-xs text-yellow-400">
              {selectedDevice.battery.level}%
            </span>
            <span className="text-stone-500 text-[10px] hidden md:inline">| {selectedDevice.battery.temperature}°C</span>
          </div>
        )}

        {/* User Guide Button */}
        <button
          onClick={() => onOpenGuideModal()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-yellow-300 border border-amber-500/35 text-xs font-bold transition-all shadow-sm"
          title="مرکز راهنما و آموزش جامع"
        >
          <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
          <span className="hidden md:inline">راهنما</span>
        </button>

        {/* Quick Screenshot */}
        <button
          onClick={() => onQuickAction('screenshot')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#14151b] hover:bg-[#1a1b22] text-stone-300 hover:text-yellow-300 border border-amber-500/20 hover:border-amber-500/40 text-xs font-semibold transition-all shadow-sm"
          title="اسکرین‌شات و ذخیره در سیستم"
        >
          <Camera className="w-3.5 h-3.5 text-yellow-400/80" />
          <span className="hidden md:inline">اسکرین‌شات</span>
        </button>

        {/* Quick Reboot */}
        <button
          onClick={() => onQuickAction('reboot')}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
          title="راه‌اندازی مجدد (Reboot)"
        >
          <Power className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">ری‌استارت</span>
        </button>
      </div>
    </header>
  );
};
