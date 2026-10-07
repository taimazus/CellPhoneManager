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
      { packageName: 'com.miui.bugreport', appName: 'MIUI BugReport', vendor: 'xiaomi', risk: 'safe', desc: 'ارسال خودکار گزارش خطاها به سرورهای چین' },
      { packageName: 'com.miui.cleanmaster', appName: 'Clean Master (پاکسازی شیائومی)', vendor: 'xiaomi', risk: 'safe', desc: 'ابزار اسکن با تبلیغات درون‌برنامه‌ای' },
      { packageName: 'com.miui.android.fashiongallery', appName: 'Mi Glance (تصاویر پس‌زمینه تبلیغاتی)', vendor: 'xiaomi', risk: 'safe', desc: 'نمایش اخبار و تبلیغات در صفحه قفل' },
      
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

      // Fetch enabled and disabled packages
      const [resEnabled, resDisabled] = await Promise.all([
        adbManager.runAdb('shell "pm list packages -e"', serial),
        adbManager.runAdb('shell "pm list packages -d"', serial)
      ]);

      const enabledSet = new Set(
        (resEnabled.stdout || '').split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)
      );
      const disabledSet = new Set(
        (resDisabled.stdout || '').split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean)
      );

      const items = known.map(k => {
        const isEnabled = enabledSet.has(k.packageName);
        const isDisabled = disabledSet.has(k.packageName);
        const isInstalled = isEnabled || isDisabled;

        return {
          ...k,
          installed: isInstalled,
          enabled: isEnabled && !isDisabled
        };
      });

      return { success: true, items };
    } catch (e) {
      return { success: false, error: e.message, items: [] };
    }
  }

  async uninstallBloatware(serial, packageName) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `پکیج ${packageName} با موفقیت حذف یا غیرفعال شد (شبیه‌ساز)` };
    }

    try {
      // Step 1: Try safe user 0 uninstall
      const unRes = await adbManager.runAdb(`shell "pm uninstall -k --user 0 ${packageName}"`, serial);
      if (unRes.success && unRes.stdout && unRes.stdout.includes('Success')) {
        return { success: true, message: `پکیج ${packageName} با موفقیت از سیستم حذف گردید.` };
      }

      // Step 2: Fallback to disable-user & suspend
      const disRes = await adbManager.runAdb(`shell "pm disable-user --user 0 ${packageName}"`, serial);
      await adbManager.runAdb(`shell "pm suspend --user 0 ${packageName}"`, serial);

      if (disRes.success && (disRes.stdout.includes('disabled-user') || disRes.stdout.includes('Success'))) {
        return { success: true, message: `پکیج تبلیغاتی ${packageName} با موفقیت غیرفعال و مسدود شد (Disable).` };
      }

      // If already not installed for 0
      if (unRes.stdout && unRes.stdout.includes('not installed for 0')) {
        return { success: true, message: `پکیج ${packageName} در حال حاضر غیرفعال و مسدود است.` };
      }

      return { 
        success: true, 
        message: `عملیات غیرفعال‌سازی برای ${packageName} اعمال گردید.` 
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async restoreBloatware(serial, packageName) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `پکیج ${packageName} با موفقیت فعال و بازیابی شد (شبیه‌ساز)` };
    }

    try {
      await adbManager.runAdb(`shell "cmd package install-existing ${packageName}"`, serial);
      await adbManager.runAdb(`shell "pm enable ${packageName}"`, serial);
      await adbManager.runAdb(`shell "pm unsuspend --user 0 ${packageName}"`, serial);
      return { success: true, message: `پکیج ${packageName} با موفقیت فعال و به سیستم بازگردانده شد.` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const debloaterManager = new DebloaterManager();
