import { describe, it, expect } from 'vitest';
import { iosManager, isValidIosUdid } from '../server/iosManager.js';
import { fileManager } from '../server/fileManager.js';

describe('IosManager & iOS File Operations Test Suite', () => {
  it('should validate iOS UDID format correctly', () => {
    expect(isValidIosUdid('00008110-001578D23C85801E')).toBe(true);
    expect(isValidIosUdid('8110001578D23C85801E12345678901234567890')).toBe(true);
    expect(isValidIosUdid('invalid;rm -rf /')).toBe(false);
    expect(isValidIosUdid('')).toBe(false);
  });

  it('should identify iOS device serials', () => {
    expect(iosManager.isIosDevice('mock-ios-15pro')).toBe(true);
    expect(iosManager.isIosDevice('00008110-001578D23C85801E')).toBe(true);
    expect(fileManager.isIos('mock-ios-15pro')).toBe(true);
  });

  it('should return mock details for mock iOS device', async () => {
    const details = await iosManager.getDeviceDetails('mock-ios-15pro');
    expect(details).toBeDefined();
    expect(details.model).toContain('iPhone');
    expect(details.type).toBe('ios');
    expect(details.battery).toBeDefined();
    expect(details.storage).toBeDefined();
  });

  it('should list iOS media directories via fileManager', async () => {
    const items = await fileManager.listDirectory('mock-ios-15pro', '/');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(i => i.name === 'DCIM')).toBe(true);
    expect(items.some(i => i.name === 'Downloads')).toBe(true);
  });

  it('should normalize iOS paths correctly in fileManager', () => {
    expect(fileManager.normalizeIosPath('/sdcard/')).toBe('/');
    expect(fileManager.normalizeIosPath('/sdcard/DCIM/')).toBe('/DCIM/');
    expect(fileManager.normalizeIosPath('Downloads')).toBe('/Downloads');
  });
});
