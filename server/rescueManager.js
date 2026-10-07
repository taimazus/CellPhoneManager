import { adbManager } from './adbManager.js';

export class RescueManager {
  async dismissKeyguard(serial) {
    try {
      await adbManager.runAdb('shell wm dismiss-keyguard', serial);
      await adbManager.runAdb('shell input keyevent 82', serial); // KEYCODE_MENU
      return { success: true, message: 'دستور بازگشایی قفل صفحه ارسال شد.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async rebootSafeMode(serial) {
    try {
      await adbManager.runAdb('shell setprop persist.sys.safemode 1', serial);
      await adbManager.runAdb('reboot', serial);
      return { success: true, message: 'گوشی در حالت Safe Mode ریبوت شد. (برنامه‌های قفل‌کننده موقتاً غیرفعال می‌شوند)' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async openEmergencyDialer(serial) {
    try {
      await adbManager.runAdb('shell am start -a android.intent.action.EMERGENCY_DIAL', serial);
      return { success: true, message: 'صفحه شماره‌گیر اضطراری باز شد.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async wipeDataRecovery(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return { success: true, message: 'فرمان ریبوت به ریکاوری با فلگ وایپ داده صادر شد (حالت شبیه‌ساز).' };
      }
      await adbManager.runAdb('reboot recovery', serial);
      return { success: true, message: 'گوشی به محیط Recovery ریبوت شد. از منوی ریکاوری گزینه Wipe Data / Factory Reset را انتخاب کنید.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async removeRootLockKeys(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return { success: true, message: 'فایل‌های قفل صفحه در حالت شبیه‌ساز با موفقیت حذف شدند.' };
      }
      // Deleting lock pattern/pin/password keys in /data/system/
      const cmds = [
        'rm -f /data/system/password.key',
        'rm -f /data/system/pattern.key',
        'rm -f /data/system/gesture.key',
        'rm -f /data/system/locksettings.db',
        'rm -f /data/system/locksettings.db-wal',
        'rm -f /data/system/locksettings.db-shm'
      ];
      for (const cmd of cmds) {
        await adbManager.runAdb(`shell su -c "${cmd}"`, serial);
      }
      return { success: true, message: 'فایل‌های کلید قفل از /data/system/ پاکسازی شدند. گوشی را ری‌استارت کنید.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const rescueManager = new RescueManager();
