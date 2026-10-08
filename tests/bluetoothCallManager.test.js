import { describe, it, expect } from 'vitest';
import bluetoothCallManager from '../server/bluetoothCallManager.js';

describe('BluetoothCallManager Test Suite', () => {
  it('should query PC bluetooth status on Windows', async () => {
    const status = await bluetoothCallManager.getPcBluetoothStatus();
    expect(status).toHaveProperty('available');
    expect(status).toHaveProperty('hasAdapter');
    expect(status).toHaveProperty('adapters');
    expect(Array.isArray(status.adapters)).toBe(true);
    expect(Array.isArray(status.pairedDevices)).toBe(true);
  }, 20000);

  it('should query device bluetooth status for mock device', async () => {
    const devStatus = await bluetoothCallManager.getDeviceBluetoothStatus('mock-device');
    expect(devStatus.available).toBe(true);
    expect(devStatus.enabled).toBe(true);
    expect(devStatus.name).toBe('Mock Galaxy Phone');
  });

  it('should prepare auto pair for mock device', async () => {
    const res = await bluetoothCallManager.prepareAutoPair('mock-device');
    expect(res).toHaveProperty('success');
    expect(res).toHaveProperty('message');
  }, 20000);

  it('should place call with speakerphone routing', async () => {
    const res = await bluetoothCallManager.makeCallWithRouting('mock-device', '09121234567', {
      mode: 'speaker'
    });
    expect(res.success).toBe(true);
    expect(res.mode).toBe('speaker');
  });

  it('should place call with bluetooth routing', async () => {
    const res = await bluetoothCallManager.makeCallWithRouting('mock-device', '09121234567', {
      mode: 'bluetooth'
    });
    expect(res.success).toBe(true);
    expect(res.mode).toBe('bluetooth');
  });
});
