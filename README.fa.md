<div align="center" dir="rtl">

# 📱 نرم‌افزار جامع مدیریت تلفن همراه (CellPhoneManager)

<p align="center">
  <b>سامانه یکپارچه عیب‌یابی، استریم صوتی، کنترل سخت‌افزاری و اتوماسیون گوشی‌های هوشمند</b>
  <br />
  <i>توسعه‌یافته توسط شرکت راهکار الکترونیک سهند (<a href="https://irres.ir">irres.ir</a>)</i>
</p>

<p align="center">
  <a href="README.md"><b>🇺🇸 Read in English</b></a> •
  <a href="#-ویژگی‌های-کلیدی"><b>ویژگی‌ها</b></a> •
  <a href="#-راه‌اندازی-سریع"><b>راه‌اندازی</b></a> •
  <a href="#-ساختار-فنی"><b>ساختار فنی</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/نسخه-3.8.0-blue?style=for-the-badge" alt="نسخه 3.8.0" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Express-4-black?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/مجوز-MIT-green?style=for-the-badge" alt="مجوز MIT" />
</p>

</div>

---

<div dir="rtl">

## 🌟 درباره پروژه

**CellPhoneManager** یک پلتفرم جامع و مدرن جهت ارتباط، کنترل، مانیتورینگ بلادرنگ و اتوماسیون دستگاه‌های هوشمند اندرویدی است. این نرم‌افزار توسط **شرکت راهکار الکترونیک سهند** طراحی شده و با ترکیب قدرت **React 19** در فرانت‌اند و **Node.js / Express** در بک‌اند به همراه پروتکل‌های Real-time وب‌سوکت، تجربه‌ای بسیار سریع، پایدار و روان برای پایش سخت‌افزار و انتقال صوت ارائه می‌دهد.

---

## ✨ ویژگی‌های کلیدی

- ⚡ **تله‌متری زنده و مانیتورینگ:** نمایش لحظه‌ای وضعیت باتری، دمای پردازنده، مصرف حافظه رم و فضای ذخیره‌سازی از طریق WebSocket.
- 🎵 **استریم صوتی بدون تاخیر (Low Latency):** انتقال زنده خروجی صوتی گوشی به رایانه با کیفیت بالا.
- 📱 **ابزارهای پیشرفته ADB:** مدیریت فایل‌ها، کنترل از راه دور، پشتیبان‌گیری و عیب‌یابی عمیق سیستم‌عامل.
- 🖥️ **رابط کاربری مدرن و واکنش‌گرا:** طراحی شیک با Tailwind CSS و آیکون‌های روان Lucide React.
- 🧪 **تست‌های خودکار:** دارای پوشش تست با فریم‌ورک Vitest جهت تضمین پایداری نرم‌افزار.

---

## 🛠️ استک فناوری‌ها

- **فرانت‌اند:** React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React
- **بک‌اند:** Node.js, Express.js, WebSockets (`ws`), Multer, CORS
- **تست خودکار:** Vitest
- **اتصال به دستگاه:** پروتکل ADB، روتینگ صوتی و ابزارهای خط فرمان ویندوز

---

## 🚀 راه‌اندازی سریع

### پیش‌نیازها
- نصب [Node.js](https://nodejs.org/) (نسخه ۱۸ یا بالاتر)

### مراحل نصب و اجرا

۱. **کلون کردن مخزن:**
```bash
git clone https://github.com/taimazus/CellPhoneManager.git
cd CellPhoneManager
```

۲. **نصب وابستگی‌ها:**
```bash
npm install
```

۳. **اجرای همزمان فرانت‌اند و بک‌اند در حالت توسعه:**
```bash
npm run dev
```
- کلاینت روی: `http://localhost:5173`
- سرور بک‌اند روی: `http://localhost:3000`

۴. **اجرای تست‌ها:**
```bash
npm test
```

۵. **بیلد نسخه نهایی (Production):**
```bash
npm run build
```

---

## 📁 ساختار پوشه‌بندی

```text
CellPhoneManager/
├── server/               # کدهای سرور Express و وب‌سوکت
├── src/                  # برنامه کاربری فرانت‌اند (React 19)
│   ├── components/       # کامپوننت‌های رابط کاربری
│   ├── hooks/            # هوک‌های مدیریت وضعیت و وب‌سوکت
│   └── App.tsx           # ریشه اپلیکیشن
├── tests/                # تست‌های واحد Vitest
├── package.json          # پیکربندی اسکریپت‌ها و پکیج‌ها
└── vite.config.ts        # تنظیمات بیلد Vite
```

---

## 📄 مجوز انتشار (License)

این پروژه تحت مجوز **MIT** منتشر شده است. برای اطلاعات بیشتر فایل [`LICENSE`](LICENSE) را مطالعه فرمایید.

</div>

---

<div align="center">
  <sub>طراحی و توسعه توسط <a href="https://irres.ir">شرکت راهکار الکترونیک سهند</a> • نگهدارنده: <a href="https://github.com/taimazus">تایماز</a></sub>
</div>
