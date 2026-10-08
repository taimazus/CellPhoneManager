import { describe, it, expect } from 'vitest';
import { repairWorkbenchManager } from '../server/repairWorkbenchManager.js';

describe('RepairWorkbenchManager Test Suite', () => {
  const mockId = 'mock-android-s24';

  it('should manage customer job sheets (create, read, update status, delete)', () => {
    const createRes = repairWorkbenchManager.createJobSheet({
      customerName: 'رضا محمدی',
      customerPhone: '09123456789',
      deviceModel: 'Samsung Galaxy S24 Ultra',
      problemDescription: 'تعویض فلت شارژ و تست باتری',
      estimatedCost: 1200000,
      depositAmount: 500000
    });
    expect(createRes.success).toBe(true);
    expect(createRes.jobSheet.id).toBeDefined();

    const sheets = repairWorkbenchManager.getJobSheets();
    expect(sheets.length).toBeGreaterThan(0);

    const updateRes = repairWorkbenchManager.updateJobSheetStatus(createRes.jobSheet.id, 'ready');
    expect(updateRes.success).toBe(true);
    expect(updateRes.jobSheet.status).toBe('ready');

    const delRes = repairWorkbenchManager.deleteJobSheet(createRes.jobSheet.id);
    expect(delRes.success).toBe(true);
  });

  it('should trigger MTP browser and Samsung test mode ADB', async () => {
    const mtpRes = await repairWorkbenchManager.launchMtpBrowser(mockId, { targetUrl: 'https://youtube.com' });
    expect(mtpRes.success).toBe(true);

    const samRes = await repairWorkbenchManager.triggerSamsungTestModeAdb(mockId);
    expect(samRes.success).toBe(true);

    const miRes = await repairWorkbenchManager.checkMiAccountAndBootloader(mockId);
    expect(miRes.success).toBe(true);
    expect(miRes.lockStatus).toBeDefined();
  });

  it('should execute broken screen forensic data extraction', async () => {
    const extRes = await repairWorkbenchManager.extractBrokenScreenData(mockId, {
      categories: ['contacts', 'sms', 'photos']
    });
    expect(extRes.success).toBe(true);
    expect(extRes.stats).toBeDefined();

    const pinRes = await repairWorkbenchManager.injectPinOrPattern(mockId, '1234');
    expect(pinRes.success).toBe(true);
  });

  it('should provide secret codes database and execute codes', async () => {
    const db = repairWorkbenchManager.getSecretCodesDatabase();
    expect(Array.isArray(db)).toBe(true);
    expect(db.length).toBeGreaterThan(5);

    const execRes = await repairWorkbenchManager.executeSecretCode(mockId, db[0]);
    expect(execRes.success).toBe(true);
  });

  it('should read IMEI, Baseband and Network Diagnostics', async () => {
    const diag = await repairWorkbenchManager.getImeiAndBasebandDiagnostics(mockId);
    expect(diag.success).toBe(true);
    expect(diag.basebandVersion).toBeDefined();
    expect(diag.basebandStatus).toBeDefined();
  });

  it('should get charging power and hardware telemetry', async () => {
    const pwr = await repairWorkbenchManager.getChargingPowerTelemetry(mockId);
    expect(pwr.success).toBe(true);
    expect(pwr.currentMa).toBeGreaterThan(0);
    expect(pwr.voltageMv).toBeGreaterThan(0);
  });

  it('should fix common software glitches', async () => {
    const fix1 = await repairWorkbenchManager.fixGlitch(mockId, 'gms_stop');
    expect(fix1.success).toBe(true);

    const fix2 = await repairWorkbenchManager.fixGlitch(mockId, 'storage_bootloop');
    expect(fix2.success).toBe(true);

    const fix3 = await repairWorkbenchManager.fixGlitch(mockId, 'force_mtp');
    expect(fix3.success).toBe(true);
  });
});
