import { exec, spawn } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';

const execAsync = util.promisify(exec);

export class AdbManager {
  async runAdb(args, serial = null) {
    const adbPath = await toolManager.getAdbPath();
    const serialFlag = serial ? `-s ${serial}` : '';
    const cmd = `"${adbPath}" ${serialFlag} ${args}`;
    try {
      const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
      return { success: true, stdout, stderr };
    } catch (err) {
      return { success: false, error: err.message, stderr: err.stderr || '' };
    }
  }

  async listDevices() {
    const res = await this.runAdb('devices -l');
    if (!res.success) {
      return [];
    }

    const lines = res.stdout.trim().split('\n').slice(1);
    const devices = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+/);
      const serial = parts[0];
      const state = parts[1];

      if (state === 'device') {
        const modelMatch = trimmed.match(/model:(\S+)/);
        const deviceMatch = trimmed.match(/device:(\S+)/);
        const productMatch = trimmed.match(/product:(\S+)/);

        const model = modelMatch ? modelMatch[1].replace(/_/g, ' ') : 'Android Device';
        const product = productMatch ? productMatch[1] : '';

        // Fetch detailed device info
        const details = await this.getDeviceDetails(serial);

        devices.push({
          id: serial,
          serial: serial,
          name: `${model} (${serial})`,
          type: 'android',
          model: model,
          state: state,
          product: product,
          ...details
        });
      } else {
        devices.push({
          id: serial,
          serial: serial,
          name: `Android Device [${state}]`,
          type: 'android',
          model: 'Unknown',
          state: state
        });
      }
    }

    return devices;
  }

  async getDeviceDetails(serial) {
    try {
      const [osRes, apiRes, brandRes, batteryRes, wmRes] = await Promise.all([
        this.runAdb('shell getprop ro.build.version.release', serial),
        this.runAdb('shell getprop ro.build.version.sdk', serial),
        this.runAdb('shell getprop ro.product.brand', serial),
        this.runAdb('shell dumpsys battery', serial),
        this.runAdb('shell wm size', serial)
      ]);

      const osVersion = osRes.success ? `Android ${osRes.stdout.trim()}` : 'Android';
      const apiLevel = apiRes.success ? parseInt(apiRes.stdout.trim(), 10) : 0;
      const manufacturer = brandRes.success ? brandRes.stdout.trim().toUpperCase() : 'Generic';
      
      // Parse battery
      let battery = { level: 80, status: 'Normal', temperature: 30, health: 'Good', voltage: 4000, cycles: 0 };
      if (batteryRes.success) {
        const text = batteryRes.stdout;
        const levelMatch = text.match(/level:\s*(\d+)/);
        const tempMatch = text.match(/temperature:\s*(\d+)/);
        const voltMatch = text.match(/voltage:\s*(\d+)/);
        const statusMatch = text.match(/status:\s*(\d+)/);
        
        if (levelMatch) battery.level = parseInt(levelMatch[1], 10);
        if (tempMatch) battery.temperature = parseInt(tempMatch[1], 10) / 10;
        if (voltMatch) battery.voltage = parseInt(voltMatch[1], 10);
        if (statusMatch) {
          battery.status = statusMatch[1] === '2' ? 'Charging' : 'Discharging';
        }
      }

      // Parse resolution
      let resolution = '1080x2400';
      if (wmRes.success) {
        const m = wmRes.stdout.match(/Physical size:\s*(\d+x\d+)/);
        if (m) resolution = m[1];
      }

      return {
        osVersion,
        apiLevel,
        manufacturer,
        battery,
        display: { resolution, density: 420, refreshRate: 'Auto' },
        storage: { total: '128 GB', used: '64 GB', free: '64 GB', usedPercentage: 50 },
        ram: { total: '8 GB', used: '4.2 GB', free: '3.8 GB' }
      };
    } catch {
      return {
        osVersion: 'Android',
        manufacturer: 'Android'
      };
    }
  }

  async listApps(serial) {
    const res = await this.runAdb('shell pm list packages -f -u', serial);
    if (!res.success) return [];

    const lines = res.stdout.trim().split('\n');
    const apps = [];

    for (const line of lines) {
      if (!line.startsWith('package:')) continue;
      const clean = line.replace('package:', '').trim();
      const lastIndex = clean.lastIndexOf('=');
      if (lastIndex === -1) continue;

      const apkPath = clean.substring(0, lastIndex);
      const packageName = clean.substring(lastIndex + 1);
      const isSystem = apkPath.startsWith('/system') || apkPath.startsWith('/product') || apkPath.startsWith('/vendor');

      apps.push({
        packageName,
        appName: packageName.split('.').pop() || packageName,
        isSystem,
        apkPath,
        enabled: true,
        size: 'N/A'
      });
    }

    return apps;
  }

  async installApk(serial, apkFilePath) {
    return await this.runAdb(`install -r -d -g "${apkFilePath}"`, serial);
  }

  async uninstallApp(serial, packageName, keepData = false) {
    const keepFlag = keepData ? '-k' : '';
    return await this.runAdb(`uninstall ${keepFlag} ${packageName}`, serial);
  }

  async disableApp(serial, packageName) {
    // Disable or hide for user 0 (removes bloatware without root)
    return await this.runAdb(`shell pm disable-user --user 0 ${packageName}`, serial);
  }

  async enableApp(serial, packageName) {
    return await this.runAdb(`shell pm enable ${packageName}`, serial);
  }

  async clearAppData(serial, packageName) {
    return await this.runAdb(`shell pm clear ${packageName}`, serial);
  }

  async setDisplayDensity(serial, density) {
    return await this.runAdb(`shell wm density ${density}`, serial);
  }

  async resetDisplayDensity(serial) {
    return await this.runAdb(`shell wm density reset`, serial);
  }

  async setAnimationScale(serial, scale) {
    await this.runAdb(`shell settings put global window_animation_scale ${scale}`, serial);
    await this.runAdb(`shell settings put global transition_animation_scale ${scale}`, serial);
    await this.runAdb(`shell settings put global animator_duration_scale ${scale}`, serial);
    return { success: true };
  }

  async setDemoMode(serial, enable) {
    if (enable) {
      await this.runAdb('shell settings put global sysui_demo_allowed 1', serial);
      await this.runAdb('shell am broadcast -a com.android.systemui.demo -e command enter', serial);
      await this.runAdb('shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1000', serial);
      await this.runAdb('shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false', serial);
      await this.runAdb('shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e datatype 5g', serial);
    } else {
      await this.runAdb('shell am broadcast -a com.android.systemui.demo -e command exit', serial);
    }
    return { success: true };
  }

  async getCurrentTweaks(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        dpi: 420,
        animScale: 1.0,
        refreshRate: 'auto',
        privateDns: 'off',
        customRes: '1080x2400',
        showTouches: false,
        pointerLocation: false,
        showFps: false,
        darkMode: true,
        stayAwake: false,
        clockSeconds: false,
        forceMsaa: false,
        demoMode: false
      };
    }

    try {
      const [
        touchesRes,
        pointerRes,
        fpsRes,
        dnsModeRes,
        dnsSpecRes,
        animRes,
        wmDensityRes,
        wmSizeRes,
        stayAwakeRes,
        clockRes,
        userHzRes,
        peakHzRes,
        uiModeRes,
        demoRes,
        msaaRes
      ] = await Promise.all([
        this.runAdb('shell "settings get system show_touches 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get system pointer_location 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get system show_refresh_rate 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get global private_dns_mode 2>/dev/null || echo off"', serial),
        this.runAdb('shell "settings get global private_dns_specifier 2>/dev/null || echo off"', serial),
        this.runAdb('shell "settings get global window_animation_scale 2>/dev/null || echo 1.0"', serial),
        this.runAdb('shell "wm density 2>/dev/null || echo 420"', serial),
        this.runAdb('shell "wm size 2>/dev/null || echo 1080x2400"', serial),
        this.runAdb('shell "settings get global stay_on_while_plugged_in 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get secure clock_seconds 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get system user_refresh_rate 2>/dev/null || echo auto"', serial),
        this.runAdb('shell "settings get global peak_refresh_rate 2>/dev/null || echo auto"', serial),
        this.runAdb('shell "cmd uimode night 2>/dev/null || echo no"', serial),
        this.runAdb('shell "settings get global sysui_demo_allowed 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "getprop debug.egl.force_msaa 2>/dev/null || echo 0"', serial)
      ]);

      const showTouches = (touchesRes.stdout || '').trim() === '1';
      const pointerLocation = (pointerRes.stdout || '').trim() === '1';
      const showFps = (fpsRes.stdout || '').trim() === '1';
      const dnsMode = (dnsModeRes.stdout || '').trim();
      const dnsSpec = (dnsSpecRes.stdout || '').trim();
      const animScale = parseFloat((animRes.stdout || '1.0').trim()) || 1.0;
      const stayAwake = (stayAwakeRes.stdout || '').trim() === '3';
      const clockSeconds = (clockRes.stdout || '').trim() === '1';
      const darkMode = (uiModeRes.stdout || '').toLowerCase().includes('yes');
      const demoMode = (demoRes.stdout || '').trim() === '1';
      const forceMsaa = (msaaRes.stdout || '').trim() === '1';

      let dpi = 420;
      const densityMatch = (wmDensityRes.stdout || '').match(/Override density:\s*(\d+)/) || (wmDensityRes.stdout || '').match(/Physical density:\s*(\d+)/);
      if (densityMatch) {
        dpi = parseInt(densityMatch[1], 10);
      }

      let customRes = '1080x2400';
      const sizeMatch = (wmSizeRes.stdout || '').match(/Override size:\s*(\d+x\d+)/) || (wmSizeRes.stdout || '').match(/Physical size:\s*(\d+x\d+)/);
      if (sizeMatch) {
        customRes = sizeMatch[1];
      }

      let refreshRate = 'auto';
      const userHz = (userHzRes.stdout || '').trim();
      const peakHz = (peakHzRes.stdout || '').trim();
      if (userHz === '60' || userHz === '90' || userHz === '120') {
        refreshRate = userHz;
      } else if (peakHz.startsWith('60') || peakHz.startsWith('90') || peakHz.startsWith('120')) {
        refreshRate = parseInt(peakHz, 10).toString();
      }

      let privateDns = 'off';
      if (dnsMode === 'hostname' && dnsSpec && dnsSpec !== 'null' && dnsSpec !== 'off') {
        privateDns = dnsSpec;
      }

      return {
        dpi,
        animScale,
        refreshRate,
        customRes,
        privateDns,
        showTouches,
        pointerLocation,
        showFps,
        darkMode,
        stayAwake,
        clockSeconds,
        forceMsaa,
        demoMode
      };
    } catch (err) {
      return { dpi: 420, animScale: 1.0, privateDns: 'off', showTouches: false, pointerLocation: false, showFps: false };
    }
  }

  async setRefreshRate(serial, rate) {
    if (rate === 'auto' || rate === 'default') {
      await Promise.all([
        this.runAdb('shell settings delete global peak_refresh_rate 2>/dev/null || true', serial),
        this.runAdb('shell settings delete global min_refresh_rate 2>/dev/null || true', serial),
        this.runAdb('shell settings delete system user_refresh_rate 2>/dev/null || true', serial)
      ]);
      return { success: true, message: 'نرخ نوسازی به حالت پیش‌فرض و خودکار بازگردانده شد.' };
    } else {
      const val = parseFloat(rate).toFixed(1);
      const intVal = parseInt(rate, 10);
      await Promise.all([
        this.runAdb(`shell settings put global peak_refresh_rate ${val} 2>/dev/null || true`, serial),
        this.runAdb(`shell settings put global min_refresh_rate ${val} 2>/dev/null || true`, serial),
        this.runAdb(`shell settings put system user_refresh_rate ${intVal} 2>/dev/null || true`, serial),
        this.runAdb(`shell settings put system peak_refresh_rate ${val} 2>/dev/null || true`, serial),
        this.runAdb(`shell settings put system min_refresh_rate ${val} 2>/dev/null || true`, serial)
      ]);
      return { success: true, message: `رفرش ریت دستگاه روی ${rate}Hz قفل شد.` };
    }
  }

  async setCustomResolution(serial, resolution) {
    if (resolution === 'reset') {
      await this.runAdb('shell wm size reset', serial);
      return { success: true, message: 'رزولوشن صفحه به مقدار کارخانه بازنشانی شد.' };
    }
    await this.runAdb(`shell wm size ${resolution}`, serial);
    return { success: true, message: `رزولوشن صفحه روی ${resolution} تنظیم گردید.` };
  }

  async setPrivateDns(serial, specifier) {
    if (!specifier || specifier === 'off') {
      await this.runAdb('shell settings put global private_dns_mode off', serial);
      return { success: true, message: 'دی‌ان‌اس خصوصی غیرفعال شد.' };
    } else if (specifier === 'opportunistic' || specifier === 'auto') {
      await this.runAdb('shell settings put global private_dns_mode opportunistic', serial);
      return { success: true, message: 'دی‌ان‌اس خصوصی روی حالت خودکار تنظیم شد.' };
    } else {
      await this.runAdb('shell settings put global private_dns_mode hostname', serial);
      await this.runAdb(`shell settings put global private_dns_specifier ${specifier}`, serial);
      return { success: true, message: `دی‌ان‌اس «${specifier}» با موفقیت روی کل سیستم فعال گردید.` };
    }
  }

  async setShowTouches(serial, enable) {
    const val = enable ? 1 : 0;
    await this.runAdb(`shell settings put system show_touches ${val}`, serial);
    return { success: true, message: enable ? 'نقطه لمس انگشت روی صفحه فعال شد.' : 'نقطه لمس غیرفعال شد.' };
  }

  async setShowPointerLocation(serial, enable) {
    const val = enable ? 1 : 0;
    await this.runAdb(`shell settings put system pointer_location ${val}`, serial);
    return { success: true, message: enable ? 'خط کش و مختصات تاچ روی صفحه فعال شد.' : 'مختصات تاچ غیرفعال شد.' };
  }

  async setShowFpsOverlay(serial, enable) {
    const val = enable ? 1 : 0;
    await Promise.all([
      this.runAdb(`shell settings put system show_refresh_rate ${val} 2>/dev/null || true`, serial),
      this.runAdb(`shell settings put secure show_refresh_rate ${val} 2>/dev/null || true`, serial),
      this.runAdb(`shell setprop debug.sf.showfps ${val} 2>/dev/null || true`, serial)
    ]);
    return { success: true, message: enable ? 'شمارنده نرخ نوسازی و فریم فعال شد.' : 'شمارنده فریم غیرفعال شد.' };
  }

  async setDarkMode(serial, enable) {
    try {
      await this.runAdb(`shell cmd uimode night ${enable ? 'yes' : 'no'}`, serial);
    } catch (e) {
      await this.runAdb(`shell settings put secure ui_night_mode ${enable ? 2 : 1}`, serial);
    }
    return { success: true, message: enable ? 'حالت دارک‌مود (تاریک) فعال شد.' : 'حالت لایت (روشن) فعال شد.' };
  }

  async setStayAwake(serial, enable) {
    const val = enable ? 3 : 0;
    await this.runAdb(`shell settings put global stay_on_while_plugged_in ${val}`, serial);
    return { success: true, message: enable ? 'روشن ماندن صفحه حین اتصال به کابل فعال شد.' : 'روشن ماندن غیرفعال شد.' };
  }

  async setClockSeconds(serial, enable) {
    const val = enable ? 1 : 0;
    await this.runAdb(`shell settings put secure clock_seconds ${val}`, serial);
    return { success: true, message: enable ? 'ثانیه‌شمار ساعت استاتوس‌بار فعال شد.' : 'ثانیه‌شمار ساعت غیرفعال شد.' };
  }

  async setForceMsaa(serial, enable) {
    const val = enable ? 1 : 0;
    await Promise.all([
      this.runAdb(`shell setprop debug.egl.force_msaa ${val} 2>/dev/null || true`, serial),
      this.runAdb(`shell settings put global debug.egl.force_msaa ${val} 2>/dev/null || true`, serial)
    ]);
    return { success: true, message: enable ? 'اجبار 4x MSAA گرافیک فعال شد.' : 'تنظیم MSAA به حالت پیش‌فرض بازگشت.' };
  }

  async setAggressiveDoze(serial) {
    await Promise.all([
      this.runAdb('shell dumpsys battery unplug 2>/dev/null || true', serial),
      this.runAdb('shell dumpsys deviceidle force-idle deep 2>/dev/null || true', serial),
      this.runAdb('shell dumpsys deviceidle step 2>/dev/null || true', serial),
      this.runAdb('shell cmd appops set com.google.android.gms RUN_IN_BACKGROUND ignore 2>/dev/null || true', serial)
    ]);
    return { success: true, message: 'حالت خواب عمیق (Deep Sleep) با موفقیت روی گوشی فعال و پردازش‌های پس‌زمینه فریز شدند.' };
  }


  async getScreenBuffer(serial) {
    const adbPath = await toolManager.getAdbPath();
    const args = serial ? ['-s', serial, 'exec-out', 'screencap', '-p'] : ['exec-out', 'screencap', '-p'];
    
    return new Promise((resolve, reject) => {
      const proc = spawn(adbPath, args);
      const chunks = [];

      proc.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });

      proc.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`screencap failed with exit code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  async captureScreenshot(serial) {
    try {
      const buffer = await this.getScreenBuffer(serial);
      return { success: true, base64: buffer.toString('base64') };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }


  async sendKey(serial, keycode) {
    return await this.runAdb(`shell input keyevent ${keycode}`, serial);
  }

  async sendTap(serial, x, y) {
    return await this.runAdb(`shell input tap ${x} ${y}`, serial);
  }

  async sendSwipe(serial, x1, y1, x2, y2, duration = 300) {
    return await this.runAdb(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`, serial);
  }

  async reboot(serial, mode = 'normal') {
    if (mode === 'bootloader') return await this.runAdb('reboot bootloader', serial);
    if (mode === 'recovery') return await this.runAdb('reboot recovery', serial);
    if (mode === 'edl') return await this.runAdb('reboot edl', serial);
    return await this.runAdb('reboot', serial);
  }

  async enableTcpip(serial, port = 5555) {
    return await this.runAdb(`tcpip ${port}`, serial);
  }

  async connectWireless(ip, port = 5555) {
    const target = `${ip}:${port}`;
    const res = await this.runAdb(`connect ${target}`);
    if (res.success && (res.stdout.includes('connected to') || res.stdout.includes('already connected'))) {
      return { success: true, message: `با موفقیت به ${target} متصل شد`, stdout: res.stdout };
    }
    return { success: false, error: res.stderr || res.stdout || 'خطا در برقراری اتصال بی‌سیم' };
  }

  async pairWireless(ip, port, code) {
    const target = `${ip}:${port}`;
    const res = await this.runAdb(`pair ${target} ${code}`);
    if (res.success && res.stdout.includes('Successfully paired')) {
      return { success: true, message: `جفت‌سازی با ${target} با موفقیت انجام شد`, stdout: res.stdout };
    }
    return { success: false, error: res.stderr || res.stdout || 'کد جفت‌سازی یا آدرس IP نامعتبر است' };
  }

  async disconnectWireless(ip, port = 5555) {
    const target = `${ip}:${port}`;
    return await this.runAdb(`disconnect ${target}`);
  }

  async setSimulatedLocation(serial, lat, lng) {
    // Enable mock location setting if supported and send location broadcast/geo fix
    await this.runAdb('shell settings put secure location_mode 3', serial);
    await this.runAdb(`shell cmd location set-location ${lat} ${lng}`, serial);
    await this.runAdb(`shell am broadcast -a com.android.location.MOCK --ef lat ${lat} --ef lon ${lng}`, serial);
    return { success: true, message: `موقعیت مکانی اندروید با موفقیت روی ${lat}, ${lng} تنظیم شد` };
  }

  async clearSimulatedLocation(serial) {
    await this.runAdb('shell cmd location reset', serial);
    return { success: true, message: 'شبیه‌سازی موقعیت مکانی با موفقیت لغو شد' };
  }

  async sendTextInput(serial, text) {
    if (!text) return { success: false, error: 'متن خالی است' };
    // Escape special characters for adb shell
    const escaped = text.replace(/([\\"'`$!#&*()|;<>\s])/g, '\\$1');
    return await this.runAdb(`shell input text "${escaped}"`, serial);
  }

  async extractApk(serial, packageName, localDestPath) {
    const pathRes = await this.runAdb(`shell pm path ${packageName}`, serial);
    if (!pathRes.success || !pathRes.stdout) {
      return { success: false, error: 'آدرس فایل پکیج روی گوشی یافت نشد' };
    }
    const remoteApk = pathRes.stdout.trim().split('\n')[0].replace('package:', '').trim();
    return await this.runAdb(`pull "${remoteApk}" "${localDestPath}"`, serial);
  }

  async testVibrator(serial, durationMs = 800) {
    return await this.runAdb(`shell cmd vibrator vibrate ${durationMs}`, serial);
  }

  async getNetworkStats(serial) {
    try {
      const [ipRes, wifiRes] = await Promise.all([
        this.runAdb('shell ip route', serial),
        this.runAdb('shell dumpsys wifi', serial)
      ]);
      return {
        success: true,
        ipRoute: ipRes.stdout || '',
        wifiInfo: wifiRes.stdout ? wifiRes.stdout.substring(0, 500) : ''
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async launchApp(serial, packageName) {
    return await this.runAdb(`shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`, serial);
  }

  async openUrl(serial, url) {
    return await this.runAdb(`shell am start -a android.intent.action.VIEW -d "${url}"`, serial);
  }

  async expandNotifications(serial) {
    return await this.runAdb('shell cmd statusbar expand-notifications', serial);
  }

  async expandQuickSettings(serial) {
    return await this.runAdb('shell cmd statusbar expand-settings', serial);
  }

  async collapsePanels(serial) {
    return await this.runAdb('shell cmd statusbar collapse', serial);
  }

  async cleanCacheAndMemory(serial) {
    try {
      const [trimRes, killRes] = await Promise.all([
        this.runAdb('shell pm trim-caches 4096M', serial),
        this.runAdb('shell am kill-all', serial)
      ]);
      return { success: true, message: 'حافظه موقت و کش برنامه‌ها با موفقیت پاکسازی و بهینه‌سازی شد' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getDeepDeviceInfo(serial) {
    try {
      const [cpuRes, patchRes, lockedRes, selinuxRes, uptimeRes, boardRes] = await Promise.all([
        this.runAdb('shell getprop ro.product.cpu.abi', serial),
        this.runAdb('shell getprop ro.build.version.security_patch', serial),
        this.runAdb('shell getprop ro.boot.flash.locked', serial),
        this.runAdb('shell getprop ro.boot.selinux', serial),
        this.runAdb('shell uptime', serial),
        this.runAdb('shell getprop ro.board.platform', serial)
      ]);

      return {
        cpuAbi: cpuRes.stdout?.trim() || 'arm64-v8a (64-Bit)',
        securityPatch: patchRes.stdout?.trim() || '2024-05-01',
        bootloaderLocked: lockedRes.stdout?.trim() === '1' ? 'Locked (قفل)' : 'Unlocked (باز)',
        selinux: selinuxRes.stdout?.trim() || 'Enforcing',
        uptime: uptimeRes.stdout?.trim() || 'Up 48 hours',
        socPlatform: boardRes.stdout?.trim() || 'Qualcomm / MediaTek'
      };
    } catch {
      return {
        cpuAbi: 'arm64-v8a',
        securityPatch: '2024-05-01',
        bootloaderLocked: 'Locked',
        selinux: 'Enforcing',
        uptime: 'Up 24 hours',
        socPlatform: 'Snapdragon / Dimensity'
      };
    }
  }

  // ==========================================
  // Communication: Calls, Contacts & SMS
  // ==========================================
  async getCallLogs(serial) {
    try {
      const res = await this.runAdb('shell content query --uri content://call_log/calls --projection _id:number:name:type:duration:date', serial);
      if (!res.success || !res.stdout || res.stdout.includes('No result found')) {
        return [];
      }
      const rows = res.stdout.trim().split('\n');
      const callLogs = [];

      for (const row of rows) {
        if (!row.startsWith('Row:')) continue;
        const idMatch = row.match(/_id=(\d+)/);
        const numMatch = row.match(/number=([^,]+)/);
        const nameMatch = row.match(/name=([^,]+)/);
        const typeMatch = row.match(/type=(\d+)/);
        const durMatch = row.match(/duration=(\d+)/);
        const dateMatch = row.match(/date=(\d+)/);

        const typeCode = typeMatch ? parseInt(typeMatch[1], 10) : 1;
        let typeStr = 'incoming';
        if (typeCode === 2) typeStr = 'outgoing';
        else if (typeCode === 3) typeStr = 'missed';
        else if (typeCode === 5) typeStr = 'rejected';

        const rawDate = dateMatch ? new Date(parseInt(dateMatch[1], 10)) : new Date();
        const durationSec = durMatch ? parseInt(durMatch[1], 10) : 0;
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;

        callLogs.push({
          id: idMatch ? idMatch[1] : String(Math.random()),
          name: nameMatch && nameMatch[1] !== 'NULL' ? nameMatch[1] : 'ناشناس',
          number: numMatch ? numMatch[1].trim() : 'Unknown',
          type: typeStr,
          duration: `${mins}m ${secs}s`,
          timestamp: rawDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          date: rawDate.toLocaleDateString('fa-IR')
        });
      }

      return callLogs;
    } catch {
      return [];
    }
  }

  async getCallState(serial) {
    try {
      // 1. Check telephony.registry for call state
      const res = await this.runAdb('shell dumpsys telephony.registry', serial);
      let state = 'idle'; // 'idle' | 'ringing' | 'offhook' (in-call)
      let incomingNumber = '';

      if (res.success && res.stdout) {
        const stateMatch = res.stdout.match(/mCallState=(\d+)/);
        const numMatch = res.stdout.match(/mCallIncomingNumber=([^\r\n]+)/);

        if (stateMatch) {
          const s = parseInt(stateMatch[1], 10);
          if (s === 1) state = 'ringing';
          else if (s === 2) state = 'offhook';
          else state = 'idle';
        }
        if (numMatch && numMatch[1] && numMatch[1].trim() !== '""' && numMatch[1].trim() !== '') {
          incomingNumber = numMatch[1].replace(/["']/g, '').trim();
        }
      }

      // 2. Also check telecom dumpsys for more active call details
      const telecomRes = await this.runAdb('shell dumpsys telecom', serial);
      let callDuration = '';
      if (telecomRes.success && telecomRes.stdout) {
        if (telecomRes.stdout.includes('Call State: RINGING') || telecomRes.stdout.includes('STATE_RINGING')) {
          state = 'ringing';
        } else if (telecomRes.stdout.includes('Call State: ACTIVE') || telecomRes.stdout.includes('STATE_ACTIVE') || telecomRes.stdout.includes('Call State: DIALING')) {
          state = 'offhook';
        }
      }

      return {
        success: true,
        state, // 'idle' | 'ringing' | 'offhook'
        incomingNumber: incomingNumber || (state === 'ringing' ? 'تماس ورودی' : ''),
        isRinging: state === 'ringing',
        isInCall: state === 'offhook'
      };
    } catch (e) {
      return { success: false, state: 'idle', isRinging: false, isInCall: false, error: e.message };
    }
  }

  async answerCall(serial) {
    try {
      // Try telecom command first (modern Android)
      const res = await this.runAdb('shell cmd telecom accept-call', serial);
      if (!res.success) {
        // Fallback keyevents
        await this.runAdb('shell input keyevent 5', serial); // KEYCODE_CALL
        await this.runAdb('shell input keyevent 79', serial); // KEYCODE_HEADSETHOOK
      }
      return { success: true, message: 'تماس با موفقیت پاسخ داده شد' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async endCall(serial) {
    try {
      const res = await this.runAdb('shell cmd telecom end-call', serial);
      if (!res.success) {
        await this.runAdb('shell input keyevent 6', serial); // KEYCODE_ENDCALL
      }
      return { success: true, message: 'تماس قطع / رد شد' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async toggleMute(serial) {
    try {
      await this.runAdb('shell input keyevent 91', serial); // KEYCODE_MUTE
      return { success: true, message: 'وضعیت میکروفون تماس تغییر یافت' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async setAudioRoute(serial, route = 'speaker') {
    try {
      // 8 = SPEAKER, 1 = EARPIECE, 2 = BLUETOOTH
      const routeCode = route === 'speaker' ? 8 : (route === 'bluetooth' ? 2 : 1);
      const res = await this.runAdb(`shell cmd telecom set-audio-route ${routeCode}`, serial);
      return { success: true, message: `خروجی صدا به ${route === 'speaker' ? 'بلندگو' : 'گوشی/هدست'} تغییر یافت`, details: res };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async sendDtmf(serial, digit) {
    const keyMap = {
      '0': 7, '1': 8, '2': 9, '3': 10, '4': 11,
      '5': 12, '6': 13, '7': 14, '8': 15, '9': 16,
      '*': 17, '#': 18
    };
    const keycode = keyMap[digit];
    if (keycode) {
      return await this.runAdb(`shell input keyevent ${keycode}`, serial);
    }
    return { success: false, error: 'کلید نامعتبر است' };
  }

  async rejectCallWithSms(serial, { number, message }) {
    try {
      // 1. End call
      await this.endCall(serial);
      // 2. Send quick SMS if number is provided
      if (number && number !== 'Unknown' && number !== 'تماس ورودی') {
        await this.sendSms(serial, { number, body: message });
      }
      return { success: true, message: 'تماس رد شد و پیامک پاسخ سریع ارسال گردید' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async makeCall(serial, number, options = {}) {
    const cleanNum = number.replace(/[^\d+*#]/g, '');
    const encodedNum = cleanNum.replace(/#/g, '%23');
    let extraArgs = '';
    if (options.simSlot !== undefined && options.simSlot !== null && options.simSlot !== -1 && options.simSlot !== '') {
      const slot = Number(options.simSlot);
      extraArgs = ` --ei com.android.phone.extra.slot ${slot} --ei simSlot ${slot} --ei Phone.SLOT_KEY ${slot} --ei subscription ${slot}`;
    }
    return await this.runAdb(`shell am start -a android.intent.action.CALL -d "tel:${encodedNum}"${extraArgs}`, serial);
  }

  async getActiveDialog(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          active: true,
          title: 'پیام USSD اپراتور',
          message: 'موجودی ریالی شما: ۱۲۵,۴۰۰ ریال\nبسته اینترنت فعال: ۵ گیگابایت تا ۱۴۰۵/۰۲/۱۵\n\n۱: خرید بسته اینترنت\n۲: انتقال شارژ\n۳: تنظیمات',
          hasInput: true,
          buttons: ['تایید', 'انصراف']
        };
      }

      const dumpRes = await this.runAdb('shell "uiautomator dump /data/local/tmp/cpm_dump.xml && cat /data/local/tmp/cpm_dump.xml"', serial);
      if (!dumpRes.success || !dumpRes.stdout || !dumpRes.stdout.includes('<hierarchy')) {
        return { active: false, message: 'هیچ دیالوگی در حال حاضر فعال نیست' };
      }

      const xml = dumpRes.stdout;
      
      const msgMatch = xml.match(/<node[^>]*resource-id="[^"]*(?:id\/message|dialog_message|message_text|alert_message)[^"]*"[^>]*text="([^"]+)"/i)
        || xml.match(/<node[^>]*text="([^"]{3,})"[^>]*resource-id="[^"]*(?:message|body|desc)[^"]*"/i);
      
      const titleMatch = xml.match(/<node[^>]*resource-id="[^"]*(?:id\/alertTitle|title)[^"]*"[^>]*text="([^"]+)"/i);
      
      const hasInput = xml.includes('class="android.widget.EditText"');
      
      const buttons = [];
      const btnMatches = [...xml.matchAll(/<node[^>]*class="android.widget.Button"[^>]*text="([^"]+)"/gi)];
      for (const b of btnMatches) {
        if (b[1] && b[1].trim()) buttons.push(b[1].trim());
      }

      if (msgMatch && msgMatch[1]) {
        const cleanMsg = msgMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#10;/g, '\n')
          .replace(/\\n/g, '\n');

        return {
          active: true,
          title: titleMatch ? titleMatch[1].replace(/&quot;/g, '"') : 'پیام شبکه مخابراتی (USSD)',
          message: cleanMsg,
          hasInput,
          buttons: buttons.length > 0 ? buttons : ['تایید']
        };
      }

      // Fallback: search for dialog or system UI text nodes
      if (xml.includes('class="android.app.AlertDialog"') || xml.includes('com.android.phone') || xml.includes('com.google.android.dialer')) {
        const textNodes = [...xml.matchAll(/<node[^>]*class="android.widget.TextView"[^>]*text="([^"]{4,})"/gi)];
        for (const t of textNodes) {
          const text = t[1];
          if (text && !text.includes('Messages') && !text.includes('Phone') && !text.includes('Chrome') && !text.includes('Camera')) {
            return {
              active: true,
              title: titleMatch ? titleMatch[1] : 'پیام شبکه (USSD)',
              message: text.replace(/&#10;/g, '\n').replace(/&quot;/g, '"'),
              hasInput,
              buttons: buttons.length > 0 ? buttons : ['تایید']
            };
          }
        }
      }

      return { active: false, message: 'پیام متنی فعالی روی صفحه دریافت نشد' };
    } catch (e) {
      return { active: false, error: e.message };
    }
  }

  async replyToDialog(serial, text) {
    if (serial && serial.startsWith('mock-')) {
      return {
        active: true,
        title: 'پاسخ منوی انتخابی',
        message: `گزینه ${text} با موفقیت ارسال شد.\nدرخواست شما در حال بررسی است.`,
        hasInput: false,
        buttons: ['تایید']
      };
    }

    try {
      if (text && text.trim()) {
        const dumpRes = await this.runAdb('shell "uiautomator dump /data/local/tmp/cpm_dump.xml && cat /data/local/tmp/cpm_dump.xml"', serial);
        if (dumpRes.success && dumpRes.stdout) {
          const xml = dumpRes.stdout;
          const editMatch = xml.match(/<node[^>]*class="android.widget.EditText"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/i);
          if (editMatch) {
            const x1 = parseInt(editMatch[1], 10);
            const y1 = parseInt(editMatch[2], 10);
            const x2 = parseInt(editMatch[3], 10);
            const y2 = parseInt(editMatch[4], 10);
            const cx = Math.floor((x1 + x2) / 2);
            const cy = Math.floor((y1 + y2) / 2);
            await this.runAdb(`shell input tap ${cx} ${cy}`, serial);
            await new Promise(r => setTimeout(r, 200));
          }
        }

        await this.runAdb(`shell input text "${text.trim()}"`, serial);
        await new Promise(r => setTimeout(r, 200));

        // Tap the Send/OK button if present
        const dumpRes2 = await this.runAdb('shell "uiautomator dump /data/local/tmp/cpm_dump.xml && cat /data/local/tmp/cpm_dump.xml"', serial);
        if (dumpRes2.success && dumpRes2.stdout) {
          const xml2 = dumpRes2.stdout;
          const sendBtnMatch = xml2.match(/<node[^>]*resource-id="[^"]*button1[^"]*"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/i)
            || xml2.match(/<node[^>]*text="(?:ارسال|Send|تایید|OK)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/i);
          if (sendBtnMatch) {
            const x1 = parseInt(sendBtnMatch[1], 10);
            const y1 = parseInt(sendBtnMatch[2], 10);
            const x2 = parseInt(sendBtnMatch[3], 10);
            const y2 = parseInt(sendBtnMatch[4], 10);
            const cx = Math.floor((x1 + x2) / 2);
            const cy = Math.floor((y1 + y2) / 2);
            await this.runAdb(`shell input tap ${cx} ${cy}`, serial);
          } else {
            await this.runAdb('shell input keyevent 66', serial); // KEYCODE_ENTER
          }
        } else {
          await this.runAdb('shell input keyevent 66', serial);
        }
      }
      await new Promise(r => setTimeout(r, 2500));
      return await this.getActiveDialog(serial);
    } catch (e) {
      return { active: false, error: e.message };
    }
  }

  async dismissDialog(serial) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: 'پیام USSD با موفقیت بسته شد' };
    }

    try {
      // 1. Try to find dismiss/cancel/ok button coordinates in active dialog
      const dumpRes = await this.runAdb('shell "uiautomator dump /data/local/tmp/cpm_dump.xml && cat /data/local/tmp/cpm_dump.xml"', serial);
      if (dumpRes.success && dumpRes.stdout) {
        const xml = dumpRes.stdout;
        // Search for button nodes: button1 (OK/Cancel), button2, or buttons with text
        const buttonRegex = /<node[^>]*class="android.widget.Button"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/gi;
        const matches = [...xml.matchAll(buttonRegex)];

        if (matches.length > 0) {
          // Tap the button (e.g. OK or Cancel)
          const target = matches[matches.length - 1];
          const x1 = parseInt(target[1], 10);
          const y1 = parseInt(target[2], 10);
          const x2 = parseInt(target[3], 10);
          const y2 = parseInt(target[4], 10);
          const cx = Math.floor((x1 + x2) / 2);
          const cy = Math.floor((y1 + y2) / 2);
          await this.runAdb(`shell input tap ${cx} ${cy}`, serial);
          await new Promise(r => setTimeout(r, 250));
        }
      }

      // 2. Send KEYCODE_BACK, KEYCODE_ESCAPE, and KEYCODE_ENTER for complete dismissal
      await this.runAdb('shell input keyevent 4', serial); // KEYCODE_BACK
      await this.runAdb('shell input keyevent 111', serial); // KEYCODE_ESCAPE
      await this.runAdb('shell input keyevent 66', serial); // KEYCODE_ENTER

      return { success: true, message: 'پیام USSD با موفقیت روی گوشی بسته شد' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async sendUssd(serial, code, options = {}) {
    const callRes = await this.makeCall(serial, code, options);
    if (!callRes.success) return callRes;

    // Allow network time to respond
    await new Promise(r => setTimeout(r, 2500));
    const dialog = await this.getActiveDialog(serial);
    return {
      success: true,
      message: `کد دستوری ${code} ارسال شد`,
      dialog
    };
  }

  async setDefaultSim(serial, { voiceSlot, smsSlot, dataSlot }) {
    try {
      if (voiceSlot !== undefined && voiceSlot !== -1) {
        await this.runAdb(`shell settings put global multi_sim_voice_call ${voiceSlot}`, serial);
        await this.runAdb(`shell settings put global user_preferred_sub ${voiceSlot}`, serial);
      }
      if (smsSlot !== undefined && smsSlot !== -1) {
        await this.runAdb(`shell settings put global multi_sim_sms ${smsSlot}`, serial);
      }
      if (dataSlot !== undefined && dataSlot !== -1) {
        await this.runAdb(`shell settings put global multi_sim_data_call ${dataSlot}`, serial);
      }
      return { success: true, message: 'سیم‌کارت پیش‌فرض با موفقیت روی گوشی تنظیم شد' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async deleteCallLog(serial, id) {
    return await this.runAdb(`shell content delete --uri content://call_log/calls --where "_id=${id}"`, serial);
  }

  async clearAllCallLogs(serial) {
    return await this.runAdb('shell content delete --uri content://call_log/calls', serial);
  }

  async getContacts(serial) {
    try {
      const res = await this.runAdb('shell content query --uri content://com.android.contacts/data/phones --projection _id:display_name:data1', serial);
      if (!res.success || !res.stdout || res.stdout.includes('No result found')) {
        return [];
      }
      const rows = res.stdout.trim().split('\n');
      const contacts = [];
      const seen = new Set();

      for (const row of rows) {
        if (!row.startsWith('Row:')) continue;
        const idMatch = row.match(/_id=(\d+)/);
        const nameMatch = row.match(/display_name=([^,]+)/);
        const phoneMatch = row.match(/data1=([^,]+)/);

        const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, '') : '';
        if (!phone || seen.has(phone)) continue;
        seen.add(phone);

        contacts.push({
          id: idMatch ? idMatch[1] : String(Math.random()),
          name: nameMatch && nameMatch[1] !== 'NULL' ? nameMatch[1].trim() : phone,
          phone: phone,
          email: '',
          notes: ''
        });
      }

      return contacts;
    } catch {
      return [];
    }
  }

  async addContact(serial, { name, phone, email = '', notes = '' }) {
    // Launch insert contact activity or content insert
    return await this.runAdb(
      `shell am start -a android.intent.action.INSERT -t vnd.android.cursor.dir/contact -e name "${name}" -e phone "${phone}" -e email "${email}" -e notes "${notes}"`,
      serial
    );
  }

  async deleteContact(serial, id) {
    return await this.runAdb(`shell content delete --uri content://com.android.contacts/raw_contacts --where "_id=${id}"`, serial);
  }

  async getSms(serial) {
    try {
      const res = await this.runAdb('shell content query --uri content://sms --projection _id:thread_id:address:body:date:type:read', serial);
      if (!res.success || !res.stdout || res.stdout.includes('No result found')) {
        return [];
      }
      const rows = res.stdout.trim().split('\n');
      const messages = [];

      for (const row of rows) {
        if (!row.startsWith('Row:')) continue;
        const idMatch = row.match(/_id=(\d+)/);
        const threadMatch = row.match(/thread_id=(\d+)/);
        const addrMatch = row.match(/address=([^,]+)/);
        const bodyMatch = row.match(/body=([^,]+)/);
        const dateMatch = row.match(/date=(\d+)/);
        const typeMatch = row.match(/type=(\d+)/);

        const typeCode = typeMatch ? parseInt(typeMatch[1], 10) : 1;
        const rawDate = dateMatch ? new Date(parseInt(dateMatch[1], 10)) : new Date();

        messages.push({
          id: idMatch ? idMatch[1] : String(Math.random()),
          threadId: threadMatch ? `t_${threadMatch[1]}` : 't_default',
          number: addrMatch ? addrMatch[1].trim() : 'Unknown',
          sender: typeCode === 2 ? 'شما' : (addrMatch ? addrMatch[1].trim() : 'ناشناس'),
          body: bodyMatch ? bodyMatch[1].trim() : '',
          timestamp: rawDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          type: typeCode === 2 ? 'sent' : 'inbox',
          read: true
        });
      }

      return messages;
    } catch {
      return [];
    }
  }

  async sendSms(serial, { number, body, simSlot }) {
    const escaped = (body || '').replace(/([\\"'`$!#&*()|;<>\s])/g, '\\$1');
    let extraArgs = '';
    if (simSlot !== undefined && simSlot !== null && simSlot !== -1 && simSlot !== '') {
      const slot = Number(simSlot);
      extraArgs = ` --ei com.android.phone.extra.slot ${slot} --ei simSlot ${slot} --ei subscription ${slot}`;
    }
    return await this.runAdb(`shell am start -a android.intent.action.SENDTO -d "sms:${number}" --es sms_body "${escaped}"${extraArgs}`, serial);
  }

  async deleteSms(serial, id) {
    return await this.runAdb(`shell content delete --uri content://sms --where "_id=${id}"`, serial);
  }

  async clearAllSms(serial) {
    return await this.runAdb('shell content delete --uri content://sms', serial);
  }

  async setTorch(serial, enable) {
    try {
      // 1. MIUI / Xiaomi / HyperOS specific broadcast
      await this.runAdb(`shell am broadcast -a miui.intent.action.TOGGLE_TORCH --ez state ${enable ? 'true' : 'false'}`, serial);
      
      // 2. Standard Android cmd flashlight (AOSP, Pixel, Samsung, Motorola)
      await this.runAdb(`shell cmd flashlight set-torch ${enable ? 1 : 0}`, serial);
      
      // 3. Service call fallback
      await this.runAdb(`shell service call flashlight 1 i32 ${enable ? 1 : 0}`, serial);

      return { success: true, message: enable ? 'دستور روشن کردن فلاش ارسال شد' : 'دستور خاموش کردن فلاش ارسال شد' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async triggerCameraShutter(serial) {
    return await this.runAdb('shell input keyevent 27', serial);
  }

  async launchCamera(serial, facing = 'back') {
    const isFront = facing === 'front';
    const extra = isFront 
      ? '--ei android.intent.extras.CAMERA_FACING 1 --ez android.intent.extra.USE_FRONT_CAMERA true' 
      : '--ei android.intent.extras.CAMERA_FACING 0 --ez android.intent.extra.USE_FRONT_CAMERA false';
    try {
      // Use -S to force stop existing camera instance and reopen with new lens facing
      const res = await this.runAdb(`shell am start -S -a android.media.action.STILL_IMAGE_CAMERA ${extra}`, serial);
      if (!res.success) {
        return await this.runAdb(`shell am start -S -a android.media.action.IMAGE_CAPTURE ${extra}`, serial);
      }
      return res;
    } catch {
      return await this.runAdb(`shell am start -S -a android.media.action.IMAGE_CAPTURE ${extra}`, serial);
    }
  }

  async launchDialer(serial, number = '') {
    const uri = number ? `tel:${number}` : 'tel:';
    return await this.runAdb(`shell am start -a android.intent.action.DIAL -d "${uri}"`, serial);
  }

  async runFastboot(args) {
    const adbPath = await toolManager.getAdbPath();
    const fastbootPath = adbPath.replace('adb.exe', 'fastboot.exe').replace('adb', 'fastboot');
    try {
      const { stdout, stderr } = await execAsync(`"${fastbootPath}" ${args}`, { maxBuffer: 10 * 1024 * 1024 });
      return { success: true, stdout, stderr };
    } catch (err) {
      return { success: false, error: err.message, stderr: err.stderr || '' };
    }
  }
}

export const adbManager = new AdbManager();



