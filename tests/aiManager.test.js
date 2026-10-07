import { describe, it, expect } from 'vitest';
import { aiManager } from '../server/aiManager.js';

describe('AiManager Device-Centric & Guardrailed Test Suite', () => {
  const mockDevice = {
    name: 'Xiaomi Redmi Note 11',
    model: '2201116TG',
    osVersion: 'Android 13'
  };

  it('should execute CLEAN_JUNK and mention device name with human explanation', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'پاکسازی فایلهای اضافی روی گوشی رو انجام بده',
      deviceDetails: mockDevice
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted).toBeDefined();
    expect(res.actionExecuted.type).toBe('CLEAN_JUNK');
    expect(res.answer).toContain('Xiaomi Redmi Note 11');
    expect(res.answer).toContain('فضای آزادشده');
  });

  it('should execute VIBRATION test action', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'تست ویبره گوشی رو بزن',
      deviceDetails: mockDevice
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted?.type).toBe('VIBRATION');
    expect(res.answer).toContain('موتور ویبره');
  });

  it('should execute SET_VOLUME action on mute query', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'گوشی رو سایلنت و بی صدا کن',
      deviceDetails: mockDevice
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted?.type).toBe('SET_VOLUME');
  });

  it('should execute CREATE_BACKUP action on backup query', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'از مخاطبین و اطلاعات گوشی بکاپ بگیر',
      deviceDetails: mockDevice
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted?.type).toBe('CREATE_BACKUP');
  });

  it('should handle OUT-OF-SCOPE questions politely and state exact device responsibility', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'طرز تهیه قورمه سبزی چیه؟',
      deviceDetails: mockDevice
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted).toBeNull();
    // Must mention the specific device
    expect(res.answer).toContain('Xiaomi Redmi Note 11');
    expect(res.answer).toContain('2201116TG');
    expect(res.answer).toContain('وظیفه من منحصراً');
  });
});
