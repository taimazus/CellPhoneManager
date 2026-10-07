import { describe, it, expect } from 'vitest';
import { systemDoctorManager } from '../server/systemDoctorManager.js';

describe('SystemDoctorManager Test Suite', () => {
  it('should scan junk files on mock device', async () => {
    const res = await systemDoctorManager.scanJunk('mock-device');
    expect(res.success).toBe(true);
    expect(res.categories.length).toBeGreaterThan(0);
  });

  it('should clean junk categories', async () => {
    const res = await systemDoctorManager.cleanJunk('mock-device', ['all']);
    expect(res.success).toBe(true);
    expect(res.freedSize).toBeDefined();
  });

  it('should run health diagnostics', async () => {
    const res = await systemDoctorManager.runHealthDiagnostics('mock-device');
    expect(res.success).toBe(true);
    expect(res.diagnostics.length).toBeGreaterThan(0);
  });

  it('should perform automated repairs', async () => {
    const res = await systemDoctorManager.performRepair('mock-device', 'fix_all');
    expect(res.success).toBe(true);
    expect(res.message).toBeDefined();
  });

  it('should analyze logcat errors and return Persian diagnostic report', async () => {
    const sampleLogs = [
      'W/FeatureFlagsImplExport(23306): java.lang.NoClassDefFoundError: Class not found using the boot class loader',
      'E/AndroidRuntime(1234): NullPointerException: Attempt to invoke virtual method on a null object reference'
    ];
    const res = await systemDoctorManager.analyzeLogcatErrors('mock-device', sampleLogs);
    expect(res.success).toBe(true);
    expect(res.issuesCount).toBeGreaterThan(0);
    expect(res.reportText).toContain('گزارش جامع عیب‌یابی');
    expect(res.issues[0].recommendedAction).toBeDefined();
  });

  it('should fix specific diagnostic error on mock device', async () => {
    const res = await systemDoctorManager.fixDiagnosticError('mock-device', 'clear_cache', 'com.miui.securitycenter');
    expect(res.success).toBe(true);
    expect(res.action).toBe('clear_cache');
  });
});
