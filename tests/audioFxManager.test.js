import { describe, it, expect } from 'vitest';
import { audioFxManager } from '../server/audioFxManager.js';

describe('AudioFxManager Test Suite', () => {
  it('should retrieve volume levels for mock or live device', async () => {
    const res = await audioFxManager.getVolumes('mock-test-serial');
    expect(res.success).toBe(true);
    expect(res.volumes).toBeDefined();
    expect(res.volumes.media).toBeDefined();
    expect(res.volumes.ring).toBeDefined();
    expect(res.volumes.alarm).toBeDefined();
  });

  it('should set volume level correctly', async () => {
    const res = await audioFxManager.setVolume('mock-test-serial', { stream: 3, level: 12 });
    expect(res.success).toBe(true);
  });

  it('should handle turbo volume boost toggle', async () => {
    const res = await audioFxManager.boostGain('mock-test-serial', { enable: true });
    expect(res.success).toBe(true);
  });

  it('should return initial audio relay status correctly', () => {
    const status = audioFxManager.getAudioRelayStatus('nonexistent-serial');
    expect(status.isRelaying).toBe(false);
  });
});
