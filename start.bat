@echo off
chcp 65001 >nul
title CellPhoneManager - مرکز جامع مدیریت و عیب‌یابی موبایل
color 0B
cls

echo ===============================================================================
echo   📱  CellPhoneManager Desktop Suite - راه‌انداز خودکار و هوشمند
echo   مرکز جامع کنترل، روت، فلش، عیب‌یابی و اتصال پیشرفته اندروید و iOS
echo ===============================================================================
echo.

:: 1. Check Node.js Runtime
echo [1/4] 🔍 بررسی وجود موتور اجرایی Node.js در سیستم...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ اخطار: موتور Node.js روی سیستم شما نصب نیست یا در PATH قرار ندارد.
    echo ⏳ تلاش برای نصب خودکار آخرین نسخه پایدار Node.js LTS از طریق Windows Package Manager...
    echo.
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo.
        echo ❌ نصب خودکار با موفقیت انجام نشد.
        echo 📌 لطفاً به وب‌سایت رسمی زیر مراجعه کرده و نسخه LTS را نصب کنید:
        echo    https://nodejs.org/
        echo.
        start https://nodejs.org/
        echo پس از اتمام نصب Node.js، این فایل را مجدداً اجرا نمایید.
        pause
        exit /b 1
    ) else (
        echo 🟢 موتور Node.js با موفقیت روی سیستم نصب گردید. لطفاً یک بار پنجره را ببندید و دوباره اجرا کنید.
        pause
        exit /b 0
    )
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo    🟢 موتور Node.js با موفقیت شناسایی شد: %NODE_VER%
)

:: 2. Check and Install NPM Dependencies
echo.
echo [2/4] 📦 بررسی پکیج‌ها و وابستگی‌های نرم‌افزار (Dependencies)...
if not exist node_modules (
    echo    ⏳ در حال دانلود و نصب خودکار وابستگی‌ها (ممکن است چند لحظه طول بکشد)...
    call npm install > setup_install.log 2>&1
    if %errorlevel% neq 0 (
        echo    ❌ خطا در نصب وابستگی‌های npm!
        echo    🔍 گزارش کامل خطا در فایل زیر ذخیره شد:
        echo       %cd%\setup_install.log
        echo.
        echo    💡 راهکارهای رفع مشکل:
        echo       ۱. اتصال اینترنت یا تحریم‌شکن خود را بررسی کنید.
        echo       ۲. دستور npm cache clean --force را در ترمینال اجرا کنید.
        echo.
        pause
        exit /b 1
    ) else (
        echo    🟢 تمام پکیج‌های مورد نیاز با موفقیت نصب شدند.
    )
) else (
    echo    🟢 پکیج‌های نرم‌افزار قبلاً نصب شده و آماده استفاده هستند.
)

:: 3. Run Preflight Diagnostics
echo.
echo [3/4] 🛠️ اجرای بررسی‌های پیش‌پرواز و راه‌اندازی درایورها و ابزارهای واسط...
node server/preflight.js

:: 4. Launch Application
echo.
echo [4/4] 🚀 در حال راه‌اندازی سرور Backend و رابط کاربری وب...
echo 🌐 آدرس برنامه: http://localhost:5173
echo 💡 مرورگر اینترنت به صورت خودکار تا چند لحظه دیگر باز خواهد شد.
echo ===============================================================================
echo برای خروج از برنامه، کلیدهای Ctrl + C را در این پنجره فشار دهید.
echo ===============================================================================
echo.

:: Open Browser after a slight delay
start "" http://localhost:5173

:: Start App
npm run dev
