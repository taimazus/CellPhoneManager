@echo off
chcp 65001 >nul
title CellPhoneManager - توقف سرویس‌ها (cpmStop)
color 0C
cls

echo ===============================================================================
echo   🛑 CellPhoneManager - در حال توقف سرویس‌های در حال اجرا...
echo ===============================================================================
echo.

:: 1. Terminate processes listening on port 3001 (Backend) and 5173 (Vite Client)
echo [1/2] 🔍 در حال آزادسازی پورت‌های شبکه (3001 و 5173)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-NetTCPConnection -LocalPort 3001,5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

:: 2. Terminate dangling scrcpy mirror sessions if any
echo [2/2] 🧹 پاکسازی پردازه‌های جانبی آینه‌سازی (scrcpy)...
taskkill /F /IM scrcpy.exe >nul 2>&1

echo.
echo 🟢 تمامی سرویس‌های CellPhoneManager با موفقیت متوقف شدند.
echo ===============================================================================
if "%~1"=="" (
    timeout /t 3 >nul
)
