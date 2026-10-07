import { describe, it, expect } from 'vitest';
import { ocrManager } from '../server/ocrManager.js';

describe('OcrManager Test Suite', () => {
  it('should unescape XML entities correctly', () => {
    const raw = '&amp;quot;Hello &amp;amp; World&amp;gt; &#10;New Line';
    const clean = ocrManager.unescapeXml(raw);
    expect(clean).toContain('&');
    expect(clean).toContain('\nNew Line');
  });

  it('should filter out tracking parameters and technical codes', () => {
    expect(ocrManager.isUsefulText('utm_source=google&utm_medium=pmax')).toBe(false);
    expect(ocrManager.isUsefulText('gclid=1234567890abcdef')).toBe(false);
    expect(ocrManager.isUsefulText('com.android.systemui:id/status_bar')).toBe(false);
    expect(ocrManager.isUsefulText('این یک متن واقعی و معتبر است')).toBe(true);
    expect(ocrManager.isUsefulText('Hello from CellPhoneManager')).toBe(true);
  });

  it('should handle mock device extraction gracefully', async () => {
    const res = await ocrManager.extractScreenText('mock-test-id');
    expect(res.success).toBe(true);
    expect(res.extractedText).toBeDefined();
    expect(res.extractedText.length).toBeGreaterThan(0);
  });
});
