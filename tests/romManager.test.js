import { describe, it, expect } from 'vitest';
import { romManager } from '../server/romManager.js';

describe('RomManager Test Suite', () => {
  it('should return device architecture and ROM info for mock device', async () => {
    const info = await romManager.getDeviceRomInfo('mock-android-1');
    expect(info).toHaveProperty('success', true);
    expect(info).toHaveProperty('codename');
    expect(info).toHaveProperty('arch');
    expect(info).toHaveProperty('androidVersion');
    expect(info).toHaveProperty('isAB');
    expect(info).toHaveProperty('isDynamic');
  });

  it('should handle sideload validation safely', async () => {
    const res = await romManager.sideloadPackage('mock-android-1', 'non_existent_file.zip');
    expect(res).toHaveProperty('success', false);
    expect(res).toHaveProperty('error');
  });

  it('should support reboot mode targeting', async () => {
    const res = await romManager.rebootMode('mock-android-1', 'recovery');
    expect(res).toHaveProperty('success', true);
  });
});
