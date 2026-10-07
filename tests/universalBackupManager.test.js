import { describe, it, expect } from 'vitest';
import { universalBackupManager } from '../server/universalBackupManager.js';

describe('UniversalBackupManager Test Suite', () => {
  it('should list backups correctly', async () => {
    const listRes = await universalBackupManager.listBackups();
    expect(listRes).toHaveProperty('success', true);
    expect(Array.isArray(listRes.backups)).toBe(true);
  });

  it('should create full mock backup and verify manifest', async () => {
    const backupRes = await universalBackupManager.createBackup({
      serial: 'mock-device-1',
      type: 'android',
      deviceName: 'Samsung S24 Ultra',
      options: { contacts: true, sms: true, calls: true, apps: true, media: true },
      destinationTarget: 'pc'
    });
    expect(backupRes).toHaveProperty('success', true);
    expect(backupRes).toHaveProperty('backupId');
    expect(backupRes.manifest.items.contactsCount).toBeGreaterThan(0);
    expect(backupRes.manifest.backupMode).toBe('full');

    // Restore test
    const restoreRes = await universalBackupManager.restoreBackup({
      backupId: backupRes.backupId,
      targetSerial: 'mock-device-2',
      targetType: 'android',
      options: { contacts: true, sms: true, calls: true }
    });
    expect(restoreRes).toHaveProperty('success', true);

    // Clean up
    await universalBackupManager.deleteBackup(backupRes.backupId);
  });

  it('should create custom mock backup with phone storage target', async () => {
    const backupRes = await universalBackupManager.createBackup({
      serial: 'mock-device-1',
      type: 'android',
      deviceName: 'Xiaomi 13 Pro',
      options: { contacts: true, sms: false, calls: true, apps: false, media: false },
      destinationTarget: 'phone'
    });
    expect(backupRes).toHaveProperty('success', true);
    expect(backupRes.manifest.backupMode).toBe('custom');
    expect(backupRes.destinationTarget).toBe('phone');

    // Clean up
    await universalBackupManager.deleteBackup(backupRes.backupId);
  });
});
