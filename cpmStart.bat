@echo off
chcp 65001 >nul
title CellPhoneManager Suite - Sahand Electronic Solutions
color 0B
cls

:: 0. Resolve Project Root Directory
set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%package.json" (
    if defined CPM_HOME (
        if exist "%CPM_HOME%\package.json" set "PROJECT_DIR=%CPM_HOME%\"
    )
)
if not exist "%PROJECT_DIR%package.json" (
    if exist "%USERPROFILE%\Desktop\CellPhoneManager\package.json" set "PROJECT_DIR=%USERPROFILE%\Desktop\CellPhoneManager\"
)

if not exist "%PROJECT_DIR%package.json" (
    echo Error: CellPhoneManager project directory was not found!
    echo Please set CPM_HOME environment variable to the project path.
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"

if /i "%~1"=="--stop" goto :stop_app
if /i "%~1"=="-stop" goto :stop_app
if /i "%~1"=="stop" goto :stop_app
if /i "%~1"=="--restart" goto :restart_app
if /i "%~1"=="-restart" goto :restart_app
if /i "%~1"=="restart" goto :restart_app
if /i "%~1"=="--add-path" goto :add_path
if /i "%~1"=="--register" goto :add_path
goto :start_app

:stop_app
node server/stop.js
exit /b 0

:restart_app
node server/stop.js
ping 127.0.0.1 -n 3 >nul
call "%PROJECT_DIR%cpmStart.bat"
exit /b 0

:add_path
echo Registering CellPhoneManager in Windows PATH...
setx CPM_HOME "%cd%" >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = [Environment]::GetEnvironmentVariable('PATH', 'User'); if ($p -notlike '*%cd%*') { [Environment]::SetEnvironmentVariable('PATH', $p + ';%cd%', 'User'); Write-Host 'Path added successfully!' } else { Write-Host 'Path already registered.' }"
echo.
pause
exit /b 0

:start_app
echo ===============================================================================
echo   CellPhoneManager Desktop Suite v3.0 [cpmStart]
echo   Sahand Electronic Solutions - https://irres.ir
echo   Complete Phone Management, Diagnostics, ROM, Root and Rescue Suite
echo ===============================================================================
echo Project Location: %cd%
echo.

:: 1. Check Node.js Runtime
echo [1/4] Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not detected on system.
    echo Attempting automatic installation via winget...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo Automatic installation failed. Please download Node.js from https://nodejs.org/
        start https://nodejs.org/
        pause
        exit /b 1
    ) else (
        echo Node.js installed successfully. Please restart this window.
        pause
        exit /b 0
    )
) else (
    echo    Node.js runtime found.
)

:: 2. Check Dependencies
echo.
echo [2/4] Checking software dependencies...
if not exist node_modules (
    echo    Downloading packages, please wait...
    call npm install
    if %errorlevel% neq 0 (
        echo Error installing dependencies.
        pause
        exit /b 1
    )
) else (
    echo    Packages verified and ready.
)

:: 3. Run Preflight Diagnostics
echo.
echo [3/4] Running preflight system checks...
node server/preflight.js

:: 4. Launch Application
echo.
echo [4/4] Starting backend server and web interface...
echo Application URL: http://localhost:5173
echo.
echo ===============================================================================
echo Press Ctrl + C to exit or run cpmStop.bat to terminate.
echo ===============================================================================
echo.

start "" http://localhost:5173

npm run dev
