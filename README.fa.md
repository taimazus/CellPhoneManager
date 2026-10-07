<div lang="fa" dir="rtl" align="right">

# 👑 نرم‌افزار مدیریت جامع و سلطنتی گوشی‌های هوشمند — CellPhoneManager v3.4.0 Royal Edition

[![راهکار الکترونیک سهند](https://img.shields.io/badge/طراحی%20و%20توسعه%20توسط-شرکت%20راهکار%20الکترونیک%20سهند%20(irres.ir)-d4af37?style=for-the-badge&logo=android)](https://irres.ir)
[![گیت‌هاب](https://img.shields.io/badge/مخزن%20گیت‌هاب-taimazus%2FCellPhoneManager-181717?style=for-the-badge&logo=github)](https://github.com/taimazus/CellPhoneManager)
[![نسخه](https://img.shields.io/badge/نسخه-v3.4.0%20Royal%20Edition-eab308?style=for-the-badge)](https://github.com/taimazus/CellPhoneManager)
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

**CellPhoneManager v3.4.0 Royal Edition** یک نرم‌افزار سازمانی، مدرن، پرسرعت و همه‌منظوره با طراحی لوکس سلطنتی طلایی ۲۴ عیار و زغالی آبسیدین برای رایانه‌های ویندوزی است که گوشی شما (اندروید با هر برندی یا آیفون) را به کامپیوتر متصل کرده و امکاناتی پیشرفته و تخصصی را فراهم می‌سازد:

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

## 🚀 راهنمای راه‌اندازی سریع

### ۱. کلون یا دریافت ریپازیتوری
```bash
git clone https://github.com/taimazus/CellPhoneManager.git
cd CellPhoneManager
```

### ۲. اجرای نرم‌افزار
روی فایل **`cpmStart.bat`** دابل‌کلیک کنید یا در خط فرمان بنویسید:
```bat
.\cpmStart.bat
```
اسکریپت خودکار سرور بک‌اند را روی پورت ۳۰۰۱ و کلاینت فرانت‌اند را روی پورت ۵۱۷۳ اجرا کرده و داشبورد را در مرورگر پیش‌فرض شما باز می‌کند.

### ۳. بستن ایمن سرویس‌ها
برای بستن ایمن تمامی سرویس‌های پس‌زمینه و آزادسازی پورت‌ها:
```bat
.\cpmStop.bat
```

---

## 🧪 تست و آزمون صحت عملکرد

تمامی ۲۵ سوئیت تست (۸۰ تست واحد و یکپارچگی) به صورت خودکار قابل اجرا هستند:

```bash
# اجرای کل تست‌ها
npm test -- --run

# بیلد نسخه نهایی
npm run build
```

---

## 🏢 شرکت راهکار الکترونیک سهند (Sahand Electronic Solutions Co.)

* **وب‌سایت رسمی:** [https://irres.ir](https://irres.ir)
* **مخزن گیت‌هاب:** [https://github.com/taimazus/CellPhoneManager](https://github.com/taimazus/CellPhoneManager)
* **راهنمای استقرار آفلاین:** [`docs/OFFLINE_DEPLOYMENT.md`](docs/OFFLINE_DEPLOYMENT.md)
* **مشخصات معماری نرم‌افزار:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* **تاریخچه تغییرات:** [`CHANGELOG.md`](CHANGELOG.md)
* **مجوز انتشار:** مجوز متن‌باز MIT

</div>
