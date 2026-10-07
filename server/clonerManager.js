import { adbManager } from './adbManager.js';

export class ClonerManager {
  async getProfiles(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          users: [
            { id: '0', name: 'پروفایل اصلی (Personal)', isWork: false },
            { id: '10', name: 'پروفایل کاربری دوم (Dual Apps Space)', isWork: true }
          ]
        };
      }

      const res = await adbManager.runAdb('shell pm list users', serial);
      if (!res.success || !res.stdout) return { success: false, users: [] };

      const lines = res.stdout.split('\n');
      const users = [];

      for (const line of lines) {
        const m = line.match(/UserInfo\{(\d+):([^:]+):/);
        if (m) {
          const id = m[1];
          const name = m[2];
          users.push({
            id,
            name: id === '0' ? 'پروفایل اصلی (Personal)' : `${name} (نسخه دوم)`,
            isWork: id !== '0'
          });
        }
      }

      return { success: true, users };
    } catch (e) {
      return { success: false, error: e.message, users: [] };
    }
  }

  async createDualProfile(serial) {
    try {
      const res = await adbManager.runAdb('shell pm create-user --profileOf 0 DualApps', serial);
      if (res.success && res.stdout.includes('Success')) {
        return { success: true, message: 'فضای دوم (Dual Apps Profile) با موفقیت روی گوشی ساخته شد.' };
      }
      return { success: false, error: res.error || res.stdout };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async cloneAppToProfile(serial, { packageName, userId = '10' }) {
    try {
      const res = await adbManager.runAdb(`shell cmd package install-existing --user ${userId} ${packageName}`, serial);
      if (res.success && res.stdout.includes('Installed')) {
        return { success: true, message: `نسخه دوم ${packageName} با موفقیت در فضای دوم فعال شد.` };
      }
      return { success: false, error: res.error || res.stdout };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const clonerManager = new ClonerManager();
