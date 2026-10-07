import { describe, it, expect } from 'vitest';
import { automationManager } from '../server/automationManager.js';

describe('AutomationManager Test Suite', () => {
  it('should list rules and trigger connect automations', async () => {
    const list = automationManager.listRules();
    expect(list.success).toBe(true);
    expect(Array.isArray(list.rules)).toBe(true);

    const triggerRes = await automationManager.triggerAutomations('DEVICE_CONNECT', {
      serial: 'mock-test-phone'
    });
    expect(triggerRes.success).toBe(true);

    const history = automationManager.getHistory(5);
    expect(Array.isArray(history)).toBe(true);
  });
});
