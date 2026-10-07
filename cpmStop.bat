@echo off
chcp 65001 >nul
title CellPhoneManager Stop Service
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
echo   CellPhoneManager - Stopping Services
echo ===============================================================================
echo.

node server/stop.js

echo.
echo ===============================================================================
if "%~1"=="" (
    ping 127.0.0.1 -n 3 >nul
)
