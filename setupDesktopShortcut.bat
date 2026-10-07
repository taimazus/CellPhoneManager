@echo off
chcp 65001 >nul
title CellPhoneManager - ساخت میانبر دسکتاپ و تنظیم متغیر PATH
color 0B
cls

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
cd /d "%PROJECT_DIR%"

node server/setupShortcut.js

if /i not "%~1"=="--silent" (
    pause
)
