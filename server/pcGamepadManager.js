import { spawn, exec } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adbManager } from './adbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pure Hardware ScanCodes (PS/2 Set 1) - 100% INDEPENDENT OF WINDOWS KEYBOARD LANGUAGE (FA/EN)
export const SC = {
  // Arrow Keys (Extended = true)
  UP: { scan: 0x48, ext: true },
  DOWN: { scan: 0x50, ext: true },
  LEFT: { scan: 0x4B, ext: true },
  RIGHT: { scan: 0x4D, ext: true },

  // Special System Keys
  SPACE: { scan: 0x39, ext: false },
  ENTER: { scan: 0x1C, ext: false },
  ESCAPE: { scan: 0x01, ext: false },
  TAB: { scan: 0x0F, ext: false },
  LSHIFT: { scan: 0x2A, ext: false },
  RSHIFT: { scan: 0x36, ext: false },
  LCTRL: { scan: 0x1D, ext: false },
  LALT: { scan: 0x38, ext: false },

  // Letters (Hardware scan code of physical key position on motherboard)
  W: { scan: 0x11, ext: false },
  A: { scan: 0x1E, ext: false },
  S: { scan: 0x1F, ext: false },
  D: { scan: 0x20, ext: false },
  Q: { scan: 0x10, ext: false },
  E: { scan: 0x12, ext: false },
  R: { scan: 0x13, ext: false },
  C: { scan: 0x2E, ext: false },
  F: { scan: 0x21, ext: false },
  Z: { scan: 0x2C, ext: false },
  X: { scan: 0x2D, ext: false },

  // Player 2 / Alternate Keys
  I: { scan: 0x17, ext: false },
  J: { scan: 0x24, ext: false },
  K: { scan: 0x25, ext: false },
  L: { scan: 0x26, ext: false },
  B: { scan: 0x30, ext: false },
  N: { scan: 0x31, ext: false },
  V: { scan: 0x2F, ext: false },
  G: { scan: 0x22, ext: false },
  T: { scan: 0x14, ext: false },
  Y: { scan: 0x15, ext: false },
  U: { scan: 0x16, ext: false },
  H: { scan: 0x23, ext: false },
  P: { scan: 0x19, ext: false },

  // Numpad Keys
  NUMPAD_8: { scan: 0x48, ext: false },
  NUMPAD_2: { scan: 0x50, ext: false },
  NUMPAD_4: { scan: 0x4B, ext: false },
  NUMPAD_6: { scan: 0x4D, ext: false },
  NUMPAD_1: { scan: 0x4F, ext: false },
  NUMPAD_3: { scan: 0x51, ext: false },
  NUMPAD_5: { scan: 0x4C, ext: false },
  NUMPAD_7: { scan: 0x47, ext: false },
  NUMPAD_9: { scan: 0x49, ext: false },
  NUMPAD_0: { scan: 0x52, ext: false }
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
          'DPAD_UP': SC.UP,
          'DPAD_DOWN': SC.DOWN,
          'DPAD_LEFT': SC.LEFT,
          'DPAD_RIGHT': SC.RIGHT,
          'BTN_A': SC.S,       // Short Pass
          'BTN_B': SC.D,       // Shoot
          'BTN_X': SC.A,       // Cross / Long Pass
          'BTN_Y': SC.W,       // Through Ball
          'L1': SC.Q,          // Player Switch
          'R1': SC.E,          // Finesse / Sprint
          'L2': SC.C,          // Shield Ball
          'R2': SC.LSHIFT,     // Sprint
          'START': SC.SPACE,   // Space (Start in FIFA)
          'ENTER': SC.ENTER,   // Enter (Menu Advance)
          'SELECT': SC.ESCAPE  // Esc (Back / Pause)
        },
        player2Mappings: {
          'DPAD_UP': SC.I,
          'DPAD_DOWN': SC.K,
          'DPAD_LEFT': SC.J,
          'DPAD_RIGHT': SC.L,
          'BTN_A': SC.B,       // Short Pass
          'BTN_B': SC.N,       // Shoot
          'BTN_X': SC.V,       // Cross
          'BTN_Y': SC.G,       // Through Ball
          'L1': SC.T,          // Player Switch
          'R1': SC.Y,          // Sprint
          'L2': SC.H,          // Shield Ball
          'R2': SC.U,          // Sprint
          'START': SC.P,       // Player 2 Start
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
        }
      },
      fifa_wasd: {
        id: 'fifa_wasd',
        name: '⚽ فیفا مدرن (حرکت با WASD + پاس J، شوت K)',
        desc: 'حرکت با کلیدهای WASD، پاس با J، شوت با K، سانتر با L، پاس در عمق با I، دویدن با Shift/E',
        mappings: {
          'DPAD_UP': SC.W,
          'DPAD_DOWN': SC.S,
          'DPAD_LEFT': SC.A,
          'DPAD_RIGHT': SC.D,
          'BTN_A': SC.J,       // Short Pass
          'BTN_B': SC.K,       // Shoot
          'BTN_X': SC.L,       // Cross / Tackle
          'BTN_Y': SC.I,       // Through Ball
          'L1': SC.Q,          // Switch
          'R1': SC.E,          // Sprint
          'L2': SC.C,          // Shield
          'R2': SC.LSHIFT,     // Sprint
          'START': SC.SPACE,
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': SC.NUMPAD_8,
          'DPAD_DOWN': SC.NUMPAD_2,
          'DPAD_LEFT': SC.NUMPAD_4,
          'DPAD_RIGHT': SC.NUMPAD_6,
          'BTN_A': SC.NUMPAD_1,
          'BTN_B': SC.NUMPAD_3,
          'BTN_X': SC.NUMPAD_5,
          'BTN_Y': SC.NUMPAD_7,
          'L1': SC.NUMPAD_9,
          'R1': SC.NUMPAD_0,
          'L2': SC.H,
          'R2': SC.U,
          'START': SC.P,
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
        }
      },
      racing: {
        id: 'racing',
        name: '🏎️ مسابقه‌ای و اتومبیل‌رانی (Need for Speed / Forza)',
        desc: 'گاز با W/Up، ترمز با S/Down، نیترو با Space، ترمز دستی با Shift و فرمان با ژیروسکوپ گوشی',
        mappings: {
          'DPAD_UP': SC.UP,
          'DPAD_DOWN': SC.DOWN,
          'DPAD_LEFT': SC.LEFT,
          'DPAD_RIGHT': SC.RIGHT,
          'BTN_A': SC.W,       // Accelerate
          'BTN_B': SC.S,       // Brake
          'BTN_X': SC.SPACE,   // Nitro
          'BTN_Y': SC.C,       // Camera
          'L1': SC.LEFT,
          'R1': SC.RIGHT,
          'L2': SC.LSHIFT,     // Handbrake
          'R2': SC.W,          // Gas
          'START': SC.ENTER,
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': SC.I,
          'DPAD_DOWN': SC.K,
          'DPAD_LEFT': SC.J,
          'DPAD_RIGHT': SC.L,
          'BTN_A': SC.I,
          'BTN_B': SC.K,
          'BTN_X': SC.P,
          'BTN_Y': SC.O,
          'L1': SC.J,
          'R1': SC.L,
          'L2': SC.U,
          'R2': SC.I,
          'START': SC.ENTER,
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
        }
      },
      action: {
        id: 'action',
        name: '🎯 اکشن و شوتر (WASD + Action Keys)',
        desc: 'حرکت با WASD، پرش با Space، شلیک با کلیک چپ/Enter، نشستن با C',
        mappings: {
          'DPAD_UP': SC.W,
          'DPAD_DOWN': SC.S,
          'DPAD_LEFT': SC.A,
          'DPAD_RIGHT': SC.D,
          'BTN_A': SC.SPACE,   // Jump
          'BTN_B': SC.C,       // Crouch
          'BTN_X': SC.R,       // Reload
          'BTN_Y': SC.E,       // Interact
          'L1': SC.LSHIFT,    // Sprint
          'R1': SC.ENTER,     // Fire
          'L2': SC.Q,         // Melee
          'R2': SC.F,         // Grenade
          'START': SC.ESCAPE,
          'ENTER': SC.ENTER,
          'SELECT': SC.TAB
        },
        player2Mappings: {
          'DPAD_UP': SC.I,
          'DPAD_DOWN': SC.K,
          'DPAD_LEFT': SC.J,
          'DPAD_RIGHT': SC.L,
          'BTN_A': SC.P,
          'BTN_B': SC.H,
          'BTN_X': SC.U,
          'BTN_Y': SC.Y,
          'L1': SC.O,
          'R1': SC.ENTER,
          'L2': SC.T,
          'R2': SC.G,
          'START': SC.ESCAPE,
          'ENTER': SC.ENTER,
          'SELECT': SC.TAB
        }
      },
      retro: {
        id: 'retro',
        name: '🕹️ شبیه‌سازها و بازی‌های کلاسیک (RetroArch / MAME)',
        desc: 'چهار جهت جهت‌نما، دکمه‌های اصلی Z/X/A/S برای پلتفرمر و آرکید',
        mappings: {
          'DPAD_UP': SC.UP,
          'DPAD_DOWN': SC.DOWN,
          'DPAD_LEFT': SC.LEFT,
          'DPAD_RIGHT': SC.RIGHT,
          'BTN_A': SC.Z,
          'BTN_B': SC.X,
          'BTN_X': SC.A,
          'BTN_Y': SC.S,
          'L1': SC.Q,
          'R1': SC.E,
          'L2': SC.W,
          'R2': SC.D,
          'START': SC.ENTER,
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
        },
        player2Mappings: {
          'DPAD_UP': SC.I,
          'DPAD_DOWN': SC.K,
          'DPAD_LEFT': SC.J,
          'DPAD_RIGHT': SC.L,
          'BTN_A': SC.B,
          'BTN_B': SC.N,
          'BTN_X': SC.V,
          'BTN_Y': SC.G,
          'L1': SC.T,
          'R1': SC.Y,
          'L2': SC.U,
          'R2': SC.H,
          'START': SC.ENTER,
          'ENTER': SC.ENTER,
          'SELECT': SC.ESCAPE
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
    const scObj = mappings[button];

    if (scObj !== undefined) {
      this.sendWindowsKey(scObj, state || 'down');
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

  sendWindowsKey(scObj, state = 'down') {
    if (process.platform !== 'win32' || !scObj) return;

    // Ensure bridge is alive
    if (!this.bridgeProcess || this.bridgeProcess.killed) {
      this.initNativeBridge();
    }

    const { scan, ext = false } = scObj;
    const isExtStr = ext ? 'true' : 'false';
    const command = state === 'up' ? `HW_UP:${scan},${isExtStr}` : (state === 'tap' ? `HW_TAP:${scan},${isExtStr}` : `HW_DOWN:${scan},${isExtStr}`);

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
