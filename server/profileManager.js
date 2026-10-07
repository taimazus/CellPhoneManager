import fs from 'fs';
import path from 'path';

export class ProfileManager {
  constructor() {
    this.profilesDir = path.join(process.cwd(), 'data', 'profiles');
    this.snapshotsDir = path.join(process.cwd(), 'data', 'snapshots');
    this.initDirs();
  }

  initDirs() {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
    this.seedDefaultProfiles();
  }

  seedDefaultProfiles() {
    const defaults = [
      {
        id: 'gaming_pro',
        name: 'پروفایل گیمینگ حرفه‌ای (Gaming Pro)',
        description: 'افزایش نرخ نوسازی به ۱۲۰ هرتز، فعال‌سازی ۴x MSAA و شتاب‌دهنده گرافیکی',
        settings: {
          refreshRate: 120,
          animationScale: 0.5,
          forceMsaa: true,
          stayAwake: false,
          showFps: true
        }
      },
      {
        id: 'battery_saver_ultra',
        name: 'حالت ذخیره فوق‌العاده باتری (Eco Power)',
        description: 'کاهش انیمیشن‌ها، حالت تیره اجباری، Doze تهاجمی و نرخ نوسازی ۶۰ هرتز',
        settings: {
          refreshRate: 60,
          animationScale: 0.0,
          darkMode: true,
          dozeMode: true,
          stayAwake: false
        }
      },
      {
        id: 'developer_studio',
        name: 'استودیوی توسعه‌دهندگان (Dev Studio)',
        description: 'نمایش ضربات لمسی، مکان نشانگر، فعال بودن صفحه هنگام شارژ و ثانیه در ساعت',
        settings: {
          showTouches: true,
          pointerLocation: false,
          stayAwake: true,
          clockSeconds: true,
          demoMode: false
        }
      }
    ];

    defaults.forEach(p => {
      const pPath = path.join(this.profilesDir, `${p.id}.json`);
      if (!fs.existsSync(pPath)) {
        fs.writeFileSync(pPath, JSON.stringify(p, null, 2));
      }
    });
  }

  listProfiles() {
    this.initDirs();
    try {
      const files = fs.readdirSync(this.profilesDir);
      const profiles = [];
      for (const f of files) {
        if (f.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(this.profilesDir, f), 'utf8'));
            profiles.push(data);
          } catch (err) {
            console.error('[ProfileManager] Error loading profile:', f, err);
          }
        }
      }
      return { success: true, profiles };
    } catch (err) {
      return { success: false, error: err.message, profiles: [] };
    }
  }

  saveProfile(profile) {
    this.initDirs();
    if (!profile.id || !profile.name) {
      return { success: false, error: 'شناسه و نام پروفایل الزامی است.' };
    }
    const safeId = profile.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const pPath = path.join(this.profilesDir, `${safeId}.json`);
    const payload = {
      ...profile,
      id: safeId,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(pPath, JSON.stringify(payload, null, 2));
    return { success: true, profile: payload, message: 'پروفایل با موفقیت ذخیره شد.' };
  }

  deleteProfile(profileId) {
    const safeId = (profileId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pPath = path.join(this.profilesDir, `${safeId}.json`);
    if (fs.existsSync(pPath)) {
      fs.unlinkSync(pPath);
      return { success: true, message: 'پروفایل حذف شد.' };
    }
    return { success: false, error: 'پروفایل یافت نشد.' };
  }

  calculateDiff(currentSettings, targetSettings) {
    const diff = [];
    for (const key of Object.keys(targetSettings)) {
      const currentVal = currentSettings[key];
      const targetVal = targetSettings[key];
      if (currentVal !== targetVal) {
        diff.push({
          key,
          from: currentVal !== undefined ? currentVal : 'تعریف نشده',
          to: targetVal
        });
      }
    }
    return diff;
  }

  createSnapshot(serial, currentSettings) {
    this.initDirs();
    const safeSerial = (serial || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const snapshotId = `snap_${Date.now()}`;
    const snapPath = path.join(this.snapshotsDir, `${safeSerial}_${snapshotId}.json`);
    const snapshot = {
      snapshotId,
      serial,
      timestamp: new Date().toISOString(),
      settings: currentSettings
    };
    fs.writeFileSync(snapPath, JSON.stringify(snapshot, null, 2));
    return snapshot;
  }

  listSnapshots(serial) {
    this.initDirs();
    const safeSerial = (serial || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      const files = fs.readdirSync(this.snapshotsDir);
      const snaps = [];
      for (const f of files) {
        if (f.startsWith(safeSerial) && f.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, f), 'utf8'));
            snaps.push(data);
          } catch (err) {
            console.error('[ProfileManager] Error reading snapshot:', f, err);
          }
        }
      }
      return { success: true, snapshots: snaps.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) };
    } catch (err) {
      return { success: false, error: err.message, snapshots: [] };
    }
  }
}

export const profileManager = new ProfileManager();
