import { describe, it, expect } from 'vitest';
import { adbManager } from '../server/adbManager.js';

describe('Find My Phone & Remote Tracking Suite', () => {
  it('should have all remote hardware toggle and tracking methods defined', () => {
    expect(typeof adbManager.getFindMyPhoneStatus).toBe('function');
    expect(typeof adbManager.setWifiEnabled).toBe('function');
    expect(typeof adbManager.setMobileDataEnabled).toBe('function');
    expect(typeof adbManager.setBluetoothEnabled).toBe('function');
    expect(typeof adbManager.setLocationEnabled).toBe('function');
    expect(typeof adbManager.setFlashlight).toBe('function');
    expect(typeof adbManager.ringPhoneAlarm).toBe('function');
    expect(typeof adbManager.stopPhoneAlarm).toBe('function');
    expect(typeof adbManager.getDeviceLocation).toBe('function');
    expect(typeof adbManager.sendLockScreenMessage).toBe('function');
  });

  it('should handle mock or disconnected device gracefully without throwing exceptions', async () => {
    const res = await adbManager.getFindMyPhoneStatus('mock-dev-999');
    expect(res).toBeDefined();
    expect(typeof res.wifi).toBe('boolean');
    expect(typeof res.mobileData).toBe('boolean');
    expect(typeof res.bluetooth).toBe('boolean');
    expect(typeof res.location).toBe('boolean');
    expect(res.battery).toBeDefined();
    expect(typeof res.battery.level).toBe('number');
  });

  it('should stop alarm safely and return success structure', async () => {
    const res = await adbManager.stopPhoneAlarm('mock-dev-999');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.message).toContain('متوقف');
  });

  it('should return location structure with hasLocation flag', async () => {
    const res = await adbManager.getDeviceLocation('mock-dev-999');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(typeof res.hasLocation).toBe('boolean');
  });
});
