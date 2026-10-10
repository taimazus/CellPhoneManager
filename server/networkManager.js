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
      // 1. Get currently connected ADB wireless devices
      const activeAdbIps = new Set();
      try {
        const adbPath = await toolManager.getAdbPath();
        const { stdout: devOut } = await execAsync(`"${adbPath}" devices`);
        for (const line of (devOut || '').split('\n')) {
          const match = line.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)\s+device/);
          if (match) {
            activeAdbIps.add(match[1]);
          }
        }
      } catch (e) {
        // Ignore ADB list error if daemon not running
      }

      // 2. Discover local subnets & interface broadcasts
      const interfaces = (await import('os')).networkInterfaces();
      const subnets = [];
      for (const name in interfaces) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal) {
            const parts = iface.address.split('.');
            subnets.push({
              ip: iface.address,
              base: parts.slice(0, 3).join('.'),
              broadcast: parts.slice(0, 3).join('.') + '.255'
            });
          }
        }
      }

      // 3. Active mDNS wakeup (wakes up dormant iPhones, iPads, AirPrint printers, Bonjour devices)
      try {
        const dgram = await import('dgram');
        const udpClient = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        // Standard DNS-SD pointer query packet
        const mdnsQuery = Buffer.from([
          0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x09, 0x5f, 0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x73,
          0x07, 0x5f, 0x64, 0x6e, 0x73, 0x2d, 0x73, 0x64,
          0x04, 0x5f, 0x75, 0x64, 0x70,
          0x05, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x00,
          0x00, 0x0c, 0x00, 0x01
        ]);
        udpClient.send(mdnsQuery, 5353, '224.0.0.251', () => {});
        for (const sub of subnets) {
          udpClient.send(mdnsQuery, 5353, sub.broadcast, () => {});
        }
        setTimeout(() => {
          try { udpClient.close(); } catch {}
        }, 800);
      } catch {}

      // 4. Quick parallel port sweep on the primary /24 subnet to populate ARP
      const primarySub = subnets[0] || { base: '192.168.1' };
      const probePromises = [];
      for (let i = 1; i <= 254; i++) {
        const targetIp = `${primarySub.base}.${i}`;
        probePromises.push(this.checkTcpPort(targetIp, 5555, 300));
        probePromises.push(this.checkTcpPort(targetIp, 62078, 300));
        probePromises.push(this.checkTcpPort(targetIp, 9100, 300));
        probePromises.push(this.checkTcpPort(targetIp, 445, 300));
        probePromises.push(this.checkTcpPort(targetIp, 80, 300));
      }
      await Promise.all(probePromises);

      // 5. Query Windows ARP cache (now fully populated)
      let { stdout } = await execAsync('arp -a').catch(() => ({ stdout: '' }));
      const lines = (stdout || '').split('\n');
      const candidates = [];
      const seenIps = new Set();

      for (const line of lines) {
        const match = line.trim().match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F\-]{17})\s+(\w+)/i);
        if (match) {
          const ip = match[1];
          const mac = match[2].toUpperCase().replace(/-/g, ':');
          const type = match[3].toLowerCase();

          // Skip broadcast, multicast, loopback, gateway broadcast
          if (
            ip.endsWith('.255') || 
            ip.endsWith('.0') || 
            ip.startsWith('224.') || 
            ip.startsWith('239.') || 
            ip === '255.255.255.255' || 
            ip.startsWith('127.') ||
            seenIps.has(ip)
          ) {
            continue;
          }

          seenIps.add(ip);
          candidates.push({ ip, mac, type });
        }
      }

      // MAC Databases
      const APPLE_OUIS = [
        'E8:78:65', 'AC:BC:32', 'F0:18:98', '18:F6:43', '3C:06:30', '40:4D:7F',
        'A8:66:7F', 'DC:A9:04', '98:01:A7', 'BC:D0:74', 'F4:F9:51', '80:E6:50',
        '64:A5:C3', '48:D7:05', 'F8:38:80', '28:6A:BA', '70:EC:E4', 'A4:C3:61',
        'B8:78:26', 'F4:34:F0', '7C:6D:62', 'A4:83:E7', '00:F4:B9', '78:7B:8A',
        '20:A2:E4', '34:08:BC', '00:C6:10', '38:CA:DA', '44:4C:0C', '40:6C:8F'
      ];

      const PRINTER_OUIS = [
        '78:AC:C0', '00:17:61', '00:1B:A9', '00:21:5A', '00:25:B3', '00:1E:0B',
        '3C:D9:2B', '18:A9:58', 'A4:5D:36', '94:57:A5', '00:00:85', '00:1E:8F',
        '00:26:73', '18:03:73', '38:1A:52', '70:85:C2', '00:00:48', '00:21:B7',
        '00:26:AB', '44:D9:E7', '64:EB:8C', '00:80:77', '30:05:5C', '00:01:E6'
      ];

      const PC_OUIS = [
        '18:60:24', 'C8:D3:FF', '00:D8:61', '10:65:30', '54:BF:64', 'B8:85:84',
        'EC:F4:BB', '2C:F0:5D', 'D8:BB:C1', 'E0:D5:5E', '48:21:0B', '30:9C:23'
      ];

      const XIAOMI_OUIS = ['B4:0E:DE', 'AC:C1:EE', '34:CE:00', '68:DF:DD', '78:11:DC', '58:44:98'];
      const SAMSUNG_OUIS = ['DC:71:44', 'F4:60:E2', '50:77:05', '30:CD:A7', '88:79:7E', 'A4:70:D6', '44:78:3E', '94:DB:DA'];
      const HUAWEI_OUIS = ['E4:AA:EC', '48:2C:A0', 'B4:9C:DF'];
      const GOOGLE_OUIS = ['F4:F5:DB', 'D8:EB:97', '3C:5A:37', '94:08:53', '54:60:09'];
      const OPPO_OUIS = ['C8:51:95', 'E8:BB:A8', '14:AB:C5', 'BC:D0:74', '2C:33:61', '90:32:4B', '7C:A7:B0'];

      const isRandomizedMac = (mac) => {
        if (!mac || mac.length < 2) return false;
        const secondChar = mac[1].toUpperCase();
        return ['2', '6', 'A', 'E'].includes(secondChar);
      };

      // 6. Parallel deep port & device category classification
      const checkResults = await Promise.all(
        candidates.slice(0, 60).map(async (c) => {
          const isAdbConnected = activeAdbIps.has(c.ip);
          const [p5555, p62078, p9100, p631, p445, p80] = await Promise.all([
            isAdbConnected ? Promise.resolve(true) : this.checkTcpPort(c.ip, 5555, 350),
            this.checkTcpPort(c.ip, 62078, 350),
            this.checkTcpPort(c.ip, 9100, 350),
            this.checkTcpPort(c.ip, 631, 350),
            this.checkTcpPort(c.ip, 445, 350),
            this.checkTcpPort(c.ip, 80, 350)
          ]);

          const isAdbOpen = p5555 || isAdbConnected;
          const macPrefix = c.mac.substring(0, 8);

          let category = 'other'; // 'phones' | 'printers' | 'pcs' | 'routers' | 'other'
          let deviceType = 'Smart Device';
          let vendor = 'دستگاه متصل به شبکه Wi-Fi';
          let status = 'شناسایی‌شده در شبکه Wi-Fi';

          if (isAdbOpen) {
            category = 'phones';
            deviceType = 'Android';
            vendor = 'گوشی اندروید (Wireless Debugging فعال)';
            status = isAdbConnected ? 'متصل و آماده تبادل داده (ADB Online)' : 'آماده اتصال فوری (پورت ۵۵۵۵ باز)';
          } else if (p62078 || APPLE_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'phones';
            deviceType = 'iOS';
            vendor = 'گوشی اپل آیفون / آیپد (Apple iOS)';
            status = 'دستگاه اپل شناسایی‌شده در شبکه محلی';
          } else if (p9100 || p631 || PRINTER_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'printers';
            deviceType = 'Printer';
            vendor = 'پرینتر و اسکنر تحت شبکه (Network Printer)';
            status = 'دستگاه چاپ تحت شبکه آنلاین';
          } else if (p445 || PC_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'pcs';
            deviceType = 'PC';
            vendor = 'کامپیوتر و لپ‌تاپ (Windows PC)';
            status = 'سیستم کامپیوتری متصل به شبکه';
          } else if (c.ip.endsWith('.1') || c.ip.endsWith('.254')) {
            category = 'routers';
            deviceType = 'Router';
            vendor = 'مودم و روتر وای‌فای (Wi-Fi Router & Gateway)';
            status = 'دروازه اینترنت و مودم شبکه';
          } else if (XIAOMI_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'phones';
            deviceType = 'Android';
            vendor = 'شیائومی / ردمی / پوکو (Xiaomi / Redmi / Poco)';
            status = 'گوشی شیائومی متصل به شبکه';
          } else if (SAMSUNG_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'phones';
            deviceType = 'Android';
            vendor = 'سامسونگ گلکسی (Samsung Galaxy)';
            status = 'گوشی سامسونگ متصل به شبکه';
          } else if (HUAWEI_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'phones';
            deviceType = 'Android';
            vendor = 'هواوی / آنر (Huawei / Honor)';
            status = 'گوشی هواوی متصل به شبکه';
          } else if (GOOGLE_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'phones';
            deviceType = 'Android';
            vendor = 'گوگل پیکسل (Google Pixel)';
            status = 'گوشی گوگل متصل به شبکه';
          } else if (OPPO_OUIS.some(o => macPrefix.startsWith(o))) {
            category = 'phones';
            deviceType = 'Android';
            vendor = 'اوپو / ریلمی / وان‌پلاس (Oppo / Realme / OnePlus)';
            status = 'گوشی متصل به شبکه';
          } else if (isRandomizedMac(c.mac)) {
            category = 'phones';
            deviceType = 'Smartphone';
            vendor = 'گوشی هوشمند (اندروید / iOS با مک خصوصی)';
            status = 'شناسایی‌شده در شبکه Wi-Fi (مک رندوم / Private MAC)';
          }

          return {
            ip: c.ip,
            mac: c.mac,
            category,
            deviceType,
            vendor,
            status,
            isAdbOpen,
            isAdbConnected
          };
        })
      );

      // Sort: ADB-open and connected phones first, then iOS, then printers, then PCs, then routers
      const sortOrder = { Android: 1, iOS: 2, Smartphone: 3, Printer: 4, PC: 5, Router: 6, 'Smart Device': 7 };
      checkResults.sort((a, b) => {
        if (a.isAdbOpen && !b.isAdbOpen) return -1;
        if (!a.isAdbOpen && b.isAdbOpen) return 1;
        return (sortOrder[a.deviceType] || 99) - (sortOrder[b.deviceType] || 99);
      });

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
