import { describe, it, expect } from 'vitest';
import { windowsToastManager } from '../server/windowsToastManager.js';

describe('WindowsToastManager Test Suite', () => {
  it('should toggle enabled state properly', () => {
    windowsToastManager.setEnabled(false);
    expect(windowsToastManager.isEnabled()).toBe(false);

    windowsToastManager.setEnabled(true);
    expect(windowsToastManager.isEnabled()).toBe(true);
  });

  it('should handle showToast safely without crashing', () => {
    expect(() => {
      windowsToastManager.showToast('تست تستی', 'متن پیامک آزمایشی ویندوز');
    }).not.toThrow();
  });
});
