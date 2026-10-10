import { describe, it, expect } from 'vitest';
import { hardwareLabManager } from '../server/hardwareLabManager.js';

describe('HardwareLabManager Test Suite', () => {
  it('should handle multi-pattern vibration for mock device', async () => {
    const res = await hardwareLabManager.triggerVibration('mock-device', 'double');
    expect(res.success).toBe(true);
  });

  it('should test physical button triggers', async () => {
    const res = await hardwareLabManager.testPhysicalButton('mock-device', 'volume_up');
    expect(res.success).toBe(true);
  });

  it('should return mock sensor diagnostics', async () => {
    const res = await hardwareLabManager.getSensorDiagnostics('mock-device');
    expect(res.success).toBe(true);
    expect(res.sensors.length).toBeGreaterThan(0);
  });

  it('should return battery diagnostics', async () => {
    const res = await hardwareLabManager.getBatteryDiagnostics('mock-device');
    expect(res.success).toBe(true);
    expect(res.level).toBe(96);
  });

  it('should return bluetooth diagnostics', async () => {
    const res = await hardwareLabManager.getBluetoothDiagnostics('mock-device');
    expect(res.success).toBe(true);
    expect(res.enabled).toBe(true);
  });

  it('should launch camera test on mock and live device gracefully', async () => {
    const resStill = await hardwareLabManager.launchCameraTest('mock-device', 'still');
    expect(resStill.success).toBe(true);

    const resVideo = await hardwareLabManager.launchCameraTest('mock-device', 'video');
    expect(resVideo.success).toBe(true);
  });

  it('should launch screen color test on mock device gracefully', async () => {
    const res = await hardwareLabManager.launchScreenTest('mock-device', 'rgb');
    expect(res.success).toBe(true);
  });
});
