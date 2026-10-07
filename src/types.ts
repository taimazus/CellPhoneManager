export interface DeviceBattery {
  level: number;
  status: string;
  temperature: number;
  health: string;
  voltage: number;
  cycles?: number;
}

export interface DeviceStorage {
  total: string;
  used: string;
  free: string;
  usedPercentage: number;
}

export interface DeviceDisplay {
  resolution: string;
  density: number;
  refreshRate: string;
}

export interface DeviceApp {
  packageName: string;
  appName: string;
  version: string;
  isSystem: boolean;
  size: string;
  enabled: boolean;
}

export interface Device {
  id: string;
  serial: string;
  name: string;
  type: 'android' | 'ios';
  model: string;
  manufacturer?: string;
  osVersion?: string;
  apiLevel?: number;
  state?: string;
  battery?: DeviceBattery;
  storage?: DeviceStorage;
  ram?: {
    total: string;
    used: string;
    free: string;
  };
  display?: DeviceDisplay;
  developerOptions?: {
    usbDebugging?: boolean;
    demoMode?: boolean;
    pointerLocation?: boolean;
    animScale?: number;
    developerMode?: boolean;
    locationSpoofed?: boolean;
  };
  apps?: DeviceApp[];
}

export interface ToolStatus {
  name: string;
  installed: boolean;
  version: string;
  path?: string;
  category: 'android' | 'ios' | 'core';
  description: string;
}
