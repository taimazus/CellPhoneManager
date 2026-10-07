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
  Apple
} from 'lucide-react';
import { Device } from '../types';

interface DeviceHeaderProps {
  devices: Device[];
  selectedDevice: Device | null;
  onSelectDevice: (device: Device) => void;
  onRefreshDevices: () => void;
  onQuickAction: (action: string, payload?: any) => void;
  onOpenWirelessModal: () => void;
  isRefreshing: boolean;
}

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefreshDevices,
  onQuickAction,
  onOpenWirelessModal,
  isRefreshing
}) => {
  return (
    <header className="h-20 bg-[#0c142b]/90 border-b border-cyan-500/20 px-6 flex items-center justify-between glass-panel sticky top-0 z-30">
      {/* Device Selector Dropdown */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="flex items-center gap-3 bg-slate-900/90 hover:bg-slate-850 px-4 py-2.5 rounded-xl border border-slate-700/80 hover:border-cyan-500/50 cursor-pointer transition-all shadow-inner">
            <div className={`p-2 rounded-lg ${
              selectedDevice?.type === 'ios' ? 'bg-slate-800 text-slate-100' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {selectedDevice?.type === 'ios' ? <Apple className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {selectedDevice ? selectedDevice.name : 'در حال جستجوی دستگاه...'}
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>{selectedDevice?.osVersion || 'USB/Wi-Fi'}</span>
                <span>•</span>
                <span className="text-cyan-400">{selectedDevice?.serial || 'Disconnected'}</span>
              </div>
            </div>

            {/* Dropdown Options */}
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={selectedDevice?.id || ''}
              onChange={(e) => {
                const dev = devices.find(d => d.id === e.target.value);
                if (dev) onSelectDevice(dev);
              }}
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.type.toUpperCase()}: {d.name} ({d.serial})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Refresh Devices Button */}
        <button
          onClick={onRefreshDevices}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all"
          title="بروزرسانی لیست دستگاه‌ها"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Wireless Connect Button */}
        <button
          onClick={onOpenWirelessModal}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/20 hover:from-cyan-500/20 hover:to-blue-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-sm group"
          title="اتصال بی‌سیم از طریق Wi-Fi بدون کابل"
        >
          <Wifi className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>اتصال بی‌سیم (Wi-Fi)</span>
        </button>
      </div>


      {/* Quick Action Buttons & Telemetry Badges */}
      <div className="flex items-center gap-3">
        {selectedDevice?.battery && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 shadow-sm">
            {selectedDevice.battery.status === 'Charging' ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-cyan-400" />
            )}
            <span className="font-mono font-bold text-sm text-emerald-400">
              {selectedDevice.battery.level}%
            </span>
            <span className="text-slate-500 hidden sm:inline">| {selectedDevice.battery.temperature}°C</span>
          </div>
        )}

        {/* Quick Screenshot Button */}
        <button
          onClick={() => onQuickAction('screenshot')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-semibold transition-all shadow-sm"
          title="اسکرین‌شات سریع و ذخیره"
        >
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">اسکرین‌شات</span>
        </button>

        {/* Quick Reboot Menu */}
        <div className="relative group">
          <button
            onClick={() => onQuickAction('reboot')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 text-xs font-semibold transition-all shadow-sm"
            title="راه‌اندازی مجدد گوشی"
          >
            <Power className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">ری‌استارت</span>
          </button>
        </div>
      </div>
    </header>
  );
};
