import { adbManager } from './adbManager.js';

export class DebloaterManager {
  getKnownBloatware() {
    return [
      // Xiaomi (MIUI / HyperOS)
      { packageName: 'com.miui.analytics', appName: 'Xiaomi Analytics (رهگیری و آمار)', vendor: 'xiaomi', risk: 'safe', desc: 'سرویس جمع‌آوری داده و رفتار کاربر' },
      { packageName: 'com.miui.msa.global', appName: 'MIUI System Ads (تبلیغات شیائومی)', vendor: 'xiaomi', risk: 'safe', desc: 'سرویس نمایش بنرهای تبلیغاتی درون برنامه‌های سیستمی' },
      { packageName: 'com.xiaomi.mipicks', appName: 'GetApps (فروشگاه شیائومی)', vendor: 'xiaomi', risk: 'safe', desc: 'مارکت پیش‌فرض برنامه‌های شیائومی' },
      { packageName: 'com.miui.daemon', appName: 'MIUI Daemon', vendor: 'xiaomi', risk: 'safe', desc: 'سرویس پس‌زمینه مصرف باتری و لاگ' },
      { packageName: 'com.miui.yellowpage', appName: 'YellowPage', vendor: 'xiaomi', risk: 'safe', desc: 'سرویس دفترچه خدمات متفرقه' },
      { packageName: 'com.mi.globalbrowser', appName: 'Mi Browser (مرورگر پیش‌فرض)', vendor: 'xiaomi', risk: 'safe', desc: 'مرورگر پیش‌فرض با تبلیغات بالا' },
      
      // Samsung (One UI)
      { packageName: 'com.samsung.android.bixby.agent', appName: 'Bixby Voice Assistant', vendor: 'samsung', risk: 'safe', desc: 'دستیار صوتی بیکسبی سامسونگ' },
      { packageName: 'com.samsung.android.bixby.service', appName: 'Bixby Service', vendor: 'samsung', risk: 'safe', desc: 'سرویس پردازش فرامین بیکسبی' },
      { packageName: 'com.sec.android.app.samsungapps', appName: 'Galaxy Store (فروشگاه گلکسی)', vendor: 'samsung', risk: 'safe', desc: 'مارکت اختصاصی برنامه‌های سامسونگ' },
      { packageName: 'com.samsung.android.spay', appName: 'Samsung Pay (پرداخت سامسونگ)', vendor: 'samsung', risk: 'safe', desc: 'سرویس پرداخت غیرفعال در ایران' },
      { packageName: 'com.samsung.android.game.gamehome', appName: 'Samsung Game Launcher', vendor: 'samsung', risk: 'safe', desc: 'لانچر بازی با بنرهای تبلیغاتی' },
      
      // Google Services
      { packageName: 'com.google.android.apps.tachyon', appName: 'Google Duo / Meet', vendor: 'google', risk: 'safe', desc: 'تماس تصویری پیش‌فرض گوگل' },
      { packageName: 'com.google.android.videos', appName: 'Google TV / Play Movies', vendor: 'google', risk: 'safe', desc: 'فیلم و سریال گوگل' },
      { packageName: 'com.google.android.apps.books', appName: 'Google Play Books', vendor: 'google', risk: 'safe', desc: 'کتابخوان پلی‌استور' }
    ];
  }

  async scanDeviceBloatware(serial) {
    try {
      const known = this.getKnownBloatware();
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          items: known.map(k => ({ ...k, installed: true, enabled: true }))
        };
      }

      const res = await adbManager.runAdb('shell pm list packages', serial);
      if (!res.success || !res.stdout) return { success: false, items: [] };

      const installedPackages = new Set(
        res.stdout.split('\n').map(l => l.replace('package:', '').trim())
      );

      const items = known.map(k => ({
        ...k,
        installed: installedPackages.has(k.packageName)
      }));

      return { success: true, items };
    } catch (e) {
      return { success: false, error: e.message, items: [] };
    }
  }

  async uninstallBloatware(serial, packageName) {
    try {
      // Safe user 0 uninstall (can be restored anytime)
      const res = await adbManager.runAdb(`shell pm uninstall -k --user 0 ${packageName}`, serial);
      if (res.success && res.stdout.includes('Success')) {
        return { success: true, message: `پکیج ${packageName} با موفقیت حذف گردید.` };
      }
      return { success: false, error: res.error || res.stdout || 'خطا در حذف پکیج' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async restoreBloatware(serial, packageName) {
    try {
      const res = await adbManager.runAdb(`shell cmd package install-existing ${packageName}`, serial);
      return { success: true, message: `پکیج ${packageName} با موفقیت بازیابی شد.` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const debloaterManager = new DebloaterManager();
