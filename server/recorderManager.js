import { spawn, exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

const execAsync = util.promisify(exec);

export class RecorderManager {
  constructor() {
    this.activeRecordings = new Map(); // serial -> { method, process, filePath, fileName, remoteFile, startTime }
    this.recordingsDir = path.join(process.cwd(), 'recordings');
    this.configFile = path.join(process.cwd(), 'recorder-config.json');
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.recordingsDir && typeof data.recordingsDir === 'string') {
          this.recordingsDir = path.resolve(data.recordingsDir);
        }
      }
    } catch (e) {
      console.error('[RecorderManager] Error loading recorder config:', e);
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(
        this.configFile,
        JSON.stringify({ recordingsDir: this.recordingsDir }, null, 2),
        'utf8'
      );
    } catch (e) {
      console.error('[RecorderManager] Error saving recorder config:', e);
    }
  }

  getRecordingsDir() {
    return this.recordingsDir;
  }

  setRecordingsDir(newDir) {
    if (!newDir || typeof newDir !== 'string' || newDir.trim().length === 0) {
      return { success: false, error: 'مسیر انتخاب شده نامعتبر است.' };
    }
    const resolved = path.resolve(newDir.trim());
    try {
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      this.recordingsDir = resolved;
      this.saveConfig();
      return {
        success: true,
        recordingsDir: this.recordingsDir,
        message: 'محل ذخیره‌سازی ویدیوها با موفقیت تغییر یافت.'
      };
    } catch (err) {
      return { success: false, error: `خطا در ایجاد یا دسترسی به پوشه: ${err.message}` };
    }
  }

  openDirectoryInExplorer(customPath) {
    const targetDir = customPath ? path.resolve(customPath) : this.recordingsDir;
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      spawn('explorer.exe', [targetDir], { detached: true, stdio: 'ignore' });
      return { success: true, message: 'پوشه ضبط در ویندوز باز شد.' };
    } catch (err) {
      return { success: false, error: `خطا در باز کردن پوشه: ${err.message}` };
    }
  }

  openFileInExplorer(fileName) {
    const safeName = path.basename(fileName);
    const fullPath = path.join(this.recordingsDir, safeName);
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'فایل ویدیو یافت نشد.' };
    }
    try {
      spawn('explorer.exe', ['/select,', fullPath], { detached: true, stdio: 'ignore' });
      return { success: true, message: 'فایل در اکسپلورر نشان داده شد.' };
    } catch (err) {
      return { success: false, error: `خطا در نمایش فایل: ${err.message}` };
    }
  }

  deleteRecording(fileName) {
    const safeName = path.basename(fileName);
    const fullPath = path.join(this.recordingsDir, safeName);
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'فایل ویدیو برای حذف یافت نشد.' };
    }
    try {
      fs.unlinkSync(fullPath);
      return { success: true, message: 'فایل ویدیوی ضبط شده با موفقیت حذف شد.' };
    } catch (err) {
      return { success: false, error: `خطا در حذف فایل: ${err.message}` };
    }
  }

  // 1. Start Screen Recording
  async startScreenRecording(serial, { resolution = '1080', bitrate = 16, captureAudio = true } = {}) {
    if (this.activeRecordings.has(serial)) {
      return { success: false, error: 'یک عملیات ضبط ویدیو در حال حاضر در حال اجراست.' };
    }

    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeSerial = serial.replace(/[:.]/g, '_');
    const fileName = `Recording_${timestamp}_${safeSerial}.mp4`;
    const destPath = path.join(this.recordingsDir, fileName);

    // Mock Device Recording
    if (serial.startsWith('mock-')) {
      this.activeRecordings.set(serial, {
        method: 'mock',
        filePath: destPath,
        fileName,
        startTime: Date.now()
      });
      return {
        success: true,
        fileName,
        message: 'ضبط صفحه در حالت شبیه‌ساز آغاز شد.'
      };
    }

    const adbPath = await toolManager.getAdbPath();
    const remoteFile = `/sdcard/cpm_rec_${timestamp}.mp4`;

    try {
      // Build native hardware screenrecord command on Android
      // This is 100% reliable, produces universally playable MP4s when stopped with SIGINT
      let bitRateArg = `${Math.min(bitrate, 20)}M`;
      let sizeArg = '';
      if (resolution === '720') sizeArg = '--size 1280x720';
      else if (resolution === '1080') sizeArg = '--size 1920x1080';

      const screenrecordCmd = `"${adbPath}" -s ${serial} shell screenrecord --bit-rate ${bitRateArg} ${sizeArg} --time-limit 1800 "${remoteFile}"`;
      
      const child = exec(screenrecordCmd, (err) => {
        if (err && !err.killed) {
          console.error('[RecorderManager] screenrecord process output:', err.message);
        }
      });

      this.activeRecordings.set(serial, {
        method: 'adb_native',
        process: child,
        remoteFile,
        filePath: destPath,
        fileName,
        startTime: Date.now(),
        adbPath
      });

      return {
        success: true,
        fileName,
        message: 'ضبط سخت‌افزاری صفحه گوشی با کیفیت بالا و فریم‌ریت روان آغاز شد.'
      };
    } catch (err) {
      console.error('[RecorderManager] start error:', err);
      return { success: false, error: err.message };
    }
  }

  // 2. Stop Screen Recording & Pull Perfect Finalized MP4
  async stopScreenRecording(serial) {
    const rec = this.activeRecordings.get(serial);
    if (!rec) {
      return { success: false, error: 'عملیات ضبط فعالی یافت نشد.' };
    }

    try {
      if (rec.method === 'mock') {
        this.activeRecordings.delete(serial);
        // Write mock mp4 file
        fs.writeFileSync(rec.filePath, 'mock mp4 video content');
        return {
          success: true,
          fileName: rec.fileName,
          filePath: rec.filePath,
          message: 'ضبط ویدیو به پایان رسید و فایل MP4 ذخیره شد (شبیه‌ساز).'
        };
      }

      // Native ADB Screenrecord:
      // Send SIGINT (-2) to screenrecord inside Android so it cleanly flushes and writes the MP4 'moov' atom!
      const adbPath = rec.adbPath || (await toolManager.getAdbPath());
      try {
        await execAsync(`"${adbPath}" -s ${serial} shell pkill -2 -f screenrecord`);
      } catch (pkillErr) {
        console.log('[RecorderManager] pkill screenrecord info:', pkillErr.message);
      }

      // Allow Android 1.5s to finish writing the moov header to /sdcard
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Pull the completed, valid MP4 to computer
      try {
        await execAsync(`"${adbPath}" -s ${serial} pull "${rec.remoteFile}" "${rec.filePath}"`);
        // Clean up temporary remote file on phone
        await execAsync(`"${adbPath}" -s ${serial} shell rm -f "${rec.remoteFile}"`);
      } catch (pullErr) {
        console.error('[RecorderManager] pull video error:', pullErr);
      }

      this.activeRecordings.delete(serial);

      // Verify file exists
      if (fs.existsSync(rec.filePath)) {
        const stats = fs.statSync(rec.filePath);
        return {
          success: true,
          fileName: rec.fileName,
          filePath: rec.filePath,
          sizeBytes: stats.size,
          message: `ضبط با موفقیت به پایان رسید و فایل MP4 با حجم ${(stats.size / (1024 * 1024)).toFixed(2)} MB ذخیره گردید.`
        };
      } else {
        return {
          success: false,
          error: 'فایل ویدیو به دلیل زمان ضبط کوتاه یا عدم پاسخ‌دهی انکودر تولید نشد.'
        };
      }
    } catch (err) {
      console.error('[RecorderManager] stop error:', err);
      this.activeRecordings.delete(serial);
      return { success: false, error: err.message };
    }
  }

  getRecordingStatus(serial) {
    const rec = this.activeRecordings.get(serial);
    if (!rec) {
      return { isRecording: false };
    }
    return {
      isRecording: true,
      fileName: rec.fileName,
      elapsedSeconds: Math.floor((Date.now() - rec.startTime) / 1000)
    };
  }

  listRecordings() {
    if (!fs.existsSync(this.recordingsDir)) return [];
    try {
      const files = fs.readdirSync(this.recordingsDir);
      return files
        .filter(f => f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm'))
        .map(f => {
          const full = path.join(this.recordingsDir, f);
          const stats = fs.statSync(full);
          return {
            name: f,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            sizeBytes: stats.size,
            created: stats.birthtime.toLocaleString('fa-IR'),
            path: full
          };
        })
        .reverse();
    } catch (err) {
      console.error('[RecorderManager] Error listing recordings:', err);
      return [];
    }
  }
}

export const recorderManager = new RecorderManager();
