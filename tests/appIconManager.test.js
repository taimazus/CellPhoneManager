import { describe, it, expect } from 'vitest';
import { appIconManager } from '../server/appIconManager.js';

describe('AppIconManager Test Suite', () => {
  it('should initialize cache directory properly', () => {
    expect(appIconManager.cacheDir).toBeDefined();
    expect(typeof appIconManager.ensureCacheDir).toBe('function');
  });

  it('should score launcher and high density icons with higher priority', () => {
    const listOutput = `
      res/mipmap-mdpi/ic_launcher.png
      res/mipmap-xxxhdpi/ic_launcher.png
      res/mipmap-hdpi/ic_launcher.png
      res/drawable/ic_launcher_background.xml
      res/drawable-xxhdpi/icon.png
    `;

    const best = appIconManager._selectBestIconEntry(listOutput);
    expect(best).toBe('res/mipmap-xxxhdpi/ic_launcher.png');
  });

  it('should validate PNG, WebP, and JPEG image buffers correctly', () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
    const validWebp = Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ');
    const validJpg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const invalidBuf = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    expect(appIconManager._isValidImageBuffer(validPng)).toBe(true);
    expect(appIconManager._isValidImageBuffer(validWebp)).toBe(true);
    expect(appIconManager._isValidImageBuffer(validJpg)).toBe(true);
    expect(appIconManager._isValidImageBuffer(invalidBuf)).toBe(false);
  });

  it('should handle mock device queries gracefully returning null for SVG fallback', async () => {
    const res = await appIconManager.getAppIcon('mock-android-1', 'com.telegram');
    expect(res).toBeNull();
  });
});
