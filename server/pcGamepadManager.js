import { spawn, exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adbManager } from './adbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Complete Dual Virtual-Key and Hardware ScanCode Map
export const KEYS = {
  // Arrow Keys
  UP: { vk: 0x26, scan: 0x48, ext: true },
  DOWN: { vk: 0x28, scan: 0x50, ext: true },
  LEFT: { vk: 0x25, scan: 0x4B, ext: true },
  RIGHT: { vk: 0x27, scan: 0x4D, ext: true },

  // Special System Keys
  SPACE: { vk: 0x20, scan: 0x39, ext: false },
  ENTER: { vk: 0x0D, scan: 0x1C, ext: false },
  ESCAPE: { vk: 0x1B, scan: 0x01, ext: false },
  TAB: { vk: 0x09, scan: 0x0F, ext: false },
  LSHIFT: { vk: 0x10, scan: 0x2A, ext: false },
  RSHIFT: { vk: 0x10, scan: 0x36, ext: false },
  LCTRL: { vk: 0x11, scan: 0x1D, ext: false },
  LALT: { vk: 0x12, scan: 0x38, ext: false },

  // Letters
  W: { vk: 0x57, scan: 0x11, ext: false },
  A: { vk: 0x41, scan: 0x1E, ext: false },
  S: { vk: 0x53, scan: 0x1F, ext: false },
  D: { vk: 0x44, scan: 0x20, ext: false },
  Q: { vk: 0x51, scan: 0x10, ext: false },
  E: { vk: 0x45, scan: 0x12, ext: false },
  R: { vk: 0x52, scan: 0x13, ext: false },
  C: { vk: 0x43, scan: 0x2E, ext: false },
  F: { vk: 0x46, scan: 0x21, ext: false },
  Z: { vk: 0x5A, scan: 0x2C, ext: false },
  X: { vk: 0x58, scan: 0x2D, ext: false },

  // Player 2 / Alternate Keys
  I: { vk: 0x49, scan: 0x17, ext: false },
  J: { vk: 0x4A, scan: 0x24, ext: false },
  K: { vk: 0x4B, scan: 0x25, ext: false },
  L: { vk: 0x4C, scan: 0x26, ext: false },
  B: { vk: 0x42, scan: 0x30, ext: false },
  N: { vk: 0x4E, scan: 0x31, ext: false },
  V: { vk: 0x56, scan: 0x2F, ext: false },
  G: { vk: 0x47, scan: 0x22, ext: false },
  T: { vk: 0x54, scan: 0x14, ext: false },
  Y: { vk: 0x59, scan: 0x15, ext: false },
  U: { vk: 0x55, scan: 0x16, ext: false },
  H: { vk: 0x48, scan: 0x23, ext: false },
  P: { vk: 0x50, scan: 0x19, ext: false }
};

export class PcGamepadManager {
  constructor() {
    this.activeProfile = 'fifa'; // Default to FIFA Classic
    this.connectedControllers = new Map();
    this.latestInputs = {};
    this.isInputSimulationActive = true;
    this.bridgeProcess = null;
    this.isBridgeReady = false;

    this.profiles = {
      fifa: {
        id: 'fifa',
        name: '⚽ فیفا کلاسیک (حرکت با جهت‌نما + پاس S، شوت D)',
        desc: 'حرکت با کلیدهای جهت‌نما، پاس کوتاه S، شوت D، سانتر A، پاس عمقی W، دویدن Shift/E',
        mappings: {
          'DPAD_UP': KEYS.UP,
          'DPAD_DOWN': KEYS.DOWN,
          'DPAD_LEFT': KEYS.LEFT,
          'DPAD_RIGHT': KEYS.RIGHT,
          'BTN_A': KEYS.S,       // Short Pass
          'BTN_B': KEYS.D,       // Shoot
          'BTN_X': KEYS.A,       // Cross / Long Pass
          'BTN_Y': KEYS.W,       // Through Ball
          'L1': KEYS.Q,          // Player Switch
          'R1': KEYS.E,          // Finesse / Sprint
          'L2': KEYS.C,          // Shield Ball
          'R2': KEYS.LSHIFT,     // Sprint
          'START': KEYS.SPACE,   // Space (Start in FIFA)
          'ENTER': KEYS.ENTER,   // Enter (Menu Advance)
          'SELECT': KEYS.ESCAPE  // Esc (Back / Pause)
        },
        player2Mappings: {
          'DPAD_UP': KEYS.I,
          'DPAD_DOWN': KEYS.K,
          'DPAD_LEFT': KEYS.J,
          'DPAD_RIGHT': KEYS.L,
          'BTN_A': KEYS.B,       // Short Pass
          'BTN_B': KEYS.N,       // Shoot
          'BTN_X': KEYS.V,       // Cross
          'BTN_Y': KEYS.G,       // Through Ball
          'L1': KEYS.T,          // Player Switch
          'R1': KEYS.Y,          // Sprint
          'L2': KEYS.H,          // Shield Ball
          'R2': KEYS.U,          // Sprint
          'START': KEYS.P,       // Player 2 Start
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
        }
      },
      fifa_wasd: {
        id: 'fifa_wasd',
        name: '⚽ فیفا مدرن (حرکت با WASD + پاس J، شوت K)',
        desc: 'حرکت با کلیدهای WASD، پاس با J، شوت با K، سانتر با L، پاس در عمق با I، دویدن با Shift/E',
        mappings: {
          'DPAD_UP': KEYS.W,
          'DPAD_DOWN': KEYS.S,
          'DPAD_LEFT': KEYS.A,
          'DPAD_RIGHT': KEYS.D,
          'BTN_A': KEYS.J,       // Short Pass
          'BTN_B': KEYS.K,       // Shoot
          'BTN_X': KEYS.L,       // Cross / Tackle
          'BTN_Y': KEYS.I,       // Through Ball
          'L1': KEYS.Q,          // Switch
          'R1': KEYS.E,          // Sprint
          'L2': KEYS.C,          // Shield
          'R2': KEYS.LSHIFT,     // Sprint
          'START': KEYS.SPACE,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': KEYS.UP,
          'DPAD_DOWN': KEYS.DOWN,
          'DPAD_LEFT': KEYS.LEFT,
          'DPAD_RIGHT': KEYS.RIGHT,
          'BTN_A': KEYS.B,
          'BTN_B': KEYS.N,
          'BTN_X': KEYS.V,
          'BTN_Y': KEYS.G,
          'L1': KEYS.T,
          'R1': KEYS.Y,
          'L2': KEYS.H,
          'R2': KEYS.U,
          'START': KEYS.P,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
        }
      },
      racing: {
        id: 'racing',
        name: '🏎️ مسابقه‌ای و اتومبیل‌رانی (Need for Speed / Forza)',
        desc: 'گاز با W/Up، ترمز با S/Down، نیترو با Space، ترمز دستی با Shift و فرمان با ژیروسکوپ گوشی',
        mappings: {
          'DPAD_UP': KEYS.UP,
          'DPAD_DOWN': KEYS.DOWN,
          'DPAD_LEFT': KEYS.LEFT,
          'DPAD_RIGHT': KEYS.RIGHT,
          'BTN_A': KEYS.W,       // Accelerate
          'BTN_B': KEYS.S,       // Brake
          'BTN_X': KEYS.SPACE,   // Nitro
          'BTN_Y': KEYS.C,       // Camera
          'L1': KEYS.LEFT,
          'R1': KEYS.RIGHT,
          'L2': KEYS.LSHIFT,     // Handbrake
          'R2': KEYS.W,          // Gas
          'START': KEYS.ENTER,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': KEYS.I,
          'DPAD_DOWN': KEYS.K,
          'DPAD_LEFT': KEYS.J,
          'DPAD_RIGHT': KEYS.L,
          'BTN_A': KEYS.I,
          'BTN_B': KEYS.K,
          'BTN_X': KEYS.P,
          'BTN_Y': KEYS.O,
          'L1': KEYS.J,
          'R1': KEYS.L,
          'L2': KEYS.U,
          'R2': KEYS.I,
          'START': KEYS.ENTER,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
        }
      },
      action: {
        id: 'action',
        name: '🎯 اکشن و شوتر (WASD + Action Keys)',
        desc: 'حرکت با WASD، پرش با Space، شلیک با کلیک چپ/Enter، نشستن با C',
        mappings: {
          'DPAD_UP': KEYS.W,
          'DPAD_DOWN': KEYS.S,
          'DPAD_LEFT': KEYS.A,
          'DPAD_RIGHT': KEYS.D,
          'BTN_A': KEYS.SPACE,   // Jump
          'BTN_B': KEYS.C,       // Crouch
          'BTN_X': KEYS.R,       // Reload
          'BTN_Y': KEYS.E,       // Interact
          'L1': KEYS.LSHIFT,    // Sprint
          'R1': KEYS.ENTER,     // Fire
          'L2': KEYS.Q,         // Melee
          'R2': KEYS.F,         // Grenade
          'START': KEYS.ESCAPE,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.TAB
        },
        player2Mappings: {
          'DPAD_UP': KEYS.I,
          'DPAD_DOWN': KEYS.K,
          'DPAD_LEFT': KEYS.J,
          'DPAD_RIGHT': KEYS.L,
          'BTN_A': KEYS.P,
          'BTN_B': KEYS.H,
          'BTN_X': KEYS.U,
          'BTN_Y': KEYS.Y,
          'L1': KEYS.O,
          'R1': KEYS.ENTER,
          'L2': KEYS.T,
          'R2': KEYS.G,
          'START': KEYS.ESCAPE,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.TAB
        }
      },
      retro: {
        id: 'retro',
        name: '🕹️ شبیه‌سازها و بازی‌های کلاسیک (RetroArch / MAME)',
        desc: 'چهار جهت جهت‌نما، دکمه‌های اصلی Z/X/A/S برای پلتفرمر و آرکید',
        mappings: {
          'DPAD_UP': KEYS.UP,
          'DPAD_DOWN': KEYS.DOWN,
          'DPAD_LEFT': KEYS.LEFT,
          'DPAD_RIGHT': KEYS.RIGHT,
          'BTN_A': KEYS.Z,
          'BTN_B': KEYS.X,
          'BTN_X': KEYS.A,
          'BTN_Y': KEYS.S,
          'L1': KEYS.Q,
          'R1': KEYS.E,
          'L2': KEYS.W,
          'R2': KEYS.D,
          'START': KEYS.ENTER,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': KEYS.I,
          'DPAD_DOWN': KEYS.K,
          'DPAD_LEFT': KEYS.J,
          'DPAD_RIGHT': KEYS.L,
          'BTN_A': KEYS.B,
          'BTN_B': KEYS.N,
          'BTN_X': KEYS.V,
          'BTN_Y': KEYS.G,
          'L1': KEYS.T,
          'R1': KEYS.Y,
          'L2': KEYS.U,
          'R2': KEYS.H,
          'START': KEYS.ENTER,
          'ENTER': KEYS.ENTER,
          'SELECT': KEYS.ESCAPE
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
    const keyDef = mappings[button];

    if (keyDef !== undefined) {
      this.sendWindowsKey(keyDef, state || 'down');
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

  sendWindowsKey(keyDef, state = 'down') {
    if (process.platform !== 'win32' || !keyDef) return;

    // Ensure bridge is alive
    if (!this.bridgeProcess || this.bridgeProcess.killed) {
      this.initNativeBridge();
    }

    const { vk, scan, ext = false } = keyDef;
    const isExtStr = ext ? 'true' : 'false';
    const command = state === 'up' 
      ? `KEY_UP:${vk},${scan},${isExtStr}` 
      : (state === 'tap' ? `KEY_TAP:${vk},${scan},${isExtStr}` : `KEY_DOWN:${vk},${scan},${isExtStr}`);

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
