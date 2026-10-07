<div lang="fa" dir="rtl" align="right">

# 👑 نرم‌افزار مدیریت جامع و سلطنتی گوشی‌های هوشمند — CellPhoneManager v3.4.4 Royal Edition

[![راهکار الکترونیک سهند](https://img.shields.io/badge/طراحی%20و%20توسعه%20توسط-شرکت%20راهکار%20الکترونیک%20سهند%20(irres.ir)-d4af37?style=for-the-badge&logo=android)](https://irres.ir)
[![گیت‌هاب](https://img.shields.io/badge/مخزن%20گیت‌هاب-taimazus%2FCellPhoneManager-181717?style=for-the-badge&logo=github)](https://github.com/taimazus/CellPhoneManager)
[![نسخه](https://img.shields.io/badge/نسخه-v3.4.4%20Royal%20Edition-eab308?style=for-the-badge)](https://github.com/taimazus/CellPhoneManager)
[![لایسنس](https://img.shields.io/badge/مجوز-MIT-blue?style=for-the-badge)](LICENSE)
[![ویندوز](https://img.shields.io/badge/پلتفرم-ویندوز%20۱۰%20%D9%88%20۱۱%20(x64)-blue?style=for-the-badge&logo=windows)](https://irres.ir)
[![اندروید و آیفون](https://img.shields.io/badge/پشتیبانی-اندروید%20%D9%88%20iOS-purple?style=for-the-badge&logo=apple)](https://irres.ir)

<div align="center">
  <img src="banner.jpg" alt="بنر تبلیغاتی CellPhoneManager Royal Edition" width="100%" style="border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />
  <p><em>طراحی و توسعه اختصاصی توسط <strong>شرکت راهکار الکترونیک سهند</strong> (<a href="https://irres.ir">https://irres.ir</a>)</em></p>
  <p><strong><a href="README.md">🇬🇧 For English Documentation Click Here</a></strong></p>
</div>

---

## 📌 معرفی نرم‌افزار

**CellPhoneManager v3.4.4 Royal Edition** یک نرم‌افزار سازمانی، مدرن، پرسرعت و همه‌منظوره با طراحی لوکس سلطنتی طلایی ۲۴ عیار و زغالی آبسیدین برای رایانه‌های ویندوزی است که گوشی شما (اندروید با هر برندی یا آیفون) را به کامپیوتر متصل کرده و امکاناتی پیشرفته و تخصصی را فراهم می‌سازد:

* **🎮 دسته بازی وایرلس سلطنتی ویندوز (PC Gamepad Engine):** تبدیل هر گوشی به دسته بازی حرفه‌ای بدون تاخیر (Latency < 2ms) با تزریق مستقیم کدهای اسکن سخت‌افزاری (Hardware ScanCode) بدون وابستگی به زبان کیبورد ویندوز (فارسی/انگلیسی)، پشتیبانی همزمان از **۲ بازیکن (Player 1 & Player 2)**، کنترل ۸ جهته مورب، جوی‌استیک آنالوگ لمسی، ویبره هوشمند هپتیک چندسطحی و شبیه‌ساز صدای کلیک مکانیکی.
* **🛡️ موتور تشخیص و ارزیابی ۵ وضعیتی قابلیت‌ها (`capabilityManager`):** بررسی لحظه‌ای پیش‌نیازها (`آماده`، `نیازمند تنظیم`، `نیازمند ابزار`، `پشتیبانی‌نشده`، `نامشخص موقت`) به همراه راهنمای تعاملی گام‌به‌گام برای رفع موانع اتصال.
* **📦 استقرار ۱۰۰٪ آفلاین بدون نیاز به اینترنت (`bin/wheels/`):** ابزارهای بومی اندروید (ADB, Fastboot, Scrcpy) به‌همراه پکیج‌های چرخ آفلاین پایتون برای محیط‌های ایزوله.
* **🔐 بکاپ با رمزنگاری نظامی AES-256 و محافظت در برابر نفوذ:** رمزگذاری پشتیبان‌های مخاطبین، پیامک‌ها، تماس‌ها، گالری و برنامه‌ها با قابلیت بازرسی پیش از بازیابی.
* **⚡ صف اجرای دسته‌جمعی و چنددستگاهی (`taskQueueManager`):** مدیریت وظایف همزمان روی چند گوشی با امکان توقف، ادامه و گزارش‌گیری مجزا.
* **📈 تله‌متری زمانی و مانیتورینگ سلامت باتری (`telemetryManager`):** ثبت سری‌های زمانی دما، ولتاژ، چرخه‌های شارژ و فضای دیسک به همراه هشدارهای هوشمند داغ‌شدن.
* **🎛️ پروفایل‌های تنظیمات و بازگشت به نقطه امن (`profileManager`):** اعمال سریع پروفایل‌های کاربری (*Gaming Pro*، *Eco Power*، *Dev Studio*) و مقایسه تفاوت‌ها (Diff).
* **🔒 گارد ایمنی فلش فریمور و رام (`firmwareGuardManager`):** اعتبارسنجی هش SHA-256 و بررسی پارتیشن‌های هدف پیش از عملیات فست‌بوت.
* **🤖 اتوماسیون‌های هوشمند اتصال (`automationManager`):** اجرای خودکار سناریوهای سلامت‌سنجی یا بکاپ به محض اتصال کابل USB.
* **🔊 بلندگوی کامپیوتر روی گوشی (PC Speaker Mode):** استریم زنده صدای سیستم با تاخیر نزدیک به صفر روی کابل یا وای‌فای با اکولایزر بصری.
* **👑 تم سلطنتی یکپارچه و بهینه‌سازی بارگذاری:** کاهش حجم باندل اولیه فرانت‌اند به ۳۱۴ کیلوبایت با معماری Lazy Loading و انطباق کامل با استاندارد دسترسی‌پذیری WCAG AA.

---

## 🚀 راهنمای نصب و راه‌اندازی سریع

### ۱. دریافت و کلون مخزن
```bash
git clone https://github.com/taimazus/CellPhoneManager.git
cd CellPhoneManager
```

### ۲. نصب پیش‌نیازها (برای بار اول)
```bash
npm install
```

### ۳. اجرای یکپارچه نرم‌افزار
کافیست روی فایل **`cpmStart.bat`** دابل‌کلیک کنید یا در خط فرمان ویندوز اجرا کنید:
```bat
.\cpmStart.bat
```
این اسکریپت به صورت خودکار:
1. سرویس پس‌زمینه (Backend) را روی پورت `3001` اجرا می‌کند.
2. رابط کاربری (Frontend) را روی پورت `5173` بالا می‌آورد.
3. مرورگر شما را به آدرس `http://localhost:5173` باز می‌کند.

### ۴. راه‌اندازی مجدد و اعمال تغییرات
در صورت نیاز به راه‌اندازی مجدد سرویس‌ها بدون تداخل پورت:
```bat
.\cpmRestart.bat
```

### ۵. توقف و آزادسازی منابع
برای بستن ایمن تمامی سرویس‌های فعال و پس‌زمینه:
```bat
.\cpmStop.bat
```

---

## 🎮 راهنمای استفاده از دسته بازی روی موبایل

1. کامپیوتر و گوشی را به یک مودم Wi-Fi متصل کنید (یا از طریق کابل USB قابلیت Reverse را فعال کنید).
2. در داشبورد نرم‌افزار به زبانه **«🎮 دسته بازی (Remote Controller)»** بروید یا در مرورگر گوشی آدرس آی‌پی کامپیوتر را وارد کنید (مثال: `http://192.168.1.152:3001/gamepad.html`).
3. دکمه **«⛶ تمام‌صفحه»** را در گوشی لمس کنید تا صفحه افقی قفل شود.
4. بازی مورد نظر (مانند **FIFA 18**، **Need for Speed** یا **PES**) را اجرا کرده و **یک بار با ماوس روی پنجره بازی کلیک کنید** تا فوکوس ورودی فعال شود.
5. برای بازی دونفره، گوشی دوم را نیز به همان آدرس متصل کرده و دکمه **«🎮 بازیکن ۲»** را انتخاب کنید.

---

## 🧪 تست و آزمون صحت عملکرد

تمامی ۲۶ سوئیت تست (۸۶ تست واحد و یکپارچگی) با موفقیت ۱۰۰٪ پاس می‌شوند:

```bash
# اجرای کل تست‌ها
npm test -- --run

# بیلد نسخه نهایی تولید
npm run build
```

---

## 🏢 شرکت راهکار الکترونیک سهند (Sahand Electronic Solutions Co.)

* **وب‌سایت رسمی:** [https://irres.ir](https://irres.ir)
* **مخزن گیت‌هاب:** [https://github.com/taimazus/CellPhoneManager](https://github.com/taimazus/CellPhoneManager)
* **📘 راهنمای جامع تمامی بخش‌ها و زبانه‌ها (فارسی):** [`docs/USER_GUIDE.fa.md`](docs/USER_GUIDE.fa.md)
* **📘 Complete User & Modules Guide (English):** [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
* **📦 راهنمای استقرار آفلاین (فارسی):** [`docs/OFFLINE_DEPLOYMENT.fa.md`](docs/OFFLINE_DEPLOYMENT.fa.md)
* **📦 Offline Deployment Guide (English):** [`docs/OFFLINE_DEPLOYMENT.md`](docs/OFFLINE_DEPLOYMENT.md)
* **🏗️ سند معماری نرم‌افزار (فارسی):** [`docs/ARCHITECTURE.fa.md`](docs/ARCHITECTURE.fa.md)
* **🏗️ Architecture Specifications (English):** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* **📜 تاریخچه تغییرات:** [`CHANGELOG.md`](CHANGELOG.md)
* **📄 مجوز انتشار:** مجوز متن‌باز MIT

</div>
