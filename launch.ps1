# CellPhoneManager PowerShell Launcher & Auto-Installer
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "CellPhoneManager Desktop Suite"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "  📱 CellPhoneManager Desktop Suite - راه‌انداز خودکار هوشمند" -ForegroundColor Yellow
Write-Host "  مرکز جامع مدیریت، روت، فلش و عیب‌یابی گوشی‌های موبایل" -ForegroundColor Gray
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
Write-Host "[1/4] 🔍 بررسی وجود Node.js در سیستم..." -ForegroundColor Cyan
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "⚠️ موتور Node.js یافت نشد. در حال تلاش برای نصب خودکار از طریق Winget..." -ForegroundColor Yellow
    try {
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        Write-Host "🟢 Node.js با موفقیت نصب شد. لطفاً یک بار سیستم یا پنجره ترمینال را ری‌استارت کنید." -ForegroundColor Green
        Read-Host "برای خروج Enter را فشار دهید"
        exit
    } catch {
        Write-Host "❌ خطا در نصب خودکار Node.js. لطفاً نسخه LTS را از https://nodejs.org دانلود و نصب کنید." -ForegroundColor Red
        Start-Process "https://nodejs.org/"
        Read-Host "برای خروج Enter را فشار دهید"
        exit
    }
} else {
    $nodeVer = (node -v)
    Write-Host "   🟢 Node.js تأیید شد: $nodeVer" -ForegroundColor Green
}

# 2. Check node_modules
Write-Host "`n[2/4] 📦 بررسی پکیج‌های پروژه..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⏳ در حال نصب وابستگی‌ها (npm install)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ خطا در نصب پکیج‌ها! اتصال اینترنت خود را بررسی کنید." -ForegroundColor Red
        Read-Host "برای خروج Enter را فشار دهید"
        exit
    }
} else {
    Write-Host "   🟢 تمام پکیج‌ها آماده هستند." -ForegroundColor Green
}

# 3. Preflight
Write-Host "`n[3/4] 🛠️ اجرای بررسی پیش‌پرواز و آماده‌سازی فایل‌ها..." -ForegroundColor Cyan
node server/preflight.js

# 4. Launch
Write-Host "`n[4/4] 🚀 در حال باز کردن برنامه در مرورگر و شروع سرور..." -ForegroundColor Green
Start-Process "http://localhost:5173"
npm run dev
