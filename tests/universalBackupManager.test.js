import { describe, it, expect } from 'vitest';
import { universalBackupManager } from '../server/universalBackupManager.js';

describe('UniversalBackupManager Test Suite', () => {
  it('should list backups correctly and expose backupDir', async () => {
    const listRes = await universalBackupManager.listBackups();
    expect(listRes).toHaveProperty('success', true);
    expect(listRes).toHaveProperty('backupDir');
    expect(typeof listRes.backupDir).toBe('string');
    expect(Array.isArray(listRes.backups)).toBe(true);
  });

  it('should get and set custom backup directory safely', () => {
    const originalDir = universalBackupManager.getBackupDir();
    const setRes = universalBackupManager.setBackupDir(originalDir);
    expect(setRes.success).toBe(true);
    expect(setRes.backupDir).toBe(originalDir);

    const invalidRes = universalBackupManager.setBackupDir('');
    expect(invalidRes.success).toBe(false);
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

  it('should reject path traversal attempts in deleteBackup and restoreBackup', async () => {
    // Path traversal in deleteBackup
    const deleteTraversal1 = await universalBackupManager.deleteBackup('../test_sentinel');
    expect(deleteTraversal1.success).toBe(false);
    expect(deleteTraversal1.error).toContain('شناسه نسخه پشتیبان نامعتبر است');

    const deleteTraversal2 = await universalBackupManager.deleteBackup('..\\..\\Windows');
    expect(deleteTraversal2.success).toBe(false);

    // Path traversal in restoreBackup
    const restoreTraversal = await universalBackupManager.restoreBackup({
      backupId: '../../etc/passwd',
      targetSerial: 'mock-device-1'
    });
    expect(restoreTraversal.success).toBe(false);
    expect(restoreTraversal.error).toContain('شناسه نسخه پشتیبان نامعتبر است');
  });

  it('should handle openBackupFolder and openBackupItemFolder safely', async () => {
    const res = await universalBackupManager.openBackupFolder();
    expect(res.success).toBe(true);
    expect(res).toHaveProperty('path');

    const notFoundRes = await universalBackupManager.openBackupItemFolder('non_existent_id');
    expect(notFoundRes.success).toBe(false);
    expect(notFoundRes.error).toContain('یافت نشد');
  });
});

