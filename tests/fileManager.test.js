import { describe, it, expect } from 'vitest';
import { fileManager } from '../server/fileManager.js';

describe('FileManager Test Suite', () => {
  it('should list default sdcard files in mock mode', async () => {
    const items = await fileManager.listDirectory('mock-android-s24', '/sdcard/');
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(i => i.name === 'Download')).toBe(true);
  });

  it('should support safe delete and mkdir operations', async () => {
    const mkdirRes = await fileManager.createDirectory('mock-android-s24', '/sdcard/NewTestDir');
    expect(mkdirRes.success).toBe(true);

    const deleteRes = await fileManager.deleteFile('mock-android-s24', '/sdcard/NewTestDir');
    expect(deleteRes.success).toBe(true);
  });
});
