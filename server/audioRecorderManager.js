import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';

export class AudioRecorderManager {
  constructor() {
    this.audioDir = path.join(process.cwd(), 'audio_recordings');
    this.configFile = path.join(process.cwd(), 'audio-config.json');
    this.activeStreams = new Map(); // serial -> { process, filePath, fileName, startTime, isRecording }
    this.loadConfig();
    this.ensureDir();
  }

  ensureDir() {
    try {
      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
      }
      // Migrate legacy root files to audio directory if they exist
      const defaultAudioDir = path.join(process.cwd(), 'audio_recordings');
      if (this.audioDir === defaultAudioDir) {
        const rootFiles = fs.readdirSync(process.cwd())
          .filter(f => f.startsWith('mic_record_') && (f.endsWith('.opus') || f.endsWith('.aac') || f.endsWith('.m4a') || f.endsWith('.mkv')));
        for (const rf of rootFiles) {
          try {
            const oldPath = path.join(process.cwd(), rf);
            const newPath = path.join(defaultAudioDir, rf);
            if (!fs.existsSync(newPath)) {
              fs.renameSync(oldPath, newPath);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error('Error creating audio recordings directory:', e);
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.audioDir && typeof data.audioDir === 'string') {
          this.audioDir = path.resolve(data.audioDir);
        }
      }
    } catch (e) {
      console.error('Error loading audio config:', e);
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(
        this.configFile,
        JSON.stringify({ audioDir: this.audioDir }, null, 2),
        'utf8'
      );
    } catch (e) {
      console.error('Error saving audio config:', e);
    }
  }

  getAudioDir() {
    return this.audioDir;
  }

  setAudioDir(newDir) {
    if (!newDir || typeof newDir !== 'string' || newDir.trim().length === 0) {
      return { success: false, error: 'مسیر انتخاب شده نامعتبر است.' };
    }
    const resolved = path.resolve(newDir.trim());
    try {
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      this.audioDir = resolved;
      this.saveConfig();
      return {
        success: true,
        audioDir: this.audioDir,
        message: 'محل ذخیره‌سازی فایل‌های صوتی با موفقیت تغییر یافت.'
      };
    } catch (err) {
      return { success: false, error: `خطا در ایجاد یا دسترسی به پوشه: ${err.message}` };
    }
  }

  openDirectoryInExplorer(customPath) {
    const targetDir = customPath ? path.resolve(customPath) : this.audioDir;
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      spawn('explorer.exe', [targetDir], { detached: true, stdio: 'ignore' });
      return { success: true, message: 'پوشه فایل‌های صوتی در ویندوز باز شد.' };
    } catch (err) {
      return { success: false, error: `خطا در باز کردن پوشه: ${err.message}` };
    }
  }

  openFileInExplorer(fileName) {
    const safeName = path.basename(fileName);
    const fullPath = path.join(this.audioDir, safeName);
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'فایل صوتی یافت نشد.' };
    }
    try {
      spawn('explorer.exe', ['/select,', fullPath], { detached: true, stdio: 'ignore' });
      return { success: true, message: 'فایل در اکسپلورر نشان داده شد.' };
    } catch (err) {
      return { success: false, error: `خطا در نمایش فایل: ${err.message}` };
    }
  }

  deleteAudio(fileName) {
    const safeName = path.basename(fileName);
    const fullPath = path.join(this.audioDir, safeName);
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'فایل صوتی برای حذف یافت نشد.' };
    }
    try {
      fs.unlinkSync(fullPath);
      return { success: true, message: 'فایل صوتی با موفقیت حذف شد.' };
    } catch (err) {
      return { success: false, error: `خطا در حذف فایل صوتی: ${err.message}` };
    }
  }

  listAudioRecordings() {
    this.ensureDir();
    try {
      const files = fs.readdirSync(this.audioDir);
      return files
        .filter(f => f.endsWith('.opus') || f.endsWith('.aac') || f.endsWith('.m4a') || f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.mkv'))
        .map(f => {
          const full = path.join(this.audioDir, f);
          const stats = fs.statSync(full);
          return {
            name: f,
            size: `${(stats.size / 1024).toFixed(1)} KB`,
            sizeBytes: stats.size,
            created: stats.birthtime.toLocaleString('fa-IR'),
            path: full
          };
        })
        .reverse();
    } catch (err) {
      console.error('Error listing audio recordings:', err);
      return [];
    }
  }

  async startMicStream(serial, options = {}) {
    const scrcpyPath = await toolManager.getScrcpyPath();
    if (!scrcpyPath) {
      return { success: false, error: 'نرم‌افزار Scrcpy یافت نشد.' };
    }

    this.stopMicStream(serial);
    this.ensureDir();

    const args = [];
    if (serial && !serial.startsWith('mock-')) {
      args.push('-s', serial);
    }

    args.push('--no-video');
    args.push(`--audio-source=${options.source || 'mic'}`);

    const codec = options.codec || 'opus';
    args.push(`--audio-codec=${codec}`);

    if (options.bitRate) {
      args.push(`--audio-bit-rate=${options.bitRate}`);
    }

    if (options.buffer) {
      args.push(`--audio-buffer=${options.buffer}`);
    }

    let fileName = null;
    let destPath = null;

    if (options.record) {
      const ext = codec === 'aac' ? 'm4a' : (codec === 'opus' ? 'opus' : 'mkv');
      fileName = `Audio_${Date.now()}_${serial.replace(/[:.]/g, '_')}.${ext}`;
      destPath = path.join(this.audioDir, fileName);
      args.push(`--record=${destPath}`);
    }

    try {
      const proc = spawn(scrcpyPath, args, {
        detached: true,
        stdio: 'ignore'
      });

      proc.unref();

      this.activeStreams.set(serial, {
        process: proc,
        filePath: destPath,
        fileName,
        isRecording: !!options.record,
        startTime: Date.now()
      });

      return {
        success: true,
        fileName,
        isRecording: !!options.record,
        message: options.record 
          ? `ضبط و استریم صدای گوشی آغاز شد و در فایل ذخیره می‌شود.`
          : `استریم زنده صدای گوشی روی کامپیوتر فعال شد.`
      };
    } catch (err) {
      return {
        success: false,
        error: `خطا در اجرای استریم صدا: ${err.message}`
      };
    }
  }

  stopMicStream(serial) {
    const stream = this.activeStreams.get(serial);
    if (!stream) {
      return { success: true, message: 'استریم فعالی وجود نداشت.' };
    }

    try {
      stream.process.kill();
      this.activeStreams.delete(serial);
      return {
        success: true,
        fileName: stream.fileName,
        message: stream.isRecording ? 'ضبط صدا پایان یافت و فایل روی سیستم ذخیره شد.' : 'استریم میکروفون متوقف شد.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getStatus(serial) {
    const stream = this.activeStreams.get(serial);
    if (!stream) return { isStreaming: false, isRecording: false };
    return {
      isStreaming: true,
      isRecording: stream.isRecording,
      fileName: stream.fileName,
      elapsedSeconds: Math.floor((Date.now() - stream.startTime) / 1000)
    };
  }
}

export const audioRecorderManager = new AudioRecorderManager();
