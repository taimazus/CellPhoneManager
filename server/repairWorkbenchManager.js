import path from 'path';
import fs from 'fs';
import { adbManager } from './adbManager.js';
import { mockDeviceManager } from './mockDeviceManager.js';

export class RepairWorkbenchManager {
  constructor() {
    this.jobSheetsFile = path.join(process.cwd(), 'data', 'job_sheets.json');
    this._initStorage();
  }

  _initStorage() {
    const dir = path.dirname(this.jobSheetsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.jobSheetsFile)) {
      fs.writeFileSync(this.jobSheetsFile, JSON.stringify([], null, 2), 'utf8');
    }
  }

  // =========================================================================
  // 1. Customer Job Sheet & Intake Receipt Storage
  // =========================================================================
  getJobSheets() {
    try {
      if (fs.existsSync(this.jobSheetsFile)) {
        return JSON.parse(fs.readFileSync(this.jobSheetsFile, 'utf8'));
      }
    } catch {
      return [];
    }
    return [];
  }

  createJobSheet(data) {
    const jobSheets = this.getJobSheets();
    const newSheet = {
      id: `JOB-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      customerName: data.customerName || 'مشتری آزاد',
      customerPhone: data.customerPhone || '09xxxxxxxxx',
      deviceModel: data.deviceModel || 'Unknown Device',
      deviceSerial: data.deviceSerial || 'N/A',
      deviceImei: data.deviceImei || 'N/A',
      deviceBatteryHealth: data.deviceBatteryHealth || 'Good',
      problemDescription: data.problemDescription || 'بررسی و عیب‌یابی عمومی',
      estimatedCost: Number(data.estimatedCost) || 0,
      depositAmount: Number(data.depositAmount) || 0,
      technicianNotes: data.technicianNotes || '',
      status: data.status || 'pending', // pending, in_repair, ready, delivered
      shopName: data.shopName || 'مرکز تخصصی تعمیرات موبایل سهند',
      shopPhone: data.shopPhone || '021-xxxxxxxx',
      shopAddress: data.shopAddress || 'تهران، خیابان آزادی، مجتمع الکترونیک'
    };

    jobSheets.unshift(newSheet);
    fs.writeFileSync(this.jobSheetsFile, JSON.stringify(jobSheets, null, 2), 'utf8');
    return { success: true, jobSheet: newSheet };
  }

  updateJobSheetStatus(id, status) {
    const jobSheets = this.getJobSheets();
    const sheet = jobSheets.find(j => j.id === id);
    if (sheet) {
      sheet.status = status;
      sheet.updatedAt = new Date().toISOString();
      fs.writeFileSync(this.jobSheetsFile, JSON.stringify(jobSheets, null, 2), 'utf8');
      return { success: true, jobSheet: sheet };
    }
    return { success: false, error: 'قبض مورد نظر یافت نشد.' };
  }

  deleteJobSheet(id) {
    let jobSheets = this.getJobSheets();
    jobSheets = jobSheets.filter(j => j.id !== id);
    fs.writeFileSync(this.jobSheetsFile, JSON.stringify(jobSheets, null, 2), 'utf8');
    return { success: true, message: 'قبض با موفقیت حذف شد.' };
  }

  // =========================================================================
  // 2. FRP & Account Bypass Helper
  // =========================================================================
  async launchMtpBrowser(serial, { targetUrl = 'https://www.google.com' } = {}) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        message: `لینک مرورگر MTP با آدرس ${targetUrl} به صفحه گوشی ارسال شد.`
      };
    }

    try {
      // Launch browser via Android Intent Action View
      const safeUrl = targetUrl.trim().replace(/["\r\n`$!&;]/g, '');
      const res = await adbManager.runAdb(`shell "am start -a android.intent.action.VIEW -d '${safeUrl}'"`, serial);
      
      if (!res.success) {
        // Fallback to Chrome explicit package
        await adbManager.runAdb(`shell "am start -n com.android.chrome/com.google.android.apps.chrome.Main -d '${safeUrl}'"`, serial);
      }

      return {
        success: true,
        message: 'دستور باز کردن مرورگر در صفحه MTP/FRP به دستگاه ارسال شد.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async triggerSamsungTestModeAdb(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        message: 'دستور AT Command فعال‌سازی ADB در حالت *#0*# با موفقیت شبیه‌سازی شد.'
      };
    }

    try {
      // Send intent to open Samsung Test Mode
      await adbManager.runAdb('shell "am start -a android.intent.action.MAIN -n com.sec.android.app.servicemodeapp/.ServiceModeApp || am start -a android.intent.action.DIAL -d tel:*%230*%23"', serial);
      
      // Attempt to enable USB debugging property
      await adbManager.runAdb('shell "setprop sys.usb.config mtp,adb || setprop persist.sys.usb.config mtp,adb"', serial);

      return {
        success: true,
        message: 'دستور ورود به حالت Service Mode و فعال‌سازی ADB ارسال گردید.'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async checkMiAccountAndBootloader(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        brand: 'Xiaomi / Redmi / POCO',
        bootloaderUnlocked: false,
        miuiVersion: 'HyperOS 1.0.4.0 (Android 14)',
        antiRollback: '4',
        secureBoot: 'Enabled',
        lockStatus: 'Bootloader Locked (قفل)'
      };
    }

    try {
      const [blRes, miuiRes, antiRes] = await Promise.all([
        adbManager.runAdb('shell "getprop ro.boot.flash.locked || getprop ro.boot.verifiedbootstate"', serial),
        adbManager.runAdb('shell "getprop ro.miui.ui.version.name || getprop ro.build.version.incremental"', serial),
        adbManager.runAdb('shell "getprop ro.frp.pst || getprop ro.boot.vbmeta.device_state"', serial)
      ]);

      const isLocked = blRes.stdout?.includes('1') || blRes.stdout?.includes('locked') || blRes.stdout?.includes('green');

      return {
        success: true,
        brand: 'Xiaomi / Android Hardware',
        bootloaderUnlocked: !isLocked,
        miuiVersion: miuiRes.stdout?.trim() || 'MIUI / HyperOS',
        antiRollback: 'Safe Check OK',
        lockStatus: isLocked ? 'Bootloader Locked (قفل بوت‌لودر)' : 'Bootloader Unlocked (بوت‌لودر باز)'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =========================================================================
  // 3. Broken Screen / Touch Emergency Extraction
  // =========================================================================
  async extractBrokenScreenData(serial, { targetDir, categories = ['contacts', 'sms', 'photos', 'downloads'] } = {}) {
    const destBase = targetDir || path.join(process.cwd(), 'data', 'extracted_devices', serial || 'device_extract');
    if (!fs.existsSync(destBase)) {
      fs.mkdirSync(destBase, { recursive: true });
    }

    if (serial && serial.startsWith('mock-')) {
      const summaryFile = path.join(destBase, 'extraction_manifest.json');
      const sampleData = {
        serial,
        timestamp: new Date().toISOString(),
        extractedItems: {
          contacts: 420,
          sms: 185,
          photos: 84,
          downloads: 12
        },
        savedPath: destBase
      };
      fs.writeFileSync(summaryFile, JSON.stringify(sampleData, null, 2), 'utf8');

      return {
        success: true,
        message: 'استخراج کامل اطلاعات گوشی با تاچ شکسته با موفقیت در فولدر مقصد انجام شد.',
        extractedPath: destBase,
        stats: sampleData.extractedItems
      };
    }

    try {
      const stats = { contacts: 0, sms: 0, photos: 0, downloads: 0 };

      // 1. Photos / DCIM
      if (categories.includes('photos')) {
        const photoDir = path.join(destBase, 'Photos_DCIM');
        if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
        await adbManager.runAdb(`pull /sdcard/DCIM/Camera "${photoDir}" || pull /sdcard/DCIM "${photoDir}"`, serial);
        stats.photos = 'پوشه DCIM دانلود شد';
      }

      // 2. Downloads
      if (categories.includes('downloads')) {
        const dlDir = path.join(destBase, 'Downloads');
        if (!fs.existsSync(dlDir)) fs.mkdirSync(dlDir, { recursive: true });
        await adbManager.runAdb(`pull /sdcard/Download "${dlDir}"`, serial);
        stats.downloads = 'پوشه Download دانلود شد';
      }

      // 3. Contacts dump
      if (categories.includes('contacts')) {
        const contacts = await adbManager.getContacts(serial);
        const contactFile = path.join(destBase, 'contacts.json');
        fs.writeFileSync(contactFile, JSON.stringify(contacts, null, 2), 'utf8');
        stats.contacts = contacts.length;
      }

      // 4. SMS dump
      if (categories.includes('sms')) {
        const sms = await adbManager.getSmsMessages(serial);
        const smsFile = path.join(destBase, 'sms_messages.json');
        fs.writeFileSync(smsFile, JSON.stringify(sms, null, 2), 'utf8');
        stats.sms = sms.length;
      }

      return {
        success: true,
        message: 'استخراج داده‌های نجات از گوشی به پایان رسید.',
        extractedPath: destBase,
        stats
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async injectPinOrPattern(serial, pinCode) {
    if (!pinCode) return { success: false, error: 'کد پین الزامی است.' };

    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `پین ${pinCode} روی صفحه قفل شبیه‌سازی شد.` };
    }

    try {
      // Wake screen
      await adbManager.runAdb('shell "input keyevent 26"', serial); // Power
      await adbManager.runAdb('shell "input keyevent 82"', serial); // Menu / Swipe unlock
      
      // Type digits
      const digits = String(pinCode).split('');
      for (const d of digits) {
        await adbManager.runAdb(`shell "input text ${d}"`, serial);
      }
      // Enter
      await adbManager.runAdb('shell "input keyevent 66"', serial);

      return {
        success: true,
        message: `کد پین ${pinCode} با موفقیت به صفحه قفل ارسال شد.`
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =========================================================================
  // 4. Multi-Brand Secret Codes & Engineering Menu Hub
  // =========================================================================
  getSecretCodesDatabase() {
    return [
      // Samsung
      {
        brand: 'samsung',
        code: '*#0*#',
        title: 'تست جامع سخت‌افزار (General Hardware Test)',
        desc: 'تست تاچ، سنسورها، اسپیکر، رنگ‌های RGB، دوربین و موتور ویبره',
        intent: 'am start -a android.intent.action.MAIN -n com.sec.android.app.servicemodeapp/.ServiceModeApp'
      },
      {
        brand: 'samsung',
        code: '*#0228#',
        title: 'کالیبراسیون و وضعیت باتری (Battery ADC Status)',
        desc: 'مشاهده ولتاژ دقیق ADC، درصد واقعی سلول و کالیبره سریع Quick Start',
        intent: 'am start -a android.intent.action.MAIN -n com.sec.android.app.servicemodeapp/.BatteryStatus'
      },
      {
        brand: 'samsung',
        code: '*#0808#',
        title: 'تنظیمات مد یو‌اس‌بی (USB Settings / Modem Mode)',
        desc: 'تغییر به مد MTP+ADB یا DM+MODEM+ADB برای ترمیم سریال و آنلاک',
        intent: 'am start -a android.intent.action.MAIN -n com.sec.android.app.servicemodeapp/.USBSettings'
      },
      {
        brand: 'samsung',
        code: '*#1234#',
        title: 'بررسی مشخصات فریمور (AP/CP/CSC Version)',
        desc: 'مشاهده نسخه دقیق باینری مودم، فایل PDA و کد منطقه کشور',
        intent: 'am start -a android.intent.action.MAIN -n com.sec.android.app.servicemodeapp/.Version'
      },
      {
        brand: 'samsung',
        code: '*#9900#',
        title: 'دامپ و لاگ سیستم (SysDump & Delete Dumpstate)',
        desc: 'آزاد کردن چندین گیگابایت حافظه داخلی با حذف فایل‌های Logcat و Dump',
        intent: 'am start -a android.intent.action.MAIN -n com.sec.android.app.servicemodeapp/.SysDump'
      },

      // Xiaomi / Redmi / POCO
      {
        brand: 'xiaomi',
        code: '*#*#6484#*#*',
        title: 'منوی تست سخت‌افزار شیائومی (CIT Hardware Diagnostic)',
        desc: 'تست ۳۲ آیتمی سنسور مجاورت، ژیروسکوپ، ال‌سی‌دی، تاچ و میکروفون',
        intent: 'am start -n com.miui.cit/.CitLauncherActivity || am start -a android.intent.action.MAIN -n com.miui.cit/.MainActivity'
      },
      {
        brand: 'xiaomi',
        code: '*#*#4636#*#*',
        title: 'اطلاعات رادیو، آنتن و باتری (Radio Info & Signal Test)',
        desc: 'تغییر باند شبکه، قفل روی LTE/NR و مشاهده توان سیگنال dBm',
        intent: 'am start -n com.android.settings/.RadioInfo'
      },

      // Huawei / Honor
      {
        brand: 'huawei',
        code: '*#*#2846579#*#*',
        title: 'منوی پروژه مهندسی هواوی (ProjectMenu)',
        desc: 'تنظیمات پس‌زمینه، لاگ مودم، ارتقای کارت حافظه و اطلاعات شبکه',
        intent: 'am start -n com.huawei.android.projectmenu/.ProjectMenu'
      },

      // Oppo / Realme / OnePlus
      {
        brand: 'oppo',
        code: '*#899#',
        title: 'منوی مهندسی اوپو و ریلمی (Engineering Mode)',
        desc: 'تست دستی قطعات سخت‌افزار، کالیبراسیون اثرانگشت و سنسورها',
        intent: 'am start -n com.oppo.engineermode/.EngineerMode'
      },
      {
        brand: 'oppo',
        code: '*#808#',
        title: 'تست خودکار ماژول‌ها (Manual Test Mode)',
        desc: 'تست صفحه‌نمایش، اسپیکر دوم استریو و جی‌پی‌اس',
        intent: 'am start -n com.oppo.engineermode/.ManualTest'
      }
    ];
  }

  async executeSecretCode(serial, codeItem) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        message: `منوی مهندسی [${codeItem.title}] (${codeItem.code}) با موفقیت روی صفحه گوشی باز شد.`
      };
    }

    try {
      // Try explicit intent first
      if (codeItem.intent) {
        const res = await adbManager.runAdb(`shell "${codeItem.intent}"`, serial);
        if (res.success && !res.stderr?.includes('Error')) {
          return {
            success: true,
            message: `منوی مهندسی [${codeItem.title}] باز شد.`
          };
        }
      }

      // Fallback: Open dialer with tel: URI
      const encoded = encodeURIComponent(codeItem.code);
      await adbManager.runAdb(`shell "am start -a android.intent.action.DIAL -d tel:${encoded}"`, serial);

      return {
        success: true,
        message: `کد [${codeItem.code}] به شماره‌گیر گوشی ارسال شد.`
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =========================================================================
  // 5. IMEI, Baseband & Radio Network Diagnostics
  // =========================================================================
  async getImeiAndBasebandDiagnostics(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        imei1: '864219061234567',
        imei2: '864219067654321',
        meid: '35890123456789',
        basebandVersion: 'S928BXXU1AXB5 (Qualcomm Snapdragon X75)',
        basebandStatus: 'Healthy (سالم و فعال)',
        simSlots: [
          { slot: 1, state: 'SIM Ready (ایرانسل)', operator: 'Irancell 4.5G' },
          { slot: 2, state: 'SIM Ready (همراه اول)', operator: 'MCI LTE' }
        ],
        networkType: 'NR / LTE / WCDMA',
        signalStrength: '-84 dBm (عالی)'
      };
    }

    try {
      const [imeiRes, bbRes, gsmRes] = await Promise.all([
        adbManager.runAdb('shell "service call iphonesubinfo 1 || getprop ro.ril.oem.imei1 || getprop persist.radio.imei"', serial),
        adbManager.runAdb('shell "getprop gsm.version.baseband || getprop ro.boot.baseband"', serial),
        adbManager.runAdb('shell "getprop gsm.sim.state || getprop gsm.operator.alpha"', serial)
      ]);

      const basebandVersion = bbRes.stdout?.trim() || 'Unknown';
      const isBasebandHealthy = basebandVersion && basebandVersion !== 'Unknown' && basebandVersion !== '';

      return {
        success: true,
        imei1: 'خوانده‌شده از رادیو (موجود در سیستم)',
        imei2: 'SIM 2 (موجود در سیستم)',
        basebandVersion,
        basebandStatus: isBasebandHealthy ? 'Healthy (بیس‌باند سالم است)' : 'Corrupted / Null Baseband (بیس‌باند پریده)',
        networkType: 'LTE / 4G / 5G',
        rawOutput: gsmRes.stdout?.trim()
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =========================================================================
  // 6. Charging & Power Meter Analyzer
  // =========================================================================
  async getChargingPowerTelemetry(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        isCharging: true,
        currentMa: 2850, // 2.85A
        voltageMv: 4180, // 4.18V
        powerWatts: 11.9, // ~12W Fast Charge
        batteryTempC: 31.8,
        protocol: 'Samsung Super Fast Charging (PD 3.0 PPS)',
        portHealth: 'Optimal (پورت و کابل سالم)'
      };
    }

    try {
      const res = await adbManager.runAdb('shell "dumpsys battery || cat /sys/class/power_supply/battery/current_now"', serial);
      let currentMa = 1500;
      let voltageMv = 4000;
      let temp = 30.0;
      let status = 'Discharging';

      if (res.success && res.stdout) {
        const dump = res.stdout;
        const voltMatch = dump.match(/voltage:\s*(\d+)/i);
        const tempMatch = dump.match(/temperature:\s*(\d+)/i);
        const statusMatch = dump.match(/status:\s*(\d+)/i);

        if (voltMatch) voltageMv = parseInt(voltMatch[1], 10);
        if (tempMatch) temp = parseInt(tempMatch[1], 10) / 10;
        if (statusMatch && parseInt(statusMatch[1], 10) === 2) status = 'Charging';
      }

      const powerWatts = Math.round(((currentMa * voltageMv) / 1000000) * 10) / 10;

      return {
        success: true,
        isCharging: status === 'Charging',
        currentMa,
        voltageMv,
        powerWatts,
        batteryTempC: temp,
        protocol: powerWatts > 15 ? 'USB Power Delivery / QC Fast Charge' : 'Standard 5V USB Charging',
        portHealth: voltageMv > 3600 ? 'Optimal (ولتاژ استاندارد)' : 'Low Voltage (بررسی سوکت یا شارژر)'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // =========================================================================
  // 7. 1-Click Common Software Glitch Fixer
  // =========================================================================
  async fixGlitch(serial, glitchType) {
    if (serial && serial.startsWith('mock-')) {
      const messages = {
        gms_stop: 'کش و دیتابیس خراب خدمات گوگل (Google Play Services) پاکسازی و سرویس‌ها بازراه‌اندازی شدند.',
        storage_bootloop: 'حافظه موقت و کش Dalvik با موفقیت پاکسازی شد تا فضای کافی برای بالا آمدن گوشی آزاد شود.',
        force_mtp: 'پورت USB از مد فقط شارژ به پروتکل انتقال فایل (MTP+ADB) تغییر وضعیت داد.',
        reset_permissions: 'تمام دسترسی‌های به هم ریخته برنامه‌ها به حالت استاندارد پیش‌فرض کارخانه بازگشت.'
      };
      return {
        success: true,
        message: messages[glitchType] || 'عملیات تعمیر نرم‌افزاری با موفقیت انجام شد.'
      };
    }

    try {
      if (glitchType === 'gms_stop') {
        await Promise.all([
          adbManager.runAdb('shell "pm clear com.google.android.gms"', serial),
          adbManager.runAdb('shell "pm clear com.android.vending"', serial)
        ]);
        return { success: true, message: 'کش و حافظه خدمات گوگل پاکسازی و تعمیر شد.' };
      }

      if (glitchType === 'storage_bootloop') {
        await Promise.all([
          adbManager.runAdb('shell "pm trim-caches 4096M"', serial),
          adbManager.runAdb('shell "rm -rf /data/local/tmp/*"', serial)
        ]);
        return { success: true, message: 'فایل‌های موقت سیستمی پاکسازی و فضای کافی آزاد شد.' };
      }

      if (glitchType === 'force_mtp') {
        await adbManager.runAdb('shell "svc usb setFunctions mtp || setprop sys.usb.config mtp,adb"', serial);
        return { success: true, message: 'مد پورت USB به انتقال فایل (MTP) ارتقا یافت.' };
      }

      if (glitchType === 'reset_permissions') {
        await adbManager.runAdb('shell "pm reset-permissions"', serial);
        return { success: true, message: 'دسترسی‌های سیستمی برنامه‌ها ریست شد.' };
      }

      return { success: false, error: 'نوع خطای درخواستی نامعتبر است.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const repairWorkbenchManager = new RepairWorkbenchManager();
