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
});
