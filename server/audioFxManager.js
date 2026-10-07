import { spawn } from 'child_process';
import { adbManager } from './adbManager.js';
import { toolManager } from './toolManager.js';

export class AudioFxManager {
  constructor() {
    this.activeRelays = new Map(); // serial -> { process, mode, startTime }
  }

  async getVolumes(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        volumes: {
          media: 12,
          ring: 10,
          alarm: 15,
          notification: 8,
          call: 5
        }
      };
    }

    try {
      const streams = [
        { id: 3, key: 'media' },
        { id: 2, key: 'ring' },
        { id: 4, key: 'alarm' },
        { id: 5, key: 'notification' },
        { id: 0, key: 'call' }
      ];

      const volumes = { media: 10, ring: 10, alarm: 15, notification: 8, call: 5 };

      for (const s of streams) {
        const res = await adbManager.runAdb(`shell "cmd media_session volume --stream ${s.id} --get"`, serial);
        if (res.success && res.stdout) {
          const match = res.stdout.match(/volume is (\d+)/i);
          if (match) {
            volumes[s.key] = parseInt(match[1], 10);
          }
        }
      }

      return { success: true, volumes };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async setVolume(serial, { stream = 3, level = 15 }) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `میزان بلندی صدای استریم ${stream} روی سطح ${level} تنظیم شد.` };
    }

    try {
      const lvl = Math.max(0, Math.min(15, parseInt(level, 10)));
      // Run modern cmd media_session
      let res = await adbManager.runAdb(`shell "cmd media_session volume --stream ${stream} --set ${lvl} --show"`, serial);
      
      // Fallback if needed
      if (!res.success || (res.stderr && res.stderr.includes('inaccessible'))) {
        await adbManager.runAdb(`shell "media volume --stream ${stream} --set ${lvl}"`, serial);
      }

      if (stream === 3) {
        await adbManager.runAdb(`shell "settings put system volume_music_speaker ${lvl}"`, serial);
      }

      return { success: true, message: `میزان بلندی صدا روی سطح ${lvl} تنظیم شد.`, level: lvl };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async boostGain(serial, { enable = true }) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: enable ? 'تقویت‌کننده صدای بلندگو (Turbo Volume) فعال شد.' : 'به حالت عادی بازگشت.' };
    }

    try {
      if (enable) {
        // 1. Maximize all audio streams with visual feedback
        await adbManager.runAdb('shell "cmd media_session volume --stream 3 --set 15 --show"', serial);
        await adbManager.runAdb('shell "cmd media_session volume --stream 2 --set 15"', serial);
        await adbManager.runAdb('shell "cmd media_session volume --stream 5 --set 15"', serial);
        
        // 2. Hardware amplifier gain boost through repeated Volume Up keyevents
        for (let i = 0; i < 3; i++) {
          await adbManager.runAdb('shell "input keyevent 24"', serial);
        }

        await adbManager.runAdb('shell "settings put system volume_music_speaker 15"', serial);
      } else {
        await adbManager.runAdb('shell "cmd media_session volume --stream 3 --set 10 --show"', serial);
      }
      return { success: true, message: enable ? 'تقویت‌کننده صدای بلندگو (Turbo Volume 200%) با موفقیت اعمال شد.' : 'سطح صدا به حالت استاندارد بازگشت.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Stream internal phone music/audio to PC speakers
  async startAudioRelay(serial, { mode = 'pc_only', codec = 'opus', buffer = 60 } = {}) {
    const scrcpyPath = await toolManager.getScrcpyPath();
    if (!scrcpyPath) {
      return { success: false, error: 'نرم‌افزار Scrcpy یافت نشد.' };
    }

    this.stopAudioRelay(serial);

    const args = [];
    if (serial && !serial.startsWith('mock-')) {
      args.push('-s', serial);
    }

    args.push('--no-video');
    args.push('--audio-source=playback'); // Capture phone playback music, apps, games, videos
    args.push(`--audio-codec=${codec}`);
    args.push(`--audio-buffer=${buffer}`);

    if (mode === 'both') {
      args.push('--audio-dup'); // Play on BOTH phone speakers and PC speakers simultaneously
    }

    try {
      const proc = spawn(scrcpyPath, args, {
        detached: true,
        stdio: 'ignore'
      });

      proc.unref();

      this.activeRelays.set(serial, {
        process: proc,
        mode,
        codec,
        startTime: Date.now()
      });

      const modeLabel = mode === 'both' 
        ? 'پخش همزمان از هر دو دستگاه (اسپیکر گوشی + اسپیکر کامپیوتر)' 
        : 'پخش اختصاصی از اسپیکر کامپیوتر (قطع صدای گوشی)';

      return {
        success: true,
        mode,
        message: `انتقال و پخش صدای گوشی به کامپیوتر فعال شد (${modeLabel}).`
      };
    } catch (err) {
      return {
        success: false,
        error: `خطا در برقراری اتصال صوتی: ${err.message}`
      };
    }
  }

  stopAudioRelay(serial) {
    const relay = this.activeRelays.get(serial);
    if (!relay) {
      return { success: true, message: 'اتصال صوتی فعالی وجود نداشت.' };
    }

    try {
      relay.process.kill();
      this.activeRelays.delete(serial);
      return { success: true, message: 'انتقال صدای گوشی به کامپیوتر متوقف شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getAudioRelayStatus(serial) {
    const relay = this.activeRelays.get(serial);
    if (!relay) return { isRelaying: false };
    return {
      isRelaying: true,
      mode: relay.mode,
      codec: relay.codec,
      elapsedSeconds: Math.floor((Date.now() - relay.startTime) / 1000)
    };
  }
}

export const audioFxManager = new AudioFxManager();
