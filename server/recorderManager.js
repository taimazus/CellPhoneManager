import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';

export class RecorderManager {
  constructor() {
    this.activeRecordings = new Map(); // serial -> { process, filePath, fileName, startTime }
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
      console.error('Error loading recorder config:', e);
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
      console.error('Error saving recorder config:', e);
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

  async startScreenRecording(serial, { resolution = '1080', bitrate = 16, captureAudio = true } = {}) {
    const scrcpyPath = await toolManager.getScrcpyPath();
    if (!scrcpyPath) {
      return { success: false, error: 'نرم‌افزار Scrcpy یافت نشد.' };
    }

    if (this.activeRecordings.has(serial)) {
      return { success: false, error: 'یک عملیات ضبط ویدیو در حال حاضر در حال اجراست.' };
    }

    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }

    const fileName = `Recording_${Date.now()}_${serial.replace(/[:.]/g, '_')}.mp4`;
    const destPath = path.join(this.recordingsDir, fileName);

    const args = [
      '-s', serial,
      '--record', destPath,
      '--record-format=mp4',
      '--no-playback' // record in background without creating a mirror window
    ];

    if (resolution === '720') args.push('--max-size=1280');
    if (resolution === '1080') args.push('--max-size=1920');
    if (resolution === '4k') args.push('--max-size=3840');

    args.push(`--video-bit-rate=${bitrate}M`);

    if (captureAudio) {
      args.push('--audio-source=playback'); // Record crystal-clear internal phone sound
      args.push('--audio-codec=aac');
      args.push('--audio-bit-rate=192K');
    } else {
      args.push('--no-audio');
    }

    try {
      const recProcess = spawn(scrcpyPath, args);

      this.activeRecordings.set(serial, {
        process: recProcess,
        filePath: destPath,
        fileName,
        startTime: Date.now()
      });

      recProcess.on('exit', () => {
        this.activeRecordings.delete(serial);
      });

      return {
        success: true,
        fileName,
        message: 'ضبط صفحه و صدای داخلی گوشی با موفقیت آغاز شد.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  stopScreenRecording(serial) {
    const rec = this.activeRecordings.get(serial);
    if (!rec) {
      return { success: false, error: 'عملیات ضبط فعالی یافت نشد.' };
    }

    try {
      rec.process.kill('SIGINT');
      this.activeRecordings.delete(serial);
      return {
        success: true,
        fileName: rec.fileName,
        filePath: rec.filePath,
        message: 'ضبط ویدیو به پایان رسید و فایل MP4 ذخیره شد.'
      };
    } catch (err) {
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
        .filter(f => f.endsWith('.mp4') || f.endsWith('.mkv'))
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
      console.error('Error listing recordings:', err);
      return [];
    }
  }
}

export const recorderManager = new RecorderManager();
