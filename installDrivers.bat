@echo off
chcp 65001 >nul
title CellPhoneManager - Offline Drivers Installer
cd /d "%~dp0"

echo ===============================================================================
echo   CellPhoneManager — نصب بسته جامع درایورهای گوشی و افزونه‌های صوتی/گیم‌پد
echo   شرکت راهکار الکترونیک سهند — https://irres.ir
echo ===============================================================================
echo.

if exist "bin\drivers\install_phone_drivers.bat" (
    call "bin\drivers\install_phone_drivers.bat"
) else (
    echo [خطا] پوشه درایورها در مسیر bin\drivers یافت نشد.
    pause
)
