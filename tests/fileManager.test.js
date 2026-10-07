import { describe, it, expect } from 'vitest';
import { fileManager } from '../server/fileManager.js';

describe('FileManager Test Suite', () => {
  it('should list default sdcard files in mock mode with valid size and sizeBytes', async () => {
    const items = await fileManager.listDirectory('mock-android-s24', '/sdcard/');
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(i => i.name === 'Download')).toBe(true);
    
    // Check sizes
    const sampleDoc = items.find(i => i.name === 'sample_document.pdf');
    expect(sampleDoc).toBeDefined();
    expect(sampleDoc.size).toContain('MB');
    expect(typeof sampleDoc.sizeBytes).toBe('number');
    expect(sampleDoc.sizeBytes).toBeGreaterThan(0);
  });

  it('should support safe delete and mkdir operations', async () => {
    const mkdirRes = await fileManager.createDirectory('mock-android-s24', '/sdcard/NewTestDir');
    expect(mkdirRes.success).toBe(true);

    const deleteRes = await fileManager.deleteFile('mock-android-s24', '/sdcard/NewTestDir');
    expect(deleteRes.success).toBe(true);
  });
});
