@echo off
chcp 65001 >nul
title CellPhoneManager Restart Service
cls

set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%package.json" (
    if defined CPM_HOME (
        if exist "%CPM_HOME%\package.json" set "PROJECT_DIR=%CPM_HOME%\"
    )
)
if not exist "%PROJECT_DIR%package.json" (
    if exist "%USERPROFILE%\Desktop\CellPhoneManager\package.json" set "PROJECT_DIR=%USERPROFILE%\Desktop\CellPhoneManager\"
)

cd /d "%PROJECT_DIR%"

echo ===============================================================================
echo   CellPhoneManager - Restarting Services
echo ===============================================================================
echo.

node server/stop.js

echo.
echo Restarting application in 2 seconds...
ping 127.0.0.1 -n 3 >nul

call "%PROJECT_DIR%cpmStart.bat"
