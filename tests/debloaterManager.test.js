import { describe, it, expect } from 'vitest';
import { debloaterManager } from '../server/debloaterManager.js';

describe('DebloaterManager Test Suite', () => {
  it('should return a rich catalog of known bloatware items', () => {
    const list = debloaterManager.getKnownBloatware();
    expect(list.length).toBeGreaterThan(5);
    expect(list.some(i => i.vendor === 'xiaomi')).toBe(true);
    expect(list.some(i => i.vendor === 'samsung')).toBe(true);
  });

  it('should scan mock device bloatware accurately', async () => {
    const res = await debloaterManager.scanDeviceBloatware('mock-serial-123');
    expect(res.success).toBe(true);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].installed).toBe(true);
  });

  it('should handle uninstallation and restoration gracefully', async () => {
    const unRes = await debloaterManager.uninstallBloatware('mock-serial-123', 'com.miui.msa.global');
    expect(unRes.success).toBe(true);

    const resRes = await debloaterManager.restoreBloatware('mock-serial-123', 'com.miui.msa.global');
    expect(resRes.success).toBe(true);
  });
});
