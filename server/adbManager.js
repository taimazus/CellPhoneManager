import { exec, spawn } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';
import { resolveAppDisplayName } from './appNameResolver.js';

const execAsync = util.promisify(exec);

export class AdbManager {
  async runAdb(args, serial = null) {
    if (serial && (serial.startsWith('mock-ios') || /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{16}$/.test(serial) || /^[0-9A-Fa-f]{40}$/.test(serial))) {
      return { success: false, error: 'این قابلیت مربوط به پروتکل ADB (دستگاه‌های اندروید) است و برای دستگاه‌های اپل از پروتکل‌های بومی iOS استفاده می‌شود.' };
    }
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
      const [osRes, apiRes, brandRes, batteryRes, wmSizeRes, wmDensityRes, dfRes, memRes, refreshRes] = await Promise.all([
        this.runAdb('shell getprop ro.build.version.release', serial),
        this.runAdb('shell getprop ro.build.version.sdk', serial),
        this.runAdb('shell getprop ro.product.brand', serial),
        this.runAdb('shell dumpsys battery', serial),
        this.runAdb('shell wm size 2>/dev/null || echo 1080x2400', serial),
        this.runAdb('shell wm density 2>/dev/null || echo 420', serial),
        this.runAdb('shell "df -k /data /sdcard 2>/dev/null || df -k 2>/dev/null || true"', serial),
        this.runAdb('shell "cat /proc/meminfo 2>/dev/null || true"', serial),
        this.runAdb('shell "settings get system user_refresh_rate 2>/dev/null || settings get global peak_refresh_rate 2>/dev/null || echo Auto"', serial)
      ]);

      const osVersion = osRes.success ? `Android ${osRes.stdout.trim()}` : 'Android';
      const apiLevel = apiRes.success ? parseInt(apiRes.stdout.trim(), 10) : 0;
      const manufacturer = brandRes.success ? brandRes.stdout.trim().toUpperCase() : 'Generic';
      
      // Parse battery
      let battery = { level: 80, status: 'Normal', temperature: 30, health: 'Good', voltage: 4000, cycles: 0 };
      if (batteryRes.success && batteryRes.stdout) {
        const text = batteryRes.stdout;
        const levelMatch = text.match(/level:\s*(\d+)/i);
        const tempMatch = text.match(/temperature:\s*(\d+)/i);
        const voltMatch = text.match(/voltage:\s*(\d+)/i);
        const statusMatch = text.match(/status:\s*(\d+)/i);
        const healthMatch = text.match(/health:\s*(\d+)/i);
        
        if (levelMatch) battery.level = parseInt(levelMatch[1], 10);
        if (tempMatch) battery.temperature = parseInt(tempMatch[1], 10) / 10;
        if (voltMatch) battery.voltage = parseInt(voltMatch[1], 10);
        if (statusMatch) {
          battery.status = statusMatch[1] === '2' ? 'Charging' : 'Discharging';
        }
        if (healthMatch) {
          const healthCode = parseInt(healthMatch[1], 10);
          battery.health = healthCode === 2 ? 'Good (عالی)' : (healthCode === 3 ? 'Overheat' : 'Normal');
        }
      }

      // Parse resolution & density
      let resolution = '1080x2400';
      if (wmSizeRes.success && wmSizeRes.stdout) {
        const overrideSize = wmSizeRes.stdout.match(/Override size:\s*(\d+x\d+)/i);
        const physSize = wmSizeRes.stdout.match(/Physical size:\s*(\d+x\d+)/i);
        if (overrideSize) resolution = overrideSize[1];
        else if (physSize) resolution = physSize[1];
      }

      let density = 420;
      if (wmDensityRes.success && wmDensityRes.stdout) {
        const overrideDpi = wmDensityRes.stdout.match(/Override density:\s*(\d+)/i);
        const physDpi = wmDensityRes.stdout.match(/Physical density:\s*(\d+)/i);
        if (overrideDpi) density = parseInt(overrideDpi[1], 10);
        else if (physDpi) density = parseInt(physDpi[1], 10);
      }

      let refreshRate = 'Auto';
      const rawHz = (refreshRes.stdout || '').trim();
      if (rawHz && rawHz !== 'null' && rawHz !== 'Auto') {
        const parsedHz = parseInt(rawHz, 10);
        if (!isNaN(parsedHz) && parsedHz > 0) refreshRate = `${parsedHz}Hz`;
      }

      // Parse real storage from df
      let storage = { total: '128 GB', used: '64 GB', free: '64 GB', usedPercentage: 50 };
      if (dfRes.success && dfRes.stdout) {
        const lines = dfRes.stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && (parts[0].includes('/data') || parts[5]?.includes('/data') || parts[0].includes('/sdcard') || parts[5]?.includes('/sdcard'))) {
            const totalK = parseInt(parts[1], 10);
            const usedK = parseInt(parts[2], 10);
            const freeK = parseInt(parts[3], 10);
            if (totalK > 0) {
              const totalGB = (totalK / 1024 / 1024).toFixed(1);
              const usedGB = (usedK / 1024 / 1024).toFixed(1);
              const freeGB = (freeK / 1024 / 1024).toFixed(1);
              const pct = Math.round((usedK / totalK) * 100);
              storage = {
                total: `${totalGB} GB`,
                used: `${usedGB} GB`,
                free: `${freeGB} GB`,
                usedPercentage: pct
              };
              break;
            }
          }
        }
      }

      // Parse real RAM from meminfo
      let ram = { total: '8 GB', used: '4.2 GB', free: '3.8 GB' };
      if (memRes.success && memRes.stdout) {
        const totalMatch = memRes.stdout.match(/MemTotal:\s*(\d+)/i);
        const availMatch = memRes.stdout.match(/MemAvailable:\s*(\d+)/i) || memRes.stdout.match(/MemFree:\s*(\d+)/i);
        if (totalMatch) {
          const totalK = parseInt(totalMatch[1], 10);
          const availK = availMatch ? parseInt(availMatch[1], 10) : totalK * 0.4;
          const usedK = Math.max(0, totalK - availK);
          const totalGB = (totalK / 1024 / 1024).toFixed(1);
          const usedGB = (usedK / 1024 / 1024).toFixed(1);
          const freeGB = (availK / 1024 / 1024).toFixed(1);
          ram = {
            total: `${totalGB} GB`,
            used: `${usedGB} GB`,
            free: `${freeGB} GB`
          };
        }
      }

      return {
        osVersion,
        apiLevel,
        manufacturer,
        battery,
        display: { resolution, density, refreshRate },
        storage,
        ram
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

      const appDisplayName = resolveAppDisplayName(packageName);
      apps.push({
        packageName,
        name: appDisplayName,
        appName: appDisplayName,
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
      const { mockDeviceManager } = await import('./mockDeviceManager.js');
      return mockDeviceManager.getTweaks(serial);
    }

    try {
      const [
        touchesRes,
        pointerRes,
        fpsRes,
        dnsModeRes,
        dnsSpecRes,
        animWinRes,
        animTransRes,
        animDurRes,
        wmDensityRes,
        wmSizeRes,
        stayAwakeRes,
        clockRes,
        userHzRes,
        peakHzRes,
        minHzRes,
        uiModeRes,
        nightModeSettingRes,
        demoRes,
        msaaRes
      ] = await Promise.all([
        this.runAdb('shell "settings get system show_touches 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get system pointer_location 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get system show_refresh_rate 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get global private_dns_mode 2>/dev/null || echo off"', serial),
        this.runAdb('shell "settings get global private_dns_specifier 2>/dev/null || echo off"', serial),
        this.runAdb('shell "settings get global window_animation_scale 2>/dev/null || echo 1.0"', serial),
        this.runAdb('shell "settings get global transition_animation_scale 2>/dev/null || echo 1.0"', serial),
        this.runAdb('shell "settings get global animator_duration_scale 2>/dev/null || echo 1.0"', serial),
        this.runAdb('shell "wm density 2>/dev/null || echo 420"', serial),
        this.runAdb('shell "wm size 2>/dev/null || echo 1080x2400"', serial),
        this.runAdb('shell "settings get global stay_on_while_plugged_in 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get secure clock_seconds 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get system user_refresh_rate 2>/dev/null || echo auto"', serial),
        this.runAdb('shell "settings get global peak_refresh_rate 2>/dev/null || echo auto"', serial),
        this.runAdb('shell "settings get global min_refresh_rate 2>/dev/null || echo auto"', serial),
        this.runAdb('shell "cmd uimode night 2>/dev/null || echo no"', serial),
        this.runAdb('shell "settings get secure ui_night_mode 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "settings get global sysui_demo_allowed 2>/dev/null || echo 0"', serial),
        this.runAdb('shell "getprop debug.egl.force_msaa 2>/dev/null || settings get global force_msaa 2>/dev/null || echo 0"', serial)
      ]);

      const showTouches = (touchesRes.stdout || '').trim() === '1';
      const pointerLocation = (pointerRes.stdout || '').trim() === '1';
      const showFps = (fpsRes.stdout || '').trim() === '1';
      const dnsMode = (dnsModeRes.stdout || '').trim().toLowerCase();
      const dnsSpec = (dnsSpecRes.stdout || '').trim();
      
      // Parse animation scale (prefer window, fallback to transition or 1.0)
      let animScale = 1.0;
      const rawWin = (animWinRes.stdout || '').trim();
      const rawTrans = (animTransRes.stdout || '').trim();
      if (rawWin && rawWin !== 'null' && !isNaN(parseFloat(rawWin))) {
        animScale = parseFloat(rawWin);
      } else if (rawTrans && rawTrans !== 'null' && !isNaN(parseFloat(rawTrans))) {
        animScale = parseFloat(rawTrans);
      }

      // Stay awake: values 1, 2, 3, 7 represent different plug-in states
      const stayAwakeVal = parseInt((stayAwakeRes.stdout || '0').trim(), 10) || 0;
      const stayAwake = stayAwakeVal > 0;

      const clockSeconds = (clockRes.stdout || '').trim() === '1';
      
      // Dark mode: check both uimode and secure ui_night_mode
      const nightOut = (uiModeRes.stdout || '').toLowerCase();
      const nightSetting = (nightModeSettingRes.stdout || '').trim();
      const darkMode = nightOut.includes('yes') || nightSetting === '2';

      const demoMode = (demoRes.stdout || '').trim() === '1';
      const forceMsaa = (msaaRes.stdout || '').trim() === '1';

      let dpi = 420;
      if (wmDensityRes.stdout) {
        const overrideDpi = wmDensityRes.stdout.match(/Override density:\s*(\d+)/i);
        const physDpi = wmDensityRes.stdout.match(/Physical density:\s*(\d+)/i);
        if (overrideDpi) dpi = parseInt(overrideDpi[1], 10);
        else if (physDpi) dpi = parseInt(physDpi[1], 10);
      }

      let customRes = '1080x2400';
      if (wmSizeRes.stdout) {
        const overrideSize = wmSizeRes.stdout.match(/Override size:\s*(\d+x\d+)/i);
        const physSize = wmSizeRes.stdout.match(/Physical size:\s*(\d+x\d+)/i);
        if (overrideSize) customRes = overrideSize[1];
        else if (physSize) customRes = physSize[1];
      }

      let refreshRate = 'auto';
      const userHz = (userHzRes.stdout || '').trim();
      const peakHz = (peakHzRes.stdout || '').trim();
      if (userHz === '60' || userHz === '90' || userHz === '120' || userHz === '144') {
        refreshRate = userHz;
      } else if (peakHz.startsWith('60') || peakHz.startsWith('90') || peakHz.startsWith('120') || peakHz.startsWith('144')) {
        refreshRate = parseInt(peakHz, 10).toString();
      }

      let privateDns = 'off';
      if (dnsMode === 'hostname' && dnsSpec && dnsSpec !== 'null' && dnsSpec !== 'off') {
        privateDns = dnsSpec;
      } else if (dnsMode === 'opportunistic' || dnsMode === 'auto') {
        privateDns = 'auto';
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
      return { dpi: 420, animScale: 1.0, refreshRate: 'auto', privateDns: 'off', customRes: '1080x2400', showTouches: false, pointerLocation: false, showFps: false };
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
    const rawError = res.stderr || res.stdout || '';
    let errorMsg = rawError || 'کد جفت‌سازی یا آدرس IP نامعتبر است';
    if (String(port).trim() === '5555' || rawError.includes('protocol fault') || rawError.includes("couldn't read status message")) {
      errorMsg = 'خطای پروتکل: پورت جفت‌سازی ۵۵۵۵ نیست! لطفاً در گوشی به بخش Wireless Debugging > Pair device بروید و پورت ۵ رقمی موقتی (مثلاً ۳۸۲۴۱) که کنار IP نمایش داده می‌شود را وارد کنید و پنجره را باز نگه دارید.';
    }
    return { success: false, error: errorMsg };
  }

  generateQrPairingSession() {
    const randomHex = Math.random().toString(36).substring(2, 8);
    const serviceName = `studio-${randomHex}`;
    const password = String(Math.floor(100000 + Math.random() * 900000));
    const qrString = `WIFI:T:ADB;S:${serviceName};P:${password};;`;
    return {
      serviceName,
      password,
      qrString
    };
  }

  async getMdnsServices() {
    const res = await this.runAdb('mdns services');
    if (!res.success || !res.stdout) return [];
    const lines = res.stdout.split('\n');
    const services = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('List of')) continue;
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const [instanceName, serviceType, ipPort] = parts;
        const [ip, portStr] = ipPort.split(':');
        services.push({
          instanceName,
          serviceType,
          ipPort,
          ip,
          port: portStr ? parseInt(portStr, 10) : undefined
        });
      }
    }
    return services;
  }

  async checkAndPairQr(serviceName, password) {
    const services = await this.getMdnsServices();
    
    // Look for pairing service matching serviceName or any newly advertised pairing service
    let pairingTarget = services.find(s => 
      s.serviceType === '_adb-tls-pairing._tcp' && 
      (s.instanceName === serviceName || s.instanceName.includes(serviceName))
    );

    if (!pairingTarget) {
      const pairingServices = services.filter(s => s.serviceType === '_adb-tls-pairing._tcp');
      if (pairingServices.length === 1) {
        pairingTarget = pairingServices[0];
      }
    }

    if (!pairingTarget) {
      return { 
        status: 'waiting', 
        message: 'در انتظار اسکن بارکد QR توسط دوربین گوشی...',
        discoveredCount: services.length 
      };
    }

    const { ip, port } = pairingTarget;
    const pairRes = await this.pairWireless(ip, port, password);
    if (!pairRes.success) {
      return {
        status: 'error',
        error: pairRes.error || 'خطا در جفت‌سازی دستگاه با بارکد QR',
        target: `${ip}:${port}`
      };
    }

    // Try to auto-connect to _adb-tls-connect._tcp
    await new Promise(r => setTimeout(r, 800));
    const freshServices = await this.getMdnsServices();
    const connectTarget = freshServices.find(s => 
      s.serviceType === '_adb-tls-connect._tcp' && s.ip === ip
    );

    let connectRes = null;
    if (connectTarget) {
      connectRes = await this.connectWireless(connectTarget.ip, connectTarget.port);
    } else {
      connectRes = await this.connectWireless(ip, 5555);
    }

    return {
      status: 'success',
      paired: true,
      connected: connectRes?.success ?? false,
      ip,
      port,
      message: `دستگاه (${ip}) با موفقیت از طریق بارکد QR جفت‌سازی و متصل شد!`
    };
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
    await this.runAdb(`shell cmd vibrator_manager synced -f -B oneshot ${durationMs} 255`, serial);
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
    if (!packageName) return { success: false, error: 'شناسه بسته نامعتبر است' };

    const packageAliases = {
      'com.android.gallery3d': [
        'com.miui.gallery',
        'com.sec.android.gallery3d',
        'com.google.android.apps.photos',
        'com.google.android.apps.photosgo',
        'com.google.ai.edge.gallery',
        'com.coloros.gallery3d',
        'com.huawei.photos',
        'com.android.gallery3d',
        'com.motorola.cn.gallery'
      ],
      'com.google.android.documentsui': [
        'com.mi.android.globalFileexplorer',
        'com.android.fileexplorer',
        'com.sec.android.app.myfiles',
        'com.google.android.apps.nbu.files',
        'com.google.android.documentsui',
        'com.coloros.filemanager',
        'com.huawei.hidisk',
        'com.motorola.filemanager'
      ],
      'com.android.camera': [
        'com.android.camera',
        'com.android.camera2',
        'com.sec.android.app.camera',
        'com.google.android.GoogleCamera',
        'com.huawei.camera',
        'org.codeaurora.snapcam'
      ],
      'com.android.chrome': [
        'com.android.chrome',
        'com.sec.android.app.sbrowser',
        'com.mi.globalbrowser',
        'org.mozilla.firefox',
        'com.opera.browser',
        'com.brave.browser',
        'com.android.browser'
      ],
      'org.telegram.messenger': [
        'org.telegram.messenger',
        'org.telegram.messenger.web',
        'org.thunderdog.challegram',
        'org.telegram.plus'
      ],
      'com.whatsapp': [
        'com.whatsapp',
        'com.whatsapp.w4b'
      ],
      'com.google.android.youtube': [
        'com.google.android.youtube',
        'app.revanced.android.youtube',
        'com.google.android.apps.youtube.mango'
      ],
      'com.android.settings': [
        'com.android.settings'
      ]
    };

    const candidates = packageAliases[packageName] || [packageName];

    for (const pkg of candidates) {
      const monkeyRes = await this.runAdb(`shell "monkey -p ${pkg} -c android.intent.category.LAUNCHER 1"`, serial);
      if (monkeyRes.success && monkeyRes.stdout && monkeyRes.stdout.includes('Events injected: 1')) {
        return { success: true, message: `برنامه با موفقیت در گوشی باز شد (${pkg})` };
      }
    }

    // Fallback to Android intents if monkey matching didn't launch
    if (packageName.includes('gallery') || packageName.includes('photos')) {
      const intentRes = await this.runAdb(`shell "am start -a android.intent.action.VIEW -t image/*"`, serial);
      if (intentRes.success && (!intentRes.stderr || !intentRes.stderr.includes('Error'))) {
        return { success: true, message: 'گالری با موفقیت باز شد' };
      }
    }
    if (packageName.includes('file') || packageName.includes('documents')) {
      const intentRes = await this.runAdb(`shell "am start -a android.intent.action.VIEW -t */*"`, serial);
      if (intentRes.success && (!intentRes.stderr || !intentRes.stderr.includes('Error'))) {
        return { success: true, message: 'مدیریت فایل با موفقیت باز شد' };
      }
    }
    if (packageName.includes('camera')) {
      const intentRes = await this.runAdb(`shell "am start -a android.media.action.IMAGE_CAPTURE"`, serial);
      if (intentRes.success && (!intentRes.stderr || !intentRes.stderr.includes('Error'))) {
        return { success: true, message: 'دوربین با موفقیت باز شد' };
      }
    }
    if (packageName.includes('settings')) {
      const intentRes = await this.runAdb(`shell "am start -a android.settings.SETTINGS"`, serial);
      if (intentRes.success && (!intentRes.stderr || !intentRes.stderr.includes('Error'))) {
        return { success: true, message: 'تنظیمات با موفقیت باز شد' };
      }
    }

    return { success: false, error: 'برنامه مورد نظر روی این گوشی یافت نشد یا در دسترس نیست.' };
  }


  async openUrl(serial, url) {
    if (!url || typeof url !== 'string') return { success: false, error: 'آدرس اینترنتی نامعتبر است' };
    const safeUrl = url.trim().replace(/["\r\n`$!&;]/g, '');
    return await this.runAdb(`shell am start -a android.intent.action.VIEW -d "${safeUrl}"`, serial);
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

        const durationSec = durMatch ? parseInt(durMatch[1], 10) : 0;
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const dateNum = dateMatch ? parseInt(dateMatch[1], 10) : Date.now();
        const rawDate = new Date(dateNum);

        callLogs.push({
          id: idMatch ? idMatch[1] : String(Math.random()),
          name: nameMatch && nameMatch[1] !== 'NULL' ? nameMatch[1] : 'ناشناس',
          number: numMatch ? numMatch[1].trim() : 'Unknown',
          type: typeStr,
          duration: `${mins}m ${secs}s`,
          rawDuration: durationSec,
          timestamp: rawDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          date: rawDate.toLocaleDateString('fa-IR'),
          rawDate: dateNum,
          isoDate: rawDate.toISOString()
        });
      }

      return callLogs;
    } catch {
      return [];
    }
  }

  async getCallState(serial) {
    try {
      // 1. Check telephony.registry for call state across all subscriptions (multi-SIM)
      const res = await this.runAdb('shell dumpsys telephony.registry', serial);
      let state = 'idle'; // 'idle' | 'ringing' | 'offhook' (in-call)
      let incomingNumber = '';
      let detectedByTelephony = false;

      if (res.success && res.stdout) {
        const callStateMatches = [...res.stdout.matchAll(/mCallState=(\d+)/g)];
        const ringingMatches = [...res.stdout.matchAll(/mRingingCallState=(\d+)/g)];
        const fgMatches = [...res.stdout.matchAll(/mForegroundCallState=(\d+)/g)];
        const numMatch = res.stdout.match(/mCallIncomingNumber=([^\r\n]+)/);

        const callStates = callStateMatches.map(m => parseInt(m[1], 10));
        const ringingStates = ringingMatches.map(m => parseInt(m[1], 10));
        const fgStates = fgMatches.map(m => parseInt(m[1], 10));

        if (callStates.length > 0 || ringingStates.length > 0 || fgStates.length > 0) {
          detectedByTelephony = true;
          if (callStates.some(s => s === 1) || ringingStates.some(s => s === 1)) {
            state = 'ringing';
          } else if (callStates.some(s => s === 2) || fgStates.some(s => s > 0 && s !== 7 && s !== 8)) {
            // 7 = DISCONNECTED, 8 = DISCONNECTING
            state = 'offhook';
          } else {
            state = 'idle';
          }
        }

        if (numMatch && numMatch[1] && numMatch[1].trim() !== '""' && numMatch[1].trim() !== '') {
          incomingNumber = numMatch[1].replace(/["']/g, '').trim();
        }
      }

      // 2. If telephony was not detected or indicated idle, verify telecom dumpsys active calls section
      // (ensuring historical log entries like SET_ACTIVE do NOT cause false positives)
      if (!detectedByTelephony || state === 'idle') {
        const telecomRes = await this.runAdb('shell dumpsys telecom', serial);
        if (telecomRes.success && telecomRes.stdout) {
          const stdout = telecomRes.stdout;
          const hasActiveDialing = /Active dialing, or connecting calls:\s*\n\s*Call \{/i.test(stdout);
          const hasRingingCalls = /Ringing calls:\s*\n\s*Call \{/i.test(stdout);
          const hasActiveCalls = /Foreground call:\s*\n\s*Call \{/i.test(stdout);
          const mCallsMatch = stdout.match(/mCalls:\s*([\s\S]*?)(?:mCallAudioManager:|Pending Msg:|$)/);
          const mCallsContent = mCallsMatch ? mCallsMatch[1] : '';
          const hasCallInMCalls = /Call \{[^}]*state=(?:ACTIVE|DIALING|RINGING|CONNECTING)/i.test(mCallsContent);

          if (hasRingingCalls || /Call \{[^}]*state=RINGING/i.test(mCallsContent)) {
            state = 'ringing';
          } else if (hasActiveDialing || hasActiveCalls || hasCallInMCalls) {
            state = 'offhook';
          } else if (detectedByTelephony) {
            state = 'idle';
          }
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

        const escapedText = (text || '').trim().replace(/([\\"'`$!#&*()|;<>\s])/g, '\\$1');
        await this.runAdb(`shell input text "${escapedText}"`, serial);
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
      const res = await this.runAdb('shell content query --uri content://com.android.contacts/data/phones --projection _id:raw_contact_id:contact_id:display_name:data1:data4:account_name:account_type:company', serial);
      let output = res.stdout || '';

      if (!res.success || !output || output.includes('No result found')) {
        const fallbackRes = await this.runAdb('shell content query --uri content://com.android.contacts/data/phones', serial);
        if (fallbackRes.success && fallbackRes.stdout && !fallbackRes.stdout.includes('No result found')) {
          output = fallbackRes.stdout;
        } else {
          return [];
        }
      }

      const rows = output.trim().split('\n');
      const contactsMap = new Map();

      const getSourceInfo = (accType = '', accName = '') => {
        const type = String(accType).toLowerCase();
        const name = String(accName).toLowerCase();
        if (type.includes('google') || name.includes('@gmail') || name.includes('@google')) {
          return { key: 'google', label: `گوگل (${accName || 'Google'})`, icon: 'google' };
        }
        if (type.includes('xiaomi') || name.includes('mi') || name.includes('xiaomi')) {
          return { key: 'xiaomi', label: `شیائومی (${accName || 'Mi Cloud'})`, icon: 'xiaomi' };
        }
        if (type.includes('whatsapp.w4b')) {
          return { key: 'whatsapp_business', label: 'واتساپ تجاری (Business)', icon: 'whatsapp' };
        }
        if (type.includes('whatsapp')) {
          return { key: 'whatsapp', label: 'واتساپ (WhatsApp)', icon: 'whatsapp' };
        }
        if (type.includes('telegram')) {
          return { key: 'telegram', label: 'تلگرام (Telegram)', icon: 'telegram' };
        }
        if (type.includes('eitaa')) {
          return { key: 'eitaa', label: 'ایتا (Eitaa)', icon: 'eitaa' };
        }
        if (type.includes('sim') || name.includes('sim')) {
          return { key: 'sim', label: `سیم‌کارت (${accName || 'SIM'})`, icon: 'sim' };
        }
        if (type.includes('local') || type.includes('phone') || name.includes('phone') || name.includes('device')) {
          return { key: 'device', label: 'حافظه داخلی گوشی', icon: 'device' };
        }
        if (accName || accType) {
          return { key: 'other', label: `${accName || accType}`, icon: 'account' };
        }
        return { key: 'device', label: 'حافظه دستگاه', icon: 'device' };
      };

      for (const row of rows) {
        if (!row.startsWith('Row:')) continue;

        const idMatch = row.match(/_id=(\d+)/);
        const rawContactMatch = row.match(/raw_contact_id=(\d+)/);
        const contactIdMatch = row.match(/contact_id=(\d+)/);
        const nameMatch = row.match(/display_name=([^,]+)/);
        const data1Match = row.match(/data1=([^,]+)/);
        const data4Match = row.match(/data4=([^,]+)/);
        const accNameMatch = row.match(/account_name=([^,]+)/);
        const accTypeMatch = row.match(/account_type=([^,]+)/);
        const companyMatch = row.match(/company=([^,]+)/);

        const id = idMatch ? idMatch[1] : '';
        const rawContactId = rawContactMatch ? rawContactMatch[1] : id;
        const contactId = contactIdMatch ? contactIdMatch[1] : id;
        const rawName = nameMatch && nameMatch[1] !== 'NULL' ? nameMatch[1].trim() : '';
        const d1 = data1Match && data1Match[1] !== 'NULL' ? data1Match[1].trim() : '';
        const d4 = data4Match && data4Match[1] !== 'NULL' ? data4Match[1].trim() : '';
        const accName = accNameMatch && accNameMatch[1] !== 'NULL' ? accNameMatch[1].trim() : '';
        const accType = accTypeMatch && accTypeMatch[1] !== 'NULL' ? accTypeMatch[1].trim() : '';
        const company = companyMatch && companyMatch[1] !== 'NULL' ? companyMatch[1].trim() : '';

        // Determine real phone number
        let phone = '';
        if (d1 && /\d/.test(d1)) {
          phone = d1.replace(/\s+/g, '');
        } else if (d4 && /\d/.test(d4)) {
          phone = d4.replace(/\s+/g, '');
        } else if (d1) {
          phone = d1.replace(/\s+/g, '');
        } else if (d4) {
          phone = d4.replace(/\s+/g, '');
        }

        const name = rawName || phone || 'مخاطب بدون نام';
        const sourceInfo = getSourceInfo(accType, accName);
        const contactKey = `${rawContactId || id}_${phone}`;

        if (!contactsMap.has(contactKey)) {
          contactsMap.set(contactKey, {
            id: id || rawContactId || String(Math.random()),
            rawContactId: rawContactId || id,
            contactId: contactId,
            name: name,
            phone: phone,
            email: '',
            notes: '',
            company: company,
            accountName: accName,
            accountType: accType,
            sourceKey: sourceInfo.key,
            sourceLabel: sourceInfo.label,
            sourceIcon: sourceInfo.icon
          });
        }
      }

      return Array.from(contactsMap.values());
    } catch {
      return [];
    }
  }

  async addContact(serial, { name, phone, email = '', notes = '' }) {
    return await this.runAdb(
      `shell am start -a android.intent.action.INSERT -t vnd.android.cursor.dir/contact -e name "${name}" -e phone "${phone}" -e email "${email}" -e notes "${notes}"`,
      serial
    );
  }

  async updateContact(serial, { id, rawContactId, name, phone, email = '', notes = '' }) {
    const targetId = rawContactId || id;
    try {
      if (name) {
        await this.runAdb(`shell content update --uri content://com.android.contacts/data --bind data1:s:"${name}" --bind data2:s:"${name}" --where "raw_contact_id=${targetId} AND mimetype='vnd.android.cursor.item/name'"`, serial);
      }
      if (phone) {
        const clean = phone.replace(/\s+/g, '');
        await this.runAdb(`shell content update --uri content://com.android.contacts/data --bind data1:s:"${phone}" --bind data4:s:"${clean}" --where "raw_contact_id=${targetId} AND mimetype='vnd.android.cursor.item/phone_v2'"`, serial);
      }
      return { success: true, message: 'اطلاعات مخاطب با موفقیت به‌روزرسانی شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteContact(serial, id, rawContactId = null) {
    const targetId = rawContactId || id;
    try {
      await this.runAdb(`shell content delete --uri content://com.android.contacts/raw_contacts --where "_id=${targetId}"`, serial);
      await this.runAdb(`shell content delete --uri content://com.android.contacts/data --where "raw_contact_id=${targetId}"`, serial);
      return { success: true, message: 'مخاطب با موفقیت حذف گردید' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteContactsBatch(serial, { contactIds = [], rawContactIds = [] } = {}) {
    try {
      const targets = [...new Set([...contactIds, ...rawContactIds])].filter(i => i && !isNaN(Number(i)));
      if (targets.length > 0) {
        const idList = targets.join(',');
        await this.runAdb(`shell content delete --uri content://com.android.contacts/raw_contacts --where "_id IN (${idList})"`, serial);
        await this.runAdb(`shell content delete --uri content://com.android.contacts/data --where "raw_contact_id IN (${idList})"`, serial);
      }
      return { success: true, message: `${targets.length} مخاطب با موفقیت حذف شدند` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async clearAllContacts(serial) {
    try {
      await this.runAdb('shell content delete --uri content://com.android.contacts/raw_contacts', serial);
      await this.runAdb('shell content delete --uri content://com.android.contacts/data', serial);
      return { success: true, message: 'تمامی مخاطبین با موفقیت پاکسازی شدند' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async mergeContacts(serial, { targetContact, duplicateIds = [] }) {
    try {
      if (targetContact) {
        await this.updateContact(serial, targetContact);
      }
      if (duplicateIds && duplicateIds.length > 0) {
        await this.deleteContactsBatch(serial, { contactIds: duplicateIds, rawContactIds: duplicateIds });
      }
      return { success: true, message: 'مخاطبین هم‌پوشان با موفقیت ادغام شدند' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getSms(serial) {
    try {
      // Put body at the end of projection so commas/newlines inside SMS text don't corrupt previous columns
      const res = await this.runAdb('shell content query --uri content://sms --projection _id:thread_id:address:date:type:read:body', serial);
      if (!res.success || !res.stdout || res.stdout.includes('No result found')) {
        return [];
      }

      // Check blocked numbers from content://blocked_number/blocked if accessible
      const blockedNumbers = new Set();
      try {
        const blockedRes = await this.runAdb('shell content query --uri content://blocked_number/blocked --projection original_number', serial);
        if (blockedRes.success && blockedRes.stdout && !blockedRes.stdout.includes('No result found')) {
          const bMatches = blockedRes.stdout.match(/original_number=([^,\s\n]+)/g);
          if (bMatches) {
            bMatches.forEach(m => {
              const num = m.replace('original_number=', '').trim();
              if (num && num !== 'NULL' && num !== 'null') blockedNumbers.add(num);
            });
          }
        }
      } catch {
        // Safe fallback
      }

      // Split output into row blocks starting with "Row: <number>"
      const rowBlocks = res.stdout.split(/(?=^Row:\s*\d+\s+)/m).filter(b => b.trim().startsWith('Row:'));
      const messages = [];

      for (const block of rowBlocks) {
        const idMatch = block.match(/_id=(\d+)/);
        const threadMatch = block.match(/thread_id=(\d+)/);
        const addrMatch = block.match(/address=([^,]+)/);
        const dateMatch = block.match(/date=(\d+)/);
        const typeMatch = block.match(/type=(\d+)/);
        const readMatch = block.match(/read=(\d+)/);

        // Body is everything after "body=" to the end of the block
        let body = '';
        const bodyIdx = block.indexOf('body=');
        if (bodyIdx !== -1) {
          body = block.substring(bodyIdx + 5).trim();
          if (body === 'NULL' || body === 'null') {
            body = '';
          }
        }

        const typeCode = typeMatch ? parseInt(typeMatch[1], 10) : 1;
        const dateNum = dateMatch ? parseInt(dateMatch[1], 10) : Date.now();
        const rawDate = new Date(dateNum);
        const rawNumber = addrMatch ? addrMatch[1].trim() : 'Unknown';
        const address = rawNumber === 'NULL' || rawNumber === 'null' ? 'Unknown' : rawNumber;

        // Android type codes:
        // 1: Inbox, 2: Sent, 3: Draft, 4: Outbox, 5: Failed, 6: Queued
        let msgType = 'inbox';
        if (typeCode === 2) msgType = 'sent';
        else if (typeCode === 3) msgType = 'draft';
        else if (typeCode === 4 || typeCode === 6) msgType = 'outbox';
        else if (typeCode === 5) msgType = 'failed';

        // Categorize Banking / OTP / Spam / Promotions / Blocked
        const fullContent = (address + ' ' + body).toLowerCase();
        const isBank = /بانک|bank|parsian|melli|mellat|saderat|sepah|tejarat|keshavarzi|pasargad|saman|blubank|resalat|shahr|maskan|refah|karafarin|sina|postbank|ghavamin|صندوق|واریز|برداشت|مانده|انتقال|کارت به کارت|شاپرک|پایا|ساتنا/i.test(fullContent);
        const isOtp = /کد تایید|کد فعال‌سازی|کد ورود|رمز یکبار مصرف|رمز پویا|otp|verification code|security code|verify code|pin code/i.test(fullContent);
        const isSpam = /تبلیغ|لغو11|لغو 11|ارسال ۱|ارسال 1|تخفیف|برنده|جایزه|تور لحظه|ویژه|اقساط|کدتخفیف|حراج|فروش ویژه|وام فوری|شارژ رایگان|ad:|adv:/i.test(fullContent) || (/^\d{4,6}$/.test(address) && !isBank && !isOtp);
        const isBlocked = blockedNumbers.has(address);

        messages.push({
          id: idMatch ? idMatch[1] : String(Math.random()),
          threadId: threadMatch ? `t_${threadMatch[1]}` : (address ? `t_${address}` : 't_default'),
          number: address,
          sender: typeCode === 2 ? 'شما' : address,
          body: body,
          timestamp: rawDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          date: rawDate.toLocaleDateString('fa-IR'),
          rawDate: dateNum,
          isoDate: rawDate.toISOString(),
          type: msgType,
          typeCode: typeCode,
          isBank,
          isOtp,
          isSpam,
          isBlocked,
          read: readMatch ? readMatch[1] === '1' : true
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

  async getSmsCount(serial) {
    try {
      const res = await this.runAdb('shell "content query --uri content://sms --projection count\\(*\\)"', serial);
      if (res.success && res.stdout) {
        const match = res.stdout.match(/count\(\*\)=(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
    } catch {}
    return -1;
  }

  async openSmsApp(serial) {
    return await this.runAdb('shell am start -a android.intent.action.MAIN -c android.intent.category.APP_MESSAGING', serial);
  }

  async deleteSms(serial, id) {
    try {
      const idList = (Array.isArray(id) ? id : [id])
        .map(i => String(i).trim())
        .filter(i => /^\d+$/.test(i));
      
      if (idList.length === 0) {
        return { success: true, message: 'شناسه پیامی برای حذف مشخص نشده است' };
      }

      // 1. Direct ADB Content Provider deletion
      const whereClause = idList.length === 1 ? `_id=${idList[0]}` : `_id IN (${idList.join(',')})`;
      const res = await this.runAdb(`shell content delete --uri content://sms --where "${whereClause}"`, serial);

      // 2. Verification
      const verify = await this.runAdb(`shell content query --uri content://sms --projection _id --where "${whereClause}"`, serial);
      if (!verify.stdout || verify.stdout.includes('No result found')) {
        return { success: true, message: 'پیامک با موفقیت حذف شد' };
      }

      // 3. Fallback: If rooted, attempt via su
      const rootRes = await this.runAdb(`shell su -c "content delete --uri content://sms --where '${whereClause}'"`, serial);
      if (rootRes.success) {
        const verifyRoot = await this.runAdb(`shell content query --uri content://sms --projection _id --where "${whereClause}"`, serial);
        if (!verifyRoot.stdout || verifyRoot.stdout.includes('No result found')) {
          return { success: true, message: 'پیامک با موفقیت حذف شد (Root)' };
        }
      }

      return {
        success: false,
        error: 'سیستم‌عامل اندروید به دلایل امنیتی اجازه حذف مستقیم این پیامک را مسدود کرده است. لطفاً از داخل برنامه پیام‌های گوشی اقدام فرمایید.',
        requireDefaultApp: true
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteSmsThread(serial, threadKey, number, messageIds = []) {
    try {
      let anyDeleted = false;

      // 1. Delete by specific message IDs if provided
      const validIds = (Array.isArray(messageIds) ? messageIds : [messageIds])
        .map(i => String(i).trim())
        .filter(i => /^\d+$/.test(i));

      if (validIds.length > 0) {
        const whereIds = validIds.length === 1 ? `_id=${validIds[0]}` : `_id IN (${validIds.join(',')})`;
        await this.runAdb(`shell content delete --uri content://sms --where "${whereIds}"`, serial);
        anyDeleted = true;
      }

      // 2. Delete by numeric thread_id (handle both raw '7666' and prefixed 't_7666')
      const rawThread = String(threadKey || '').replace(/^t_/, '').trim();
      if (/^\d+$/.test(rawThread) && Number(rawThread) > 0) {
        // Try conversations endpoint
        await this.runAdb(`shell content delete --uri content://sms/conversations/${rawThread}`, serial);
        // Also try standard where clause
        await this.runAdb(`shell content delete --uri content://sms --where "thread_id=${rawThread}"`, serial);
        anyDeleted = true;
      }

      // 3. Delete by address variations if number is provided
      if (number) {
        const clean = String(number).replace(/['"\\;]/g, '').trim();
        const digits = clean.replace(/\D/g, '');
        const addrList = new Set();
        if (clean) addrList.add(clean);
        if (digits) {
          addrList.add(digits);
          addrList.add(`+${digits}`);
          if (digits.startsWith('98') && digits.length === 12) {
            addrList.add(`0${digits.slice(2)}`);
          }
        }
        if (addrList.size > 0) {
          const inClause = Array.from(addrList).map(a => `'${a}'`).join(',');
          await this.runAdb(`shell content delete --uri content://sms --where "address IN (${inClause})"`, serial);
          anyDeleted = true;
        }
      }

      // 4. Verify thread deletion
      if (/^\d+$/.test(rawThread) && Number(rawThread) > 0) {
        const check = await this.runAdb(`shell content query --uri content://sms/conversations/${rawThread} --projection _id`, serial);
        if (!check.stdout || check.stdout.includes('No result found')) {
          return { success: true, message: 'گفتگو با موفقیت حذف شد' };
        }
      }

      if (validIds.length > 0) {
        const whereIds = validIds.length === 1 ? `_id=${validIds[0]}` : `_id IN (${validIds.join(',')})`;
        const check = await this.runAdb(`shell content query --uri content://sms --projection _id --where "${whereIds}"`, serial);
        if (!check.stdout || check.stdout.includes('No result found')) {
          return { success: true, message: 'گفتگو با موفقیت حذف شد' };
        }
      }

      if (anyDeleted) {
        return { success: true, message: 'دستور حذف گفتگو به دستگاه ارسال شد' };
      }

      return { success: true, message: 'گفتگو حذف گردید' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteSmsBatch(serial, { messageIds = [], threadKeys = [], numbers = [] } = {}) {
    try {
      // 1. Delete message IDs
      const validIds = (messageIds || []).map(i => String(i).trim()).filter(i => /^\d+$/.test(i));
      if (validIds.length > 0) {
        await this.runAdb(`shell content delete --uri content://sms --where "_id IN (${validIds.join(',')})"`, serial);
      }

      // 2. Delete threads
      for (const t of (threadKeys || [])) {
        const raw = String(t || '').replace(/^t_/, '').trim();
        if (/^\d+$/.test(raw) && Number(raw) > 0) {
          await this.runAdb(`shell content delete --uri content://sms/conversations/${raw}`, serial);
          await this.runAdb(`shell content delete --uri content://sms --where "thread_id=${raw}"`, serial);
        }
      }

      // 3. Delete numbers
      if (numbers && numbers.length > 0) {
        const addrList = new Set();
        numbers.forEach(num => {
          const clean = String(num).replace(/['"\\;]/g, '').trim();
          const digits = clean.replace(/\D/g, '');
          if (clean) addrList.add(clean);
          if (digits) {
            addrList.add(digits);
            addrList.add(`+${digits}`);
            if (digits.startsWith('98') && digits.length === 12) {
              addrList.add(`0${digits.slice(2)}`);
            }
          }
        });
        if (addrList.size > 0) {
          const inClause = Array.from(addrList).map(a => `'${a}'`).join(',');
          await this.runAdb(`shell content delete --uri content://sms --where "address IN (${inClause})"`, serial);
        }
      }

      return { success: true, message: 'پیام‌های انتخابی با موفقیت حذف شدند' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async clearAllSms(serial) {
    const countBefore = await this.getSmsCount(serial);
    await this.runAdb('shell content delete --uri content://sms', serial);
    const countAfter = await this.getSmsCount(serial);
    if (countBefore > 0 && countAfter >= countBefore) {
      return {
        success: false,
        error: 'سیستم‌عامل اندروید به دلایل امنیتی اجازه پاکسازی کلی پیامک‌ها از طریق پورت ADB را مسدود کرده است (تنها برنامه پیش‌فرض پیام‌رسان یا دستگاه روت‌شده مجاز است). لطفاً از داخل برنامه Messages گوشی اقدام فرمایید.',
        requireDefaultApp: true
      };
    }
    return { success: true, message: 'تمامی پیامک‌ها با موفقیت پاکسازی شدند' };
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

  // --- Find My Phone & Remote Security Controls ---
  async getFindMyPhoneStatus(serial) {
    try {
      const [wifiRes, dataRes, btRes, locRes, batRes] = await Promise.all([
        this.runAdb('shell settings get global wifi_on', serial),
        this.runAdb('shell settings get global mobile_data', serial),
        this.runAdb('shell settings get global bluetooth_on', serial),
        this.runAdb('shell settings get secure location_mode', serial),
        this.runAdb('shell dumpsys battery', serial)
      ]);

      const wifi = (wifiRes.stdout || '').trim() === '1';
      const mobileData = (dataRes.stdout || '').trim() === '1';
      const bluetooth = (btRes.stdout || '').trim() === '1';
      const locVal = (locRes.stdout || '').trim();
      const location = locVal !== '0' && locVal !== '';

      let batteryLevel = 100;
      let batteryCharging = false;
      if (batRes.stdout) {
        const levelMatch = batRes.stdout.match(/level:\s*(\d+)/);
        if (levelMatch) batteryLevel = parseInt(levelMatch[1], 10);
        const statusMatch = batRes.stdout.match(/status:\s*(\d+)/);
        if (statusMatch && (statusMatch[1] === '2' || statusMatch[1] === '5')) {
          batteryCharging = true;
        }
      }

      return {
        success: true,
        wifi,
        mobileData,
        bluetooth,
        location,
        battery: {
          level: batteryLevel,
          charging: batteryCharging
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async setWifiEnabled(serial, enabled) {
    const val = enabled ? 'enable' : 'disable';
    const cmdVal = enabled ? 'enabled' : 'disabled';
    await this.runAdb(`shell cmd wifi set-wifi-enabled ${cmdVal}`, serial);
    await this.runAdb(`shell svc wifi ${val}`, serial);
    return { success: true, enabled, message: `وای‌فای گوشی با موفقیت ${enabled ? 'روشن' : 'خاموش'} شد` };
  }

  async setMobileDataEnabled(serial, enabled) {
    const val = enabled ? 'enable' : 'disable';
    await this.runAdb(`shell svc data ${val}`, serial);
    await this.runAdb(`shell telephony data ${val}`, serial);
    return { success: true, enabled, message: `داده همراه (اینترنت) با موفقیت ${enabled ? 'روشن' : 'خاموش'} شد` };
  }

  async setBluetoothEnabled(serial, enabled) {
    const val = enabled ? 'enable' : 'disable';
    await this.runAdb(`shell cmd bluetooth_manager ${val}`, serial);
    await this.runAdb(`shell svc bluetooth ${val}`, serial);
    return { success: true, enabled, message: `بلوتوث با موفقیت ${enabled ? 'روشن' : 'خاموش'} شد` };
  }

  async setLocationEnabled(serial, enabled) {
    const mode = enabled ? 3 : 0;
    await this.runAdb(`shell cmd location set-location-enabled ${enabled}`, serial);
    await this.runAdb(`shell settings put secure location_mode ${mode}`, serial);
    return { success: true, enabled, message: `مکان‌یابی GPS با موفقیت ${enabled ? 'روشن' : 'خاموش'} شد` };
  }

  async setFlashlight(serial, enabled) {
    const val = enabled ? 1 : 0;
    const boolVal = enabled ? 'true' : 'false';

    // 1. Xiaomi / Redmi / Poco / MIUI broadcast (proven reliable)
    await this.runAdb(`shell am broadcast -a miui.intent.action.TOGGLE_TORCH --ez miui.intent.extra.IS_ENABLE ${boolVal}`, serial);

    // 2. Android SystemUI Quick Settings Tile click
    await this.runAdb('shell cmd statusbar click-tile flashlight', serial);

    // 3. Camera torch mode for AOSP / Pixel / Motorola
    await this.runAdb(`shell cmd camera set-torch-mode 0 ${val}`, serial);
    await this.runAdb(`shell cmd camera set-torch-mode 1 ${val}`, serial);

    return { success: true, enabled, message: `چراغ‌قوه با موفقیت ${enabled ? 'روشن' : 'خاموش'} شد` };
  }

  async ringPhoneAlarm(serial, { maxVolume = true, vibrate = true } = {}) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: 'آژیر هشدار روی دستگاه شبیه‌ساز فعال شد' };
    }
    try {
      // 1. Unmute and Maximize volume for Alarm, Ring, and Media streams
      if (maxVolume) {
        await this.runAdb('shell settings put global zen_mode 0', serial); // disable DND
        await this.runAdb('shell cmd media_session volume --stream 4 --set 15', serial); // STREAM_ALARM max
        await this.runAdb('shell cmd media_session volume --stream 2 --set 15', serial); // STREAM_RING max
        await this.runAdb('shell cmd media_session volume --stream 3 --set 15', serial); // STREAM_MUSIC max
        await this.runAdb('shell media volume --stream 4 --set 15', serial);
        await this.runAdb('shell media volume --stream 2 --set 15', serial);
        await this.runAdb('shell media volume --stream 3 --set 15', serial);
      }

      // 2. Trigger high-intensity vibration (Android 12-14 vibrator_manager + legacy vibrator)
      if (vibrate) {
        await this.runAdb('shell cmd vibrator_manager synced -f -B oneshot 15000 255', serial);
        await this.runAdb('shell cmd vibrator vibrate 15000', serial);
      }

      // 3. Play loud alarm / siren without browser redirection
      // Method A: Trigger hardware AlarmClock countdown (Guaranteed to sound native alarm tone at 100% volume)
      await this.runAdb('shell am start -a android.intent.action.SET_TIMER --ei android.intent.extra.LENGTH 1 --ez android.intent.extra.SKIP_UI true', serial);

      // Method B: System Sound Picker preview
      await this.runAdb('shell am start -a android.intent.action.RINGTONE_PICKER --ei android.intent.extra.ringtone.TYPE 4', serial);

      return {
        success: true,
        message: 'آژیر هشدار با حداکثر ولوم صدا و لرزش ممتد روی گوشی فعال شد!'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async stopPhoneAlarm(serial) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: 'صدای آژیر و ویبره گوشی متوقف شد (شبیه‌ساز)' };
    }
    try {
      // 1. Stop vibration
      await this.runAdb('shell cmd vibrator_manager cancel', serial);
      await this.runAdb('shell cmd vibrator vibrate 0', serial);

      // 2. Dismiss system alarm
      await this.runAdb('shell am start -a android.intent.action.DISMISS_ALARM', serial);
      await this.runAdb('shell am force-stop com.android.deskclock', serial);
      await this.runAdb('shell am force-stop com.google.android.deskclock', serial);
      await this.runAdb('shell am force-stop com.sec.android.app.clockpackage', serial);
      await this.runAdb('shell am force-stop com.android.soundpicker', serial);
      await this.runAdb('shell am force-stop com.google.android.apps.nbu.files', serial);
      // Stop media without muting the device volume (Do NOT use KEYCODE_VOLUME_MUTE 164 as it mutes in-call audio)
      await this.runAdb('shell input keyevent 86', serial); // KEYCODE_MEDIA_STOP
      await this.runAdb('shell input keyevent 127', serial); // KEYCODE_MEDIA_PAUSE
      await this.runAdb('shell input keyevent 4', serial); // BACK key to dismiss picker UI

      // Restore safe in-call and ringer volumes so phone calls remain audible
      await this.runAdb('shell cmd media_session volume --stream 0 --set 10 2>/dev/null || true', serial);
      await this.runAdb('shell cmd media_session volume --stream 2 --set 10 2>/dev/null || true', serial);
      await this.runAdb('shell cmd media_session volume --stream 3 --set 10 2>/dev/null || true', serial);

      return { success: true, message: 'صدای آژیر و ویبره گوشی متوقف شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Complete recovery for call audio routing and volume.
   * Restores earpiece / speaker audio if incoming call audio was muted or intercepted, without restarting phone.
   */
  async resetCallAudio(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        message: 'صدای مکالمه و خروجی گوشی ریست شد و به حالت استاندارد بازگشت (شبیه‌ساز)'
      };
    }

    try {
      // 1. Reset Telecom route to normal earpiece (1)
      await this.runAdb('shell cmd telecom set-audio-route 1 2>/dev/null || true', serial);

      // 2. Unmute and restore in-call volume (STREAM_VOICE_CALL = 0) and ringer (STREAM_RING = 2)
      await this.runAdb('shell cmd media_session volume --stream 0 --set 12 2>/dev/null || true', serial);
      await this.runAdb('shell media volume --stream 0 --set 12 2>/dev/null || true', serial);
      await this.runAdb('shell settings put system volume_voice_earpiece 10 2>/dev/null || true', serial);
      await this.runAdb('shell settings put system volume_voice 10 2>/dev/null || true', serial);
      await this.runAdb('shell cmd media_session volume --stream 2 --set 10 2>/dev/null || true', serial);
      await this.runAdb('shell media volume --stream 2 --set 10 2>/dev/null || true', serial);

      // 3. Clear hardware and software mute flags
      await this.runAdb('shell cmd audio set-ringer-mode 2 2>/dev/null || true', serial);
      await this.runAdb('shell cmd audio set-master-mute false 2>/dev/null || true', serial);
      await this.runAdb('shell cmd audio set-mic-mute false 2>/dev/null || true', serial);
      await this.runAdb('shell service call audio 6 i32 0 2>/dev/null || true', serial);

      // 4. Send Volume Up keyevent (24) to tell Android audio HAL to exit hardware mute state
      await this.runAdb('shell input keyevent 24', serial);

      // 5. Cleanly reset media session
      await this.runAdb('shell cmd media_session reset 2>/dev/null || true', serial);

      return {
        success: true,
        message: 'مسیر صوتی و صدای مکالمه با موفقیت بازنشانی شد. اکنون صدای تماس گیرنده به وضوح شنیده می‌شود.'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getDeviceLocation(serial) {
    try {
      const dumpRes = await this.runAdb('shell dumpsys location', serial);
      const text = dumpRes.stdout || '';

      let lat = null;
      let lng = null;
      let accuracy = null;
      let timestamp = null;

      // Search for location patterns in dumpsys location (e.g., Location[gps 35.6892, 51.3890 acc=12 et=...])
      const locMatch = text.match(/Location\[(?:gps|fused|network)\s+([-\d.]+)[,\s]+([-\d.]+)\s+(?:acc=([-\d.]+))?/i) ||
                       text.match(/last\s+location=.*?[(\s]([-\d.]+)[,\s]+([-\d.]+)/i);

      if (locMatch) {
        lat = parseFloat(locMatch[1]);
        lng = parseFloat(locMatch[2]);
        if (locMatch[3]) accuracy = parseFloat(locMatch[3]);
        timestamp = new Date().toISOString();
      }

      // Fallback: check last known location from providers
      if (!lat || !lng) {
        const gpsMatch = text.match(/gps:\s+Location\[.*?([-\d.]+),\s*([-\d.]+)/);
        if (gpsMatch) {
          lat = parseFloat(gpsMatch[1]);
          lng = parseFloat(gpsMatch[2]);
        }
      }

      return {
        success: true,
        hasLocation: lat !== null && lng !== null,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || 15,
        timestamp: timestamp || new Date().toISOString(),
        rawSummary: text.substring(0, 300)
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async sendLockScreenMessage(serial, message, contactNumber = '') {
    try {
      const fullText = contactNumber ? `${message} | تماس اضطراری: ${contactNumber}` : message;
      // Set lockscreen owner text
      await this.runAdb(`shell settings put secure lock_screen_owner_info "${fullText}"`, serial);
      await this.runAdb('shell settings put secure lock_screen_owner_info_enabled 1', serial);
      // Turn screen on to display the message immediately
      await this.runAdb('shell input keyevent 26', serial); // Wake up display
      return {
        success: true,
        message: 'پیام اضطراری با موفقیت بر روی صفحه قفل گوشی نمایش داده شد'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const adbManager = new AdbManager();



