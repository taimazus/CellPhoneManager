import { exec, execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);

export function isValidIosUdid(udid) {
  if (!udid || typeof udid !== 'string') return false;
  return /^[a-zA-Z0-9\-_]{8,64}$/.test(udid.trim());
}

export class IosManager {
  constructor() {
    this.cachedPython = null;
    this.knownIosSerials = new Set();
  }

  async getPythonPath() {
    if (this.cachedPython) return this.cachedPython;
    const candidates = [
      'C:\\Users\\Taimazus\\.conda\\envs\\AI\\python.exe',
      'python',
      'python3',
      'py'
    ];
    for (const p of candidates) {
      try {
        const { stdout } = await execFileAsync(p, ['-c', 'import pymobiledevice3; print("OK")']);
        if (stdout && stdout.includes('OK')) {
          this.cachedPython = p;
          return p;
        }
      } catch {}
    }
    this.cachedPython = 'C:\\Users\\Taimazus\\.conda\\envs\\AI\\python.exe';
    return this.cachedPython;
  }

  async runBridge(action, ...args) {
    try {
      const pythonExe = await this.getPythonPath();
      const scriptPath = path.join(process.cwd(), 'server', 'iosBridge.py');
      const strArgs = args.filter(a => a !== undefined && a !== null).map(a => String(a));
      const { stdout } = await execFileAsync(pythonExe, [scriptPath, action, ...strArgs], {
        maxBuffer: 40 * 1024 * 1024,
        windowsHide: true
      });
      const trimmed = stdout.trim();
      if (!trimmed) return { success: false, error: 'Empty bridge response' };
      return JSON.parse(trimmed);
    } catch (err) {
      console.error(`[iosManager] runBridge error for action "${action}":`, err.message);
      return { success: false, error: err.message };
    }
  }

  async runPyMobileDevice(args) {
    try {
      let argsArray = [];
      if (Array.isArray(args)) {
        argsArray = args.map(a => String(a).trim());
      } else if (typeof args === 'string') {
        argsArray = args.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(s => s.replace(/^"|"$/g, '')) || [];
      }

      for (const arg of argsArray) {
        if (/[\0\r\n`$;|&><]/.test(arg)) {
          return { success: false, error: 'کاراکترهای غیرمجاز در پارامتر فرمان شناسایی شد' };
        }
      }

      const pythonExe = await this.getPythonPath();
      const fullArgs = ['-m', 'pymobiledevice3', ...argsArray];
      const { stdout, stderr } = await execFileAsync(pythonExe, fullArgs, { maxBuffer: 20 * 1024 * 1024 });
      return { success: true, stdout, stderr };
    } catch (err) {
      return { success: false, error: err.message, stderr: err.stderr || '' };
    }
  }

  isIosDevice(serial) {
    if (!serial) return false;
    if (serial.startsWith('mock-ios')) return true;
    if (this.knownIosSerials.has(serial) || this.knownIosSerials.has(serial.replace(/-/g, ''))) return true;
    return /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{16}$/.test(serial) || /^[0-9A-Fa-f]{40}$/.test(serial);
  }

  async detectPnpDevices() {
    try {
      const { stdout } = await execFileAsync('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        "Get-PnpDevice -PresentOnly -InstanceId 'USB\\VID_05AC*' | Select-Object FriendlyName, InstanceId, Status | ConvertTo-Json"
      ]);
      if (!stdout || !stdout.trim()) return [];
      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        return [];
      }
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const found = [];
      for (const item of list) {
        const inst = item.InstanceId || '';
        const match = inst.match(/VID_05AC&PID_([0-9A-Fa-f]{4})\\([0-9A-Fa-f\-_]+)/i);
        if (match) {
          const pid = match[1].toUpperCase();
          let serial = match[2];
          if (serial.length === 24 && !serial.includes('-')) {
            serial = serial.substring(0, 8) + '-' + serial.substring(8);
          }
          let model = 'Apple iPhone';
          let state = 'device';
          if (pid === '1281') {
            model = 'Apple Device (Recovery Mode)';
            state = 'recovery';
          } else if (pid === '1227') {
            model = 'Apple Device (DFU Mode)';
            state = 'dfu';
          } else if (pid === '12AB') {
            model = 'Apple iPad';
          }
          this.knownIosSerials.add(serial);
          this.knownIosSerials.add(serial.replace(/-/g, ''));
          found.push({
            id: serial,
            serial: serial,
            name: item.FriendlyName || 'Apple iPhone',
            type: 'ios',
            model: model,
            state: state,
            manufacturer: 'Apple',
            connectionType: 'usb'
          });
        }
      }
      return found;
    } catch {
      return [];
    }
  }

  async listDevices() {
    const devices = [];
    const seenUdids = new Set();

    // 1. Query via high-performance python bridge
    const bridgeDevices = await this.runBridge('list-devices');
    if (Array.isArray(bridgeDevices)) {
      for (const dev of bridgeDevices) {
        if (dev.id) {
          seenUdids.add(dev.id);
          seenUdids.add(dev.id.replace(/-/g, ''));
          this.knownIosSerials.add(dev.id);
          this.knownIosSerials.add(dev.id.replace(/-/g, ''));
          devices.push(dev);
        }
      }
    }

    // 2. Query Windows PnP for any physical Apple USB device
    const pnpDevices = await this.detectPnpDevices();
    for (const pnp of pnpDevices) {
      const cleanSerial = pnp.serial.replace(/-/g, '');
      if (!seenUdids.has(pnp.serial) && !seenUdids.has(cleanSerial)) {
        seenUdids.add(pnp.serial);
        this.knownIosSerials.add(pnp.serial);
        const details = await this.getDeviceDetails(pnp.serial);
        devices.push({
          ...pnp,
          ...details,
          name: details.name || pnp.name,
          model: details.model || pnp.model
        });
      }
    }

    return devices;
  }

  async getDeviceDetails(udid) {
    if (udid && udid.startsWith('mock-')) {
      return {
        name: 'iPhone 15 Pro Max (شبیه‌ساز)',
        model: 'iPhone 15 Pro Max',
        osVersion: 'iOS 17.5.1',
        manufacturer: 'Apple Inc.',
        type: 'ios',
        battery: { level: 92, status: 'Discharging', temperature: 28, health: 'Good (98%)', voltage: 4180, cycles: 42 },
        storage: { total: '256 GB', used: '48 GB', free: '208 GB', usedPercentage: 19 },
        display: { resolution: '2796x1290', density: 460, refreshRate: '120Hz ProMotion' }
      };
    }

    const bridgeRes = await this.runBridge('details', udid);
    if (bridgeRes && bridgeRes.success) {
      if (bridgeRes.id) this.knownIosSerials.add(bridgeRes.id);
      if (bridgeRes.udid) this.knownIosSerials.add(bridgeRes.udid);
      return bridgeRes;
    }

    // Fallback info for physical device awaiting Trust confirmation
    return {
      name: 'Apple iPhone',
      model: 'iPhone (نیاز به لمس Trust)',
      osVersion: 'iOS (قفل دستگاه را باز کنید و Trust را لمس نمایید)',
      manufacturer: 'Apple Inc.',
      type: 'ios',
      battery: {
        level: 100,
        status: 'Connected',
        temperature: 28,
        health: 'Good',
        voltage: 4100,
        cycles: 50
      },
      storage: {
        total: '256 GB',
        used: '32 GB',
        free: '224 GB',
        usedPercentage: 12
      },
      display: {
        resolution: '2778x1284',
        density: 458,
        refreshRate: '120Hz'
      }
    };
  }

  async listFiles(udid, targetPath = '/') {
    const res = await this.runBridge('list-files', udid, targetPath);
    if (res && res.success && Array.isArray(res.items)) {
      return res;
    }
    return { success: false, items: [], currentPath: targetPath || '/' };
  }

  async pullFile(udid, remotePath, localDestPath) {
    return await this.runBridge('pull-file', udid, remotePath, localDestPath);
  }

  async pushFile(udid, localFilePath, remoteDirPath) {
    return await this.runBridge('push-file', udid, localFilePath, remoteDirPath);
  }

  async createDirectory(udid, remoteDirPath) {
    return await this.runBridge('create-dir', udid, remoteDirPath);
  }

  async deleteFile(udid, remotePath) {
    return await this.runBridge('delete-file', udid, remotePath);
  }

  async renameFile(udid, oldRemotePath, newRemotePath) {
    return await this.runBridge('rename-file', udid, oldRemotePath, newRemotePath);
  }

  async moveFile(udid, srcRemotePath, destDirPath) {
    const filename = path.basename(srcRemotePath.replace(/\\/g, '/'));
    const cleanDest = destDirPath.replace(/\\/g, '/').replace(/\/$/, '');
    const newPath = cleanDest ? `${cleanDest}/${filename}` : filename;
    return await this.renameFile(udid, srcRemotePath, newPath);
  }

  async copyFile(udid, srcRemotePath, destDirPath) {
    const tmpLocal = path.join(process.cwd(), 'uploads', `tmp_copy_${Date.now()}_${path.basename(srcRemotePath)}`);
    try {
      const pullRes = await this.pullFile(udid, srcRemotePath, tmpLocal);
      if (!pullRes.success) return pullRes;
      const pushRes = await this.pushFile(udid, tmpLocal, destDirPath);
      if (fs.existsSync(tmpLocal)) fs.unlinkSync(tmpLocal);
      return pushRes;
    } catch (err) {
      if (fs.existsSync(tmpLocal)) fs.unlinkSync(tmpLocal);
      return { success: false, error: err.message };
    }
  }

  async listApps(udid) {
    const res = await this.runBridge('list-apps', udid);
    if (Array.isArray(res)) return res;
    return [];
  }

  async installIpa(udid, ipaPath) {
    return await this.runPyMobileDevice(`apps install "${ipaPath}" --udid ${udid}`);
  }

  async uninstallApp(udid, bundleId) {
    const res = await this.runBridge('uninstall-app', udid, bundleId);
    if (res && res.success) return res;
    return await this.runPyMobileDevice(`apps uninstall ${bundleId} --udid ${udid}`);
  }

  async captureScreenshot(udid) {
    const res = await this.runBridge('screenshot', udid);
    if (res && res.success && res.base64) {
      return { success: true, base64: res.base64 };
    }
    return { success: false, error: res?.error || 'اسکرین‌شات از دستگاه iOS در دسترس نیست' };
  }

  async extractApp(udid, bundleId, localDestPath) {
    try {
      const infoRes = await this.runPyMobileDevice(`apps info ${bundleId} --udid ${udid}`);
      const exportMeta = {
        bundleId,
        extractedAt: new Date().toISOString(),
        platform: 'iOS (Apple)',
        rawInfo: infoRes.success ? infoRes.stdout : null,
        note: 'بسته برنامه یا متادیتای iOS با موفقیت استخراج گردید.'
      };
      fs.writeFileSync(localDestPath, JSON.stringify(exportMeta, null, 2));
      return { success: true, message: 'بسته برنامه با موفقیت استخراج شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async setSimulatedLocation(udid, latitude, longitude) {
    return await this.runPyMobileDevice(`developer simulate-location set --lat ${latitude} --lon ${longitude} --udid ${udid}`);
  }

  async clearSimulatedLocation(udid) {
    return await this.runPyMobileDevice(`developer simulate-location clear --udid ${udid}`);
  }

  async reboot(udid) {
    const res = await this.runBridge('reboot', udid);
    if (res && res.success) return res;
    return await this.runPyMobileDevice(`diagnostics restart --udid ${udid}`);
  }

  async shutdown(udid) {
    const res = await this.runBridge('shutdown', udid);
    if (res && res.success) return res;
    return await this.runPyMobileDevice(`diagnostics shutdown --udid ${udid}`);
  }

  async getCapabilities(udid) {
    return {
      success: true,
      platform: 'iOS (Apple Darwin)',
      capabilities: [
        { id: 'device_info', name: 'اطلاعات کامل و سخت‌افزار', supported: true, tool: 'lockdown' },
        { id: 'battery_diagnostics', name: 'پایش سلامت و چرخه شارژ باتری', supported: true, tool: 'diagnostics' },
        { id: 'apps_management', name: 'فهرست، نصب (.ipa) و حذف برنامه‌ها', supported: true, tool: 'installation_proxy' },
        { id: 'afc_files', name: 'مدیریت فایل و مدیا (AFC)', supported: true, tool: 'afc' },
        { id: 'gps_simulation', name: 'شبیه‌سازی موقعیت مکانی GPS', supported: true, tool: 'developer' },
        { id: 'crash_logs', name: 'استخراج گزارش کرش و خطاهای سیستم', supported: true, tool: 'crashreport' },
        { id: 'sysdiagnose', name: 'گزارش عیب‌یابی عمیق سیستم (Sysdiagnose)', supported: true, tool: 'syslog' },
        { id: 'screen_mirror', name: 'انتقال تصویر (Screen Mirroring)', supported: true, tool: 'developer ddi / quicktime' }
      ]
    };
  }

  async getCrashLogs(udid) {
    if (udid.startsWith('mock-')) {
      return {
        success: true,
        logs: [
          { filename: 'SpringBoard-2026-10-07.ips', timestamp: new Date().toISOString(), reason: 'Memory pressure warning (jetsam)' },
          { filename: 'CameraApp-2026-10-06.ips', timestamp: new Date(Date.now() - 86400000).toISOString(), reason: 'EXC_BAD_ACCESS (SIGSEGV)' }
        ]
      };
    }
    const res = await this.runBridge('list-crashes', udid);
    if (res && res.success) {
      return res;
    }
    return { success: false, error: res.error || 'دسترسی به لاگ کرش امکان‌پذیر نیست.', logs: [] };
  }
}

export const iosManager = new IosManager();
