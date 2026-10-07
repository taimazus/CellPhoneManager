import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Search, 
  HelpCircle, 
  Smartphone, 
  Usb, 
  Wifi, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Volume2, 
  Camera, 
  HardDrive, 
  Archive, 
  Layers, 
  Key, 
  Sliders, 
  Activity, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, initialTopic = 'getting_started' }) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialTopic);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = [
    { id: 'getting_started', title: '🚀 شروع کار و اتصال گوشی', icon: Smartphone, desc: 'فعال‌سازی اشکال‌زدایی USB و اتصال بی‌سیم' },
    { id: 'brands_guide', title: '📱 راهنمای برندها (شیائومی، سامسونگ...)', icon: Layers, desc: 'تنظیمات خاص MIUI, One UI, EMUI و iOS' },
    { id: 'mirror_stream', title: '🖥️ نمایش زنده و کنترل گوشی', icon: Zap, desc: 'اسکریم، کنترل ماوس و کیبورد و انتقال صدا' },
    { id: 'backup_restore', title: '📦 پشتیبان‌گیری و بازیابی جامع', icon: Archive, desc: 'بکاپ کامل یا سفارشی و انتقال به گوشی جدید' },
    { id: 'apps_apk', title: '🧩 مدیریت و استخراج برنامه‌ها', icon: HardDrive, desc: 'نصب، حذف دسته‌جمعی و استخراج APK/IPA' },
    { id: 'doctor_cleaner', title: '🩺 عیب‌یابی و پاکسازی سیستم', icon: Activity, desc: 'حذف کش، ترمیم دسترسی‌ها و کاهش مصرف باتری' },
    { id: 'debloater', title: '🗑️ حذف تبلیغات و برنامه‌های اضافی', icon: ShieldCheck, desc: 'پاکسازی امن Bloatware بدون نیاز به روت' },
    { id: 'audio_studio', title: '🔊 تقویت صدا و انتقال به کامپیوتر', icon: Volume2, desc: 'اکولایزر، تقویت تا ۲۰۰٪ و پخش آهنگ روی PC' },
    { id: 'camera_mic', title: '🎥 تبدیل به وب‌کم و میکروفون', icon: Camera, desc: 'استفاده از دوربین گوشی به عنوان وب‌کم 4K' },
    { id: 'root_rom', title: '⚡ روت، فلش رام و ریکاوری', icon: Flame, desc: 'آموزش Magisk، فست‌بوت و نجات گوشی بریک‌شده' },
    { id: 'faq_troubleshooting', title: '❓ عیب‌یابی و پرسش‌های متداول', icon: HelpCircle, desc: 'حل مشکلات قطع شدن کابل و نشناختن گوشی' }
  ];

  const guideContent: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
    getting_started: {
      title: 'راهنمای جامع راه‌اندازی و اتصال دستگاه به رایانه',
      subtitle: 'مراحل گام‌به‌گام فعال‌سازی قابلیت اشکال‌زدایی (USB Debugging) در انواع گوشی‌ها',
      content: (
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>مراحل فعال‌سازی USB Debugging در اندروید:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs mr-2">
              <li>وارد <strong>تنظیمات (Settings)</strong> گوشی خود شوید.</li>
              <li>به بخش <strong>درباره تلفن (About Phone)</strong> بروید.</li>
              <li>گزینه <strong>شماره ساخت (Build Number)</strong> یا در شیائومی <strong>MIUI/OS Version</strong> را <strong>۷ مرتبه متوالی لمس کنید</strong> تا پیام «شما اکنون یک توسعه‌دهنده هستید!» ظاهر شود.</li>
              <li>به صفحه اصلی تنظیمات بازگشته و وارد <strong>گزینه‌های توسعه‌دهنده (Developer Options)</strong> شوید.</li>
              <li>گزینه <strong>اشکال‌زدایی USB (USB Debugging)</strong> را روشن کنید.</li>
              <li>کابل گوشی را به کامپیوتر متصل کنید و در پیام پاپ‌آپ ظاهرشده روی گوشی، تیک <strong>همیشه اجازه داده شود (Always allow)</strong> را بزنید و دکمه <strong>تأیید (OK)</strong> را لمس نمایید.</li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>اتصال بی‌سیم (Wireless ADB بدون نیاز به کابل):</span>
            </h4>
            <p className="text-xs text-slate-400">
              ۱. مطمئن شوید گوشی و کامپیوتر هر دو به <strong>یک شبکه وای‌فای مشترک</strong> متصل هستند.<br />
              ۲. برای بار اول با کابل متصل شده و دکمه <strong>«اتصال وای‌فای (Wireless)»</strong> در بالای برنامه را بزنید تا پورت ۵۵۵۵ فعال شود.<br />
              ۳. در اندروید ۱۱ به بالا می‌توانید از منوی Developer Options گزینه <strong>Wireless Debugging</strong> را فعال کرده و با IP و پورت جفت‌سازی (Pairing Code) متصل شوید.
            </p>
          </div>
        </div>
      )
    },

    brands_guide: {
      title: 'راهنمای اختصاصی برندهای شیائومی، سامسونگ، هواوی و آیفون',
      subtitle: 'رفع محدودیت‌ها و مجوزهای امنیتی خاص هر شرکت',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <h4 className="font-bold text-amber-300">⚡ گوشی‌های شیائومی، پوکو و ردمی (Xiaomi / HyperOS / MIUI):</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              در گوشی‌های شیائومی برای امکان کنترل لمسی از روی کامپیوتر و نصب خودکار برنامه‌ها، علاوه بر USB Debugging باید گزینه‌های زیر را در منوی <strong>Developer Options</strong> روشن کنید:
            </p>
            <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1 mr-2">
              <li><strong>Install via USB</strong> (نصب برنامه‌ها از طریق USB)</li>
              <li><strong>USB Debugging (Security Settings)</strong> (مجوز شبیه‌سازی لمس و کیبورد)</li>
              <li><strong>Disable Permission Monitoring</strong> (در صورت قطع مکرر صدا یا تاچ)</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
            <h4 className="font-bold text-blue-300">🔷 گوشی‌های سامسونگ (Samsung One UI):</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              اگر پس از اتصال فقط حالت شارژ فعال می‌شود:
            </p>
            <ul className="list-disc list-inside text-xs text-blue-200/90 space-y-1 mr-2">
              <li>از نوار اعلان، حالت اتصال USB را از «فقط شارژ» به <strong>«انتقال فایل (MTP / Transferring files)»</strong> تغییر دهید.</li>
              <li>در صورت نصب برنامه Samsung Smart Switch، آن را موقتاً ببندید تا پورت ADB آزاد شود.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100">🍎 دستگاه‌های اپل آیفون و آیپد (Apple iOS):</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              پس از اتصال کابل لایتنینگ/تایپ‌سی به کامپیوتر، روی صفحه آیفون پیام <strong>Trust This Computer</strong> ظاهر می‌شود. دکمه <strong>Trust</strong> را بزنید و رمز عبور گوشی را وارد کنید. سرویس usbmuxd به‌طور خودکار ارتباط را برقرار می‌کند.
            </p>
          </div>
        </div>
      )
    },

    mirror_stream: {
      title: 'راهنمای نمایش زنده، کنترل لمسی و انتقال صدا به کامپیوتر',
      subtitle: 'تجربه روانی تصویر با نرخ ۶۰ فریم بر ثانیه و تاخیر نزدیک به صفر',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">🎮 امکانات و کلیدهای میانبر:</h4>
            <ul className="space-y-1.5 list-disc list-inside mr-2">
              <li><strong>کلیک چپ ماوس:</strong> لمس و باز کردن برنامه‌ها</li>
              <li><strong>کلیک راست ماوس:</strong> دکمه بازگشت (Back)</li>
              <li><strong>چرخ ماوس (اسکرول):</strong> پیمایش لیست‌ها و اینستاگرام/تلگرام</li>
              <li><strong>کلیک وسط ماوس:</strong> رفتن به صفحه اصلی (Home)</li>
              <li><strong>درگ و اسلاید:</strong> کشیدن نوار اعلان‌ها از بالا به پایین یا سوایپ بین صفحات</li>
            </ul>
          </div>
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-300">
            💡 برای بازی‌های سنگین، پیشنهاد می‌شود از حالت <strong>موتور پرسرعت Scrcpy</strong> استفاده کنید تا از پردازش کارت گرافیک (GPU) نهایت بهره برده شود.
          </div>
        </div>
      )
    },

    backup_restore: {
      title: 'راهنمای پشتیبان‌گیری کامل و بازیابی سفارشی اطلاعات',
      subtitle: 'چگونه از تمام مخاطبین، پیامک‌ها، عکس‌ها و برنامه‌ها بکاپ بگیریم؟',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h5 className="font-bold text-white">✨ پشتیبان‌گیری ۱ کلیکی کامل:</h5>
              <p className="text-slate-400">تمام مخاطبین (به صورت vCard)، پیامک‌های SMS، تاریخچه تماس‌ها، عکس‌های دوربین و لیست برنامه‌ها را بدون نیاز به روت در کامپیوتر یا کارت حافظه گوشی ذخیره می‌کند.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h5 className="font-bold text-white">🎛️ بازیابی سفارشی و گزینشی:</h5>
              <p className="text-slate-400">در زمان بازیابی، می‌توانید تیک مخاطبین یا پیامک‌ها را جداگانه بزنید تا فقط موارد دلخواه شما روی گوشی جدید تزریق شوند.</p>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
            📁 تمام بک‌آپ‌ها در پوشه <code>backups/</code> کامپیوتر نگهداری می‌شوند و با کلیک روی دکمه «پوشه بکاپ‌ها در PC» می‌توانید فایل‌ها را مستقیماً کپی یا در فلش مموری ذخیره کنید.
          </div>
        </div>
      )
    },

    doctor_cleaner: {
      title: 'پزشک سیستم، پاکسازی فایل‌های اضافی و تعمیرات خودکار',
      subtitle: 'آزادسازی گیگابایت‌ها فضای خالی و رفع کندی سرعت گوشی',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">🧹 چه مواردی پاکسازی می‌شوند؟</h4>
            <ul className="space-y-1.5 list-disc list-inside mr-2 text-slate-300">
              <li><strong>حافظه کش پنهان برنامه‌ها (App Cache):</strong> داده‌های موقت پیام‌رسان‌ها و مرورگرها بدون پاک شدن اطلاعات شخصی.</li>
              <li><strong>بسته‌های نصبی موقت (Temp APKs):</strong> فایل‌های نصبی قدیمی باقی‌مانده در پوشه Download.</li>
              <li><strong>بند انگشتی تصاویر (Thumbnails):</strong> فایل‌های کش گالری که بعد از پاک کردن عکس‌ها در حافظه باقی می‌مانند.</li>
              <li><strong>گزارش خطاها و لاگ‌های سنگین (Crash Dumps):</strong> لاگ‌های حجیم سیستمی که باعث پر شدن پوشه Other می‌شوند.</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <h4 className="font-bold text-cyan-300 text-sm">🛠️ جعبه ابزار تعمیرات ۱ کلیکی:</h4>
            <p className="text-slate-300">شامل بهینه‌سازی سرورهای DNS جهت افزایش سرعت اینترنت، بازنشانی سرویس باتری (Battery Calibration) و راه‌اندازی مجدد سرور گرافیکی سیستم.</p>
          </div>
        </div>
      )
    },

    debloater: {
      title: 'راهنمای حذف تبلیغات سیستمی و برنامه‌های ناخواسته (Debloater)',
      subtitle: 'پاکسازی امن برنامه‌های پیش‌فرض شیائومی، سامسونگ و گوگل بدون نیاز به روت',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>بسیاری از گوشی‌ها به صورت پیش‌فرض دارای برنامه‌های تبلیغاتی، بازی‌های اسپانسر شده و سرویس‌های جمع‌آوری داده هستند که سرعت گوشی و باتری را کاهش می‌دهند.</p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">✅ فهرست برنامه‌های قابل حذف امن:</h4>
            <ul className="space-y-1 list-disc list-inside mr-2">
              <li>سرویس تبلیغات شیائومی: <code>com.miui.msa.global</code> و <code>com.miui.analytics</code></li>
              <li>مرورگر پیش‌فرض شیائومی (Mi Browser): <code>com.mi.globalbrowser</code></li>
              <li>برنامه‌های تجاری سامسونگ: Samsung Members, Facebook Services, Microsoft Office</li>
            </ul>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300">
            ⚠️ <strong>نکته ایمنی:</strong> در صورتی که برنامه‌ای را اشتباهاً حذف کردید، نگران نباشید! از تب «برنامه‌های حذف‌شده» می‌توانید آن را با ۱ کلیک مجدداً بازیابی و فعال نمایید.
          </div>
        </div>
      )
    },

    audio_studio: {
      title: 'راهنمای استودیوی صوتی، تقویت صدا و انتقال به کامپیوتر',
      subtitle: 'چگونه آهنگ و صدای بازی گوشی را از بلندگوهای کامپیوتر پخش کنیم؟',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">🎵 پخش صدای گوشی روی اسپیکر کامپیوتر:</h4>
            <p className="text-slate-300">
              با فعال کردن کلید <strong>«پخش زنده صدای گوشی روی PC»</strong>، کلیه صداهای مدیا، موسیقی، پادکست و بازی‌ها از طریق پل ارتباطی با کیفیت بالا به اسپیکر یا هدفون متصل به کامپیوتر هدایت می‌شوند.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">🔊 تقویت بلندی صدا (Volume Booster):</h4>
            <p className="text-slate-300">
              می‌توانید بلندی صدای خروجی را تا <strong>۲۰۰٪</strong> همراه با اکولایزر بیس قوی (Bass Boost) و شفافیت گفتار (Vocal Clarity) تقویت نمایید.
            </p>
          </div>
        </div>
      )
    },

    camera_mic: {
      title: 'راهنمای تبدیل دوربین و میکروفون گوشی به وب‌کم رایانه',
      subtitle: 'استفاده در تماس‌های ویدیویی تلگرام، واتساپ، ادوبی کانکت، زوم و اسکایپ',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            دوربین باکیفیت گوشی‌های هوشمند بسیار بهتر از وب‌کم‌های گران‌قیمت لپ‌تاپ عمل می‌کند. با این قابلیت، تصویر دوربین اصلی یا سلفی همراه با فوکوس و نور کافی به کامپیوتر استریم می‌شود.
          </p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">🎤 تبدیل به میکروفون استودیویی کامپیوتر:</h4>
            <p className="text-slate-300">
              در تب «میکروفون»، صدای شما از طریق میکروفون مجهز به نویزگیر گوشی ضبط و با بالاترین کیفیت به کامپیوتر منتقل شده و ذخیره می‌شود.
            </p>
          </div>
        </div>
      )
    },

    root_rom: {
      title: 'راهنمای فلش رام، روت Magisk و محیط فست‌بوت',
      subtitle: 'ابزارهای تخصصی تکنسین‌های تعمیرات موبایل',
      content: (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <h4 className="font-bold text-rose-300 text-sm">⚡ عملیات فست‌بوت و ریکاوری:</h4>
            <p className="text-slate-300">
              امکان بازنشانی قفل بوت‌لودر (Unlock Bootloader)، تغییر اسلات فعال بوت (Slot A/B) و نصب ریکاوری کاستوم (TWRP / OrangeFox) با بررسی خودکار سازگاری پردازنده گوشی.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">📱 روت و آن‌روت یکپارچه:</h4>
            <p className="text-slate-300">
              پچ کردن خودکار فایل <code>boot.img</code> با آخرین نسخه Magisk و نصب امن روت بدون آسیب به داده‌های کاربری.
            </p>
          </div>
        </div>
      )
    },

    faq_troubleshooting: {
      title: 'پرسش‌های متداول و عیب‌یابی خطاهای اتصال',
      subtitle: 'راه‌حل‌های سریع برای رایج‌ترین مشکلات کاربران',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <h5 className="font-bold text-cyan-300">❓ چرا گوشی متصل شده ولی برنامه آن را شناسایی نمی‌کند؟</h5>
            <p className="text-slate-400">
              ۱. کابل USB را جدا کرده و به یکی از پورت‌های پشت کیس کامپیوتر (مستقیم به مادربورد) متصل کنید.<br />
              ۲. مطمئن شوید درایور ADB گوشی نصب است (دکمه «عیب‌یابی ابزارها» را در داشبورد بزنید).<br />
              ۳. قفل صفحه گوشی را باز کنید و در پیام نمایش‌داده‌شده دکمه «Always allow from this computer» را تأیید نمایید.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <h5 className="font-bold text-cyan-300">❓ وضعیت دستگاه روی Unauthorized یا Offline است، چه کنم؟</h5>
            <p className="text-slate-400">
              یک‌بار گزینه USB Debugging را در تنظیمات گوشی خاموش و مجدداً روشن کنید. در منوی Developer Options گزینه <strong>Revoke USB debugging authorizations</strong> را بزنید تا کلید امنیتی ریست شود.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <h5 className="font-bold text-cyan-300">❓ آیا استفاده از این برنامه اطلاعات شخصی من را پاک می‌کند؟</h5>
            <p className="text-slate-400">
              خیر! کلیه قابلیت‌های نمایش زنده، استخراج فایل، پاکسازی کش و بکاپ‌گیری به داده‌های شخصی شما صدمه نمی‌زنند و کاملاً بدون خطر هستند.
            </p>
          </div>
        </div>
      )
    }
  };

  const filteredCategories = categories.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentContent = guideContent[activeCategory] || guideContent.getting_started;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#121319] border border-amber-500/30 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-5 bg-[#171822] border-b border-amber-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>مرکز راهنما و آموزش جامع کاربران (Help & Learning Center)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-yellow-300 font-mono font-bold border border-amber-500/30">
                  ROYAL EDITION
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                راهنمای قدم‌به‌قدم فعال‌سازی و بهره‌برداری از کلیه امکانات حرفه‌ای CellPhoneManager
              </p>
            </div>
          </div>


          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left / Category Sidebar (4 cols) */}
          <div className="md:col-span-4 bg-slate-950/70 border-l border-slate-800/80 p-4 flex flex-col gap-3 overflow-hidden">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در سرفصل‌های راهنما..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500 transition-all font-sans"
              />
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-right p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isActive 
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/5' 
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {cat.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right / Content Area (8 cols) */}
          <div className="md:col-span-8 p-6 overflow-y-auto flex flex-col justify-between space-y-6 bg-[#0c142b]/60">
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-4 space-y-1">
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <span>{currentContent.title}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {currentContent.subtitle}
                </p>
              </div>

              {/* Dynamic Topic Content */}
              {currentContent.content}
            </div>

            {/* Bottom Support Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>نیاز به پشتیبانی بیشتر دارید؟ وبسایت سهند:</span>
                <a 
                  href="https://irres.ir" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 hover:underline font-mono"
                >
                  irres.ir
                </a>
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                متوجه شدم، بستن راهنما
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
