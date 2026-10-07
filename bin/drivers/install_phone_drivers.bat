@echo off
chcp 65001 >nul
title Universal Phone & Hardware Drivers Installer
cd /d "%~dp0"
echo ===============================================================================
echo   CellPhoneManager — Universal Phone USB & Virtual Drivers Installer
echo   Sahand Electronic Solutions — https://irres.ir
echo ===============================================================================
echo.

:: 1. Install Google Universal ADB & Fastboot USB Drivers
echo [1/3] Installing Universal Android USB & Fastboot Drivers...
if exist "google_usb_driver.zip" (
    powershell -NoProfile -Command "Expand-Archive -Path 'google_usb_driver.zip' -DestinationPath '$env:TEMP\cpm_usb_driver' -Force"
    powershell -NoProfile -Command "Start-Process pnputil.exe -ArgumentList '/add-driver \"$env:TEMP\cpm_usb_driver\usb_driver\*.inf\" /install' -Verb RunAs -Wait"
    echo    --> Universal Android USB drivers registered in Windows Driver Store.
) else (
    echo    --> google_usb_driver.zip not found, skipping.
)
echo.

:: 2. Install VB-Audio Virtual Cable
echo [2/3] Installing VB-Audio Virtual Microphone Cable...
if exist "vbcable.zip" (
    powershell -NoProfile -Command "Expand-Archive -Path 'vbcable.zip' -DestinationPath '$env:TEMP\cpm_vbcable' -Force"
    powershell -NoProfile -Command "Start-Process -FilePath '$env:TEMP\cpm_vbcable\VBCABLE_Setup_x64.exe' -Verb RunAs"
    echo    --> VB-Cable setup launched. Please click 'Install Driver'.
)
echo.

:: 3. Install ViGEmBus Gamepad Driver
echo [3/3] Installing ViGEmBus Virtual Gamepad Driver...
if exist "vigembus_setup.exe" (
    powershell -NoProfile -Command "Start-Process -FilePath 'vigembus_setup.exe' -Verb RunAs"
    echo    --> ViGEmBus setup launched.
)
echo.
echo ===============================================================================
echo   All offline drivers have been initiated successfully!
echo ===============================================================================
pause
