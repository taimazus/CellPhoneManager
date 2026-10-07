import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DeviceHeader } from './components/DeviceHeader';
import { OverviewTab } from './components/OverviewTab';
import { MirrorControlTab } from './components/MirrorControlTab';
import { AppsTab } from './components/AppsTab';
import { TweaksTab } from './components/TweaksTab';
import { DiagnosticsTab } from './components/DiagnosticsTab';
import { DoctorTab } from './components/DoctorTab';
import { FilesTab } from './components/FilesTab';
import { BackupTab } from './components/BackupTab';
import { FastbootTab } from './components/FastbootTab';
import { HardwareLabTab } from './components/HardwareLabTab';
import { MessagesTab } from './components/MessagesTab';
import { CameraTab } from './components/CameraTab';
import { MicrophoneTab } from './components/MicrophoneTab';
import { NetworkVpnTab } from './components/NetworkVpnTab';
import { AutomationTab } from './components/AutomationTab';
import { NotificationsTab } from './components/NotificationsTab';
import { MultiDeviceTab } from './components/MultiDeviceTab';
import { ApkInspectorTab } from './components/ApkInspectorTab';
import { ScreenRecorderTab } from './components/ScreenRecorderTab';
import { BatteryHealthTab } from './components/BatteryHealthTab';
import { AiAssistantTab } from './components/AiAssistantTab';
import { RemoteControllerTab } from './components/RemoteControllerTab';
import { GpsSimulatorTab } from './components/GpsSimulatorTab';
import { DebloaterTab } from './components/DebloaterTab';
import { AppClonerTab } from './components/AppClonerTab';
import { MigrationTab } from './components/MigrationTab';
import { ScreenOcrTab } from './components/ScreenOcrTab';
import { AudioFxTab } from './components/AudioFxTab';
import { LockscreenRescueTab } from './components/LockscreenRescueTab';
import { RootToolkitTab } from './components/RootToolkitTab';
import { RomFlasherTab } from './components/RomFlasherTab';
import { PasswordVaultTab } from './components/PasswordVaultTab';
import { WirelessModal } from './components/WirelessModal';
import { UserGuideModal } from './components/UserGuideModal';
import { Device } from './types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  activeTab: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TabErrorBoundary caught error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl glass-panel border border-rose-500/30 text-right space-y-4 max-w-xl mx-auto my-12" dir="rtl">
          <div className="flex items-center gap-3 text-rose-400">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 font-bold">⚠️</div>
            <div>
              <h3 className="text-base font-bold text-white">خطا در بارگذاری این بخش</h3>
              <p className="text-xs text-rose-300 font-mono mt-0.5">{this.state.error?.message || 'خطای رندر رخ داد'}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            سیستم به صورت خودکار خطا را ایزوله کرد تا سایر بخش‌های برنامه بدون مشکل به کار خود ادامه دهند.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            تلاش مجدد
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isWirelessModalOpen, setIsWirelessModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [guideTopic, setGuideTopic] = useState<string>('getting_started');

  const handleOpenGuide = (topic: string = 'getting_started') => {
    setGuideTopic(topic);
    setIsGuideModalOpen(true);
  };

  const fetchDevices = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (data.devices && Array.isArray(data.devices)) {
        // Sort devices so that high-speed USB devices come first before Wi-Fi / mock devices
        const sorted = [...data.devices].sort((a: Device, b: Device) => {
          const aWifi = a.id.includes(':') || a.id.includes('.');
          const bWifi = b.id.includes(':') || b.id.includes('.');
          if (aWifi && !bWifi) return 1;
          if (!aWifi && bWifi) return -1;
          return 0;
        });
        setDevices(sorted);
        if (!selectedDevice || !sorted.some((d: Device) => d.id === selectedDevice.id)) {
          setSelectedDevice(sorted[0] || null);
        }
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleQuickAction = async (action: string, payload?: any) => {
    if (!selectedDevice) return;

    if (action === 'screenshot') {
      try {
        const res = await fetch(`/api/devices/${selectedDevice.id}/control/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'screenshot', type: selectedDevice.type })
        });
        const data = await res.json();
        if (data.success && data.base64) {
          const win = window.open();
          win?.document.write(`<iframe src="data:image/png;base64,${data.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          alert('اسکرین‌شات دریافت شد (حالت آزمایشی)');
        }
      } catch (err: any) {
        alert(`خطا در گرفتن اسکرین‌شات: ${err.message}`);
      }
      return;
    }

    if (action === 'reboot') {
      const mode = payload?.mode || 'normal';
      if (!confirm(`آیا از راه‌اندازی مجدد گوشی (${mode}) اطمینان دارید؟`)) return;
      try {
        await fetch(`/api/devices/${selectedDevice.id}/control/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reboot', mode, type: selectedDevice.type })
        });
        alert('دستور راه‌اندازی مجدد برای دستگاه ارسال شد.');
      } catch (err: any) {
        alert(`خطا: ${err.message}`);
      }
    }
  };

  const handleSendKey = async (keycode: number | string) => {
    if (!selectedDevice) return;
    try {
      await fetch(`/api/devices/${selectedDevice.id}/control/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'key', keycode, type: selectedDevice.type })
      });
    } catch (err) {
      console.error('Error sending keycode:', err);
    }
  };

  const handleSendTap = async (x: number, y: number) => {
    if (!selectedDevice) return;
    try {
      await fetch(`/api/devices/${selectedDevice.id}/control/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tap', x, y, type: selectedDevice.type })
      });
    } catch (err) {
      console.error('Error sending tap:', err);
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('cpm_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('cpm_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0e17] overflow-hidden text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
        />
      )}

      {/* Main Navigation Sidebar (Desktop + Mobile Drawer) */}
      <div className={`
        fixed md:relative inset-y-0 right-0 z-50 md:z-auto transition-transform duration-300 ease-in-out flex h-full
        ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }} 
          deviceType={selectedDevice?.type} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main Application Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#0a0e17]/80">
        {/* Device Selection & Action Header */}
        <DeviceHeader
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
          onRefreshDevices={fetchDevices}
          onQuickAction={handleQuickAction}
          onOpenWirelessModal={() => setIsWirelessModalOpen(true)}
          onOpenGuideModal={handleOpenGuide}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-7">
          <div className="max-w-7xl mx-auto pb-12">
            <TabErrorBoundary activeTab={activeTab}>
              {activeTab === 'overview' && (
                <OverviewTab 
                  device={selectedDevice} 
                  onNavigateTab={setActiveTab} 
                  onQuickAction={handleQuickAction} 
                />
              )}
              {activeTab === 'ai' && (
                <AiAssistantTab device={selectedDevice} />
              )}
              {activeTab === 'mirror' && (
                <MirrorControlTab
                  device={selectedDevice}
                  onSendKey={handleSendKey}
                  onSendTap={handleSendTap}
                  onScreenshot={() => handleQuickAction('screenshot')}
                />
              )}
              {activeTab === 'gamepad' && (
                <RemoteControllerTab device={selectedDevice} />
              )}
              {activeTab === 'notifications' && (
                <NotificationsTab device={selectedDevice} />
              )}
              {activeTab === 'network' && (
                <NetworkVpnTab device={selectedDevice} />
              )}
              {activeTab === 'automation' && (
                <AutomationTab device={selectedDevice} />
              )}
              {activeTab === 'gps' && (
                <GpsSimulatorTab device={selectedDevice} />
              )}
              {activeTab === 'recorder' && (
                <ScreenRecorderTab device={selectedDevice} />
              )}
              {activeTab === 'ocr' && (
                <ScreenOcrTab device={selectedDevice} />
              )}
              {activeTab === 'camera' && (
                <CameraTab device={selectedDevice} />
              )}
              {activeTab === 'microphone' && (
                <MicrophoneTab device={selectedDevice} />
              )}
              {activeTab === 'audiofx' && (
                <AudioFxTab device={selectedDevice} />
              )}
              {activeTab === 'messages' && (
                <MessagesTab device={selectedDevice} />
              )}
              {activeTab === 'battery' && (
                <BatteryHealthTab device={selectedDevice} />
              )}
              {activeTab === 'migration' && (
                <MigrationTab devices={devices} selectedDevice={selectedDevice} />
              )}
              {activeTab === 'cloner' && (
                <AppClonerTab device={selectedDevice} />
              )}
              {activeTab === 'debloater' && (
                <DebloaterTab device={selectedDevice} />
              )}
              {activeTab === 'rescue' && (
                <LockscreenRescueTab device={selectedDevice} />
              )}
              {activeTab === 'passwords' && (
                <PasswordVaultTab device={selectedDevice} />
              )}
              {activeTab === 'multidevice' && (
                <MultiDeviceTab 
                  devices={devices} 
                  selectedDevice={selectedDevice} 
                  onSelectDevice={setSelectedDevice} 
                />
              )}
              {activeTab === 'inspector' && (
                <ApkInspectorTab device={selectedDevice} />
              )}
              {activeTab === 'apps' && (
                <AppsTab device={selectedDevice} />
              )}
              {activeTab === 'files' && (
                <FilesTab device={selectedDevice} />
              )}
              {activeTab === 'backup' && (
                <BackupTab device={selectedDevice} />
              )}
              {activeTab === 'root' && (
                <RootToolkitTab device={selectedDevice} />
              )}
              {activeTab === 'rom' && (
                <RomFlasherTab device={selectedDevice} />
              )}
              {activeTab === 'fastboot' && (
                <FastbootTab device={selectedDevice} />
              )}
              {activeTab === 'hardware' && (
                <HardwareLabTab device={selectedDevice} />
              )}
              {activeTab === 'tweaks' && (
                <TweaksTab device={selectedDevice} />
              )}
              {activeTab === 'diagnostics' && (
                <DiagnosticsTab device={selectedDevice} />
              )}
              {activeTab === 'doctor' && (
                <DoctorTab device={selectedDevice} />
              )}
            </TabErrorBoundary>
          </div>
        </main>
      </div>

      {/* Wireless Wi-Fi Modal */}
      <WirelessModal
        isOpen={isWirelessModalOpen}
        onClose={() => setIsWirelessModalOpen(false)}
        onRefresh={fetchDevices}
      />

      {/* Comprehensive User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialTopic={guideTopic}
      />
    </div>
  );
}

export default App;

