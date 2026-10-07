import { describe, it, expect } from 'vitest';
import { aiManager } from '../server/aiManager.js';

describe('AiManager Action-Oriented Test Suite', () => {
  it('should execute CLEAN_JUNK action when user asks to clean junk files', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'پاکسازی فایلهای اضافی روی گوشی رو انجام بده',
      deviceDetails: { name: 'Samsung S24 Ultra', osVersion: 'Android 14' }
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted).toBeDefined();
    expect(res.actionExecuted.type).toBe('CLEAN_JUNK');
    expect(res.answer).toContain('پاکسازی');
  });

  it('should execute VIBRATION test action', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'تست ویبره گوشی رو بزن',
      deviceDetails: { name: 'Xiaomi Redmi Note 11' }
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted?.type).toBe('VIBRATION');
  });

  it('should execute SET_VOLUME action on mute query', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'گوشی رو سایلنت و بی صدا کن',
      deviceDetails: { name: 'Xiaomi Redmi Note 11' }
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted?.type).toBe('SET_VOLUME');
  });

  it('should execute CREATE_BACKUP action on backup query', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'از مخاطبین و اطلاعات گوشی بکاپ بگیر',
      deviceDetails: { name: 'Xiaomi Redmi Note 11' }
    });

    expect(res.success).toBe(true);
    expect(res.actionExecuted?.type).toBe('CREATE_BACKUP');
  });

  it('should query live battery metrics', async () => {
    const res = await aiManager.askDeviceAssistant({
      serial: 'mock-device-1',
      query: 'دمای باتری چنده و وضعیتش چطوره؟',
      deviceDetails: { name: 'Xiaomi Redmi Note 11' }
    });

    expect(res.success).toBe(true);
    expect(res.answer).toContain('باتری');
  });
});
