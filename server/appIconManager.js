import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { spawn } from 'child_process';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

export class AppIconManager {
  constructor() {
    this.cacheDir = path.join(process.cwd(), 'uploads', 'app_icons_cache');
    this.ensureCacheDir();
    this.pendingExtractions = new Map(); // prevent duplicate parallel extractions for same package
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getCachedIcon(packageName) {
    const pngPath = path.join(this.cacheDir, `${packageName}.png`);
    if (fs.existsSync(pngPath)) {
      return { filePath: pngPath, mime: 'image/png' };
    }
    const webpPath = path.join(this.cacheDir, `${packageName}.webp`);
    if (fs.existsSync(webpPath)) {
      return { filePath: webpPath, mime: 'image/webp' };
    }
    const jpgPath = path.join(this.cacheDir, `${packageName}.jpg`);
    if (fs.existsSync(jpgPath)) {
      return { filePath: jpgPath, mime: 'image/jpeg' };
    }
    return null;
  }

  async getAppIcon(serial, packageName) {
    if (!packageName) return null;

    // 1. Check local disk cache first (instant response)
    const cached = this.getCachedIcon(packageName);
    if (cached) {
      return {
        buffer: fs.readFileSync(cached.filePath),
        mime: cached.mime
      };
    }

    // 2. Return null for mock devices (will render high-end SVG fallback)
    if (!serial || serial.startsWith('mock-')) {
      return null;
    }

    // 3. Deduplicate parallel requests for the same package
    const lockKey = `${serial}_${packageName}`;
    if (this.pendingExtractions.has(lockKey)) {
      return await this.pendingExtractions.get(lockKey);
    }

    const extractionPromise = this._extractIconFromDevice(serial, packageName);
    this.pendingExtractions.set(lockKey, extractionPromise);

    try {
      const result = await extractionPromise;
      return result;
    } finally {
      this.pendingExtractions.delete(lockKey);
    }
  }

  async _extractIconFromDevice(serial, packageName) {
    try {
      // Step A: Find APK remote path on device
      const pathRes = await adbManager.runAdb(`shell pm path ${packageName}`, serial);
      if (!pathRes.success || !pathRes.stdout) return null;

      const lines = pathRes.stdout.trim().split('\n');
      let apkPath = '';
      for (const line of lines) {
        const clean = line.trim().replace(/^package:/, '');
        if (clean.endsWith('.apk')) {
          apkPath = clean;
          if (clean.endsWith('base.apk')) break; // Prefer base.apk
        }
      }

      if (!apkPath) return null;

      // Step B: List icon entries inside the APK using device unzip
      const listCmd = `shell "unzip -l '${apkPath}' 'res/*mipmap*/*' 'res/*drawable*/*' 'assets/*icon*' 'res/*icon*' 2>/dev/null"`;
      const listRes = await adbManager.runAdb(listCmd, serial);

      let bestCandidate = null;
      if (listRes.success && listRes.stdout) {
        bestCandidate = this._selectBestIconEntry(listRes.stdout);
      }

      // Step C: Extract the best candidate icon binary using adb exec-out
      if (bestCandidate) {
        const buffer = await this._execOutBinary(serial, `unzip -p '${apkPath}' '${bestCandidate}'`);
        if (buffer && buffer.length > 100 && this._isValidImageBuffer(buffer)) {
          const ext = bestCandidate.endsWith('.webp') ? 'webp' : bestCandidate.endsWith('.jpg') || bestCandidate.endsWith('.jpeg') ? 'jpg' : 'png';
          const mime = ext === 'webp' ? 'image/webp' : ext === 'jpg' ? 'image/jpeg' : 'image/png';
          const savePath = path.join(this.cacheDir, `${packageName}.${ext}`);
          fs.writeFileSync(savePath, buffer);
          return { buffer, mime };
        }
      }

      return null;
    } catch (err) {
      console.error(`[AppIconManager] Extraction failed for ${packageName}:`, err.message);
      return null;
    }
  }

  _selectBestIconEntry(unzipListOutput) {
    const lines = unzipListOutput.split('\n');
    const candidates = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const filePath = parts[parts.length - 1];
      if (!filePath) continue;

      const lower = filePath.toLowerCase();
      // Only keep raster image formats (PNG, WebP, JPG)
      if (!lower.endsWith('.png') && !lower.endsWith('.webp') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg')) {
        continue;
      }

      let score = 0;

      // Density Scoring
      if (lower.includes('xxxhdpi')) score += 600;
      else if (lower.includes('xxhdpi')) score += 500;
      else if (lower.includes('xhdpi')) score += 400;
      else if (lower.includes('hdpi')) score += 300;
      else if (lower.includes('mdpi')) score += 200;
      else if (lower.includes('ldpi')) score += 100;
      else score += 50;

      // Name Preference Scoring
      if (lower.includes('ic_launcher_round')) score += 150;
      else if (lower.includes('ic_launcher')) score += 140;
      else if (lower.includes('app_icon') || lower.includes('appicon')) score += 120;
      else if (lower.includes('icon')) score += 100;
      else if (lower.includes('logo')) score += 80;

      // Penalize background / foreground split adaptive sub-layers if composite is present
      if (lower.includes('background') || lower.includes('foreground')) {
        score -= 200;
      }

      candidates.push({ path: filePath, score });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].path;
  }

  async _execOutBinary(serial, shellCommand) {
    return new Promise(async (resolve) => {
      try {
        const adbPath = await toolManager.getAdbPath();
        const args = serial ? ['-s', serial, 'exec-out', shellCommand] : ['exec-out', shellCommand];
        const child = spawn(adbPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

        const chunks = [];
        let totalLen = 0;

        child.stdout.on('data', (chunk) => {
          chunks.push(chunk);
          totalLen += chunk.length;
        });

        child.on('error', () => resolve(null));
        child.on('close', (code) => {
          if (code === 0 && totalLen > 0) {
            resolve(Buffer.concat(chunks, totalLen));
          } else {
            resolve(null);
          }
        });

        // Timeout safety
        setTimeout(() => {
          try { child.kill(); } catch {}
          resolve(null);
        }, 4000);
      } catch {
        resolve(null);
      }
    });
  }

  _isValidImageBuffer(buffer) {
    if (!buffer || buffer.length < 3) return false;
    // PNG Header: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // WebP Header: RIFF .... WEBP
    if (buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP') {
      return true;
    }
    // JPEG Header: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    return false;
  }
}

export const appIconManager = new AppIconManager();
