@echo off
chcp 65001 >nul
title CellPhoneManager - راه‌اندازی مجدد سرویس‌ها (cpmRestart)
color 0E
cls

echo ===============================================================================
echo   🔄 CellPhoneManager - راه‌اندازی مجدد (Restart)...
echo ===============================================================================
echo.

:: 1. Run stop routine
call "%~dp0cpmStop.bat" --no-wait

echo.
echo ⏳ در حال شروع مجدد سرویس‌ها تا ۳ ثانیه دیگر...
timeout /t 2 >nul

:: 2. Launch Start
call "%~dp0cpmStart.bat"
