@echo off
chcp 65001 >nul
title VB-Audio Virtual Cable Offline Installer
cd /d "%~dp0"
echo ===============================================================================
echo   Installing VB-Audio Virtual Cable (Offline Driver)
echo ===============================================================================
echo.
echo Extracting driver package...
powershell -NoProfile -Command "Expand-Archive -Path 'vbcable.zip' -DestinationPath '$env:TEMP\cpm_vbcable' -Force"

echo Launching installer with Administrator privileges...
powershell -NoProfile -Command "Start-Process -FilePath '$env:TEMP\cpm_vbcable\VBCABLE_Setup_x64.exe' -Verb RunAs"

echo.
echo Please click 'Install Driver' on the installer window.
pause
