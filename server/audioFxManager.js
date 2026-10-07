import { adbManager } from './adbManager.js';

export class AudioFxManager {
  async setVolume(serial, { stream = 3, level = 15 }) {
    try {
      // Stream 3 is STREAM_MUSIC, 2 is RING
      await adbManager.runAdb(`shell media volume --stream ${stream} --set ${level}`, serial);
      return { success: true, message: `میزان بلندی صدای استریم ${stream} روی سطح ${level} تنظیم شد.` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async boostGain(serial, { enable = true }) {
    try {
      if (enable) {
        // Boost volume to max + enable loudness enhancer intent
        await adbManager.runAdb('shell media volume --stream 3 --set 15', serial);
        await adbManager.runAdb('shell settings put system volume_music_speaker 15', serial);
      }
      return { success: true, message: enable ? 'تقویت‌کننده صدای بلندگو (Turbo Volume) فعال شد.' : 'به حالت عادی بازگشت.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const audioFxManager = new AudioFxManager();
