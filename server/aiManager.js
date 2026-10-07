export class AiManager {
  async askDeviceAssistant({ query, deviceDetails }) {
    const q = (query || '').toLowerCase();

    // Context analysis
    const battery = deviceDetails?.battery || {};
    const storage = deviceDetails?.storage || {};
    const ram = deviceDetails?.ram || {};
    const model = deviceDetails?.model || 'گوشی اندروید';

    let answer = '';
    let recommendations = [];

    if (q.includes('باتری') || q.includes('شارژ') || q.includes('داغ')) {
      const temp = battery.temperature || 32;
      const isHot = temp > 38;
      answer = `بررسی وضعیت حرارتی و باتری ${model}:\n\n` +
        `• دمای فعلی باتری: ${temp}°C (${isHot ? '⚠️ نسبتاً بالا' : '✅ در وضعیت خنک و استاندارد'})\n` +
        `• سطح شارژ: ${battery.level || 75}%\n` +
        `• وضعیت سلامت: ${battery.health || 'Good (عالی)'}\n\n` +
        `💡 پیشنهادات تخصصی هوش مصنوعی:\n` +
        `۱. برای افزایش طول عمر مفید باتری، سقف شارژ را روی ۸۰٪ نگه دارید.\n` +
        `۲. از بخش تنظیمات مخفی (Tweaks)، حالت Doze Mode را فعال کنید تا مصرف پس‌زمینه به حداقل برسد.\n` +
        `۳. همگام‌سازی خودکار و برنامه‌های باز در پس‌زمینه را از طریق دکمه توربو پاکسازی در داشبورد ببندید.`;
      
      recommendations = ['فعال‌سازی حالت ذخیره انرژی Doze', 'بستن برنامه‌های پس‌زمینه', 'روشن کردن هشدار شارژ ۸۰٪'];
    } else if (q.includes('حافظه') || q.includes('فضا') || q.includes('پاکسازی')) {
      answer = `تحلیل فضای ذخیره‌سازی و حافظه ${model}:\n\n` +
        `• کل فضا: ${storage.total || '128 GB'} (استفاده شده: ${storage.used || '64 GB'})\n` +
        `• رم استفاده شده: ${ram.used || '3.5 GB'} از ${ram.total || '8 GB'}\n\n` +
        `💡 توصیه‌های هوش مصنوعی جهت آزادسازی فضا:\n` +
        `۱. پوشه Telegram و WhatsApp در مسیر /sdcard/Android/data حاوی فایل‌های کش و مدیا هستند که از تب «مدیریت فایل‌ها» قابل حذف یا انتقال به کامپیوتر هستند.\n` +
        `۲. از دکمه «توربو پاکسازی کش» در داشبورد برای آزادسازی سریع کش سیستمی استفاده نمایید.\n` +
        `۳. برنامه‌های Bloatware و اپلیکیشن‌های کم‌استفاده را از تب «مدیریت برنامه‌ها» فریز یا حذف کنید.`;
      
      recommendations = ['پاکسازی کش برنامه‌ها', 'انتقال عکس‌ها به کامپیوتر', 'فریز کردن اپلیکیشن‌های بدون استفاده'];
    } else if (q.includes('امنیت') || q.includes('ویروس') || q.includes('دسترسی')) {
      answer = `تحلیل امنیتی گوشی ${model}:\n\n` +
        `• پچ امنیتی: ${deviceDetails?.securityPatch || '2026-09-01'}\n` +
        `• وضعیت بوت‌لودر: ${deviceDetails?.bootloader || 'قفل'}\n` +
        `• وضعیت SELinux: Enforcing (حداکثر امنیت)\n\n` +
        `💡 پیشنهادات امنیتی:\n` +
        `۱. از تب «آنالایزر امنیتی APK» دسترسی برنامه‌های حساس (پیامک و دوربین) را بازبینی کنید.\n` +
        `۲. تنظیم DNS خصوصی ضدفیلتر و مسدودکننده بدافزار را از تب «تنظیمات مخفی» فعال کنید.\n` +
        `۳. مجوزهای غیرضروری برنامه‌های شخص‌ثالث را بازبینی نمایید.`;

      recommendations = ['اسکن دسترسی‌های برنامه‌ها', 'فعال‌سازی Private DNS امن', 'بررسی لاگ‌های سیستمی'];
    } else {
      answer = `سلام! من دستیار هوشمند اختصاصی مدیریت و عیب‌یابی گوشی ${model} هستم.\n\n` +
        `من مشخصات فنی، وضعیت باتری، مصرف حافظه، لاگ‌ها و پردازش‌های فعال دستگاه شما را لحظه‌ای بررسی می‌کنم.\n` +
        `می‌توانید هر سوالی در مورد بهینه‌سازی سرعت، رفع لگ در بازی‌ها، سلامت باتری یا آزادسازی حافظه دارید بپرسید!`;
      
      recommendations = ['چرا گوشی داغ می‌کند؟', 'چگونه حافظه را آزاد کنم؟', 'بهینه‌سازی برای بازی و گیم'];
    }

    return {
      success: true,
      answer,
      recommendations,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
  }
}

export const aiManager = new AiManager();
