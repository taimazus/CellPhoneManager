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
  Crown,
  ExternalLink
} from 'lucide-react';
import { Device } from '../types';
import { APP_VERSION } from '../constants';

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
    <header className="h-16 bg-[#0d0e13]/95 border-b border-amber-500/15 px-2.5 sm:px-4 md:px-6 flex items-center justify-between backdrop-blur-2xl sticky top-0 z-30 select-none min-w-0 w-full gap-2 overflow-x-hidden">
      {/* Device Selector & Left Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-[#14151b] hover:bg-[#1a1b22] text-stone-300 hover:text-yellow-300 border border-amber-500/25 shrink-0 transition-colors active:scale-95"
            title="منوی ناوبری"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Device Dropdown Card */}
        <div className="relative group min-w-0 shrink">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#14151b] hover:bg-[#1a1b22] px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-500/25 hover:border-amber-500/50 cursor-pointer transition-all shadow-sm min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${
              selectedDevice?.type === 'ios' ? 'bg-stone-800 text-stone-100' : 'bg-amber-500/20 text-yellow-300'
            }`}>
              {selectedDevice?.type === 'ios' ? <Apple className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            
            <div className="text-right min-w-0 overflow-hidden">
              <div className="text-xs font-bold text-white flex items-center gap-1 min-w-0">
                <span className="truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[180px] md:max-w-[220px] text-amber-100 block">
                  {selectedDevice ? selectedDevice.name : 'در حال جستجو...'}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-yellow-300 transition-colors shrink-0" />
              </div>
              <div className="text-[9px] sm:text-[10px] text-stone-400 font-mono flex items-center gap-1 truncate">
                <span className="text-amber-300/80 shrink-0">{selectedDevice?.osVersion || 'Android'}</span>
                <span className="shrink-0">•</span>
                <span className="text-yellow-400/90 truncate max-w-[60px] sm:max-w-[100px]">{selectedDevice?.serial || 'Disconnected'}</span>
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
          <div className={`hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 ${oemBadge.color}`}>
            <Crown className="w-3.5 h-3.5 text-yellow-400/80" />
            <span>{oemBadge.label}</span>
          </div>
        )}

        {/* Connection Type Badge */}
        {selectedDevice && (
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 ${
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
          className="p-2 rounded-xl bg-[#14151b] hover:bg-[#1a1b22] text-stone-400 hover:text-yellow-300 border border-amber-500/20 transition-all disabled:opacity-50 shrink-0"
          title="بروزرسانی وضعیت و اتصال‌ها"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-yellow-400' : ''}`} />
        </button>

        {/* Add Wireless Device */}
        <button
          onClick={onOpenWirelessModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 border border-amber-500/30 text-xs font-bold transition-all group shrink-0"
          title="اتصال دستگاه جدید با وای‌فای"
        >
          <Wifi className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span>اتصال Wi-Fi</span>
        </button>
      </div>

      {/* Telemetry Badges & Quick Action Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Company Branding & Website Link */}
        <a
          href="https://irres.ir"
          target="_blank"
          rel="noreferrer"
          className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-600/15 text-yellow-300 border border-amber-500/30 text-xs font-bold transition-all hover:border-amber-500/60 shadow-sm group shrink-0"
          title="شرکت راهکار الکترونیک سهند (https://irres.ir)"
        >
          <Crown className="w-3.5 h-3.5 text-yellow-400" />
          <span>راهکار الکترونیک سهند</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-yellow-200 border border-amber-500/30">{APP_VERSION}</span>
          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
        </a>

        {/* Battery Status */}
        {selectedDevice?.battery && (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#14151b] border border-amber-500/20 text-xs text-stone-200 shrink-0">
            {selectedDevice.battery.status === 'Charging' ? (
              <BatteryCharging className="w-3.5 h-3.5 text-yellow-400 animate-pulse shrink-0" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-stone-400 shrink-0" />
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
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-yellow-300 border border-amber-500/35 text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95"
          title="مرکز راهنما و آموزش جامع"
        >
          <BookOpen className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span className="hidden sm:inline">راهنما</span>
        </button>

        {/* Quick Screenshot */}
        <button
          onClick={() => onQuickAction('screenshot')}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#14151b] hover:bg-[#1a1b22] text-stone-300 hover:text-yellow-300 border border-amber-500/20 hover:border-amber-500/40 text-xs font-semibold transition-all shadow-sm shrink-0 active:scale-95"
          title="اسکرین‌شات و ذخیره در سیستم"
        >
          <Camera className="w-3.5 h-3.5 text-yellow-400/80 shrink-0" />
          <span className="hidden lg:inline">اسکرین‌شات</span>
        </button>

        {/* Quick Reboot */}
        <button
          onClick={() => onQuickAction('reboot')}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm shrink-0 active:scale-95"
          title="راه‌اندازی مجدد (Reboot)"
        >
          <Power className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="hidden lg:inline">ری‌استارت</span>
        </button>
      </div>
    </header>
  );
};
