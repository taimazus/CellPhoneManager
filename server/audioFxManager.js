import { spawn } from 'child_process';
import { adbManager } from './adbManager.js';
import { toolManager } from './toolManager.js';
import { mockDeviceManager } from './mockDeviceManager.js';

export class AudioFxManager {
  constructor() {
    this.activeRelays = new Map(); // serial -> { process, mode, startTime }
  }

  async getVolumes(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        volumes: mockDeviceManager.getVolumes(serial)
      };
    }

    try {
      const streams = [
        { id: 3, key: 'media', setting: 'volume_music_speaker' },
        { id: 2, key: 'ring', setting: 'volume_ring_speaker' },
        { id: 4, key: 'alarm', setting: 'volume_alarm_speaker' },
        { id: 5, key: 'notification', setting: 'volume_notification_speaker' },
        { id: 0, key: 'call', setting: 'volume_voice_earpiece' }
      ];

      const volumes = { media: 10, ring: 10, alarm: 15, notification: 8, call: 5 };

      // Strategy 1: cmd media_session volume --stream X --get
      for (const s of streams) {
        const res = await adbManager.runAdb(`shell "cmd media_session volume --stream ${s.id} --get"`, serial);
        if (res.success && res.stdout) {
          const match = res.stdout.match(/volume is (\d+)/i);
          if (match) {
            volumes[s.key] = parseInt(match[1], 10);
            continue;
          }
        }

        // Strategy 2: settings get system volume_*
        const settRes = await adbManager.runAdb(`shell "settings get system ${s.setting}"`, serial);
        if (settRes.success && settRes.stdout && !isNaN(parseInt(settRes.stdout.trim(), 10))) {
          volumes[s.key] = parseInt(settRes.stdout.trim(), 10);
        }
      }

      // Strategy 3: dumpsys audio fallback if everything returned default
      try {
        const dumpsysRes = await adbManager.runAdb('shell "dumpsys audio"', serial);
        if (dumpsysRes.success && dumpsysRes.stdout) {
          const dump = dumpsysRes.stdout;
          const streamMusicMatch = dump.match(/STREAM_MUSIC:[\s\S]*?Current:\s*(\d+)/i) || dump.match(/- STREAM_MUSIC:\s*[\r\n]+(?:\s+.*[\r\n]+)*?\s*Current:\s*(\d+)/i);
          const streamRingMatch = dump.match(/STREAM_RING:[\s\S]*?Current:\s*(\d+)/i);
          const streamAlarmMatch = dump.match(/STREAM_ALARM:[\s\S]*?Current:\s*(\d+)/i);
          const streamNotifMatch = dump.match(/STREAM_NOTIFICATION:[\s\S]*?Current:\s*(\d+)/i);
          const streamCallMatch = dump.match(/STREAM_VOICE_CALL:[\s\S]*?Current:\s*(\d+)/i);

          if (streamMusicMatch) volumes.media = parseInt(streamMusicMatch[1], 10);
          if (streamRingMatch) volumes.ring = parseInt(streamRingMatch[1], 10);
          if (streamAlarmMatch) volumes.alarm = parseInt(streamAlarmMatch[1], 10);
          if (streamNotifMatch) volumes.notification = parseInt(streamNotifMatch[1], 10);
          if (streamCallMatch) volumes.call = parseInt(streamCallMatch[1], 10);
        }
      } catch {
        // Keep volumes from strategy 1 or 2
      }

      return { success: true, volumes };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async setVolume(serial, { stream = 3, level = 15 }) {
    if (serial && serial.startsWith('mock-')) {
      mockDeviceManager.setVolume(serial, stream, level);
      return { success: true, message: `میزان بلندی صدای استریم ${stream} روی سطح ${level} تنظیم شد.`, level };
    }

    try {
      const lvl = Math.max(0, Math.min(15, parseInt(level, 10)));
      
      const streamIdMap = {
        'media': 3,
        'ring': 2,
        'alarm': 4,
        'notification': 5,
        'call': 0
      };
      const actualStreamId = streamIdMap[String(stream).toLowerCase()] !== undefined ? streamIdMap[String(stream).toLowerCase()] : stream;

      // Run modern cmd media_session
      let res = await adbManager.runAdb(`shell "cmd media_session volume --stream ${actualStreamId} --set ${lvl} --show"`, serial);
      
      // Fallback if needed
      if (!res.success || (res.stderr && res.stderr.includes('inaccessible'))) {
        await adbManager.runAdb(`shell "media volume --stream ${actualStreamId} --set ${lvl}"`, serial);
      }

      if (actualStreamId === 3 || stream === 'media') {
        await adbManager.runAdb(`shell "settings put system volume_music_speaker ${lvl}"`, serial);
        await adbManager.runAdb(`shell "settings put system volume_music ${lvl}"`, serial);
      } else if (actualStreamId === 2 || stream === 'ring') {
        await adbManager.runAdb(`shell "settings put system volume_ring_speaker ${lvl}"`, serial);
        await adbManager.runAdb(`shell "settings put system volume_ring ${lvl}"`, serial);
      } else if (actualStreamId === 4 || stream === 'alarm') {
        await adbManager.runAdb(`shell "settings put system volume_alarm_speaker ${lvl}"`, serial);
      } else if (actualStreamId === 5 || stream === 'notification') {
        await adbManager.runAdb(`shell "settings put system volume_notification_speaker ${lvl}"`, serial);
      } else if (actualStreamId === 0 || stream === 'call') {
        await adbManager.runAdb(`shell "settings put system volume_voice_earpiece ${lvl}"`, serial);
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
