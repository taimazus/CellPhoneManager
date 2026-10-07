import { exec } from 'child_process';
import util from 'util';
import https from 'https';
import http from 'http';
import { toolManager } from './toolManager.js';

const execAsync = util.promisify(exec);

export class NetworkManager {
  async runAdb(cmd, serial = null) {
    const adbPath = await toolManager.getAdbPath();
    const target = serial ? `-s ${serial}` : '';
    try {
      const { stdout, stderr } = await execAsync(`"${adbPath}" ${target} ${cmd}`);
      return { success: true, stdout, stderr };
    } catch (err) {
      return { success: false, error: err.message, stderr: err.stderr || '' };
    }
  }

  // 1. USB Tethering
  async enableUsbTethering(serial) {
    try {
      // Method 1: Android 11+ connectivity cmd
      let res = await this.runAdb('shell cmd connectivity tether start usb', serial);
      if (!res.success || (res.stdout && res.stdout.includes('Error'))) {
        // Method 2: svc usb
        res = await this.runAdb('shell svc usb setFunctions rndis', serial);
      }
      if (!res.success) {
        // Method 3: setprop
        res = await this.runAdb('shell setprop sys.usb.config rndis,adb', serial);
      }
      // Always also open tether settings in case Android requires user confirmation
      await this.runAdb('shell am start -a android.settings.TETHER_SETTINGS', serial);

      return {
        success: true,
        message: 'دستور فعال‌سازی اشتراک‌گذاری اینترنت با کابل (USB Tethering) ارسال و صفحه تنظیمات باز شد.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async disableUsbTethering(serial) {
    try {
      await this.runAdb('shell cmd connectivity tether stop usb', serial);
      await this.runAdb('shell svc usb setFunctions mtp', serial);
      return { success: true, message: 'اشتراک اینترنت با کابل غیرفعال شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async openTetherSettings(serial) {
    try {
      await this.runAdb('shell am start -a android.settings.TETHER_SETTINGS', serial);
      return { success: true, message: 'صفحه تنظیمات Tethering و Hotspot روی گوشی باز شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 2. Port Forwarding for VPNs (V2Ray, Clash, Shadowsocks, EveryProxy, etc.)
  async forwardVpnPort(serial, port = 10809) {
    try {
      const p = parseInt(port, 10);
      const res = await this.runAdb(`forward tcp:${p} tcp:${p}`, serial);
      if (res.success) {
        return {
          success: true,
          port: p,
          message: `پورت ${p} گوشی با موفقیت به پورت 127.0.0.1:${p} ویندوز متصل (Forward) شد.`
        };
      }
      return { success: false, error: res.error || res.stderr };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async removeVpnPortForward(serial, port = 10809) {
    try {
      const p = parseInt(port, 10);
      await this.runAdb(`forward --remove tcp:${p}`, serial);
      return { success: true, message: `فوروارد پورت ${p} متوقف شد.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async listForwardedPorts(serial) {
    try {
      const res = await this.runAdb('forward --list', serial);
      if (!res.success || !res.stdout) return [];
      const lines = res.stdout.trim().split('\n');
      const list = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          list.push({ serial: parts[0], local: parts[1], remote: parts[2] });
        }
      }
      return list;
    } catch {
      return [];
    }
  }

  // 3. Windows System Proxy Configuration
  async setWindowsProxy(enabled, proxyServer = '127.0.0.1:10809') {
    try {
      if (process.platform !== 'win32') {
        return { success: false, message: 'تنظیم خودکار پروکسی سیستمی تنها روی ویندوز پشتیبانی می‌شود.' };
      }

      if (enabled) {
        const regCmd1 = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`;
        const regCmd2 = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "${proxyServer}" /f`;
        await execAsync(regCmd1);
        await execAsync(regCmd2);
        return {
          success: true,
          enabled: true,
          proxyServer,
          message: `پروکسی ویندوز با موفقیت روی ${proxyServer} تنظیم و فعال شد!`
        };
      } else {
        const regCmd = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`;
        await execAsync(regCmd);
        return {
          success: true,
          enabled: false,
          message: 'پروکسی ویندوز غیرفعال شد و تنظیمات به حالت عادی بازگشت.'
        };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getWindowsProxyStatus() {
    try {
      if (process.platform !== 'win32') {
        return { enabled: false, proxyServer: '' };
      }
      const queryCmd = `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable`;
      const serverCmd = `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer`;

      const qRes = await execAsync(queryCmd).catch(() => ({ stdout: '' }));
      const sRes = await execAsync(serverCmd).catch(() => ({ stdout: '' }));

      const isEnabled = qRes.stdout.includes('0x1');
      let proxyServer = '';
      const match = sRes.stdout.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/);
      if (match) proxyServer = match[1].trim();

      return { enabled: isEnabled, proxyServer };
    } catch {
      return { enabled: false, proxyServer: '' };
    }
  }

  // 4. Ping & Diagnostics
  async pingHost(host = '8.8.8.8') {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `ping -n 3 ${host}` : `ping -c 3 ${host}`;
    try {
      const { stdout } = await execAsync(cmd);
      let timeMatch = stdout.match(/Average = (\d+)ms/) || stdout.match(/avg\/.*?=.*?\/(.*?)\//);
      let avgTime = timeMatch ? `${timeMatch[1]} ms` : 'پاسخ دریافت شد';
      return { success: true, host, output: stdout, avgTime };
    } catch (err) {
      return { success: false, host, error: 'تایم‌اوت یا عدم برقراری ارتباط' };
    }
  }

  async getPublicIp() {
    return new Promise((resolve) => {
      https.get('https://api.ipify.org?format=json', { timeout: 4000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: true, ip: parsed.ip });
          } catch {
            resolve({ success: false, ip: 'نامشخص' });
          }
        });
      }).on('error', () => {
        resolve({ success: false, ip: 'عدم دسترسی به اینترنت' });
      });
    });
  }
}

export const networkManager = new NetworkManager();
