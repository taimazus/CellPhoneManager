import { spawn } from 'child_process';
import path from 'path';
import { toolManager } from './toolManager.js';

export class MirrorManager {
  constructor() {
    this.activeProcesses = new Map();
  }

  async startScrcpy(serial, options = {}) {
    const scrcpyPath = await toolManager.getScrcpyPath();
    const args = [];

    if (serial && !serial.startsWith('mock-')) {
      args.push('-s', serial);
    }

    if (options.turnScreenOff) {
      args.push('--turn-screen-off');
    }

    if (options.stayOnTop) {
      args.push('--always-on-top');
    }

    if (options.maxFps) {
      args.push('--max-fps', options.maxFps.toString());
    }

    if (options.bitRate) {
      args.push('--video-bit-rate', options.bitRate.toString());
    }

    if (options.recordPath) {
      args.push('--record', options.recordPath);
    }

    // Audio safety handling:
    // Screen mirroring must never hijack phone audio or mute it on device!
    if (options.forwardAudio || options.enableAudio) {
      args.push('--audio-dup'); // Forward to PC and duplicate on phone so phone is never muted
    } else {
      args.push('--no-audio'); // Completely disable scrcpy audio capture to keep in-call audio safe
    }

    // Direct Unicode text forwarding for Persian and multilingual typing
    args.push('--prefer-text');

    try {
      const proc = spawn(scrcpyPath, args, {
        detached: true,
        stdio: 'ignore'
      });

      proc.unref();
      this.activeProcesses.set(serial, proc);

      return {
        success: true,
        message: 'اسکرین میرورینگ Scrcpy با موفقیت روی ویندوز اجرا شد',
        pid: proc.pid
      };
    } catch (err) {
      return {
        success: false,
        error: `خطا در اجرای Scrcpy: ${err.message}`
      };
    }
  }

  async startCameraWebcam(serial, options = {}) {
    // Clean up any existing stream process for this device first
    this.stopScrcpy(serial);

    const adbPath = await toolManager.getAdbPath();
    const scrcpyPath = await toolManager.getScrcpyPath();

    // Release any camera locks on the phone (close camera app if open)
    if (serial && !serial.startsWith('mock-')) {
      try {
        await execAsync(`"${adbPath}" -s ${serial} shell "am force-stop com.android.camera; am force-stop com.google.android.GoogleCamera; input keyevent 3"`);
      } catch (e) {
        console.warn('Error releasing camera app lock:', e.message);
      }
    }

    const args = [];

    if (serial && !serial.startsWith('mock-')) {
      args.push('-s', serial);
    }

    // Direct camera source mode (requires --no-audio on Android 12+)
    args.push('--video-source=camera');
    args.push('--no-audio');
    
    const isFront = options.facing === 'front';
    args.push(`--camera-facing=${isFront ? 'front' : 'back'}`);

    if (options.cameraSize) {
      args.push(`--camera-size=${options.cameraSize}`); // e.g. 1920x1080
    } else {
      args.push('--camera-size=1920x1080');
    }

    if (options.cameraFps) {
      args.push(`--camera-fps=${options.cameraFps}`);
    } else {
      args.push('--camera-fps=30');
    }

    if (options.highSpeed && options.cameraFps > 30) {
      args.push('--camera-high-speed');
    }

    if (options.stayOnTop) {
      args.push('--always-on-top');
    }

    const winTitle = isFront ? 'Sahand HD Webcam (Selfie)' : 'Sahand HD Webcam (Back)';
    args.push(`--window-title=${winTitle}`);

    if (options.orientation !== undefined && options.orientation !== null) {
      args.push(`--orientation=${options.orientation}`);
    }

    if (options.recordPath) {
      args.push('--record', options.recordPath);
    }

    try {
      const proc = spawn(scrcpyPath, args, {
        detached: true,
        stdio: 'ignore'
      });

      proc.unref();
      this.activeProcesses.set(`cam_${serial}`, proc);

      return {
        success: true,
        message: `وب‌کم اختصاصی ${isFront ? 'سلفی (جلو)' : 'اصلی (پشت)'} با کیفیت 1080p با موفقیت در ویندوز باز شد`,
        pid: proc.pid
      };
    } catch (err) {
      return {
        success: false,
        error: `خطا در اجرای وب‌کم دوربین: ${err.message}`
      };
    }
  }

  async startMicStream(serial, options = {}) {
    const scrcpyPath = await toolManager.getScrcpyPath();
    const args = [];

    if (serial && !serial.startsWith('mock-')) {
      args.push('-s', serial);
    }

    // No video forwarding, audio only from mic or playback
    args.push('--no-video');
    args.push(`--audio-source=${options.source || 'mic'}`); // 'mic' or 'playback'

    if (options.codec) {
      args.push(`--audio-codec=${options.codec}`); // 'opus', 'aac', 'raw'
    } else {
      args.push('--audio-codec=opus');
    }

    if (options.bitRate) {
      args.push(`--audio-bit-rate=${options.bitRate}`);
    }

    if (options.buffer) {
      args.push(`--audio-buffer=${options.buffer}`); // e.g. 20ms
    }

    if (options.recordPath) {
      args.push(`--record=${options.recordPath}`);
    }

    try {
      const proc = spawn(scrcpyPath, args, {
        detached: true,
        stdio: 'ignore'
      });

      proc.unref();
      this.activeProcesses.set(`mic_${serial}`, proc);

      return {
        success: true,
        message: `استریم میکروفون گوشی (${options.source === 'playback' ? 'صدای داخلی سیستم' : 'میکروفون اصلی'}) فعال شد`,
        pid: proc.pid
      };
    } catch (err) {
      return {
        success: false,
        error: `خطا در اجرای استریم صدا/میکروفون: ${err.message}`
      };
    }
  }

  stopScrcpy(serial) {
    let killed = false;
    ['cam_' + serial, 'mic_' + serial, serial].forEach(key => {
      if (this.activeProcesses.has(key)) {
        const proc = this.activeProcesses.get(key);
        try {
          proc.kill();
          killed = true;
        } catch (e) {
          console.error('Error killing process:', e);
        }
        this.activeProcesses.delete(key);
      }
    });
    return { success: true, message: killed ? 'پروسه استریم متوقف شد' : 'پروسه‌ای در حال اجرا نبود' };
  }
}

export const mirrorManager = new MirrorManager();
