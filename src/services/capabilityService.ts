export interface CapabilityItem {
  status: 'READY' | 'NEEDS_CONFIG' | 'NEEDS_TOOL_OR_PERMISSION' | 'UNSUPPORTED' | 'INDETERMINATE';
  supported: boolean;
  reason: string;
  actionGuide?: string | null;
}

export interface DeviceCapabilitiesResponse {
  success: boolean;
  serial: string;
  deviceName: string;
  osType: string;
  checkedAt: string;
  capabilities: Record<string, CapabilityItem>;
}

export const fetchDeviceCapabilities = async (deviceId: string): Promise<DeviceCapabilitiesResponse | null> => {
  try {
    const res = await fetch(`/api/devices/${deviceId}/capabilities`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching device capabilities:', err);
    return null;
  }
};
