import { describe, it, expect } from 'vitest';
import { toolManager } from '../server/toolManager.js';

describe('ToolManager Test Suite', () => {
  it('should verify platform diagnostics structure', async () => {
    const diag = await toolManager.getDiagnosticStatus();
    expect(diag).toBeDefined();
    expect(diag.tools).toBeDefined();
    expect(diag.tools.adb).toBeDefined();
    expect(diag.tools.scrcpy).toBeDefined();
    expect(diag.tools.python).toBeDefined();
  }, 15000);


  it('should return valid paths for platform tools', async () => {
    const adbPath = await toolManager.getAdbPath();
    expect(typeof adbPath).toBe('string');
    expect(adbPath.length).toBeGreaterThan(0);
  });

  it('should return transparent tool catalog metadata', () => {
    const catalog = toolManager.getToolCatalog();
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog.length).toBeGreaterThanOrEqual(5);
    expect(catalog[0]).toHaveProperty('downloadUrl');
    expect(catalog[0]).toHaveProperty('estimatedSizeMb');
    expect(catalog[0]).toHaveProperty('activatedFeatures');
  });

  it('should gracefully handle missing local file in installFromLocalFile', async () => {
    const res = await toolManager.installFromLocalFile('scrcpy', 'C:/non_existent_file.zip');
    expect(res.success).toBe(false);
    expect(res.error).toContain('یافت نشد');
  });
});
