import { describe, it, expect } from 'vitest';
import { resolveAppDisplayName } from '../server/appNameResolver.js';

describe('AppNameResolver Test Suite', () => {
  it('should correctly resolve Iranian bank apps that end with .android', () => {
    expect(resolveAppDisplayName('com.refahbank.dpi.android')).toContain('بانک رفاه');
    expect(resolveAppDisplayName('ir.tejaratbank.totp.mobile.android')).toContain('بانک تجارت');
    expect(resolveAppDisplayName('ir.tejaratbank.tata.mobile.android.tejarat')).toContain('بانک تجارت');
    expect(resolveAppDisplayName('ir.bmi.bam.nativeweb')).toContain('بانک ملی');
  });

  it('should correctly resolve global tech apps that end with .android without showing "android"', () => {
    expect(resolveAppDisplayName('com.wireguard.android')).toContain('WireGuard');
    expect(resolveAppDisplayName('com.linkedin.android')).toContain('LinkedIn');
    expect(resolveAppDisplayName('ai.perplexity.app.android')).toContain('Perplexity');
    expect(resolveAppDisplayName('com.github.android')).toContain('GitHub');
    expect(resolveAppDisplayName('net.melodify.android')).toContain('Melodify');
    expect(resolveAppDisplayName('com.xing.android')).toContain('XING');
    expect(resolveAppDisplayName('com.microsoft.rdc.android')).toContain('Remote Desktop');
  });

  it('should correctly resolve other technical packages from user screenshot', () => {
    expect(resolveAppDisplayName('com.v2ray.ang')).toBe('v2rayNG');
    expect(resolveAppDisplayName('com.kamal.androidtv')).toContain('Android TV');
    expect(resolveAppDisplayName('android')).toContain('سیستم‌عامل اندروید');
    expect(resolveAppDisplayName('com.anydesk.anydeskandroid')).toContain('AnyDesk');
    expect(resolveAppDisplayName('com.dsi.ant.plugins.antplus')).toContain('ANT+');
    expect(resolveAppDisplayName('com.ichi2.anki')).toContain('AnkiDroid');
  });

  it('should heuristically format unknown packages without using "android"', () => {
    const customResult = resolveAppDisplayName('com.awesomecompany.supertool.android');
    expect(customResult).not.toBe('android');
    expect(customResult).toContain('Supertool');
  });
});
