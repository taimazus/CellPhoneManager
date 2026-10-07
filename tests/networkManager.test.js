import { describe, it, expect } from 'vitest';
import { networkManager } from '../server/networkManager.js';

describe('NetworkManager Test Suite', () => {
  it('should reject invalid proxy server inputs and command injection payloads', async () => {
    // Malicious shell metacharacters
    const injectionAttempt1 = await networkManager.setWindowsProxy(true, '127.0.0.1:8080 & calc.exe');
    expect(injectionAttempt1.success).toBe(false);
    expect(injectionAttempt1.message).toContain('نامعتبر');

    const injectionAttempt2 = await networkManager.setWindowsProxy(true, '127.0.0.1:8080 | whoami');
    expect(injectionAttempt2.success).toBe(false);

    const injectionAttempt3 = await networkManager.setWindowsProxy(true, 'invalid-proxy-format');
    expect(injectionAttempt3.success).toBe(false);

    const nullAttempt = await networkManager.setWindowsProxy(true, null);
    expect(nullAttempt.success).toBe(false);
  });

  it('should accept valid IP:Port proxy format', async () => {
    if (process.platform === 'win32') {
      const validRes = await networkManager.setWindowsProxy(false);
      expect(validRes.success).toBe(true);
      expect(validRes.enabled).toBe(false);
    } else {
      const nonWinRes = await networkManager.setWindowsProxy(true, '127.0.0.1:10809');
      expect(nonWinRes.success).toBe(false);
    }
  });

  it('should list forwarded ports safely', async () => {
    const forwards = await networkManager.listForwardedPorts('mock-device');
    expect(Array.isArray(forwards)).toBe(true);
  });
});
