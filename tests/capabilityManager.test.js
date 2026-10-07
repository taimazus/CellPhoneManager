import { describe, it, expect } from 'vitest';
import { capabilityManager, CAPABILITY_STATUS } from '../server/capabilityManager.js';

describe('CapabilityManager Test Suite', () => {
  it('should list all master capability definitions', () => {
    const defs = capabilityManager.getCapabilityDefinitions();
    expect(Array.isArray(defs)).toBe(true);
    expect(defs.length).toBeGreaterThanOrEqual(10);
    expect(defs.some(d => d.id === 'screen_mirror')).toBe(true);
    expect(defs.some(d => d.id === 'universal_backup')).toBe(true);
  });

  it('should evaluate mock device as fully ready', async () => {
    const res = await capabilityManager.evaluateDevice({
      id: 'mock-samsung-s24',
      type: 'mock',
      state: 'device',
      androidVersion: '14.0'
    });
    expect(res.success).toBe(true);
    expect(res.capabilities.screen_mirror.status).toBe(CAPABILITY_STATUS.READY);
    expect(res.capabilities.universal_backup.supported).toBe(true);
  });

  it('should detect unauthorized device state and provide actionable guidance', async () => {
    const res = await capabilityManager.evaluateDevice({
      id: 'real-unauth-phone',
      type: 'android',
      state: 'unauthorized',
      androidVersion: '12.0'
    });
    expect(res.success).toBe(true);
    const mirrorCap = res.capabilities.screen_mirror;
    expect(mirrorCap.status).toBe(CAPABILITY_STATUS.NEEDS_TOOL_OR_PERMISSION);
    expect(mirrorCap.actionGuide).toContain('Allow USB Debugging');
  });

  it('should detect unsupported OS version correctly', async () => {
    const res = await capabilityManager.evaluateDevice({
      id: 'old-android-phone',
      type: 'android',
      state: 'device',
      androidVersion: '9.0' // USB tethering via cmd requires 11.0+
    });
    expect(res.success).toBe(true);
    const tetherCap = res.capabilities.wireless_tethering;
    expect(tetherCap.status).toBe(CAPABILITY_STATUS.UNSUPPORTED);
    expect(tetherCap.reason).toContain('اندروید 11');
  });

  it('should detect offline device as indeterminate', async () => {
    const res = await capabilityManager.evaluateDevice({
      id: 'offline-phone',
      type: 'android',
      state: 'offline'
    });
    expect(res.success).toBe(true);
    expect(res.capabilities.file_transfer.status).toBe(CAPABILITY_STATUS.INDETERMINATE);
  });

  it('should enforce assertion before execution', async () => {
    const allowed = await capabilityManager.assertCapability({
      id: 'mock-device-ok',
      type: 'mock',
      state: 'device'
    }, 'screen_mirror');
    expect(allowed.allowed).toBe(true);

    const denied = await capabilityManager.assertCapability({
      id: 'offline-device',
      type: 'android',
      state: 'offline'
    }, 'file_transfer');
    expect(denied.allowed).toBe(false);
    expect(denied.error).toContain('پاسخ نمی‌دهد');
  });
});
