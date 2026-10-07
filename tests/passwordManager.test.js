import { describe, it, expect } from 'vitest';
import { passwordManager } from '../server/passwordManager.js';

describe('PasswordManager Test Suite', () => {
  it('should return mock wifi passwords with security details', async () => {
    const res = await passwordManager.getWifiPasswords('mock-device-1');
    expect(res).toHaveProperty('success', true);
    expect(Array.isArray(res.networks)).toBe(true);
    expect(res.networks.length).toBeGreaterThan(0);
    expect(res.networks[0]).toHaveProperty('ssid');
    expect(res.networks[0]).toHaveProperty('psk');
    expect(res.networks[0]).toHaveProperty('keyMgmt');
  });

  it('should return system accounts for device', async () => {
    const res = await passwordManager.getSystemAccounts('mock-device-1');
    expect(res).toHaveProperty('success', true);
    expect(Array.isArray(res.accounts)).toBe(true);
    expect(res.accounts.length).toBeGreaterThan(0);
  });
});
