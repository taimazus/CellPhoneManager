import { describe, it, expect } from 'vitest';
import { universalBackupManager } from '../server/universalBackupManager.js';

describe('UniversalBackupManager Test Suite', () => {
  it('should list backups correctly', async () => {
    const listRes = await universalBackupManager.listBackups();
    expect(listRes).toHaveProperty('success', true);
    expect(Array.isArray(listRes.backups)).toBe(true);
  });

  it('should create mock backup and verify manifest', async () => {
    const backupRes = await universalBackupManager.createBackup({
      serial: 'mock-device-1',
      type: 'android',
      deviceName: 'Samsung S24 Ultra',
      options: { contacts: true, sms: true, calls: true, apps: true }
    });
    expect(backupRes).toHaveProperty('success', true);
    expect(backupRes).toHaveProperty('backupId');
    expect(backupRes.manifest.items.contactsCount).toBeGreaterThan(0);

    // Clean up
    await universalBackupManager.deleteBackup(backupRes.backupId);
  });
});
