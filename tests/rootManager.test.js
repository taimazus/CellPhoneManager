import { describe, it, expect, vi } from 'vitest';
import { rootManager } from '../server/rootManager.js';

describe('RootManager Test Suite', () => {
  it('should detect root status on mock or live device', async () => {
    const status = await rootManager.checkRootStatus('emulator-5554');
    expect(status).toHaveProperty('isRooted');
    expect(status).toHaveProperty('rootType');
    expect(status).toHaveProperty('suVersion');
    expect(status).toHaveProperty('selinux');
    expect(status).toHaveProperty('bootloaderUnlocked');
  });

  it('should handle unrooting structure properly', async () => {
    const result = await rootManager.unrootDevice('emulator-5554');
    expect(result).toHaveProperty('success');
  });
});
