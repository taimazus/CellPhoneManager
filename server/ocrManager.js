import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { adbManager } from './adbManager.js';
import { toolManager } from './toolManager.js';

const execAsync = util.promisify(exec);

export class OcrManager {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Unescape XML entities like &amp;, &quot;, &lt;, etc.
  unescapeXml(text) {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#10;/g, '\n')
      .replace(/&#13;/g, '')
      .trim();
  }

  // Filter out technical noise, tracking parameters, hashes, and internal Android IDs
  isUsefulText(text) {
    if (!text || text.length < 2) return false;
    const clean = text.trim();

    // Filter out pure tracking query strings (e.g., utm_source=..., gclid=..., fbclid=...)
    if (/^(utm_|gclid=|fbclid=|gad_source=|_ga=|_gl=)/i.test(clean) || clean.includes('&utm_') || clean.includes('&amp;utm_')) {
      return false;
    }

    // Filter out pure technical URLs that look like ad links
    if (/^https?:\/\/[^\s]+(utm_|gclid|gad_source|pixel)/i.test(clean) && clean.length > 80) {
      return false;
    }

    // Filter out internal resource-id patterns
    if (/^[a-zA-Z0-9_.]+:(id|layout|string|drawable)\//i.test(clean)) {
      return false;
    }

    // Filter out long random base64 or hex hashes (> 30 chars with no spaces)
    if (/^[a-zA-Z0-9_-]{32,}$/.test(clean) && !clean.includes(' ')) {
      return false;
    }

    return true;
  }

  // Method 1: Extract text from UI hierarchy XML with smart filtering
  async extractUiHierarchyText(serial) {
    try {
      await adbManager.runAdb('shell uiautomator dump /sdcard/window_dump.xml', serial);
      const readRes = await adbManager.runAdb('shell cat /sdcard/window_dump.xml', serial);

      if (!readRes.success || !readRes.stdout) {
        return { success: false, error: 'امکان استخراج لایه‌های متنی صفحه وجود ندارد.' };
      }

      const xml = readRes.stdout;
      
      // Match both text="..." and content-desc="..."
      const textMatches = xml.match(/text="([^"]+)"/g) || [];
      const descMatches = xml.match(/content-desc="([^"]+)"/g) || [];

      const extracted = [];
      const seen = new Set();

      const processMatch = (rawStr, prefix) => {
        const val = rawStr.replace(prefix, '').slice(0, -1);
        const unescaped = this.unescapeXml(val);
        if (this.isUsefulText(unescaped) && !seen.has(unescaped.toLowerCase())) {
          seen.add(unescaped.toLowerCase());
          extracted.push(unescaped);
        }
      };

      for (const m of textMatches) processMatch(m, 'text="');
      for (const m of descMatches) processMatch(m, 'content-desc="');

      return {
        success: true,
        extractedText: extracted.join('\n'),
        itemsCount: extracted.length
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Method 2: Capture screen and run Windows Media OCR on pixels
  async extractImageOcrText(serial) {
    try {
      const adbPath = await toolManager.getAdbPath();
      const tempImg = path.join(this.tempDir, `ocr_${Date.now()}_${serial.replace(/[:.]/g, '_')}.png`);
      const scriptPath = path.join(process.cwd(), 'server', 'winOcr.ps1');

      // 1. Capture screen buffer directly to local image file
      const captureCmd = `"${adbPath}" -s ${serial} exec-out screencap -p > "${tempImg}"`;
      await execAsync(captureCmd, { shell: 'cmd.exe', maxBuffer: 1024 * 1024 * 20 });

      if (!fs.existsSync(tempImg) || fs.statSync(tempImg).size < 1000) {
        return { success: false, error: 'تصویر اسکرین‌شات از دستگاه دریافت نشد.' };
      }

      // 2. Run PowerShell Windows Native OCR
      const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -ImagePath "${tempImg}"`;
      const { stdout, stderr } = await execAsync(psCmd, { maxBuffer: 1024 * 1024 * 10 });

      // Clean up temp image
      try {
        if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
      } catch {}

      if (stderr && !stdout) {
        return { success: false, error: stderr };
      }

      const rawLines = stdout.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      const usefulLines = rawLines.filter(l => this.isUsefulText(l));

      return {
        success: true,
        extractedText: usefulLines.join('\n') || rawLines.join('\n'),
        itemsCount: usefulLines.length
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Combined smart extractor
  async extractScreenText(serial, mode = 'hybrid') {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        extractedText: `CellPhoneManager v3.0 - شرکت راهکار الکترونیک سهند\nوضعیت اتصال: متصل از طریق کابل USB\nمدل دستگاه: Xiaomi Redmi Note 11 (2201116TG)\nپردازنده: Snapdragon 680 Octa-Core\nشارژ باتری: 96% سالم (39°C)`,
        mode
      };
    }

    try {
      if (mode === 'ocr') {
        const imgRes = await this.extractImageOcrText(serial);
        if (imgRes.success && imgRes.extractedText.trim().length > 0) {
          return { success: true, extractedText: imgRes.extractedText, mode: 'ocr' };
        }
        // Fallback to UI hierarchy
        return await this.extractUiHierarchyText(serial);
      }

      if (mode === 'ui') {
        return await this.extractUiHierarchyText(serial);
      }

      // Hybrid mode (default): Try Image OCR first, then enrich with UI texts
      const [imgRes, uiRes] = await Promise.allSettled([
        this.extractImageOcrText(serial),
        this.extractUiHierarchyText(serial)
      ]);

      const texts = [];
      const seen = new Set();

      if (imgRes.status === 'fulfilled' && imgRes.value?.success && imgRes.value.extractedText) {
        const lines = imgRes.value.extractedText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !seen.has(trimmed.toLowerCase())) {
            seen.add(trimmed.toLowerCase());
            texts.push(trimmed);
          }
        }
      }

      if (uiRes.status === 'fulfilled' && uiRes.value?.success && uiRes.value.extractedText) {
        const lines = uiRes.value.extractedText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !seen.has(trimmed.toLowerCase())) {
            seen.add(trimmed.toLowerCase());
            texts.push(trimmed);
          }
        }
      }

      const finalText = texts.join('\n');
      if (finalText.trim().length > 0) {
        return {
          success: true,
          extractedText: finalText,
          itemsCount: texts.length,
          mode: 'hybrid'
        };
      }

      return {
        success: true,
        extractedText: 'متن قابل تشخیصی در صفحه جاری یافت نشد.',
        itemsCount: 0,
        mode: 'hybrid'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const ocrManager = new OcrManager();
