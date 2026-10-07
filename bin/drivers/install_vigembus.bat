@echo off
chcp 65001 >nul
title ViGEmBus Virtual Gamepad Driver Offline Installer
cd /d "%~dp0"
echo ===============================================================================
echo   Installing ViGEmBus Virtual Gamepad Driver (Offline Setup)
echo ===============================================================================
echo.
echo Launching installer with Administrator privileges...
powershell -NoProfile -Command "Start-Process -FilePath 'vigembus_setup.exe' -Verb RunAs"

echo.
echo Please complete the installation wizard on screen.
pause
