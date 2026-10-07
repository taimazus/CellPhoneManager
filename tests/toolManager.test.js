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
  });

  it('should return valid paths for platform tools', async () => {
    const adbPath = await toolManager.getAdbPath();
    expect(typeof adbPath).toBe('string');
    expect(adbPath.length).toBeGreaterThan(0);
  });
});
