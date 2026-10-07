import { describe, it, expect } from 'vitest';
import { apkInspectorManager } from '../server/apkInspectorManager.js';

describe('ApkInspectorManager Test Suite', () => {
  it('should inspect mock or system package and return security details', async () => {
    const res = await apkInspectorManager.inspectInstalledApp('mock-device-id', 'com.whatsapp');
    expect(res.success).toBe(true);
    expect(res.packageName).toBe('com.whatsapp');
    expect(res.targetSdk).toBeDefined();
    expect(res.permissions).toBeDefined();
    expect(Array.isArray(res.permissions)).toBe(true);
  });
});
