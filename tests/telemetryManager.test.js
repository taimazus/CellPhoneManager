import { describe, it, expect } from 'vitest';
import { telemetryManager } from '../server/telemetryManager.js';

describe('TelemetryManager Test Suite', () => {
  it('should record snapshot and provide time-series data', () => {
    const res = telemetryManager.recordSnapshot('mock-test-phone', {
      batteryLevel: 80,
      temperature: 34.2,
      voltage: 4.05,
      freeStorageMb: 25000,
      isCharging: false
    });
    expect(res.success).toBe(true);
    expect(res.snapshot.batteryLevel).toBe(80);

    const historyRes = telemetryManager.getHistory('mock-test-phone', 10);
    expect(historyRes.success).toBe(true);
    expect(historyRes.history.length).toBeGreaterThan(0);

    // Clean up
    telemetryManager.clearHistory('mock-test-phone');
  });

  it('should trigger overheat alerts when threshold exceeded', () => {
    const alertRes = telemetryManager.recordSnapshot('mock-overheat-phone', {
      batteryLevel: 50,
      temperature: 48.5,
      voltage: 4.2,
      freeStorageMb: 25000
    });
    expect(alertRes.success).toBe(true);
    expect(alertRes.alerts.length).toBeGreaterThan(0);
    expect(alertRes.alerts[0].type).toBe('OVERHEAT');

    // Clean up
    telemetryManager.clearHistory('mock-overheat-phone');
  });
});
