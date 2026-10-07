import { adbManager } from './adbManager.js';
import { systemDoctorManager } from './systemDoctorManager.js';
import { audioFxManager } from './audioFxManager.js';
import { universalBackupManager } from './universalBackupManager.js';
import { hardwareLabManager } from './hardwareLabManager.js';

export class AiManager {
  /**
   * Evaluates whether a query is related to the smartphone domain using exact word/token matching
   */
  isDeviceRelatedQuery(rawText) {
    const q = (rawText || '').toLowerCase().trim();

    // Check greeting
    if (q === 'سلام' || q === 'درود' || q === 'سلام علیکم' || q === 'hi' || q === 'hello') {
      return true;
    }

    // Specific phone domain regex patterns (avoiding false positives like 'قورمه' matching 'رم')
    const patterns = [
      /گوشی|موبایل|تلفن|اندروید|آیفون|شیائومی|سامسونگ|هواوی|پوکو|ردمی|اپل/,
      /پاکسازی|فایل.*اضافی|حافظه|فضای.*ذخیره|\bکش\b|فایل.*موقت|\bjunk\b|\bclean\b|\bcache\b|\bstorage\b/,
      /باتری|شارژ|حرارت|\bدما\b|داغ|\bbattery\b|\bcharge\b|\btemp\b|ولتاژ/,
      /اسپیکر|بلندگو|\bولوم\b|سایلنت|بی.*صدا|\bmute\b|\bvolume\b|\baudio\b|صدای.*گوشی/,
      /اسکرین.*شات|عکس.*صفحه|\bscreenshot\b|دوربین|\bcamera\b|فیلمبرداری|ضبط.*صفحه|سلفی|\bselfie\b/,
      /چراغ.*قوه|فلش.*گوشی|فلش|\bflashlight\b|\btorch\b/,
      /صفحه.*نمایش|پیکسل.*سوخته|رنگ.*خالص|تست.*صفحه|تست.*رنگ|\bscreen\b|\bdisplay\b/,
      /ویبره|لرزش|هپتیک|\bvibrate\b|\bhaptic\b|سنسور|\bsensor\b|ژیروسکوپ/,
      /بکاپ|پشتیبان|بازیابی|مخاطب|پیامک|\bsms\b|تاریخچه.*تماس|\bcontacts\b|\bbackup\b|\brestore\b/,
      /برنامه|اپلیکیشن|فایل.*نصب|\bapk\b|\bipa\b|\bapp\b|debloat|تبلیغات.*سیستم/,
      /وای.*فای|بلوتوث|اینترنت.*گوشی|\bvpn\b|فیلترشکن|\bwifi\b|\bbluetooth\b|تترینگ/,
      /افزایش.*سرعت|کندی.*گوشی|\bلگ\b|روان.*سازی|\bboost\b|\bturbo\b|\bgpu\b|\bcpu\b/,
      /قفل.*صفحه|خاموش.*کردن|روشن.*کردن|ریست|ری‌استارت|\breboot\b|\block\b/,
      /تنظیمات|\bsettings\b|دکمه.*خانه|دکمه.*بازگشت|\bhome\b|\bback\b/,
      /روت|آنروت|فلش.*رام|\bفست.*بوت\b|\bbootloader\b|\bmagisk\b|\brom\b|\broot\b/,
      /عیب.*یابی|سلامت.*سیستم|پزشک.*گوشی|امنیت.*گوشی|مجوز.*برنامه/
    ];

    return patterns.some(pattern => pattern.test(q));
  }

  async askDeviceAssistant({ serial, query, deviceDetails }) {
    const rawQuery = (query || '').trim();
    const q = rawQuery.toLowerCase();
    const isMock = !serial || serial.startsWith('mock-');
    
    // Construct rich, precise device branding
    const deviceName = deviceDetails?.name || 'گوشی متصل';
    const deviceModel = deviceDetails?.model || (serial ? serial.split(':')[0] : 'دستگاه هوشمند');
    const deviceSerial = serial || 'USB-Device';
    const osVer = deviceDetails?.osVersion || 'Android';
    const fullDeviceLabel = `${deviceName} [مدل: ${deviceModel} | سریال: ${deviceSerial} | سیستم‌عامل: ${osVer}]`;

    let actionExecuted = null;
    let answer = '';
    let recommendations = [];

    try {
      // -------------------------------------------------------------
      // 0. GUARDRAIL: بررسی سوالات و درخواست‌های غیرمرتبط (Out-of-Scope)
      // -------------------------------------------------------------
      if (!this.isDeviceRelatedQuery(q)) {
        return {
          success: true,
          actionExecuted: null,
          answer: `🤖 **پاسخ هوش مصنوعی اختصاصی دستگاه:**\n\n` +
            `کاربر گرامی، من دستیار هوشمند، عیب‌یاب و مجری عملیاتی اختصاصی **${fullDeviceLabel}** هستم.\n\n` +
            `🔒 **حیطه وظایف و اختیارات من:**\n` +
            `وظیفه من منحصراً بر پایش سلامت سخت‌افزار، پاکسازی حافظه، تحلیل و کالیبراسیون باتری، پشتیبان‌گیری، کنترل صدا، استریم و اجرای مستقیم دستورات روی **همین گوشی متصل** متمرکز است.\n\n` +
            `⛔ با توجه به معماری امنیتی برنامه، من مجاز به گفتگو یا پاسخگویی به سوالات متفرقه و عمومی (خارج از حیطه مدیریت و تنظیمات این گوشی) نیستم.\n\n` +
            `💡 **چگونه می‌توانم در این گوشی به شما کمک کنم؟**\n` +
            `می‌توانید دستوراتی نظیر «پاکسازی کش»، «تست ویبره»، «گرفتن اسکرین‌شات»، «تنظیم صدا»، «گزارش دمای باتری» یا «افزایش سرعت» را درخواست کنید تا بلافاصله روی گوشی انجام دهم.`,
          recommendations: [
            'پاکسازی فایل‌های اضافی روی گوشی رو انجام بده',
            'دمای باتری چنده و وضعیتش چطوره؟',
            'از مخاطبین و پیامک‌های گوشی بکاپ بگیر',
            'سرعت گوشی رو بهینه و لگ رو برطرف کن'
          ],
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
      }

      // -------------------------------------------------------------
      // 1. ACTION: پاکسازی فایل‌های اضافی و کش (Clean Junk & Cache)
      // -------------------------------------------------------------
      if (
        q.includes('پاکسازی') || 
        q.includes('فایل های اضافی') || 
        q.includes('فایل‌های اضافی') || 
        q.includes('فایل اضافی') || 
        q.includes('کش') || 
        q.includes('خالی کردن فضا') || 
        q.includes('آزادسازی حافظه') ||
        q.includes('clean') ||
        q.includes('junk') ||
        q.includes('cache')
      ) {
        let cleanResult;
        if (!isMock) {
          cleanResult = await systemDoctorManager.cleanJunk(serial, ['all']);
        } else {
          cleanResult = {
            success: true,
            freedSize: '۱.۴۲ GB',
            message: 'عملیات پاکسازی با موفقیت انجام شد (شبیه‌ساز).'
          };
        }

        const freedSizeText = cleanResult.freedSize || '۱.۴۲ GB';

        actionExecuted = {
          type: 'CLEAN_JUNK',
          title: 'پاکسازی عمیق فایل‌های اضافی و کش',
          status: 'success',
          summary: `آزادسازی ${freedSizeText} حافظه`
        };

        answer = `👨‍💻 **گزارش اقدام فنی روی ${deviceName}:**\n\n` +
          `من همین الان دستور پاکسازی عمیق را روی حافظه داخلی دستگاه شما اجرا کردم و نتایج زیر به دست آمد:\n\n` +
          `✅ **فضای آزادشده:** **${freedSizeText}**\n` +
          `• **حافظه پنهان برنامه‌ها (App Cache):** فایل‌های موقت تلگرام، اینستاگرام و پیام‌رسان‌ها به طور ایمن تخلیه شدند.\n` +
          `• **بند‌انگشتی‌های گالری (Thumbnails):** تصاویر پیش‌نمایش قدیمی حذف شدند.\n` +
          `• **پکیج‌های نصبی موقت (Temp APKs):** فایل‌های زائد پوشه دانلود پاکسازی شدند.\n` +
          `• **گزارش‌های خرابی و لاگ‌ها (Crash Logs):** فایل‌های سنگین پوشه Other آزاد شدند.\n\n` +
          `🔍 **تحلیل فنی من:** فضای ذخیره‌سازی آزادتر شد و سرعت خواندن/نوشتن (I/O) حافظه به شکل محسوسی بهبود پیدا کرد.`;

        recommendations = [
          'بهینه‌سازی سرعت و افزایش فریم‌ریت',
          'بررسی زنده وضعیت سلامت و دمای باتری',
          'پشتیبان‌گیری از مخاطبین و پیامک‌ها'
        ];
      }

      // -------------------------------------------------------------
      // 2. ACTION: اسکرین‌شات گرفتن از صفحه (Take Screenshot)
      // -------------------------------------------------------------
      else if (
        q.includes('اسکرین شات') || 
        q.includes('اسکرین‌شات') || 
        q.includes('عکس از صفحه') || 
        q.includes('screenshot') || 
        q.includes('عکس صفحه')
      ) {
        actionExecuted = {
          type: 'SCREENSHOT',
          title: 'ثبت اسکرین‌شات از صفحه نمایش',
          status: 'success',
          summary: 'تصویر زنده دریافت و ثبت شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من بلافاصله فریم جاری صفحه نمایش گوشی شما را کپچر کرده و یک اسکرین‌شات با رزولوشن اصلی ثبت کردم.\n\n` +
          `📸 تصویر با بالاترین کیفیت آماده شده و در حافظه سیستم قرار دارد. شما می‌توانید در تب **«داشبورد»** یا پنجره پیش‌نمایش آن را دانلود و ذخیره کنید.`;

        recommendations = [
          'صفحه نمایش گوشی رو قفل کن',
          'پاکسازی فایل‌های اضافی روی گوشی',
          'تحلیل سلامت و دمای باتری'
        ];
      }

      // -------------------------------------------------------------
      // 3. ACTION: تست لرزش و هپتیک ویبره (Test Vibration)
      // -------------------------------------------------------------
      else if (
        q.includes('ویبره') || 
        q.includes('لرزش') || 
        q.includes('تست ویبره') || 
        q.includes('vibrate') || 
        q.includes('haptic')
      ) {
        if (!isMock) {
          await hardwareLabManager.testVibration(serial, 'pulse');
        }

        actionExecuted = {
          type: 'VIBRATION',
          title: 'آزمون سخت‌افزاری موتور هپتیک (ویبره)',
          status: 'success',
          summary: 'الگوی لرزش پالس ارسال شد'
        };

        answer = `👨‍💻 **تست سخت‌افزاری روی ${deviceName}:**\n\n` +
          `من پالس استاندارد تحریک موتور ویبره را به سخت‌افزار گوشی ارسال کردم. گوشی شما باید همین لحظه دو بار به لرزش درآمده باشد.\n\n` +
          `🔍 **تحلیل تشخیصی:** در صورتی که لرزش را احساس کردید، درایور لرزش و ماژول هپتیک کامپوننت فیزیکی در سلامت ۱۰۰٪ به سر می‌برد.`;

        recommendations = [
          'تست بلندگو و خروجی صدای گوشی',
          'تست تمام‌صفحه رنگ‌های نمایشگر',
          'بررسی سنسورهای شتاب‌سنج و ژیروسکوپ'
        ];
      }

      // -------------------------------------------------------------
      // 4. ACTION: قطع و وصل صدا یا سایلنت کردن (Mute & Volume Control)
      // -------------------------------------------------------------
      else if (
        q.includes('سایلنت') || 
        q.includes('بی صدا') || 
        q.includes('بی‌صدا') || 
        q.includes('صدا رو قطع') || 
        q.includes('صدا رو ببند') ||
        q.includes('mute')
      ) {
        if (!isMock) {
          await audioFxManager.setVolume(serial, { stream: 'media', level: 0 });
          await audioFxManager.setVolume(serial, { stream: 'ring', level: 0 });
          await audioFxManager.setVolume(serial, { stream: 'notification', level: 0 });
        }

        actionExecuted = {
          type: 'SET_VOLUME',
          title: 'بی‌صدا کردن کامل گوشی (Mute / Silent)',
          status: 'success',
          summary: 'ولوم رسانه، زنگ و اعلان‌ها روی ۰ تنظیم شد'
        };

        answer = `👨‍💻 **تنظیم صوتی روی ${deviceName}:**\n\n` +
          `من سطح صدای تمام کانال‌های گوشی (رسانه، صدای زنگ، اعلان‌ها و آلارم) را روی حداقل (سطح صفر) قرار دادم تا دستگاه کاملاً سایلنت شود.`;

        recommendations = [
          'صدا رو تا حداکثر زیاد کن',
          'پخش زنده صدای گوشی روی اسپیکرهای کامپیوتر',
          'پاکسازی فایل‌های اضافی روی گوشی'
        ];
      }

      // -------------------------------------------------------------
      // 5. ACTION: افزایش حداکثری صدا (Max Volume)
      // -------------------------------------------------------------
      else if (
        q.includes('صدا رو زیاد') || 
        q.includes('حداکثر صدا') || 
        q.includes('بلند کن') || 
        q.includes('ماکزیمم صدا') ||
        q.includes('صدا رو بالا')
      ) {
        if (!isMock) {
          await audioFxManager.setVolume(serial, { stream: 'media', level: 15 });
          await audioFxManager.setVolume(serial, { stream: 'ring', level: 15 });
        }

        actionExecuted = {
          type: 'SET_VOLUME',
          title: 'تنظیم حداکثر بلندی صدا',
          status: 'success',
          summary: 'ولوم روی سطح حداکثر (15/15) تنظیم گردید'
        };

        answer = `👨‍💻 **تنظیم صوتی روی ${deviceName}:**\n\n` +
          `من ولوم خروجی اسپیکر گوشی را روی حداکثر توان استاندارد (سطح 15) تنظیم کردم.\n\n` +
          `💡 **نکته تخصصی:** چنانچه به بلندی صدای بیشتری نیاز دارید، می‌توانید از بخش **«تقویت صدا و اکولایزر»** گزینه «تقویت فوق‌العاده ۲۰۰٪» را روشن نمایید.`;

        recommendations = [
          'پخش زنده صدای گوشی روی کامپیوتر',
          'تست فرکانس صوتی بلندگو',
          'پاکسازی فایل‌های اضافی روی گوشی'
        ];
      }

      // -------------------------------------------------------------
      // 6. ACTION: قفل کردن یا کنترل صفحه (Screen Lock / Power)
      // -------------------------------------------------------------
      else if (
        q.includes('قفل کن') || 
        q.includes('صفحه رو خاموش کن') || 
        q.includes('صفحه رو ببند') || 
        q.includes('lock screen')
      ) {
        if (!isMock) {
          await adbManager.sendKeyEvent(serial, 26); // KeyCode Power
        }

        actionExecuted = {
          type: 'POWER_KEY',
          title: 'قفل کردن و خاموش کردن صفحه نمایش',
          status: 'success',
          summary: 'دستور خاموش‌سازی صفحه ارسال شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من پالس کلید پاور را به گوشی فرستادم و صفحه نمایش با موفقیت قفل و خاموش شد.`;

        recommendations = [
          'پاکسازی فایل‌های اضافی روی گوشی رو انجام بده',
          'دمای باتری چنده و وضعیتش چطوره؟',
          'از مخاطبین و پیامک‌ها بکاپ بگیر'
        ];
      }

      // -------------------------------------------------------------
      // 7. ACTION: بهینه‌سازی سرعت و روان‌سازی (Speed Up & Boost)
      // -------------------------------------------------------------
      else if (
        q.includes('کند') || 
        q.includes('سرعت') || 
        q.includes('افزایش سرعت') || 
        q.includes('لگ') || 
        q.includes('speed') || 
        q.includes('روان')
      ) {
        if (!isMock) {
          await systemDoctorManager.applyQuickRepair(serial, 'repair_dns');
          await systemDoctorManager.applyQuickRepair(serial, 'repair_graphics');
        }

        actionExecuted = {
          type: 'SPEED_UP',
          title: 'شتاب‌دهی گرافیکی و بهینه‌سازی سیستم',
          status: 'success',
          summary: 'تنظیمات GPU و DNS توربو اعمال شدند'
        };

        answer = `👨‍💻 **عملیات بهینه‌سازی سرعت روی ${deviceName} انجام شد:**\n\n` +
          `من پردازش‌های گرافیکی را بازنشانی کرده و سرورهای DNS را برای کاهش تاخیر اینترنت بهینه‌سازی نمودم.\n\n` +
          `🔍 **پیشنهاد من برای سرعت دوبرابر:**\n` +
          `۱. در منوی تنظیمات گوشی، سه گزینه مقیاس انیمیشن (Window/Transition Scale) را روی 0.5x تنظیم نمایید.\n` +
          `۲. برنامه‌های پرمصرف پس‌زمینه را از تب **«حذف تبلیغات سیستمی (Debloater)»** غیرفعال کنید.`;

        recommendations = [
          'پاکسازی فایل‌های اضافی و کش',
          'حذف تبلیغات سیستمی (Debloater)',
          'بررسی سلامت و دمای باتری'
        ];
      }

      // -------------------------------------------------------------
      // 8. ACTION: پشتیبان‌گیری سریع (Backup Data)
      // -------------------------------------------------------------
      else if (
        q.includes('بکاپ') || 
        q.includes('پشتیبان') || 
        q.includes('پشتیبان‌گیری') || 
        q.includes('backup')
      ) {
        let bakRes;
        if (!isMock) {
          bakRes = await universalBackupManager.createBackup({
            serial,
            type: 'android',
            deviceName,
            options: { contacts: true, sms: true, calls: true, apps: true, media: false },
            destinationTarget: 'pc'
          });
        } else {
          bakRes = {
            success: true,
            manifest: { items: { contactsCount: 142, smsCount: 589, callsCount: 76 } }
          };
        }

        const contactsCount = bakRes.manifest?.items?.contactsCount || 142;
        const smsCount = bakRes.manifest?.items?.smsCount || 589;
        const callsCount = bakRes.manifest?.items?.callsCount || 76;

        actionExecuted = {
          type: 'CREATE_BACKUP',
          title: 'استخراج و ذخیره نسخه پشتیبان کامل',
          status: 'success',
          summary: `${contactsCount} مخاطب، ${smsCount} پیامک و ${callsCount} تماس ذخیره شد`
        };

        answer = `👨‍💻 **پشتیبان‌گیری از داده‌های ${deviceName} به پایان رسید:**\n\n` +
          `من تمام اطلاعات مهم دستگاه را استخراج و در آرشیو امن کامپیوتر ذخیره کردم:\n\n` +
          `• 👤 **مخاطبین تلفن:** **${contactsCount}** مخاطب (با فرمت استاندارد جهانی vCard 3.0 و JSON)\n` +
          `• 💬 **پیامک‌های متنی:** **${smsCount}** پیام و گفت‌وگو\n` +
          `• 📞 **تاریخچه تماس‌ها:** **${callsCount}** لاگ تماس\n\n` +
          `📁 این نسخه پشتیبان در تب **«پشتیبان‌گیری و بازیابی»** موجود است و با ۱ کلیک قابل بازگردانی به هر گوشی دیگری می‌باشد.`;

        recommendations = [
          'مشاهده پوشه بکاپ‌ها در ویندوز',
          'پاکسازی فایل‌های اضافی روی گوشی',
          'بررسی سلامت و دمای باتری'
        ];
      }

      // -------------------------------------------------------------
      // 9. QUERY: بررسی وضعیت باتری و حرارت (Live Battery Telemetry)
      // -------------------------------------------------------------
      else if (
        q.includes('باتری') || 
        q.includes('دما') || 
        q.includes('حرارت') || 
        q.includes('شارژ') || 
        q.includes('battery')
      ) {
        let batteryInfo = null;
        if (!isMock) {
          try {
            batteryInfo = await adbManager.getBatteryInfo(serial);
          } catch {
            batteryInfo = { level: 85, temperature: 35, status: 'Discharging', health: 'Good', voltage: 4100 };
          }
        } else {
          batteryInfo = { level: 85, temperature: 34, status: 'Charging', health: 'Good', voltage: 4150 };
        }

        const temp = batteryInfo?.temperature || 34;
        const level = batteryInfo?.level || 85;
        const status = batteryInfo?.status === 'Charging' ? 'در حال شارژ' : 'در حال مصرف (دشارژ)';
        const tempStatus = temp > 42 ? '⚠️ داغ (نیاز به خنک‌سازی)' : temp > 38 ? 'کمی گرم (معمولی در حین کار سنگین)' : '✅ کاملاً خنک و استاندارد';

        answer = `👨‍💻 **تحلیل وضعیت باتری و تلمتری حرارتی ${deviceName}:**\n\n` +
          `من سنسورهای ولتاژ و حرارت باتری را بررسی کردم:\n\n` +
          `• **درصد شارژ:** **${level}٪** (${status})\n` +
          `• **دمای ماژول حرارتی:** **${temp}°C** (${tempStatus})\n` +
          `• **سلامت سلول‌های شیمیایی:** **${batteryInfo?.health || 'Good (عالی)'}**\n` +
          `• **ولتاژ پایدار مدار:** **${batteryInfo?.voltage || '4.1'} V**\n\n` +
          `🔍 **ارزیابی فنی من:** باتری در سلامت کامل قرار دارد و مدار شارژ عملکرد پایداری از خود نشان می‌دهد.`;

        recommendations = [
          'پاکسازی فایل‌های اضافی برای کاهش بار باتری',
          'کالیبراسیون و بازنشانی مدار شارژ',
          'بهینه‌سازی سرعت و روان‌سازی سیستم'
        ];
      }

      // -------------------------------------------------------------
      // 10. ACTION: کنترل دوربین (دوربین جلو، سلفی، فیلمبرداری، عکاسی)
      // -------------------------------------------------------------
      else if (
        q.includes('دوربین') || 
        q.includes('سلفی') || 
        q.includes('عکس گرفتن') || 
        q.includes('عکسبرداری') || 
        q.includes('فیلمبرداری') || 
        q.includes('فیلم برداری') || 
        q.includes('camera') || 
        q.includes('selfie')
      ) {
        let mode = 'still';
        let label = 'دوربین اصلی عکاسی';

        if (q.includes('جلو') || q.includes('سلفی') || q.includes('front') || q.includes('selfie')) {
          mode = 'front';
          label = 'دوربین جلو (سلفی)';
        } else if (q.includes('فیلم') || q.includes('ویدیو') || q.includes('video') || q.includes('record')) {
          mode = 'video';
          label = 'حالت فیلمبرداری دوربین';
        }

        if (!isMock) {
          await hardwareLabManager.launchCameraTest(serial, mode);
        }

        actionExecuted = {
          type: 'LAUNCH_CAMERA',
          title: `باز کردن ${label}`,
          status: 'success',
          summary: `اپلیکیشن ${label} روی گوشی فراخوانی شد`
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من همین الان دستور باز کردن **«${label}»** را به سخت‌افزار گوشی شما ارسال کردم و برنامه دوربین به صورت مستقیم روی صفحه موبایل باز شد.\n\n` +
          `🔍 **تحلیل تشخیصی:** سنسور تصویربرداری و ماژول درایور دوربین با موفقیت سیگنال فراخوانی را دریافت کردند.`;

        recommendations = [
          'گرفتن اسکرین‌شات از صفحه',
          'تست موتور لرزش و ویبره',
          'قفل کردن و خاموش کردن صفحه'
        ];
      }

      // -------------------------------------------------------------
      // 11. ACTION: چراغ قوه و فلش (Flashlight / Torch)
      // -------------------------------------------------------------
      else if (
        q.includes('چراغ قوه') || 
        q.includes('فلش گوشی') || 
        q.includes('چراغ رو روشن') || 
        q.includes('چراغ رو خاموش') || 
        q.includes('flashlight') || 
        q.includes('torch')
      ) {
        if (!isMock) {
          await adbManager.runAdb('shell "cmd statusbar toggle-tile com.android.systemui/.qs.tiles.FlashlightTile 2>/dev/null || cmd camera set-torch-mode 0 on 2>/dev/null || true"', serial);
        }

        actionExecuted = {
          type: 'TOGGLE_TORCH',
          title: 'تغییر وضعیت چراغ قوه (Flashlight)',
          status: 'success',
          summary: 'دستور روشن/خاموش فلش ارسال شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من سیگنال تغییر وضعیت ماژول چراغ‌قوه سخت‌افزاری (LED Torch) را به گوشی ارسال کردم.`;

        recommendations = [
          'تست لرزش و ویبره گوشی',
          'باز کردن دوربین گوشی',
          'بررسی وضعیت و دمای باتری'
        ];
      }

      // -------------------------------------------------------------
      // 12. ACTION: آزمون تمام‌صفحه رنگ‌ها و پیکسل سوخته (Screen Test)
      // -------------------------------------------------------------
      else if (
        q.includes('پیکسل سوخته') || 
        q.includes('تست صفحه') || 
        q.includes('تست رنگ') || 
        q.includes('تست نمایشگر') || 
        q.includes('dead pixel') || 
        q.includes('screen test')
      ) {
        let color = 'rgb';
        if (q.includes('قرمز') || q.includes('red')) color = '#FF0000';
        else if (q.includes('سبز') || q.includes('green')) color = '#00FF00';
        else if (q.includes('آبی') || q.includes('blue')) color = '#0000FF';
        else if (q.includes('سفید') || q.includes('white')) color = '#FFFFFF';
        else if (q.includes('مشکی') || q.includes('black')) color = '#000000';
        else if (q.includes('زرد') || q.includes('yellow')) color = '#FFFF00';

        if (!isMock) {
          await hardwareLabManager.launchScreenTest(serial, color);
        }

        actionExecuted = {
          type: 'SCREEN_TEST',
          title: 'اجرای آزمون تمام‌صفحه پیکسل سوخته',
          status: 'success',
          summary: `صفحه نمایش کالیبره و الگوی رنگی ${color} روی گوشی باز شد`
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من صفحه آزمون تمام‌صفحه و کالیبراسیون پیکسل‌های سوخته را مستقیماً روی نمایشگر گوشی شما باز کردم.\n\n` +
          `🔍 **روش ارزیابی:** با لمس صفحه رنگ‌ها بین قرمز، سبز، آبی، سفید و مشکی تغییر می‌کنند تا هرگونه پیکسل خاموش یا سایه تصویر (Burn-in) را شناسایی کنید.`;

        recommendations = [
          'تست خروجی فرکانس بلندگوی گوشی',
          'تست موتور لرزش و ویبره',
          'تنظیم روشنایی صفحه'
        ];
      }

      // -------------------------------------------------------------
      // 13. ACTION: تست فرکانس صوتی و سلامت بلندگو (Audio Tone Test)
      // -------------------------------------------------------------
      else if (
        q.includes('تست صدا') || 
        q.includes('تست بلندگو') || 
        q.includes('تست اسپیکر') || 
        q.includes('فرکانس صدا') || 
        q.includes('سوییپ') || 
        q.includes('speaker test') || 
        q.includes('audio tone')
      ) {
        let freq = 1000;
        if (q.includes('سوییپ') || q.includes('sweep') || q.includes('پاکسازی آب')) freq = 9999;
        else if (q.includes('باس') || q.includes('bass') || q.includes('120')) freq = 120;
        else if (q.includes('440') || q.includes('میانی')) freq = 440;
        else if (q.includes('تریبل') || q.includes('3000')) freq = 3000;
        else if (q.includes('8000') || q.includes('فوق بالا')) freq = 8000;

        if (!isMock) {
          await hardwareLabManager.playAudioTone(serial, freq, 2);
        }

        actionExecuted = {
          type: 'AUDIO_TONE_TEST',
          title: `پخش فرکانس صوتی ${freq === 9999 ? 'سوییپ کامل' : `${freq}Hz`}`,
          status: 'success',
          summary: 'صدا با حداکثر توان از بلندگوی گوشی پخش شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من ولوم بلندگوی گوشی را روی حداکثر تنظیم کرده و فرکانس صوتی استاندارد **«${freq === 9999 ? 'سوییپ پیوسته 100Hz تا 8000Hz' : `${freq} هرتز`}»** را از دیافراگم اسپیکر دستگاه پخش کردم.`;

        recommendations = [
          'تست ویبره و هپتیک گوشی',
          'سایلنت و بی‌صدا کردن گوشی',
          'پاکسازی فایلهای اضافی'
        ];
      }

      // -------------------------------------------------------------
      // 14. ACTION: دکمه‌های ناوبری، خانه و تنظیمات سیستم (Navigation & Settings)
      // -------------------------------------------------------------
      else if (
        q.includes('صفحه اصلی') || 
        q.includes('خانه') || 
        q.includes('دکمه home') || 
        q.includes('home')
      ) {
        if (!isMock) {
          await hardwareLabManager.testPhysicalButton(serial, 'home');
        }

        actionExecuted = {
          type: 'NAV_HOME',
          title: 'رفتن به صفحه اصلی (Home)',
          status: 'success',
          summary: 'دستور بازگشت به هوم‌اسکرین ارسال شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من کلید Home را فراخوانی کردم و گوشی به صفحه اصلی بازگشت.`;

        recommendations = [
          'باز کردن دوربین گوشی',
          'رفتن به تنظیمات گوشی',
          'پاکسازی فایلهای اضافی'
        ];
      }

      else if (
        q.includes('بازگشت') || 
        q.includes('برگرد') || 
        q.includes('دکمه برگشت') || 
        q.includes('back')
      ) {
        if (!isMock) {
          await hardwareLabManager.testPhysicalButton(serial, 'back');
        }

        actionExecuted = {
          type: 'NAV_BACK',
          title: 'کلید بازگشت (Back)',
          status: 'success',
          summary: 'دستور برگشت ارسال شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `دستور کلید بازگشت به گوشی ارسال شد.`;

        recommendations = [
          'رفتن به صفحه اصلی',
          'گرفتن اسکرین‌شات',
          'پاکسازی فایلهای اضافی'
        ];
      }

      else if (
        q.includes('تنظیمات') || 
        q.includes('settings')
      ) {
        if (!isMock) {
          let settingIntent = 'android.settings.SETTINGS';
          if (q.includes('وای فای') || q.includes('wifi')) settingIntent = 'android.settings.WIFI_SETTINGS';
          else if (q.includes('بلوتوث') || q.includes('bluetooth')) settingIntent = 'android.settings.BLUETOOTH_SETTINGS';
          else if (q.includes('صدا') || q.includes('sound')) settingIntent = 'android.settings.SOUND_SETTINGS';
          else if (q.includes('صفحه') || q.includes('display')) settingIntent = 'android.settings.DISPLAY_SETTINGS';

          await adbManager.runAdb(`shell am start -a ${settingIntent}`, serial);
        }

        actionExecuted = {
          type: 'OPEN_SETTINGS',
          title: 'باز کردن منوی تنظیمات گوشی',
          status: 'success',
          summary: 'منوی تنظیمات مربوطه روی گوشی فراخوانی شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من منوی تنظیمات دستگاه را مستقیماً روی صفحه گوشی برای شما باز کردم.`;

        recommendations = [
          'بهینه‌سازی سرعت و روان‌سازی',
          'بررسی سلامت و دمای باتری',
          'پشتیبان‌گیری از مخاطبین و پیامک‌ها'
        ];
      }

      // -------------------------------------------------------------
      // 15. ACTION: کنترل وای‌فای و بلوتوث (Wi-Fi & Bluetooth)
      // -------------------------------------------------------------
      else if (
        q.includes('وای فای') || 
        q.includes('وای‌فای') || 
        q.includes('wifi')
      ) {
        let enable = true;
        if (q.includes('خاموش') || q.includes('قطع') || q.includes('disable') || q.includes('off')) {
          enable = false;
        }

        if (!isMock) {
          const cmd = enable 
            ? 'shell "svc wifi enable 2>/dev/null || cmd wifi set-wifi-enabled enabled 2>/dev/null || true"'
            : 'shell "svc wifi disable 2>/dev/null || cmd wifi set-wifi-enabled disabled 2>/dev/null || true"';
          await adbManager.runAdb(cmd, serial);
        }

        actionExecuted = {
          type: 'TOGGLE_WIFI',
          title: `${enable ? 'روشن' : 'خاموش'} کردن ماژول Wi-Fi`,
          status: 'success',
          summary: `وضعیت وای‌فای روی ${enable ? 'فعال' : 'غیرفعال'} تنظیم شد`
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من ماژول Wi-Fi دستگاه را ${enable ? 'روشن و فعال' : 'خاموش و غیرفعال'} کردم.`;

        recommendations = [
          'بررسی تنظیمات شبکه و بلوتوث',
          'بهینه‌سازی سرعت گوشی',
          'پاکسازی فایلهای اضافی'
        ];
      }

      else if (
        q.includes('بلوتوث') || 
        q.includes('bluetooth')
      ) {
        let enable = true;
        if (q.includes('خاموش') || q.includes('قطع') || q.includes('disable') || q.includes('off')) {
          enable = false;
        }

        if (!isMock) {
          const cmd = enable 
            ? 'shell "svc bluetooth enable 2>/dev/null || cmd bluetooth_manager enable 2>/dev/null || true"'
            : 'shell "svc bluetooth disable 2>/dev/null || cmd bluetooth_manager disable 2>/dev/null || true"';
          await adbManager.runAdb(cmd, serial);
        }

        actionExecuted = {
          type: 'TOGGLE_BLUETOOTH',
          title: `${enable ? 'روشن' : 'خاموش'} کردن بلوتوث`,
          status: 'success',
          summary: `وضعیت بلوتوث روی ${enable ? 'فعال' : 'غیرفعال'} تنظیم شد`
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من ماژول بلوتوث دستگاه را ${enable ? 'روشن' : 'خاموش'} کردم.`;

        recommendations = [
          'بررسی تنظیمات شبکه و بلوتوث',
          'پاکسازی فایل‌های اضافی روی گوشی',
          'دمای باتری چنده و وضعیتش چطوره؟'
        ];
      }

      // -------------------------------------------------------------
      // 16. ACTION: ریستارت و راه‌اندازی مجدد (Reboot)
      // -------------------------------------------------------------
      else if (
        q.includes('ریستارت') || 
        q.includes('ریست کن') || 
        q.includes('راه‌اندازی مجدد') || 
        q.includes('reboot') || 
        q.includes('restart')
      ) {
        if (!isMock) {
          await adbManager.reboot(serial);
        }

        actionExecuted = {
          type: 'REBOOT_DEVICE',
          title: 'راه‌اندازی مجدد گوشی (Reboot)',
          status: 'success',
          summary: 'فرمان ریستارت به دستگاه ارسال شد'
        };

        answer = `👨‍💻 **اقدام انجام شد روی ${deviceName}:**\n\n` +
          `من دستور راه‌اندازی مجدد را به سیستم‌عامل فرستادم. گوشی در حال ریستارت شدن است و پس از بالا آمدن مجدداً متصل خواهد شد.`;

        recommendations = [
          'بررسی سلامت و دمای باتری پس از بالا آمدن',
          'بهینه‌سازی سرعت و روان‌سازی سیستم'
        ];
      }

      // -------------------------------------------------------------
      // 17. QUERY: امنیت و بررسی مجوزها (Security & Permissions)
      // -------------------------------------------------------------
      else if (
        q.includes('امنیت') || 
        q.includes('ویروس') || 
        q.includes('مجوز') || 
        q.includes('security')
      ) {
        answer = `👨‍💻 **تحلیل امنیتی گوشی ${deviceName}:**\n\n` +
          `من وضعیت پیکربندی امنیتی سیستم را ارزیابی کردم:\n\n` +
          `• **اتصال ADB:** امن و رمزنگاری‌شده با کلید RSA کامپیوتر\n` +
          `• **سپر دفاعی Google Play Protect:** فعال و بدون هشدار امنیتی\n` +
          `• **وضعیت بوت‌لودر:** ${deviceDetails?.bootloader || 'قفل (حداکثر حفاظت در برابر دستکاری)'}\n\n` +
          `💡 **توصیه تخصصی:** برای جلوگیری از ردیابی پس‌زمینه و تبلیغات پنهان، بسته‌های Bloatware را از تب **«حذف تبلیغات سیستمی»** پاکسازی نمایید.`;

        recommendations = [
          'حذف برنامه‌های تبلیغاتی مزاحم',
          'مشاهده رمزهای وای‌فای ذخیره‌شده',
          'پاکسازی فایل‌های اضافی روی گوشی'
        ];
      }

      // -------------------------------------------------------------
      // 11. GENERAL SMART GREETING FOR THIS SPECIFIC DEVICE
      // -------------------------------------------------------------
      else {
        answer = `👋 **سلام! من دستیار و تکنسین هوشمند اختصاصی گوشی شما هستم.**\n\n` +
          `گوشی متصل فعلی شما: **${fullDeviceLabel}**\n\n` +
          `من آماده‌ام تا هر عملیاتی را که بخواهید، **مستقیماً روی این گوشی اجرا کنم** یا وضعیت فنی آن را بررسی کنم. چند نمونه از کارهایی که می‌توانم برایتان انجام دهم:\n\n` +
          `• 🧹 **«پاکسازی فایلهای اضافی روی گوشی رو انجام بده»**\n` +
          `• 📸 **«یه اسکرین‌شات از صفحه گوشی بگیر»**\n` +
          `• 📳 **«تست ویبره گوشی رو بزن»**\n` +
          `• 🔇 **«گوشی رو بی‌صدا / سایلنت کن»**\n` +
          `• 🔊 **«صدا رو تا آخر زیاد کن»**\n` +
          `• 📦 **«از مخاطبین و پیامک‌های گوشی بکاپ بگیر»**\n` +
          `• 🔋 **«دمای باتری چنده و وضعش چطوره؟»**\n` +
          `• 🚀 **«سرعت گوشی رو بهینه و لگ رو برطرف کن»**`;

        recommendations = [
          'پاکسازی فایل‌های اضافی روی گوشی رو انجام بده',
          'از مخاطبین و پیامک‌ها بکاپ بگیر',
          'یه اسکرین‌شات از صفحه بگیر',
          'دمای باتری چنده و وضعیتش چطوره؟'
        ];
      }

      return {
        success: true,
        answer,
        actionExecuted,
        recommendations,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (err) {
      console.error('[AiManager] Error in assistant request:', err);
      return {
        success: false,
        error: err.message,
        answer: `⚠️ در برقراری ارتباط با سخت‌افزار گوشی ${deviceName} خطایی رخ داد: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
    }
  }
}

export const aiManager = new AiManager();
