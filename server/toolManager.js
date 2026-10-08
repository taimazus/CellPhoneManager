import { exec, spawn } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';

const execAsync = util.promisify(exec);

export class ToolManager {
  constructor() {
    this.binDir = path.join(process.cwd(), 'bin');
    this.ensureBinDir();
  }

  ensureBinDir() {
    if (!fs.existsSync(this.binDir)) {
      fs.mkdirSync(this.binDir, { recursive: true });
    }
  }

  async checkTool(cmd) {
    try {
      const { stdout } = await execAsync(cmd);
      return { installed: true, version: stdout.trim().split('\n')[0] };
    } catch (err) {
      return { installed: false, error: err.message };
    }
  }

  async getAdbPath() {
    // Check local bin first, then system PATH
    const localAdb = path.join(this.binDir, 'platform-tools', 'adb.exe');
    if (fs.existsSync(localAdb)) return localAdb;
    try {
      await execAsync('adb version');
      return 'adb';
    } catch {
      return localAdb; // fallback
    }
  }

  async getScrcpyPath() {
    const localScrcpy = path.join(this.binDir, 'scrcpy', 'scrcpy.exe');
    if (fs.existsSync(localScrcpy)) return localScrcpy;
    try {
      await execAsync('scrcpy --version');
      return 'scrcpy';
    } catch {
      return localScrcpy;
    }
  }

  async getFfmpegPath() {
    const localFfmpeg = path.join(this.binDir, 'ffmpeg', 'ffmpeg.exe');
    if (fs.existsSync(localFfmpeg)) return localFfmpeg;
    try {
      await execAsync('ffmpeg -version');
      return 'ffmpeg';
    } catch {
      return 'ffmpeg';
    }
  }


  async getDiagnosticStatus() {
    const adbPath = await this.getAdbPath();
    const scrcpyPath = await this.getScrcpyPath();

    const adbCheck = await this.checkTool(`"${adbPath}" version`);
    const scrcpyCheck = await this.checkTool(`"${scrcpyPath}" --version`);
    const pythonCheck = await this.checkTool('python --version');
    const pymobiledeviceCheck = await this.checkTool('python -m pymobiledevice3 --help');
    
    // Check Apple Mobile Device Service (iTunes/usbmuxd) on Windows
    let itunesDriver = { installed: false, detail: 'Not detected' };
    try {
      const { stdout } = await execAsync('Get-Service -Name "Apple Mobile Device Service" -ErrorAction SilentlyContinue', { shell: 'powershell.exe' });
      if (stdout && stdout.includes('Running')) {
        itunesDriver = { installed: true, detail: 'Apple Mobile Device Service is Running' };
      } else if (stdout && stdout.includes('Stopped')) {
        itunesDriver = { installed: true, detail: 'Apple Mobile Device Service is Stopped' };
      }
    } catch (e) {
      itunesDriver = { installed: false, detail: e.message };
    }

    return {
      tools: {
        adb: {
          name: 'Android Debug Bridge (ADB)',
          installed: adbCheck.installed,
          version: adbCheck.version || 'Not Installed',
          path: adbPath,
          category: 'android',
          isOfflineReady: fs.existsSync(path.join(this.binDir, 'platform-tools', 'adb.exe')),
          description: 'مدیریت و اتصال خط فرمان به گوشی‌های اندروید (کاملاً آفلاین)'
        },
        scrcpy: {
          name: 'Scrcpy Screen Mirror',
          installed: scrcpyCheck.installed,
          version: scrcpyCheck.version || 'Not Installed',
          path: scrcpyPath,
          category: 'android',
          isOfflineReady: fs.existsSync(path.join(this.binDir, 'scrcpy', 'scrcpy.exe')),
          description: 'نمایش و کنترل مستقیم صفحه گوشی با فریم‌ریت و کیفیت بالا (کاملاً آفلاین)'
        },
        python: {
          name: 'Python Runtime',
          installed: pythonCheck.installed,
          version: pythonCheck.version || 'Not Installed',
          category: 'core',
          isOfflineReady: pythonCheck.installed,
          description: 'محیط اجرای اسکریپت‌ها و ماژول‌های پیشرفته iOS'
        },
        pymobiledevice: {
          name: 'pymobiledevice3 (iOS Engine)',
          installed: pymobiledeviceCheck.installed,
          version: pymobiledeviceCheck.installed ? 'Active' : 'Not Installed',
          category: 'ios',
          isOfflineReady: fs.existsSync(path.join(this.binDir, 'wheels')),
          description: 'واسط ارتباطی بدون نیاز به جیلبریک برای آیفون و آیپد'
        },
        itunesService: {
          name: 'Apple Mobile Device Driver',
          installed: itunesDriver.installed,
          version: itunesDriver.detail,
          category: 'ios',
          isOfflineReady: itunesDriver.installed,
          description: 'درایور رسمی ویندوز برای شناسایی کابل لایتنینگ و USB-C آیفون'
        }
      }
    };
  }

  async installTool(toolId, logCallback = () => {}) {
    logCallback(`شروع بررسی و آماده‌سازی ${toolId}...`);
    try {
      if (toolId === 'pymobiledevice') {
        const localWheelsDir = path.join(this.binDir, 'wheels');
        if (fs.existsSync(localWheelsDir)) {
          logCallback('در حال نصب ماژول pymobiledevice3 از پکیج محلی آفلاین (Local Wheels)...');
          const { stdout, stderr } = await execAsync(`python -m pip install --no-index --find-links="${localWheelsDir}" pymobiledevice3`);
          logCallback(`نصب آفلاین انجام شد:\n${stdout}\n${stderr || ''}`);
          return { success: true, message: 'pymobiledevice3 از پکیج محلی نصب شد.' };
        }

        logCallback('پکیج محلی یافت نشد؛ در حال نصب از مخزن انلاین pip...');
        const { stdout, stderr } = await execAsync('python -m pip install --upgrade pymobiledevice3');
        logCallback(`نصب انجام شد:\n${stdout}\n${stderr || ''}`);
        return { success: true, message: 'pymobiledevice3 با موفقیت نصب شد' };
      }

      if (toolId === 'adb') {
        logCallback('در حال دانلود Android Platform Tools رسمی از Google...');
        const zipUrl = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';
        const destZip = path.join(this.binDir, 'platform-tools.zip');
        
        // Download using curl or powershell
        await execAsync(`powershell -Command "Invoke-WebRequest -Uri '${zipUrl}' -OutFile '${destZip}'"`);
        logCallback('در حال استخراج فایل‌های فشرده...');
        await execAsync(`powershell -Command "Expand-Archive -Path '${destZip}' -DestinationPath '${this.binDir}' -Force"`);
        
        if (fs.existsSync(destZip)) fs.unlinkSync(destZip);
        logCallback('ADB و Fastboot با موفقیت راه‌اندازی شدند.');
        return { success: true, message: 'Platform Tools با موفقیت نصب شد' };
      }

      if (toolId === 'scrcpy') {
        logCallback('در حال دانلود و پیکربندی آخرین نسخه Scrcpy...');
        const scrcpyZipUrl = 'https://github.com/Genymobile/scrcpy/releases/download/v2.4/scrcpy-win64-v2.4.zip';
        const destZip = path.join(this.binDir, 'scrcpy.zip');
        await execAsync(`powershell -Command "Invoke-WebRequest -Uri '${scrcpyZipUrl}' -OutFile '${destZip}'"`);
        await execAsync(`powershell -Command "Expand-Archive -Path '${destZip}' -DestinationPath '${this.binDir}' -Force"`);
        if (fs.existsSync(destZip)) fs.unlinkSync(destZip);
        logCallback('موتور Scrcpy با موفقیت آماده شد.');
        return { success: true, message: 'ابزار Scrcpy با موفقیت نصب شد' };
      }

      if (toolId === 'itunesService') {
        logCallback('در حال تلاش برای نصب درایورهای رسمی اپل (Apple Mobile Device Support)...');
        try {
          // Try winget first
          logCallback('در حال اجرای دستور winget برای نصب درایور آیتونز...');
          const { stdout } = await execAsync('winget install --id Apple.iTunes --exact --accept-package-agreements --accept-source-agreements --silent', { timeout: 60000 });
          logCallback(`نتیجه winget: ${stdout}`);
          return { success: true, message: 'درایورهای اپل با موفقیت نصب شدند' };
        } catch (wingetErr) {
          logCallback('نصب خودکار با winget انجام نشد. لینک دانلود مستقیم درایور رسمی اپل ارائه گردید.');
          return { 
            success: false, 
            message: 'برای اتصال آیفون، کافیست نرم‌افزار رسمی iTunes را از سایت اپل نصب کنید.',
            downloadUrl: 'https://www.apple.com/itunes/download/win64'
          };
        }
      }

      if (toolId === 'googleDriver' || toolId === 'usbDriver') {
        logCallback('در حال نصب درایورهای رسمی Universal Android USB...');
        const localZip = path.join(this.binDir, 'drivers', 'google_usb_driver.zip');
        if (fs.existsSync(localZip)) {
          logCallback('استفاده از پکیج آفلاین google_usb_driver.zip...');
          await execAsync(`powershell -NoProfile -Command "Expand-Archive -Path '${localZip}' -DestinationPath '$env:TEMP\\cpm_usb_driver' -Force; Start-Process pnputil.exe -ArgumentList '/add-driver \\\"$env:TEMP\\cpm_usb_driver\\usb_driver\\*.inf\\\" /install' -Verb RunAs -Wait"`);
          return { success: true, message: 'درایورهای USB با موفقیت در مخزن درایور ویندوز ثبت شدند' };
        }
      }

      if (toolId === 'vbcable') {
        logCallback('در حال نصب درایور کابل مجازی صدا (VB-Audio Virtual Cable)...');
        const localZip = path.join(this.binDir, 'drivers', 'vbcable.zip');
        if (fs.existsSync(localZip)) {
          logCallback('استفاده از پکیج آفلاین همراه نرم‌افزار...');
          await execAsync(`powershell -NoProfile -Command "Expand-Archive -Path '${localZip}' -DestinationPath '$env:TEMP\\cpm_vbcable' -Force; Start-Process -FilePath '$env:TEMP\\cpm_vbcable\\VBCABLE_Setup_x64.exe' -Verb RunAs"`);
          return { success: true, message: 'نصاب درایور VB-Cable با موفقیت اجرا شد' };
        }
        await execAsync('powershell -NoProfile -Command "Invoke-WebRequest -Uri \'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip\' -OutFile \'$env:TEMP\\VBCABLE.zip\'; Expand-Archive -Path \'$env:TEMP\\VBCABLE.zip\' -DestinationPath \'$env:TEMP\\VBCABLE\' -Force; Start-Process -FilePath \'$env:TEMP\\VBCABLE\\VBCABLE_Setup_x64.exe\' -Verb RunAs"');
        return { success: true, message: 'نصاب درایور VB-Cable اجرا شد' };
      }

      if (toolId === 'vigembus') {
        logCallback('در حال نصب درایور دسته بازی مجازی (ViGEmBus)...');
        const localExe = path.join(this.binDir, 'drivers', 'vigembus_setup.exe');
        if (fs.existsSync(localExe)) {
          logCallback('استفاده از پکیج نصبی آفلاین همراه نرم‌افزار...');
          await execAsync(`powershell -NoProfile -Command "Start-Process -FilePath '${localExe}' -Verb RunAs"`);
          return { success: true, message: 'نصاب درایور ViGEmBus با موفقیت اجرا شد' };
        }
        await execAsync('powershell -NoProfile -Command "Invoke-WebRequest -Uri \'https://github.com/nefarius/ViGEmBus/releases/download/v1.22.0/ViGEmBus_1.22.0_x64_x86_arm64.exe\' -OutFile \'$env:TEMP\\ViGEmBus_Setup.exe\'; Start-Process -FilePath \'$env:TEMP\\ViGEmBus_Setup.exe\' -Verb RunAs"');
        return { success: true, message: 'نصاب درایور ViGEmBus اجرا شد' };
      }

      return { success: false, message: `ابزار ناشناخته: ${toolId}` };
    } catch (err) {
      logCallback(`خطا در نصب: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // Tool Catalog with Transparent Metadata (Size, Source, Capabilities)
  getToolCatalog() {
    return [
      {
        id: 'adb',
        name: 'Android Platform Tools (ADB & Fastboot)',
        downloadUrl: 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
        estimatedSizeMb: 12.5,
        category: 'android',
        activatedFeatures: ['دستورات خط فرمان ADB', 'مدیریت فایل اندروید', 'نصب برنامه‌ها', 'پشتیبان‌گیری'],
        offlineSupport: 'فایل‌های adb.exe و fastboot.exe در bin/platform-tools'
      },
      {
        id: 'scrcpy',
        name: 'Scrcpy Screen Mirroring Engine',
        downloadUrl: 'https://github.com/Genymobile/scrcpy/releases/download/v2.4/scrcpy-win64-v2.4.zip',
        estimatedSizeMb: 8.2,
        category: 'android',
        activatedFeatures: ['انتقال زنده تصویر گوشی با ۶۰/۱۲۰ فریم', 'کنترل لمسی و کیبورد'],
        offlineSupport: 'فایل‌های scrcpy.exe در bin/scrcpy'
      },
      {
        id: 'pymobiledevice',
        name: 'pymobiledevice3 (iOS Communication Engine)',
        downloadUrl: 'https://pypi.org/project/pymobiledevice3/',
        estimatedSizeMb: 18.0,
        category: 'ios',
        activatedFeatures: ['مدیریت برنامه‌های iOS', 'انتقال فایل AFC', 'شبیه‌سازی موقعیت GPS', 'استخراج لاگ کرش'],
        offlineSupport: 'پکیج‌های پایتون .whl در bin/wheels'
      },
      {
        id: 'itunesService',
        name: 'Apple Mobile Device Support Driver',
        downloadUrl: 'https://www.apple.com/itunes/download/win64',
        estimatedSizeMb: 220.0,
        category: 'ios',
        activatedFeatures: ['شناسایی سخت‌افزاری کابل لایتنینگ و USB-C آیفون در ویندوز'],
        offlineSupport: 'فایل نصاب رسمی iTunes و درایور Apple Mobile Device'
      },
      {
        id: 'vbcable',
        name: 'VB-Audio Virtual Cable (PC Speaker Loopback)',
        downloadUrl: 'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip',
        estimatedSizeMb: 1.2,
        category: 'audio',
        activatedFeatures: ['کپچر صدای سیستم ویندوز برای استریم مستقیم به گوشی'],
        offlineSupport: 'فایل vbcable.zip در bin/drivers/'
      },
      {
        id: 'vigembus',
        name: 'ViGEmBus Virtual Gamepad Driver',
        downloadUrl: 'https://github.com/nefarius/ViGEmBus/releases/download/v1.22.0/ViGEmBus_1.22.0_x64_x86_arm64.exe',
        estimatedSizeMb: 2.5,
        category: 'controller',
        activatedFeatures: ['تبدیل گوشی به دسته بازی مجازی استاندارد Xbox/PlayStation در ویندوز'],
        offlineSupport: 'فایل vigembus_setup.exe در bin/drivers/'
      }
    ];
  }

  async installFromLocalFile(toolId, localFilePath, logCallback = () => {}) {
    if (!localFilePath || typeof localFilePath !== 'string') {
      return { success: false, error: 'مسیر فایل مشخص نشده است.' };
    }
    const resolvedPath = path.resolve(localFilePath);
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: 'فایل نصبی محلی در مسیر مشخص‌شده یافت نشد.' };
    }
    try {
      const stats = fs.statSync(resolvedPath);
      if (!stats.isFile()) {
        return { success: false, error: 'مسیر مشخص‌شده یک فایل معتبر نیست.' };
      }
    } catch (e) {
      return { success: false, error: `خطا در بررسی فایل: ${e.message}` };
    }

    logCallback(`در حال استقرار ${toolId} از فایل محلی: ${resolvedPath}`);
    try {
      const lower = resolvedPath.toLowerCase();
      if (lower.endsWith('.zip')) {
        await new Promise((resolve, reject) => {
          const ps = spawn('powershell.exe', [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            'Expand-Archive',
            '-LiteralPath',
            resolvedPath,
            '-DestinationPath',
            this.binDir,
            '-Force'
          ]);
          let stderr = '';
          ps.stderr.on('data', (d) => { stderr += d.toString(); });
          ps.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(stderr || `استخراج فایل فشرده با کد ${code} ناموفق بود`));
          });
          ps.on('error', reject);
        });
        logCallback(`فایل فشرده با موفقیت در ${this.binDir} استخراج شد.`);
        return { success: true, message: 'ابزار با موفقیت از پکیج محلی آفلاین نصب گردید.' };
      }
      if (lower.endsWith('.exe')) {
        await new Promise((resolve, reject) => {
          const ps = spawn('powershell.exe', [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            'Start-Process',
            '-FilePath',
            resolvedPath,
            '-Verb',
            'RunAs'
          ]);
          let stderr = '';
          ps.stderr.on('data', (d) => { stderr += d.toString(); });
          ps.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(stderr || `اجرای نصاب با کد ${code} ناموفق بود`));
          });
          ps.on('error', reject);
        });
        return { success: true, message: 'نصاب محلی با دسترسی مدیر اجرا شد.' };
      }
      return { success: false, error: 'فرمت فایل محلی پشتیبانی نمی‌شود (فقط zip و exe).' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const toolManager = new ToolManager();
