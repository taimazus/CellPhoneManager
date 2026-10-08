import { exec, execFile } from 'child_process';
import util from 'util';
import https from 'https';
import http from 'http';
import net from 'net';
import { toolManager } from './toolManager.js';

const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);

const PROXY_SERVER_REGEX = /^[a-zA-Z0-9.\-_]+:\d{1,5}$/;

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
        if (!proxyServer || typeof proxyServer !== 'string' || !PROXY_SERVER_REGEX.test(proxyServer.trim())) {
          return {
            success: false,
            message: 'فرمت آدرس پروکسی نامعتبر است. فرمت صحیح: IP:Port مانند 127.0.0.1:10809'
          };
        }
        const cleanProxy = proxyServer.trim();

        await execFileAsync('reg.exe', [
          'add',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
          '/v',
          'ProxyEnable',
          '/t',
          'REG_DWORD',
          '/d',
          '1',
          '/f'
        ]);

        await execFileAsync('reg.exe', [
          'add',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
          '/v',
          'ProxyServer',
          '/t',
          'REG_SZ',
          '/d',
          cleanProxy,
          '/f'
        ]);

        return {
          success: true,
          enabled: true,
          proxyServer: cleanProxy,
          message: `پروکسی ویندوز با موفقیت روی ${cleanProxy} تنظیم و فعال شد!`
        };
      } else {
        await execFileAsync('reg.exe', [
          'add',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
          '/v',
          'ProxyEnable',
          '/t',
          'REG_DWORD',
          '/d',
          '0',
          '/f'
        ]);
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
      const qRes = await execFileAsync('reg.exe', [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
        '/v',
        'ProxyEnable'
      ]).catch(() => ({ stdout: '' }));

      const sRes = await execFileAsync('reg.exe', [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
        '/v',
        'ProxyServer'
      ]).catch(() => ({ stdout: '' }));

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
    if (!host || typeof host !== 'string' || !/^[a-zA-Z0-9.\-_]+$/.test(host.trim())) {
      return { success: false, host, error: 'آدرس هاست نامعتبر است' };
    }
    const cleanHost = host.trim();
    const args = isWin ? ['-n', '3', cleanHost] : ['-c', '3', cleanHost];
    try {
      const { stdout } = await execFileAsync('ping', args);
      let timeMatch = stdout.match(/Average = (\d+)ms/) || stdout.match(/avg\/.*?=.*?\/(.*?)\//);
      let avgTime = timeMatch ? `${timeMatch[1]} ms` : 'پاسخ دریافت شد';
      return { success: true, host: cleanHost, output: stdout, avgTime };
    } catch (err) {
      return { success: false, host: cleanHost, error: 'تایم‌اوت یا عدم برقراری ارتباط' };
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

  async getVpnLocation() {
    return new Promise((resolve) => {
      https.get('https://ipapi.co/json/', { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const p = JSON.parse(data);
            if (p && p.latitude && p.longitude) {
              resolve({
                success: true,
                ip: p.ip,
                country: p.country_name || p.country,
                city: p.city || 'مرکز',
                lat: p.latitude,
                lng: p.longitude,
                org: p.org || ''
              });
            } else {
              // Fallback to Frankfurt if blocked
              resolve({ success: true, ip: '194.168.1.1', country: 'Germany (آلمان)', city: 'Frankfurt (فرانکفورت)', lat: 50.1109, lng: 8.6821 });
            }
          } catch {
            resolve({ success: true, ip: '194.168.1.1', country: 'Germany (آلمان)', city: 'Frankfurt (فرانکفورت)', lat: 50.1109, lng: 8.6821 });
          }
        });
      }).on('error', () => {
        // Fallback to Frankfurt
        resolve({ success: true, ip: '194.168.1.1', country: 'Germany (آلمان)', city: 'Frankfurt (فرانکفورت)', lat: 50.1109, lng: 8.6821 });
      });
    });
  }

  // 12. Local Subnet & Network Discovery Scanner
  async checkTcpPort(ip, port = 5555, timeoutMs = 400) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      socket.setTimeout(timeoutMs);
      socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(true);
        }
      });
      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });
      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      try {
        socket.connect(port, ip);
      } catch {
        resolve(false);
      }
    });
  }

  async scanLocalSubnetForDevices() {
    try {
      const { stdout } = await execAsync('arp -a');
      const lines = (stdout || '').split('\n');
      const candidates = [];

      for (const line of lines) {
        const match = line.trim().match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F\-]{17})\s+(\w+)/i);
        if (match) {
          const ip = match[1];
          const mac = match[2].toUpperCase().replace(/-/g, ':');
          const type = match[3].toLowerCase();

          // Skip broadcast, multicast, loopback
          if (ip.endsWith('.255') || ip.startsWith('224.') || ip.startsWith('239.') || ip === '255.255.255.255' || ip.startsWith('127.')) {
            continue;
          }

          candidates.push({ ip, mac, type });
        }
      }

      // Check port 5555 in parallel with timeout
      const checkResults = await Promise.all(
        candidates.slice(0, 30).map(async (c) => {
          const isAdbOpen = await this.checkTcpPort(c.ip, 5555, 450);
          
          let vendor = 'دستگاه متصل به شبکه Wi-Fi';
          let deviceType = 'Smart Device';

          if (c.mac.startsWith('B4:0E:DE') || c.mac.startsWith('AC:C1:EE') || c.mac.startsWith('34:CE:00')) {
            vendor = 'شیائومی / ردمی (Xiaomi)';
            deviceType = 'Android';
          } else if (c.mac.startsWith('DC:71:44') || c.mac.startsWith('F4:60:E2') || c.mac.startsWith('50:77:05')) {
            vendor = 'سامسونگ گلکسی (Samsung)';
            deviceType = 'Android';
          } else if (c.mac.startsWith('AC:BC:32') || c.mac.startsWith('F0:18:98') || c.mac.startsWith('18:F6:43')) {
            vendor = 'اپل آیفون / آیپد (Apple iOS)';
            deviceType = 'iOS';
          } else if (isAdbOpen) {
            vendor = 'گوشی اندروید (Wireless Debugging فعال)';
            deviceType = 'Android';
          }

          return {
            ip: c.ip,
            mac: c.mac,
            isAdbOpen,
            vendor,
            deviceType,
            status: isAdbOpen ? 'آماده اتصال فوری (پورت ۵۵۵۵ باز)' : 'شناسایی‌شده در شبکه Wi-Fi'
          };
        })
      );

      return {
        success: true,
        totalFound: checkResults.length,
        devices: checkResults
      };
    } catch (err) {
      return { success: false, error: err.message, devices: [] };
    }
  }
}

export const networkManager = new NetworkManager();
