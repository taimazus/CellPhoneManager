import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';

export class RecorderManager {
  constructor() {
    this.activeRecordings = new Map(); // serial -> { process, filePath, startTime }
  }

  async startScreenRecording(serial, { resolution = '1080', bitrate = 12, captureAudio = true } = {}) {
    const scrcpyPath = await toolManager.getScrcpyPath();
    if (!scrcpyPath) {
      return { success: false, error: 'نرم‌افزار Scrcpy یافت نشد.' };
    }

    if (this.activeRecordings.has(serial)) {
      return { success: false, error: 'یک عملیات ضبط ویدیو در حال حاضر در حال اجراست.' };
    }

    const recordingsDir = path.join(process.cwd(), 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const fileName = `Recording_${Date.now()}_${serial.replace(/[:.]/g, '_')}.mp4`;
    const destPath = path.join(recordingsDir, fileName);

    const args = [
      '-s', serial,
      '--record', destPath,
      '--record-format=mp4',
      '--no-playback' // record in background without creating a window
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
    const recordingsDir = path.join(process.cwd(), 'recordings');
    if (!fs.existsSync(recordingsDir)) return [];
    const files = fs.readdirSync(recordingsDir);
    return files
      .filter(f => f.endsWith('.mp4') || f.endsWith('.mkv'))
      .map(f => {
        const full = path.join(recordingsDir, f);
        const stats = fs.statSync(full);
        return {
          name: f,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          created: stats.birthtime.toLocaleString('fa-IR')
        };
      })
      .reverse();
  }
}

export const recorderManager = new RecorderManager();
