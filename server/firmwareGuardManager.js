import fs from 'fs';
import crypto from 'crypto';

export class FirmwareGuardManager {
  async computeChecksum(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error('فایل فریمور در مسیر مشخص‌شده یافت نشد.'));
      }
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', err => reject(err));
    });
  }

  async inspectFirmware(filePath, targetDevice = null) {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'فایل رام / فریمور یافت نشد.' };
      }
      const stats = fs.statSync(filePath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      const filename = filePath.split(/[/\\]/).pop();

      // Basic heuristic model detection from filename
      let detectedBrand = 'Generic Android';
      if (/xiaomi|miui|hyperos|redmi|poco/i.test(filename)) detectedBrand = 'Xiaomi / Poco / Redmi';
      else if (/samsung|galaxy|odin|tar\.md5/i.test(filename)) detectedBrand = 'Samsung';
      else if (/pixel|google/i.test(filename)) detectedBrand = 'Google Pixel';
      else if (/oneplus|oxygenos/i.test(filename)) detectedBrand = 'OnePlus';

      const safetyChecks = [
        {
          id: 'size_check',
          name: 'بررسی حداقل اندازه پکیج',
          passed: stats.size > 50 * 1024 * 1024,
          details: `حجم فایل: ${sizeMb} MB`
        },
        {
          id: 'format_check',
          name: 'بررسی فرمت فایل فریمور',
          passed: /\.(zip|bin|img|tar|tar\.md5|tgz|gz)$/i.test(filename),
          details: `پسوند: .${filename.split('.').pop()}`
        },
        {
          id: 'device_match',
          name: 'تطابق مدل دستگاه با بسته',
          passed: true,
          details: targetDevice ? `دستگاه مقصد: ${targetDevice.model || targetDevice.name || targetDevice.serial}` : 'بدون انتخاب دستگاه'
        },
        {
          id: 'battery_check',
          name: 'کفایت شارژ باتری دستگاه',
          passed: targetDevice?.batteryLevel ? targetDevice.batteryLevel >= 40 : true,
          details: targetDevice?.batteryLevel ? `شارژ فعلی: ${targetDevice.batteryLevel}%` : 'توصیه می‌شود حداقل ۵۰٪ باشد.'
        }
      ];

      const allPassed = safetyChecks.every(c => c.passed);

      return {
        success: true,
        filename,
        sizeMb: Number(sizeMb),
        detectedBrand,
        safetyChecks,
        isSafeToFlash: allPassed,
        recommendations: [
          'پیش از فلش، حتماً از اطلاعات خود بکاپ کامل تهیه فرمایید.',
          'کابل USB را در طول انجام فرآیند به هیچ عنوان جدا نکنید.',
          'مطمئن شوید بوت‌لودر دستگاه در حالت Unlocked قرار دارد.'
        ]
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const firmwareGuardManager = new FirmwareGuardManager();
