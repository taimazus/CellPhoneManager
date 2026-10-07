import { spawn, exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adbManager } from './adbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Windows Virtual-Key code map
export const VK = {
  // Arrow Keys
  UP: 0x26,    // 38
  DOWN: 0x28,  // 40
  LEFT: 0x25,  // 37
  RIGHT: 0x27, // 39
  // Common Keys
  SPACE: 0x20, // 32
  ENTER: 0x0D, // 13
  ESCAPE: 0x1B,// 27
  TAB: 0x09,   // 9
  SHIFT: 0x10, // 16
  CONTROL: 0x11, // 17
  ALT: 0x12,   // 18
  // Letters A-Z
  A: 0x41, B: 0x42, C: 0x43, D: 0x44, E: 0x45, F: 0x46, G: 0x47,
  H: 0x48, I: 0x49, J: 0x4A, K: 0x4B, L: 0x4C, M: 0x4D, N: 0x4E,
  O: 0x4F, P: 0x50, Q: 0x51, R: 0x52, S: 0x53, T: 0x54, U: 0x55,
  V: 0x56, W: 0x57, X: 0x58, Y: 0x59, Z: 0x5A,
  // Numpad Keys
  NUMPAD_0: 0x60, NUMPAD_1: 0x61, NUMPAD_2: 0x62, NUMPAD_3: 0x63,
  NUMPAD_4: 0x64, NUMPAD_5: 0x65, NUMPAD_6: 0x66, NUMPAD_7: 0x67,
  NUMPAD_8: 0x68, NUMPAD_9: 0x69,
  // Digits 0-9
  NUM_0: 0x30, NUM_1: 0x31, NUM_2: 0x32, NUM_3: 0x33, NUM_4: 0x34,
  NUM_5: 0x35, NUM_6: 0x36, NUM_7: 0x37, NUM_8: 0x38, NUM_9: 0x39
};

export class PcGamepadManager {
  constructor() {
    this.activeProfile = 'fifa'; // Default to FIFA
    this.connectedControllers = new Map();
    this.latestInputs = {};
    this.isInputSimulationActive = true;
    this.bridgeProcess = null;
    this.isBridgeReady = false;

    this.profiles = {
      fifa: {
        id: 'fifa',
        name: '⚽ فوتبال فیفا و پی‌اس (FIFA / PES)',
        desc: 'پاس کوتاه با S، شوت با D، پاس در عمق با W، سانتر با A، دویدن با Shift/E، شروع با Space/Enter',
        mappings: {
          // Player 1 mappings
          'DPAD_UP': VK.UP,
          'DPAD_DOWN': VK.DOWN,
          'DPAD_LEFT': VK.LEFT,
          'DPAD_RIGHT': VK.RIGHT,
          'BTN_A': VK.S,      // Short Pass / Menu Select
          'BTN_B': VK.D,      // Shoot / Cancel
          'BTN_X': VK.A,      // Cross / Long Pass
          'BTN_Y': VK.W,      // Through Ball
          'L1': VK.Q,         // Player Switch
          'R1': VK.E,         // Finesse / Sprint
          'L2': VK.C,         // Shield Ball
          'R2': VK.SHIFT,     // Sprint
          'START': VK.SPACE,  // Space (Start/Confirm in FIFA)
          'ENTER': VK.ENTER,  // Enter (Menu Advance)
          'SELECT': VK.ESCAPE // Esc (Back / Pause)
        },
        player2Mappings: {
          // Player 2 mappings (I/J/K/L + B/N/V/G)
          'DPAD_UP': VK.I,
          'DPAD_DOWN': VK.K,
          'DPAD_LEFT': VK.J,
          'DPAD_RIGHT': VK.L,
          'BTN_A': VK.B,      // Short Pass
          'BTN_B': VK.N,      // Shoot
          'BTN_X': VK.V,      // Cross
          'BTN_Y': VK.G,      // Through Ball
          'L1': VK.T,         // Player Switch
          'R1': VK.Y,         // Sprint
          'L2': VK.H,         // Shield Ball
          'R2': VK.U,         // Sprint
          'START': VK.P,      // Player 2 Start
          'ENTER': VK.ENTER,
          'SELECT': VK.ESCAPE
        }
      },
      racing: {
        id: 'racing',
        name: '🏎️ مسابقه‌ای و اتومبیل‌رانی (Need for Speed / Forza)',
        desc: 'گاز با W/Up، ترمز با S/Down، نیترو با Space، ترمز دستی با Shift و فرمان با ژیروسکوپ گوشی',
        mappings: {
          'DPAD_UP': VK.UP,
          'DPAD_DOWN': VK.DOWN,
          'DPAD_LEFT': VK.LEFT,
          'DPAD_RIGHT': VK.RIGHT,
          'BTN_A': VK.W,      // Accelerate
          'BTN_B': VK.S,      // Brake
          'BTN_X': VK.SPACE,  // Nitro
          'BTN_Y': VK.C,      // Camera
          'L1': VK.LEFT,
          'R1': VK.RIGHT,
          'L2': VK.SHIFT,     // Handbrake
          'R2': VK.W,         // Gas
          'START': VK.ENTER,
          'ENTER': VK.ENTER,
          'SELECT': VK.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': VK.I,
          'DPAD_DOWN': VK.K,
          'DPAD_LEFT': VK.J,
          'DPAD_RIGHT': VK.L,
          'BTN_A': VK.I,
          'BTN_B': VK.K,
          'BTN_X': VK.P,
          'BTN_Y': VK.O,
          'L1': VK.J,
          'R1': VK.L,
          'L2': VK.U,
          'R2': VK.I,
          'START': VK.ENTER,
          'ENTER': VK.ENTER,
          'SELECT': VK.ESCAPE
        }
      },
      action: {
        id: 'action',
        name: '🎯 اکشن و شوتر (WASD + Action Keys)',
        desc: 'حرکت با WASD، پرش با Space، شلیک با کلیک چپ/Enter، نشستن با C',
        mappings: {
          'DPAD_UP': VK.W,
          'DPAD_DOWN': VK.S,
          'DPAD_LEFT': VK.A,
          'DPAD_RIGHT': VK.D,
          'BTN_A': VK.SPACE,  // Jump
          'BTN_B': VK.C,      // Crouch
          'BTN_X': VK.R,      // Reload
          'BTN_Y': VK.E,      // Interact
          'L1': VK.SHIFT,     // Sprint
          'R1': VK.ENTER,     // Fire
          'L2': VK.Q,         // Melee
          'R2': VK.F,         // Grenade
          'START': VK.ESCAPE,
          'ENTER': VK.ENTER,
          'SELECT': VK.TAB
        },
        player2Mappings: {
          'DPAD_UP': VK.I,
          'DPAD_DOWN': VK.K,
          'DPAD_LEFT': VK.J,
          'DPAD_RIGHT': VK.L,
          'BTN_A': VK.P,
          'BTN_B': VK.H,
          'BTN_X': VK.U,
          'BTN_Y': VK.Y,
          'L1': VK.O,
          'R1': VK.ENTER,
          'L2': VK.T,
          'R2': VK.G,
          'START': VK.ESCAPE,
          'ENTER': VK.ENTER,
          'SELECT': VK.TAB
        }
      },
      retro: {
        id: 'retro',
        name: '🕹️ شبیه‌سازها و بازی‌های کلاسیک (RetroArch / MAME)',
        desc: 'چهار جهت جهت‌نما، دکمه‌های اصلی Z/X/A/S برای پلتفرمر و آرکید',
        mappings: {
          'DPAD_UP': VK.UP,
          'DPAD_DOWN': VK.DOWN,
          'DPAD_LEFT': VK.LEFT,
          'DPAD_RIGHT': VK.RIGHT,
          'BTN_A': VK.Z,
          'BTN_B': VK.X,
          'BTN_X': VK.A,
          'BTN_Y': VK.S,
          'L1': VK.Q,
          'R1': VK.E,
          'L2': VK.NUM_1,
          'R2': VK.NUM_2,
          'START': VK.ENTER,
          'ENTER': VK.ENTER,
          'SELECT': VK.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': VK.I,
          'DPAD_DOWN': VK.K,
          'DPAD_LEFT': VK.J,
          'DPAD_RIGHT': VK.L,
          'BTN_A': VK.B,
          'BTN_B': VK.N,
          'BTN_X': VK.V,
          'BTN_Y': VK.G,
          'L1': VK.T,
          'R1': VK.Y,
          'L2': VK.NUM_3,
          'R2': VK.NUM_4,
          'START': VK.ENTER,
          'ENTER': VK.ENTER,
          'SELECT': VK.ESCAPE
        }
      }
    };

    this.initNativeBridge();
  }

  initNativeBridge() {
    if (process.platform !== 'win32') return;

    try {
      const scriptPath = path.join(__dirname, 'winInputBridge.ps1');
      if (!fs.existsSync(scriptPath)) {
        return;
      }

      this.bridgeProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.bridgeProcess.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text.includes('READY')) {
          this.isBridgeReady = true;
        }
      });

      this.bridgeProcess.on('error', () => {
        this.isBridgeReady = false;
        this.bridgeProcess = null;
      });

      this.bridgeProcess.on('exit', () => {
        this.isBridgeReady = false;
        this.bridgeProcess = null;
      });
    } catch {
      this.isBridgeReady = false;
    }
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

      // 2. Wake up screen and dismiss lockscreen
      try {
        await adbManager.runAdb(['shell', 'input', 'keyevent', '224'], serial);
        await adbManager.runAdb(['shell', 'input', 'keyevent', '82'], serial);
        await adbManager.runAdb(['shell', 'wm', 'dismiss-keyguard'], serial);
      } catch {
        // non-fatal
      }

      // 3. Try to launch using modern Android browser intents in prioritized order
      const browserIntents = [
        ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', lanUrl, '-f', '0x10000000', '--user', '0'],
        ['shell', 'am', 'start', '-n', 'com.android.chrome/org.chromium.chrome.browser.ChromeTabbedActivity', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-n', 'com.android.chrome/com.google.android.apps.chrome.IntentDispatcher', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-n', 'org.mozilla.firefox/org.mozilla.fenix.HomeActivity', '-a', 'android.intent.action.VIEW', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-n', 'com.mi.globalbrowser/com.android.browser.BrowserActivity', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-n', 'com.sec.android.app.sbrowser/com.sec.android.app.sbrowser.SBrowserMainActivity', '-d', lanUrl, '-f', '0x10000000'],
        ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', lanUrl]
      ];

      let launched = false;
      let lastErr = null;
      for (const intentArgs of browserIntents) {
        try {
          const res = await adbManager.runAdb(intentArgs, serial);
          if (res && res.success && !res.stdout?.includes('Error:') && !res.stdout?.includes('does not exist') && !res.stdout?.includes('Permission Denial')) {
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
    const { button, state, player = 1, axisX, axisY } = event;
    this.latestInputs = {
      button,
      state,
      player,
      axisX: axisX !== undefined ? Math.round(axisX * 100) / 100 : 0,
      axisY: axisY !== undefined ? Math.round(axisY * 100) / 100 : 0,
      timestamp: Date.now()
    };

    if (!this.isInputSimulationActive) return;

    // Select Player 1 or Player 2 mapping
    const profile = this.profiles[this.activeProfile] || this.profiles.fifa;
    const mappings = player === 2 && profile.player2Mappings ? profile.player2Mappings : profile.mappings;
    const vkCode = mappings[button];

    if (vkCode !== undefined) {
      this.sendWindowsKey(vkCode, state || 'down');
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

  sendWindowsKey(vkCode, state = 'down') {
    if (process.platform !== 'win32') return;

    // Ensure bridge is alive
    if (!this.bridgeProcess || this.bridgeProcess.killed) {
      this.initNativeBridge();
    }

    const command = state === 'up' ? `UP:${vkCode}` : (state === 'tap' ? `TAP:${vkCode}` : `DOWN:${vkCode}`);

    if (this.bridgeProcess && this.bridgeProcess.stdin && this.bridgeProcess.stdin.writable) {
      try {
        this.bridgeProcess.stdin.write(`${command}\n`);
      } catch {
        // bridge write failure
      }
    }
  }

  sendWindowsMouseClick(clickType = 'left') {
    if (process.platform !== 'win32') return;

    if (!this.bridgeProcess || this.bridgeProcess.killed) {
      this.initNativeBridge();
    }

    if (this.bridgeProcess && this.bridgeProcess.stdin && this.bridgeProcess.stdin.writable) {
      try {
        this.bridgeProcess.stdin.write(`CLICK:${clickType}\n`);
      } catch {
        // bridge write failure
      }
    }
  }

  sendWindowsMouseMove(dx, dy) {
    if (process.platform !== 'win32') return;

    if (!this.bridgeProcess || this.bridgeProcess.killed) {
      this.initNativeBridge();
    }

    const factor = 1.5;
    const moveX = Math.round(dx * factor);
    const moveY = Math.round(dy * factor);

    if (this.bridgeProcess && this.bridgeProcess.stdin && this.bridgeProcess.stdin.writable) {
      try {
        this.bridgeProcess.stdin.write(`MOUSE:${moveX},${moveY}\n`);
      } catch {
        // bridge write failure
      }
    }
  }

  destroy() {
    if (this.bridgeProcess) {
      try {
        this.bridgeProcess.stdin.write('QUIT\n');
        this.bridgeProcess.kill();
      } catch {
        // ignore
      }
      this.bridgeProcess = null;
    }
  }
}

export const pcGamepadManager = new PcGamepadManager();
