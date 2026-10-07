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
          description: 'مدیریت و اتصال خط فرمان به گوشی‌های اندروید'
        },
        scrcpy: {
          name: 'Scrcpy Screen Mirror',
          installed: scrcpyCheck.installed,
          version: scrcpyCheck.version || 'Not Installed',
          path: scrcpyPath,
          category: 'android',
          description: 'نمایش و کنترل مستقیم صفحه گوشی با فریم‌ریت و کیفیت بالا'
        },
        python: {
          name: 'Python Runtime',
          installed: pythonCheck.installed,
          version: pythonCheck.version || 'Not Installed',
          category: 'core',
          description: 'محیط اجرای اسکریپت‌ها و ماژول‌های پیشرفته iOS'
        },
        pymobiledevice: {
          name: 'pymobiledevice3 (iOS Engine)',
          installed: pymobiledeviceCheck.installed,
          version: pymobiledeviceCheck.installed ? 'Active' : 'Not Installed',
          category: 'ios',
          description: 'واسط ارتباطی قدرتمند و بدون نیاز به جیلبریک برای آیفون و آیپد'
        },
        itunesService: {
          name: 'Apple Mobile Device Driver',
          installed: itunesDriver.installed,
          version: itunesDriver.detail,
          category: 'ios',
          description: 'درایور رسمی ویندوز برای شناسایی کابل لایتنینگ و USB-C آیفون'
        }
      }
    };
  }

  async installTool(toolId, logCallback = () => {}) {
    logCallback(`شروع نصب یا بروزرسانی ${toolId}...`);
    try {
      if (toolId === 'pymobiledevice') {
        logCallback('در حال نصب ماژول pymobiledevice3 با دستور pip...');
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

      return { success: false, message: `ابزار ناشناخته: ${toolId}` };
    } catch (err) {
      logCallback(`خطا در نصب: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}


export const toolManager = new ToolManager();
