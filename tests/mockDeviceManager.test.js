import { describe, it, expect } from 'vitest';
import { mockDeviceManager } from '../server/mockDeviceManager.js';

describe('MockDeviceManager Test Suite', () => {
  it('should return available virtual demo devices for Android and iOS', () => {
    const devices = mockDeviceManager.getDevices();
    expect(devices.length).toBeGreaterThanOrEqual(2);
    
    const android = devices.find(d => d.type === 'android');
    const ios = devices.find(d => d.type === 'ios');

    expect(android).toBeDefined();
    expect(ios).toBeDefined();
    expect(android.battery.level).toBeGreaterThan(0);
    expect(ios.battery.health).toBeDefined();
  });

  it('should allow modifying device developer settings', () => {
    const updated = mockDeviceManager.updateSetting('mock-android-s24', 'demoMode', true);
    expect(updated).toBe(true);

    const dev = mockDeviceManager.getDevice('mock-android-s24');
    expect(dev.developerOptions.demoMode).toBe(true);
  });

  it('should support freezing and removing apps', () => {
    const frozen = mockDeviceManager.setAppStatus('mock-android-s24', 'com.whatsapp', false);
    expect(frozen).toBe(true);

    const dev = mockDeviceManager.getDevice('mock-android-s24');
    const whatsapp = dev.apps.find(a => a.packageName === 'com.whatsapp');
    expect(whatsapp.enabled).toBe(false);

    const removed = mockDeviceManager.removeApp('mock-android-s24', 'com.spotify.music');
    expect(removed).toBe(true);

    const postDev = mockDeviceManager.getDevice('mock-android-s24');
    expect(postDev.apps.some(a => a.packageName === 'com.spotify.music')).toBe(false);
  });
});
