# 📦 Air-Gapped & Offline Deployment Guide

<div align="center">
  <p><strong>Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)</strong> — <a href="https://irres.ir">https://irres.ir</a></p>
  <p><strong>Software Version:</strong> <code>v3.5.0 Royal Edition</code> | <strong>Universal Smartphone Management Suite</strong></p>
  <p><strong><a href="OFFLINE_DEPLOYMENT.fa.md">🇮🇷 برای مشاهده نسخه فارسی اینجا کلیک کنید</a></strong></p>
</div>

---

### 1. 100% Offline-Ready Core Features
All mission-critical tools and binaries are pre-packaged within the local `bin/` directory and operate with **zero internet connectivity** in secure, air-gapped lab or enterprise environments:

| Feature / Module | Offline Status | Local Binary & Mechanism |
| :--- | :---: | :--- |
| **Wireless PC Gamepad & Remote Engine** | ✅ 100% Offline | Native `winInputBridge.ps1` & local WebSocket |
| **Screen Mirroring & High-FPS Control** | ✅ 100% Offline | `bin/scrcpy/scrcpy.exe` |
| **Android ADB Shell & File Management** | ✅ 100% Offline | `bin/platform-tools/adb.exe` |
| **Firmware Flashing, Root & Bootloader** | ✅ 100% Offline | `bin/platform-tools/fastboot.exe` |
| **Universal AES-256 Encrypted Backups** | ✅ 100% Offline | Internal `UniversalBackupManager` engine |
| **Battery Health, Thermals & Telemetry** | ✅ 100% Offline | Local time-series logging in `data/telemetry/` |
| **PC Speaker Mode Audio Stream** | ✅ 100% Offline | Local WebSocket PCM Audio & Equalizer |
| **System Tuning, Tweaks & Debloating** | ✅ 100% Offline | Secure ADB commands |
| **Screen OCR Text Extractor** | ✅ 100% Offline | Local OCR Canvas / Tesseract engine |
| **Android & Audio Drivers** | ✅ 100% Offline | Pre-bundled driver packages in `bin/drivers/` |

---

### 2. Offline Preparation for Apple iOS Devices
iOS device management is powered by `pymobiledevice3`. For air-gapped deployment on isolated systems:

1. On an internet-connected computer, download the required Python wheels:
   ```bash
   pip download pymobiledevice3 -d bin/wheels
   ```
2. Copy the `bin/wheels/` directory to your target offline workstation.
3. When requested to initialize iOS tools, CellPhoneManager will detect `bin/wheels/` and run the offline installer automatically:
   ```bash
   python -m pip install --no-index --find-links=bin/wheels pymobiledevice3
   ```
4. Install `Apple Mobile Device Support` using offline iTunes setup packages.

---

### 3. Features Inherently Requiring Internet
- **Public IP Verification:** Uses `api.ipify.org`.
- **VPN Server Geolocation:** Uses `ipapi.co`.

---

### 4. Fast Offline Startup
Simply execute `cpmStart.bat`. All internal services initialize rapidly and launch the responsive dashboard in your default browser.
