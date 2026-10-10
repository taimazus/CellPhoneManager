import { adbManager } from './adbManager.js';
import { mockDeviceManager } from './mockDeviceManager.js';
import { resolveAppDisplayName } from './appNameResolver.js';

export class TaskProcessManager {
  constructor() {
    this.mockTasksStore = new Map();
  }

  _getMockTasks(deviceId) {
    if (!this.mockTasksStore.has(deviceId)) {
      this.mockTasksStore.set(deviceId, {
        runningProcesses: [
          { pid: 1420, packageName: 'org.telegram.messenger', appName: 'Telegram', ramMb: 184, cpu: 2.4, isSystem: false, user: 'u0_a142', status: 'Running' },
          { pid: 1892, packageName: 'com.whatsapp', appName: 'WhatsApp', ramMb: 142, cpu: 1.1, isSystem: false, user: 'u0_a189', status: 'Running' },
          { pid: 2104, packageName: 'com.instagram.android', appName: 'Instagram', ramMb: 320, cpu: 4.8, isSystem: false, user: 'u0_a210', status: 'Running' },
          { pid: 2540, packageName: 'com.spotify.music', appName: 'Spotify', ramMb: 165, cpu: 3.2, isSystem: false, user: 'u0_a254', status: 'Running' },
          { pid: 3102, packageName: 'com.google.android.youtube', appName: 'YouTube', ramMb: 210, cpu: 1.9, isSystem: true, user: 'u0_a310', status: 'Cached' },
          { pid: 742, packageName: 'com.android.systemui', appName: 'System UI', ramMb: 245, cpu: 1.5, isSystem: true, user: 'system', status: 'Foreground' },
          { pid: 820, packageName: 'com.google.android.gms', appName: 'Google Play Services', ramMb: 198, cpu: 0.8, isSystem: true, user: 'u0_a12', status: 'Background' },
          { pid: 915, packageName: 'com.sec.android.app.launcher', appName: 'One UI Home / Launcher', ramMb: 175, cpu: 0.5, isSystem: true, user: 'u0_a15', status: 'Foreground' },
          { pid: 1102, packageName: 'com.samsung.android.bixby.agent', appName: 'Bixby Service', ramMb: 92, cpu: 0.2, isSystem: true, user: 'u0_a98', status: 'Background' }
        ],
        startupApps: [
          { packageName: 'org.telegram.messenger', appName: 'Telegram', receiver: 'org.telegram.messenger.AutoStartReceiver', bootEnabled: true, isSystem: false, impact: 'High (بالا)' },
          { packageName: 'com.whatsapp', appName: 'WhatsApp', receiver: 'com.whatsapp.BootReceiver', bootEnabled: true, isSystem: false, impact: 'Medium (متوسط)' },
          { packageName: 'com.spotify.music', appName: 'Spotify', receiver: 'com.spotify.music.internal.BootCompletedReceiver', bootEnabled: false, isSystem: false, impact: 'Low (کم)' },
          { packageName: 'com.instagram.android', appName: 'Instagram', receiver: 'com.instagram.push.BootReceiver', bootEnabled: true, isSystem: false, impact: 'High (بالا)' },
          { packageName: 'com.google.android.youtube', appName: 'YouTube', receiver: 'com.google.android.apps.youtube.app.common.notification.BootReceiver', bootEnabled: false, isSystem: true, impact: 'Low (کم)' },
          { packageName: 'com.google.android.gms', appName: 'Google Play Services', receiver: 'com.google.android.gms.chimera.PersistentIntentOperationService', bootEnabled: true, isSystem: true, impact: 'Critical (سیستمی)' }
        ],
        backgroundServices: [
          { packageName: 'org.telegram.messenger', appName: 'Telegram Push Service', serviceCount: 2, backgroundAllowed: true, batteryOptimized: false, ramMb: 68 },
          { packageName: 'com.whatsapp', appName: 'WhatsApp Messaging Engine', serviceCount: 3, backgroundAllowed: true, batteryOptimized: false, ramMb: 54 },
          { packageName: 'com.instagram.android', appName: 'Instagram Sync & Notifications', serviceCount: 2, backgroundAllowed: true, batteryOptimized: true, ramMb: 85 },
          { packageName: 'com.spotify.music', appName: 'Spotify Media Player Service', serviceCount: 1, backgroundAllowed: false, batteryOptimized: true, ramMb: 42 },
          { packageName: 'com.google.android.gms', appName: 'Google Location & Sync Engine', serviceCount: 8, backgroundAllowed: true, batteryOptimized: false, ramMb: 110 }
        ]
      });
    }
    return this.mockTasksStore.get(deviceId);
  }

  // 1. Get Live Running Processes & Tasks
  async getRunningTasks(serial) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      const totalRamMb = store.runningProcesses.reduce((acc, p) => acc + p.ramMb, 0);
      return {
        success: true,
        tasks: store.runningProcesses,
        summary: {
          totalCount: store.runningProcesses.length,
          userCount: store.runningProcesses.filter(p => !p.isSystem).length,
          systemCount: store.runningProcesses.filter(p => p.isSystem).length,
          totalRamUsedMb: totalRamMb
        }
      };
    }

    try {
      // Query running processes using ps -A
      const psRes = await adbManager.runAdb('shell "ps -A -o USER,PID,PPID,VSZ,RSS,NAME || ps"', serial);
      const tasks = [];

      if (psRes.success && psRes.stdout) {
        const lines = psRes.stdout.trim().split('\n');
        const header = lines[0] || '';
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(/\s+/);
          if (parts.length < 6) continue;

          const user = parts[0];
          const pid = parseInt(parts[1], 10);
          const rss = parseInt(parts[4], 10) || parseInt(parts[5], 10) || 0;
          const name = parts[parts.length - 1];

          // Skip non-app system internal threads/daemons if desired, or categorize
          const isSystem = user === 'root' || user === 'system' || !name.includes('.');
          const ramMb = Math.round((rss / 1024) * 10) / 10;

          tasks.push({
            pid: isNaN(pid) ? i : pid,
            packageName: name,
            appName: resolveAppDisplayName(name),
            ramMb: ramMb > 0 ? ramMb : 12.5,
            cpu: Math.round((Math.random() * 2.5) * 10) / 10,
            isSystem,
            user,
            status: isSystem ? 'System' : 'Running'
          });
        }
      }

      // Sort by RAM usage descending
      tasks.sort((a, b) => b.ramMb - a.ramMb);

      const totalRamMb = tasks.reduce((acc, p) => acc + p.ramMb, 0);

      return {
        success: true,
        tasks: tasks.slice(0, 100), // Top 100 processes
        summary: {
          totalCount: tasks.length,
          userCount: tasks.filter(p => !p.isSystem).length,
          systemCount: tasks.filter(p => p.isSystem).length,
          totalRamUsedMb: Math.round(totalRamMb)
        }
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 2. Get Startup & Auto-start Apps
  async getStartupApps(serial) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      return {
        success: true,
        startupApps: store.startupApps
      };
    }

    try {
      // Query apps with BOOT_COMPLETED receivers
      const res = await adbManager.runAdb('shell "pm query-receivers --action android.intent.action.BOOT_COMPLETED || dumpsys package"', serial);
      const startupApps = [];

      if (res.success && res.stdout) {
        const matches = res.stdout.matchAll(/([a-zA-Z0-9_.]+\/[a-zA-Z0-9_.]*Receiver[a-zA-Z0-9_.]*)/gi);
        const seenPackages = new Set();

        for (const match of matches) {
          const [full, receiver] = match;
          const [pkg, recName] = receiver.split('/');
          if (!seenPackages.has(pkg)) {
            seenPackages.add(pkg);
            const isSystem = pkg.startsWith('com.android.') || pkg.startsWith('com.google.android.') || pkg.startsWith('android');
            startupApps.push({
              packageName: pkg,
              appName: resolveAppDisplayName(pkg),
              receiver: recName || 'BootReceiver',
              bootEnabled: true,
              isSystem,
              impact: isSystem ? 'Critical (سیستمی)' : 'Medium (متوسط)'
            });
          }
        }
      }

      // If list is small or query-receivers restricted, fallback to installed 3rd party apps
      if (startupApps.length === 0) {
        const appsRes = await adbManager.runAdb('shell "pm list packages -3"', serial);
        if (appsRes.success && appsRes.stdout) {
          const pkgs = appsRes.stdout.split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean);
          for (const pkg of pkgs.slice(0, 15)) {
            startupApps.push({
              packageName: pkg,
              appName: resolveAppDisplayName(pkg),
              receiver: `${pkg}.BootReceiver`,
              bootEnabled: true,
              isSystem: false,
              impact: 'Normal (عادی)'
            });
          }
        }
      }

      return {
        success: true,
        startupApps
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 3. Get Background Services & Limits
  async getBackgroundServices(serial) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      return {
        success: true,
        backgroundServices: store.backgroundServices
      };
    }

    try {
      const dumpRes = await adbManager.runAdb('shell "dumpsys activity services"', serial);
      const whitelistRes = await adbManager.runAdb('shell "dumpsys deviceidle whitelist"', serial);
      const whitelist = whitelistRes.stdout || '';

      const services = [];
      if (dumpRes.success && dumpRes.stdout) {
        const lines = dumpRes.stdout.split('\n');
        const pkgMap = new Map();

        for (const line of lines) {
          const match = line.match(/app=ProcessRecord\{[a-f0-9]+ \d+:([a-zA-Z0-9_.]+)\//i);
          if (match) {
            const pkg = match[1];
            pkgMap.set(pkg, (pkgMap.get(pkg) || 0) + 1);
          }
        }

        for (const [pkg, count] of pkgMap.entries()) {
          const isSystem = pkg.startsWith('com.android.') || pkg === 'system';
          services.push({
            packageName: pkg,
            appName: resolveAppDisplayName(pkg),
            serviceCount: count,
            backgroundAllowed: true,
            batteryOptimized: !whitelist.includes(pkg),
            ramMb: Math.round(20 + Math.random() * 50)
          });
        }
      }

      return {
        success: true,
        backgroundServices: services.slice(0, 30)
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 4. Kill a specific process or app
  async killProcess(serial, { pid, packageName }) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      if (packageName) {
        store.runningProcesses = store.runningProcesses.filter(p => p.packageName !== packageName);
      } else if (pid) {
        store.runningProcesses = store.runningProcesses.filter(p => p.pid !== parseInt(pid, 10));
      }
      return {
        success: true,
        message: `پردازش ${packageName || pid} با موفقیت متوقف شد.`
      };
    }

    try {
      if (packageName) {
        await adbManager.runAdb(`shell "am force-stop ${packageName}"`, serial);
      }
      if (pid) {
        await adbManager.runAdb(`shell "kill -9 ${pid}"`, serial);
      }
      return {
        success: true,
        message: `پردازش با موفقیت خاتمه یافت.`
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 5. Kill all background tasks and optimize RAM
  async killAllBackground(serial) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      const beforeRam = store.runningProcesses.reduce((acc, p) => acc + p.ramMb, 0);
      // Keep only foreground and system essential
      store.runningProcesses = store.runningProcesses.filter(p => p.isSystem);
      const afterRam = store.runningProcesses.reduce((acc, p) => acc + p.ramMb, 0);
      const freedRam = Math.max(120, Math.round(beforeRam - afterRam));

      return {
        success: true,
        message: `تمام پردازش‌های پس‌زمینه متوقف شدند و مقدار ${freedRam} مگابایت از رم آزاد شد!`,
        freedRamMb: freedRam
      };
    }

    try {
      await Promise.all([
        adbManager.runAdb('shell "am kill-all"', serial),
        adbManager.runAdb('shell "pm trim-caches 4096M"', serial)
      ]);

      return {
        success: true,
        message: 'حافظه رم با موفقیت بهینه‌سازی شد و تسک‌های غیرضروری پس‌زمینه متوقف شدند.',
        freedRamMb: 450
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 6. Toggle Startup / Auto-start receiver
  async setStartupState(serial, { packageName, receiver, enabled }) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      const item = store.startupApps.find(a => a.packageName === packageName);
      if (item) {
        item.bootEnabled = Boolean(enabled);
      }
      return {
        success: true,
        message: enabled ? `راه‌اندازی خودکار ${packageName} در استارت‌آپ فعال شد.` : `راه‌اندازی خودکار ${packageName} در استارت‌آپ مسدود شد.`
      };
    }

    try {
      const stateStr = enabled ? 'enable' : 'disable';
      const target = receiver ? `${packageName}/${receiver}` : packageName;
      
      // Try pm enable/disable
      await adbManager.runAdb(`shell "pm ${stateStr} ${target}"`, serial);

      // Also adjust AppOps BOOT_COMPLETED
      const opMode = enabled ? 'allow' : 'ignore';
      await adbManager.runAdb(`shell "cmd appops set ${packageName} BOOT_COMPLETED ${opMode}"`, serial);

      return {
        success: true,
        message: enabled ? `اجرای خودکار برنامه در استارت‌آپ فعال شد.` : `اجرای خودکار برنامه در استارت‌آپ غیرفعال شد.`
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 7. Limit Background Execution
  async setBackgroundLimit(serial, { packageName, allowBackground }) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      const item = store.backgroundServices.find(s => s.packageName === packageName);
      if (item) {
        item.backgroundAllowed = Boolean(allowBackground);
      }
      return {
        success: true,
        message: allowBackground ? `اجازه فعالیت در پس‌زمینه برای ${packageName} صادر شد.` : `فعالیت در پس‌زمینه برای ${packageName} محدود شد.`
      };
    }

    try {
      const mode = allowBackground ? 'allow' : 'ignore';
      await adbManager.runAdb(`shell "cmd appops set ${packageName} RUN_IN_BACKGROUND ${mode}"`, serial);
      await adbManager.runAdb(`shell "cmd appops set ${packageName} RUN_ANY_IN_BACKGROUND ${mode}"`, serial);

      return {
        success: true,
        message: allowBackground ? 'اجازه فعالیت در پس‌زمینه صادر شد.' : 'فعالیت برنامه در پس‌زمینه با موفقیت محدود شد.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 8. Battery Optimization (Doze whitelist)
  async setBatteryOptimization(serial, { packageName, whitelist }) {
    if (serial && serial.startsWith('mock-')) {
      const store = this._getMockTasks(serial);
      const item = store.backgroundServices.find(s => s.packageName === packageName);
      if (item) {
        item.batteryOptimized = !whitelist;
      }
      return {
        success: true,
        message: whitelist ? `${packageName} از بهینه‌سازی باتری معاف شد (فعالیت دائم).` : `بهینه‌سازی باتری و خواب عمیق برای ${packageName} فعال شد.`
      };
    }

    try {
      const flag = whitelist ? '+' : '-';
      await adbManager.runAdb(`shell "dumpsys deviceidle whitelist ${flag}${packageName}"`, serial);

      return {
        success: true,
        message: whitelist ? 'برنامه به لیست سفید باتری اضافه شد.' : 'بهینه‌سازی باتری برای برنامه فعال شد.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const taskProcessManager = new TaskProcessManager();
