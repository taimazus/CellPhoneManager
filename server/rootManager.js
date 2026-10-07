import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

const execAsync = util.promisify(exec);

export class RootManager {
  // 1. Check Root Status
  async checkRootStatus(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          isRooted: false,
          rootType: 'روت نیست (Not Rooted)',
          suVersion: 'یافت نشد',
          selinux: 'Enforcing (امن)',
          bootloaderUnlocked: true,
          magiskInstalled: false
        };
      }

      // Check su binary
      const suCheck = await adbManager.runAdb('shell which su', serial);
      const isSuFound = suCheck.success && suCheck.stdout && suCheck.stdout.includes('su');

      // Check su version
      let suVer = 'نامشخص';
      if (isSuFound) {
        const verRes = await adbManager.runAdb('shell su -v', serial);
        if (verRes.success && verRes.stdout) suVer = verRes.stdout.trim();
      }

      // Check Magisk package
      const magiskPkg = await adbManager.runAdb('shell pm list packages com.topjohnwu.magisk', serial);
      const isMagisk = magiskPkg.success && magiskPkg.stdout && magiskPkg.stdout.includes('magisk');

      // Check KernelSU
      const ksuRes = await adbManager.runAdb('shell test -e /data/adb/ksud && echo "KSU_EXISTS"', serial);
      const isKsu = ksuRes.success && ksuRes.stdout && ksuRes.stdout.includes('KSU_EXISTS');

      // Check SELinux
      const selinuxRes = await adbManager.runAdb('shell getenforce', serial);
      const selinux = selinuxRes.success && selinuxRes.stdout ? selinuxRes.stdout.trim() : 'Enforcing';

      // Check bootloader state
      const blRes = await adbManager.runAdb('shell getprop ro.boot.flash.locked', serial);
      const isLocked = blRes.success && blRes.stdout && blRes.stdout.includes('1');

      let rootType = 'روت نیست (Not Rooted)';
      if (isMagisk) rootType = 'Magisk (Zygisk)';
      else if (isKsu) rootType = 'KernelSU (هسته لینوکس)';
      else if (isSuFound) rootType = 'SuperSU / Standard SU';

      return {
        success: true,
        isRooted: isSuFound || isMagisk || isKsu,
        rootType,
        suVersion: suVer,
        selinux,
        bootloaderUnlocked: !isLocked,
        magiskInstalled: isMagisk
      };
    } catch (e) {
      return { success: false, error: e.message, isRooted: false };
    }
  }

  // 2. Push Magisk APK to Device for Boot Patching
  async installMagiskApp(serial) {
    try {
      // In real scenario, download or push Magisk APK
      const res = await adbManager.runAdb('shell am start -a android.intent.action.VIEW -d https://github.com/topjohnwu/Magisk/releases', serial);
      return {
        success: true,
        message: 'صفحه دریافت آخرین نسخه رسمی Magisk برای پچ کردن فایل Boot باز شد.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 3. Complete Unroot & Restore Stock Boot
  async unrootDevice(serial, stockBootPath = null) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          message: 'عملیات آن‌روت کامل و بازگردانی Stock Boot شبیه‌سازی شد. گوشی به حالت کارخانه و Unrooted بازگشت.'
        };
      }

      // 1. If Magisk app is installed, trigger uninstall broadcast
      await adbManager.runAdb('shell am broadcast -a com.topjohnwu.magisk.UNINSTALL', serial);

      // 2. Remove su binaries from temporary dirs if writable
      await adbManager.runAdb('shell su -c "rm -rf /data/adb/modules /data/adb/magisk /data/adb/ksu"', serial).catch(() => {});

      // 3. If stock boot.img provided, flash via fastboot
      if (stockBootPath && fs.existsSync(stockBootPath)) {
        await adbManager.reboot(serial, 'bootloader');
        await new Promise(r => setTimeout(r, 4000));
        await adbManager.runFastboot(`flash boot "${stockBootPath}"`);
        await adbManager.runFastboot('reboot');
      }

      return {
        success: true,
        message: 'دستور آن‌روت و پاکسازی ماژول‌های روت با موفقیت ارسال شد. جهت تکمیل، گوشی را یک‌بار ریبوت نمایید.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 4. Temporary Boot Test (Fastboot boot without permanent flash)
  async temporaryBoot(patchedBootPath) {
    try {
      if (!fs.existsSync(patchedBootPath)) {
        return { success: false, error: 'فایل بوت پچ‌شده یافت نشد.' };
      }
      const res = await adbManager.runFastboot(`boot "${patchedBootPath}"`);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 5. Permanent Flash Boot
  async flashBoot(patchedBootPath, slot = 'both') {
    try {
      if (!fs.existsSync(patchedBootPath)) {
        return { success: false, error: 'فایل بوت پچ‌شده یافت نشد.' };
      }
      let cmd = `flash boot "${patchedBootPath}"`;
      if (slot === 'a') cmd = `flash boot_a "${patchedBootPath}"`;
      if (slot === 'b') cmd = `flash boot_b "${patchedBootPath}"`;

      const res = await adbManager.runFastboot(cmd);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const rootManager = new RootManager();
