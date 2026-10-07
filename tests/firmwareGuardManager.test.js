import { describe, it, expect } from 'vitest';
import { firmwareGuardManager } from '../server/firmwareGuardManager.js';
import fs from 'fs';
import path from 'path';

describe('FirmwareGuardManager Test Suite', () => {
  it('should inspect firmware package safely', async () => {
    // Create temporary dummy firmware file
    const tmpPath = path.join(process.cwd(), 'temp_test_rom.zip');
    fs.writeFileSync(tmpPath, 'dummy-firmware-content-for-testing');

    const inspectRes = await firmwareGuardManager.inspectFirmware(tmpPath, {
      model: 'Redmi Note 11',
      batteryLevel: 80
    });
    expect(inspectRes.success).toBe(true);
    expect(inspectRes).toHaveProperty('safetyChecks');
    expect(Array.isArray(inspectRes.safetyChecks)).toBe(true);

    const checksum = await firmwareGuardManager.computeChecksum(tmpPath, 'sha256');
    expect(typeof checksum).toBe('string');
    expect(checksum.length).toBe(64); // SHA-256 is 64 hex chars

    // Clean up
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });
});
