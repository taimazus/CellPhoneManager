import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { adbManager } from './adbManager.js';
import { toolManager } from './toolManager.js';

const execAsync = util.promisify(exec);

export class RomManager {
  // Get Device Specifications & ROM Compatibility details
  async getDeviceRomInfo(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          codename: 'alioth',
          model: 'POCO F3 / Redmi K40',
          androidVersion: '14 (HyperOS / Custom)',
          arch: 'arm64-v8a',
          slot: '_a',
          isAB: true,
          isDynamic: true,
          trebleSupported: true,
          securityPatch: '2024-05-01'
        };
      }

      const getProp = async (prop) => {
        const res = await adbManager.runAdb(`shell getprop ${prop}`, serial);
        return res.success && res.stdout ? res.stdout.trim() : '';
      };

      const codename = (await getProp('ro.product.device')) || (await getProp('ro.build.product')) || 'نامشخص';
      const model = (await getProp('ro.product.model')) || (await getProp('ro.product.brand')) || 'نامشخص';
      const androidVersion = (await getProp('ro.build.version.release')) || 'نامشخص';
      const arch = (await getProp('ro.product.cpu.abi')) || 'arm64-v8a';
      const slot = (await getProp('ro.boot.slot_suffix')) || 'تک اسلات';
      const isDynamic = (await getProp('ro.boot.dynamic_partitions')) === 'true';
      const trebleSupported = (await getProp('ro.treble.enabled')) === 'true';
      const securityPatch = (await getProp('ro.build.version.security_patch')) || 'نامشخص';

      return {
        success: true,
        codename,
        model,
        androidVersion,
        arch,
        slot,
        isAB: slot.includes('_a') || slot.includes('_b'),
        isDynamic,
        trebleSupported,
        securityPatch
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Sideload ROM / Update Package via ADB Sideload (LineageOS, PixelOS, Stock OTA zip)
  async sideloadPackage(serial, zipFilePath) {
    try {
      if (!fs.existsSync(zipFilePath)) {
        return { success: false, error: `فایل پکیج یافت نشد: ${zipFilePath}` };
      }

      if (serial && serial.startsWith('mock-')) {
        return { success: true, message: `پکیج ${path.basename(zipFilePath)} با موفقیت در حالت شبیه‌ساز سایدلود شد.` };
      }

      const res = await adbManager.runAdb(`sideload "${zipFilePath}"`, serial);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Flash Fastboot Partitions (Stock / Custom / GSI)
  async flashPartition(partition, imagePath, disableVerity = false) {
    try {
      if (!fs.existsSync(imagePath)) {
        return { success: false, error: `فایل ایمیج یافت نشد: ${imagePath}` };
      }

      let cmd = '';
      if (partition === 'vbmeta' && disableVerity) {
        cmd = `flash --disable-verity --disable-verification vbmeta "${imagePath}"`;
      } else {
        cmd = `flash ${partition} "${imagePath}"`;
      }

      const res = await adbManager.runFastboot(cmd);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Wipe Userdata / Factory Reset in Fastboot
  async fastbootWipeData() {
    try {
      const res = await adbManager.runFastboot('-w');
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Reboot device to specific mode
  async rebootMode(serial, targetMode) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return { success: true, message: `دستگاه با موفقیت به حالت ${targetMode} هدایت شد.` };
      }

      let cmd = '';
      if (targetMode === 'recovery') cmd = 'reboot recovery';
      else if (targetMode === 'bootloader') cmd = 'reboot bootloader';
      else if (targetMode === 'fastbootd') cmd = 'reboot fastboot';
      else if (targetMode === 'sideload') cmd = 'reboot sideload';
      else if (targetMode === 'edl') cmd = 'reboot edl';
      else cmd = 'reboot';

      const res = await adbManager.runAdb(cmd, serial);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const romManager = new RomManager();
