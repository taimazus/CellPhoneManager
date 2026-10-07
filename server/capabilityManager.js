import { toolManager } from './toolManager.js';

export const CAPABILITY_STATUS = {
  READY: 'READY',                                   // آماده: تمام پیش‌نیازها فراهم است
  NEEDS_CONFIG: 'NEEDS_CONFIG',                     // نیازمند تنظیم: مثلاً فعال‌سازی اشکال‌زدایی USB
  NEEDS_TOOL_OR_PERMISSION: 'NEEDS_TOOL_OR_PERMISSION', // نیازمند ابزار یا تأیید مجوز روی گوشی
  UNSUPPORTED: 'UNSUPPORTED',                       // پشتیبانی نمی‌شود: به دلیل محدودیت سیستم‌عامل یا مدل
  INDETERMINATE: 'INDETERMINATE'                    // وضعیت نامشخص: دستگاه آفلاین یا عدم پاسخگویی
};

export class CapabilityManager {
  constructor() {
    this.cache = new Map(); // serial -> { capabilities, checkedAt }
  }

  // Master Capability Catalog with Requirements Definitions
  getCapabilityDefinitions() {
    return [
      {
        id: 'screen_mirror',
        name: 'انتقال و کنترل زنده تصویر (Screen Mirror)',
        category: 'display',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 5.0,
        requiredTools: ['scrcpy', 'adb'],
        requiresDeviceAuth: true,
        description: 'انتقال آنی صفحه نمایش گوشی روی کامپیوتر با ماوس و کیبورد'
      },
      {
        id: 'file_transfer',
        name: 'مدیریت و انتقال فایل (File Transfer)',
        category: 'storage',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 4.1,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'مرور فایل‌ها، دانلود و آپلود اسناد و مدیا بین گوشی و کامپیوتر'
      },
      {
        id: 'app_install',
        name: 'نصب و مدیریت برنامه‌ها (App Management)',
        category: 'apps',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 4.0,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'نصب بسته‌های APK/IPA، استخراج و غیرفعال‌سازی برنامه‌ها'
      },
      {
        id: 'universal_backup',
        name: 'پشتیبان‌گیری جامع (Universal Backup)',
        category: 'data',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 5.0,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'پشتیبان‌گیری کامل از مخاطبین، پیامک‌ها، تماس‌ها و برنامه‌ها'
      },
      {
        id: 'wireless_tethering',
        name: 'اشتراک‌گذاری اینترنت با کابل (USB Tethering)',
        category: 'network',
        requiredOs: ['android', 'mock'],
        minAndroidVersion: 11.0,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'فعال‌سازی خودکار اشتراک اینترنت پرسرعت گوشی با کامپیوتر'
      },
      {
        id: 'hidden_tweaks',
        name: 'شخصی‌سازی و تنظیمات پیشرفته سیستم (Tweaks)',
        category: 'system',
        requiredOs: ['android', 'mock'],
        minAndroidVersion: 7.0,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'تنظیم نرخ نوسازی ۱۲۰Hz، تراکم صفحه DPI و انیمیشن‌ها'
      },
      {
        id: 'gps_simulation',
        name: 'شبیه‌سازی موقعیت مکانی (GPS Simulation)',
        category: 'developer',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 6.0,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'تغییر و تنظیم موقعیت جغرافیایی دلخواه روی نقشه'
      },
      {
        id: 'root_flashing',
        name: 'روت و فلش فریمور (Root & Fastboot)',
        category: 'advanced',
        requiredOs: ['android', 'mock'],
        minAndroidVersion: 6.0,
        requiredTools: ['fastboot', 'adb'],
        requiresDeviceAuth: true,
        requiresRootOrBootloader: true,
        description: 'آنلاک بوت‌لودر، فلش کرنل، Magisk و روت دستگاه'
      },
      {
        id: 'pc_speaker_streaming',
        name: 'استریم صدای کامپیوتر روی گوشی (PC Speaker)',
        category: 'audio',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 5.0,
        requiredTools: [],
        requiresDeviceAuth: false,
        description: 'انتقال شفاف و بدون تاخیر صدای ویندوز به بلندگوی گوشی'
      },
      {
        id: 'ocr_screen',
        name: 'استخراج هوشمند متن از تصویر (Screen OCR)',
        category: 'ai',
        requiredOs: ['android', 'ios', 'mock'],
        minAndroidVersion: 5.0,
        requiredTools: ['adb'],
        requiresDeviceAuth: true,
        description: 'اسکن و بازشناسی متون فارسی و انگلیسی موجود در تصویر گوشی'
      }
    ];
  }

  // Comprehensive Evaluation for a Specific Device
  async evaluateDevice(device) {
    if (!device || !device.id) {
      return {
        success: false,
        error: 'اطلاعات دستگاه معتبر نیست.',
        capabilities: {}
      };
    }

    const serial = device.serial || device.id;
    const isMock = serial.startsWith('mock-');
    const osType = device.type || (isMock ? 'mock' : 'android');
    const deviceState = device.state || 'device'; // device, unauthorized, offline, recovery, fastboot
    const androidVersion = parseFloat(device.androidVersion || device.osVersion || '11.0');

    // Diagnostic tool check on host (skip heavy PowerShell calls for mock devices)
    const toolStatus = isMock ? {} : await toolManager.getDiagnosticStatus().catch(() => ({}));

    const definitions = this.getCapabilityDefinitions();
    const evaluated = {};

    for (const def of definitions) {
      evaluated[def.id] = this.evaluateSingleCapability({
        definition: def,
        device,
        osType,
        deviceState,
        androidVersion,
        isMock,
        toolStatus
      });
    }

    const result = {
      success: true,
      serial,
      deviceName: device.name || device.model || serial,
      osType,
      checkedAt: new Date().toISOString(),
      capabilities: evaluated
    };

    this.cache.set(serial, result);
    return result;
  }

  evaluateSingleCapability({ definition, osType, deviceState, androidVersion, isMock, toolStatus }) {
    // 1. Device Offline / Disconnected
    if (deviceState === 'offline') {
      return {
        status: CAPABILITY_STATUS.INDETERMINATE,
        supported: false,
        reason: 'گوشی اکنون پاسخ نمی‌دهد. کابل USB و اتصال را بررسی و دوباره تلاش کنید.',
        actionGuide: 'کابل USB را جدا کرده و مجدداً متصل کنید.'
      };
    }

    // 2. Mock Device - Full readiness
    if (isMock) {
      return {
        status: CAPABILITY_STATUS.READY,
        supported: true,
        reason: 'قابلیت در محیط شبیه‌ساز کاملاً فعال و آماده استفاده است.',
        actionGuide: null
      };
    }

    // 3. Unauthorized State (RSA fingerprint prompt on phone)
    if (deviceState === 'unauthorized' && definition.requiresDeviceAuth) {
      return {
        status: CAPABILITY_STATUS.NEEDS_TOOL_OR_PERMISSION,
        supported: false,
        reason: 'ارتباط برقرار است، اما مجوز دسترسی داده نشده است.',
        actionGuide: 'صفحه گوشی را آنلاک کنید و پیام "Allow USB Debugging" (اجازه اشکال‌زدایی) را با زدن تیک Always Allow تأیید کنید.'
      };
    }

    // 4. OS Incompatibility
    if (!definition.requiredOs.includes(osType)) {
      return {
        status: CAPABILITY_STATUS.UNSUPPORTED,
        supported: false,
        reason: `این قابلیت برای سیستم‌عامل ${osType.toUpperCase()} تعریف نشده است و تنها روی ${definition.requiredOs.join(', ').toUpperCase()} کار می‌کند.`,
        actionGuide: null
      };
    }

    // 5. Minimum OS Version Check (Android)
    if (osType === 'android' && definition.minAndroidVersion && androidVersion < definition.minAndroidVersion) {
      return {
        status: CAPABILITY_STATUS.UNSUPPORTED,
        supported: false,
        reason: `این عملیات به اندروید ${definition.minAndroidVersion} یا بالاتر نیاز دارد؛ نسخه اندروید دستگاه شما ${androidVersion} است.`,
        actionGuide: 'برای استفاده از این قابلیت، اندروید گوشی خود را آپدیت نمایید.'
      };
    }

    // 6. Host Tool Dependency Check (Scrcpy, Fastboot, etc.)
    if (definition.requiredTools && definition.requiredTools.length > 0) {
      for (const tool of definition.requiredTools) {
        if (tool === 'scrcpy' && toolStatus.scrcpy && !toolStatus.scrcpy.installed) {
          return {
            status: CAPABILITY_STATUS.NEEDS_TOOL_OR_PERMISSION,
            supported: false,
            reason: 'نمایش زنده در دسترس نیست؛ ابزار Scrcpy بر روی کامپیوتر یافت نشد.',
            actionGuide: 'از تب "ابزارها و پیش‌نیازها"، ابزار Scrcpy را با یک کلیک نصب نمایید.'
          };
        }
        if (tool === 'fastboot' && toolStatus.fastboot && !toolStatus.fastboot.installed) {
          return {
            status: CAPABILITY_STATUS.NEEDS_TOOL_OR_PERMISSION,
            supported: false,
            reason: 'ابزار Fastboot روی سیستم ویندوز یافت نشد.',
            actionGuide: 'ابزار Platform Tools را از بخش وضعیت ابزارها راه‌اندازی کنید.'
          };
        }
      }
    }

    // 7. Success - Fully Ready
    return {
      status: CAPABILITY_STATUS.READY,
      supported: true,
      reason: 'کلیه پیش‌نیازهای نرم‌افزاری و سخت‌افزاری مهیا است.',
      actionGuide: null
    };
  }

  // Pre-execution Enforcement Check
  async assertCapability(device, capabilityId) {
    const evalResult = await this.evaluateDevice(device);
    const cap = evalResult.capabilities[capabilityId];
    if (!cap) {
      return { allowed: false, error: `شناسه قابلیت ناشناخته است: ${capabilityId}` };
    }
    if (cap.status !== CAPABILITY_STATUS.READY) {
      return {
        allowed: false,
        status: cap.status,
        error: cap.reason,
        actionGuide: cap.actionGuide
      };
    }
    return { allowed: true };
  }

  getCached(serial) {
    return this.cache.get(serial) || null;
  }
}

export const capabilityManager = new CapabilityManager();
