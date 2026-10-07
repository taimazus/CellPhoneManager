import { spawn, exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { adbManager } from './adbManager.js';

export class PcGamepadManager {
  constructor() {
    this.activeProfile = 'racing'; // 'racing' | 'action' | 'retro' | 'mouse' | 'custom'
    this.connectedControllers = new Map(); // clientId -> { id, ip, connectedAt, lastPing }
    this.latestInputs = {};
    this.isInputSimulationActive = true;
    this.profiles = {
      racing: {
        id: 'racing',
        name: '🏎️ مسابقه‌ای و اتومبیل‌رانی (Need for Speed / Forza)',
        desc: 'گاز با W/Up، ترمز با S/Down، نیترو با Space، ترمز دستی با Shift و فرمان با ژیروسکوپ گوشی',
        mappings: {
          'DPAD_UP': '{UP}',
          'DPAD_DOWN': '{DOWN}',
          'DPAD_LEFT': '{LEFT}',
          'DPAD_RIGHT': '{RIGHT}',
          'BTN_A': 'w', // Gas / Accelerate
          'BTN_B': 's', // Brake / Reverse
          'BTN_X': ' ', // Nitro / Boost (Space)
          'BTN_Y': 'c', // Change Camera
          'L1': '{LEFT}',
          'R1': '{RIGHT}',
          'L2': 's', // Handbrake
          'R2': 'w', // Gas
          'START': '{ENTER}',
          'SELECT': '{ESC}'
        }
      },
      action: {
        id: 'action',
        name: '🎯 اکشن و شوتر (WASD + Action Keys)',
        desc: 'حرکت با WASD، پرش با Space، شلیک با کلیک چپ/Enter، نشستن با C',
        mappings: {
          'DPAD_UP': 'w',
          'DPAD_DOWN': 's',
          'DPAD_LEFT': 'a',
          'DPAD_RIGHT': 'd',
          'BTN_A': ' ', // Jump (Space)
          'BTN_B': 'c', // Crouch
          'BTN_X': 'r', // Reload
          'BTN_Y': 'e', // Interact / Use
          'L1': '{SHIFT}', // Sprint
          'R1': '{ENTER}', // Fire
          'L2': 'q', // Melee
          'R2': 'f', // Grenade
          'START': '{ESC}',
          'SELECT': '{TAB}'
        }
      },
      retro: {
        id: 'retro',
        name: '🕹️ شبیه‌سازها و بازی‌های دو بعدی (RetroArch / FIFA)',
        desc: 'چهار جهت جهت‌نما، دکمه‌های اصلی Z/X/A/S برای فوتبال و پلتفرمر',
        mappings: {
          'DPAD_UP': '{UP}',
          'DPAD_DOWN': '{DOWN}',
          'DPAD_LEFT': '{LEFT}',
          'DPAD_RIGHT': '{RIGHT}',
          'BTN_A': 'z', // Pass / Action 1
          'BTN_B': 'x', // Shoot / Action 2
          'BTN_X': 'a', // Long Pass / Action 3
          'BTN_Y': 's', // Through Ball / Action 4
          'L1': 'q',
          'R1': 'e',
          'L2': '1',
          'R2': '2',
          'START': '{ENTER}',
          'SELECT': '{ESC}'
        }
      }
    };
  }

  getProfiles() {
    return Object.values(this.profiles);
  }

  setProfile(profileId) {
    if (this.profiles[profileId]) {
      this.activeProfile = profileId;
      return { success: true, profile: this.profiles[profileId] };
    }
    return { success: false, error: 'پروفایل مورد نظر یافت نشد.' };
  }

  getLocalIps() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push({ name, ip: iface.address });
        }
      }
    }
    return ips;
  }

  async setupAdbReverse(serial) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'دستگاه شبیه‌سازی شده: پورت‌ها آماده هستند.' };
    }
    try {
      await adbManager.runAdb(['reverse', 'tcp:3001', 'tcp:3001'], serial);
      return { success: true, message: 'پورت ارتباطی معکوس (ADB Reverse) با موفقیت تنظیم شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async launchOnPhone(serial) {
    const localIps = this.getLocalIps();
    const primaryIp = localIps.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.') || i.ip.startsWith('172.'))?.ip || '127.0.0.1';
    const lanUrl = `http://${primaryIp}:3001/gamepad.html`;
    const localhostUrl = 'http://localhost:3001/gamepad.html';

    if (!serial || serial.startsWith('mock-')) {
      return { 
        success: true, 
        url: localhostUrl, 
        lanUrl,
        message: 'دستگاه شبیه‌سازی: آدرس دسته بازی آماده است.' 
      };
    }
    try {
      // 1. Setup ADB reverse port forwarding for USB
      await this.setupAdbReverse(serial);

      // 2. Wake up screen and dismiss lockscreen if possible
      try {
        await adbManager.runAdb(['shell', 'input', 'keyevent', '224'], serial);
        await adbManager.runAdb(['shell', 'wm', 'dismiss-keyguard'], serial);
      } catch {
        // non-fatal
      }

      // 3. Try to launch using browser packages in sequence with LAN URL
      const browserIntents = [
        ['shell', 'am', 'start', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-n', 'com.mi.globalbrowser/com.android.browser.BrowserActivity', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-n', 'com.sec.android.app.sbrowser/com.sec.android.app.sbrowser.SBrowserMainActivity', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', localhostUrl, '-f', '0x10000000']
      ];

      let launched = false;
      let lastErr = null;
      for (const intentArgs of browserIntents) {
        try {
          const res = await adbManager.runAdb(intentArgs, serial);
          if (res && res.success && !res.stdout?.includes('Error:') && !res.stdout?.includes('does not exist')) {
            launched = true;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      return { 
        success: true, 
        url: localhostUrl, 
        lanUrl,
        launched,
        message: 'صفحه دسته بازی برای گوشی ارسال شد. در صورت نیاز می‌توانید QR کد را نیز اسکن کنید.' 
      };
    } catch (err) {
      return { 
        success: false, 
        url: localhostUrl,
        lanUrl,
        error: err.message 
      };
    }
  }

  processGamepadEvent(event) {
    const { button, state, axisX, axisY } = event;
    this.latestInputs = {
      button,
      state,
      axisX: axisX !== undefined ? Math.round(axisX * 100) / 100 : 0,
      axisY: axisY !== undefined ? Math.round(axisY * 100) / 100 : 0,
      timestamp: Date.now()
    };

    if (!this.isInputSimulationActive) return;

    // Map button to Windows key
    const profile = this.profiles[this.activeProfile] || this.profiles.racing;
    const keyToSend = profile.mappings[button];

    if (keyToSend && state === 'down') {
      this.sendWindowsKey(keyToSend);
    }
  }

  processMouseMove({ deltaX, deltaY, click }) {
    if (!this.isInputSimulationActive) return;

    if (click) {
      this.sendWindowsMouseClick(click);
      return;
    }

    if (deltaX !== undefined && deltaY !== undefined) {
      this.sendWindowsMouseMove(deltaX, deltaY);
    }
  }

  sendWindowsKey(key) {
    // Only execute on Windows host
    if (process.platform !== 'win32') return;

    // Escaping key for PowerShell SendKeys
    const safeKey = key.replace(/'/g, "''");
    const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${safeKey}')`;
    
    exec(`powershell.exe -NoProfile -NonInteractive -Command "${psCmd}"`, (err) => {
      if (err) {
        // Ignored in non-interactive / test runner environments
      }
    });
  }

  sendWindowsMouseClick(clickType = 'left') {
    if (process.platform !== 'win32') return;
    const clickFlag = clickType === 'right' ? '0x08, 0, 0, 0, 0' : '0x02, 0, 0, 0, 0; [NativeMethods]::mouse_event(0x04, 0, 0, 0, 0)';
    const psCmd = `
      $code = @'
      using System;
      using System.Runtime.InteropServices;
      public class NativeMethods {
        [DllImport("user32.dll")]
        public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int extraInfo);
      }
'@
      Add-Type -TypeDefinition $code
      [NativeMethods]::mouse_event(${clickFlag})
    `;
    exec(`powershell.exe -NoProfile -NonInteractive -Command "${psCmd}"`, () => {});
  }

  sendWindowsMouseMove(dx, dy) {
    if (process.platform !== 'win32') return;
    const factor = 1.5;
    const moveX = Math.round(dx * factor);
    const moveY = Math.round(dy * factor);
    const psCmd = `
      $code = @'
      using System;
      using System.Runtime.InteropServices;
      public class NativeMethods {
        [DllImport("user32.dll")]
        public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int extraInfo);
      }
'@
      Add-Type -TypeDefinition $code
      [NativeMethods]::mouse_event(0x0001, ${moveX}, ${moveY}, 0, 0)
    `;
    exec(`powershell.exe -NoProfile -NonInteractive -Command "${psCmd}"`, () => {});
  }
}

export const pcGamepadManager = new PcGamepadManager();
