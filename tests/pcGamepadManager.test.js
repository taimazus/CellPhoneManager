import { describe, it, expect } from 'vitest';
import { pcGamepadManager } from '../server/pcGamepadManager.js';

describe('PcGamepadManager Test Suite', () => {
  it('should list available gaming profiles', () => {
    const profiles = pcGamepadManager.getProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBeGreaterThanOrEqual(3);

    const racing = profiles.find(p => p.id === 'racing');
    expect(racing).toBeDefined();
    expect(racing.mappings).toHaveProperty('BTN_A');
  });

  it('should switch active gaming profile', () => {
    const res = pcGamepadManager.setProfile('action');
    expect(res.success).toBe(true);
    expect(pcGamepadManager.activeProfile).toBe('action');

    const invalid = pcGamepadManager.setProfile('non_existent');
    expect(invalid.success).toBe(false);
  });

  it('should process gamepad input events gracefully', () => {
    pcGamepadManager.processGamepadEvent({
      button: 'BTN_A',
      state: 'down',
      axisX: 0.5,
      axisY: -0.2
    });

    expect(pcGamepadManager.latestInputs).toBeDefined();
    expect(pcGamepadManager.latestInputs.button).toBe('BTN_A');
    expect(pcGamepadManager.latestInputs.state).toBe('down');
  });

  it('should handle ADB reverse and phone launch for mock devices', async () => {
    const reverseRes = await pcGamepadManager.setupAdbReverse('mock-phone-1');
    expect(reverseRes.success).toBe(true);

    const launchRes = await pcGamepadManager.launchOnPhone('mock-phone-1');
    expect(launchRes.success).toBe(true);
    expect(launchRes.url).toBeDefined();
  });
});
