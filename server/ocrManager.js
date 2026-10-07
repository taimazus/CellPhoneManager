import { adbManager } from './adbManager.js';

export class OcrManager {
  async extractScreenText(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          extractedText: `CellPhoneManager - مدیریت هوشمند اندروید\nوضعیت اتصال: متصل از طریق Wi-Fi 5G\nپردازنده: Snapdragon 680 Octa-Core\nشارژ باتری: 78% سالم`,
          translatedText: `CellPhoneManager - Smart Android Management\nConnection Status: Connected via Wi-Fi 5G\nProcessor: Snapdragon 680 Octa-Core\nBattery: 78% Healthy`
        };
      }

      // 1. Dump UI hierarchy using uiautomator
      const res = await adbManager.runAdb('shell uiautomator dump /sdcard/window_dump.xml', serial);
      const readRes = await adbManager.runAdb('shell cat /sdcard/window_dump.xml', serial);

      if (!readRes.success || !readRes.stdout) {
        return { success: false, error: 'امکان استخراج لایه‌های متنی صفحه وجود ندارد.' };
      }

      const matches = readRes.stdout.match(/text="([^"]+)"/g) || [];
      const extractedList = matches
        .map(m => m.replace(/text="|"/g, '').trim())
        .filter(t => t.length > 0);

      const fullText = Array.from(new Set(extractedList)).join('\n');

      return {
        success: true,
        extractedText: fullText || 'متنی در صفحه جاری یافت نشد.',
        itemsCount: extractedList.length
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const ocrManager = new OcrManager();
