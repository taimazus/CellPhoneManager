# 👑 CellPhoneManager v3.4.4 Royal Edition — Universal Smartphone Management Suite

[![Sahand Electronic Solutions](https://img.shields.io/badge/Developed%20By-Sahand%20Electronic%20Solutions%20(irres.ir)-d4af37?style=for-the-badge&logo=android)](https://irres.ir)
[![GitHub Repository](https://img.shields.io/badge/GitHub-taimazus%2FCellPhoneManager-181717?style=for-the-badge&logo=github)](https://github.com/taimazus/CellPhoneManager)
[![Release Version](https://img.shields.io/badge/Version-v3.4.4%20Royal%20Edition-eab308?style=for-the-badge)](https://github.com/taimazus/CellPhoneManager)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20(x64)-blue?style=for-the-badge&logo=windows)](https://irres.ir)
[![Cross Platform](https://img.shields.io/badge/Support-Android%20%26%20Apple%20iOS-purple?style=for-the-badge&logo=apple)](https://irres.ir)

<div align="center">
  <img src="banner.jpg" alt="CellPhoneManager Royal Edition Promotional Banner" width="100%" style="border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />
  <p><em>Exclusively engineered and developed by <strong>Sahand Electronic Solutions Co.</strong> (<a href="https://irres.ir">https://irres.ir</a>)</em></p>
  <p><strong><a href="README.fa.md">🇮🇷 برای مشاهده مستندات کامل به زبان فارسی اینجا کلیک کنید</a></strong></p>
</div>

---

## 📌 Overview

**CellPhoneManager v3.4.4 Royal Edition** is an enterprise-grade, high-performance smartphone bridge and device management suite designed for Windows 10 & 11 with an Imperial Charcoal & Royal 24k Gold aesthetic. It connects to Android (Xiaomi / HyperOS / MIUI, Samsung One UI, Huawei EMUI, Oppo ColorOS, Google Pixel) and Apple iOS devices over high-speed USB or Wireless ADB, providing rich diagnostics, hardware testing, audio streaming, screen recording, system cleaning, security auditing, multi-player PC gamepad simulation, and full data management.

---

## 🌟 Strategic Core Capabilities

* **🎮 Ultra-Low Latency Wireless PC Gamepad Engine (`pcGamepadManager`):** Transforms any smartphone into a high-precision PC gamepad with native Windows Hardware ScanCode injection (`winInputBridge.ps1`) bypassing keyboard layout dependencies (Persian/English), simultaneous **Player 1 & Player 2** multi-device support, 8-way diagonal sliding D-pad, virtual analog thumbstick, multi-intensity haptic vibration, and mechanical click sound synthesis.
* **🛡️ Device Capability Detection Engine (`capabilityManager`):** Real-time 5-state prerequisite evaluation (`READY`, `NEEDS_CONFIG`, `NEEDS_TOOL_OR_PERMISSION`, `UNSUPPORTED`, `INDETERMINATE`) with per-device caching and actionable step-by-step guidance.
* **📦 100% Offline Air-Gapped Deployment (`bin/wheels/`):** Bundled native Android tools (ADB, Fastboot, Scrcpy) and offline Python wheel fallbacks with zero mandatory internet dependency.
* **🔐 AES-256 Encrypted Backup & Universal Migration:** Military-grade encryption for local backups (Contacts, SMS, Calls, Photos, Apps) with pre-restore inspection and path-traversal prevention.
* **⚡ Multi-Device Task Queue (`taskQueueManager`):** Concurrent batch execution engine (e.g. multi-device APK installations, diagnostics, backups) with pause, resume, and per-device reporting.
* **📈 Historical Telemetry & Health Monitoring (`telemetryManager`):** Time-series logging of battery temperature, voltage, health cycle count, and storage metrics with automated overheating alerts.
* **🎛️ Configuration Profiles & Diff Rollback (`profileManager`):** Instant application of tuned device profiles (*Gaming Pro*, *Eco Power Saver*, *Dev Studio*) with JSON snapshot comparisons and 1-click restore.
* **🔒 Safe Firmware Flashing Guard (`firmwareGuardManager`):** SHA-256 integrity verification, target partition checks, and payload validation prior to fastboot operations.
* **🤖 Smart Connection Automations (`automationManager`):** Event-driven trigger engine running automated health checks, notifications, or backup tasks upon USB connection.
* **🔊 PC-to-Phone Speaker Mode:** Ultra-low latency system audio streaming from Windows to your connected smartphone over USB (`adb reverse`) or local Wi-Fi with an interactive visualizer.
* **👑 Harmonized Royal Gold Aesthetics:** Fully accessible WCAG AA compliant dark charcoal & 24k gold UI across all tabs, modals, and interactive guides.

---

## 🚀 Installation & Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/taimazus/CellPhoneManager.git
cd CellPhoneManager
```

### 2. Install Dependencies (First Run Only)
```bash
npm install
```

### 3. Start Application
Double-click **`cpmStart.bat`** or execute in command prompt:
```bat
.\cpmStart.bat
```
This automated launcher boots the Express backend on `http://127.0.0.1:3001`, launches the React Vite frontend on `http://127.0.0.1:5173`, and opens the dashboard in your default browser.

### 4. Restart Services
To cleanly restart background processes and reload configs:
```bat
.\cpmRestart.bat
```

### 5. Safe Shutdown
To terminate all active processes and release network ports:
```bat
.\cpmStop.bat
```

---

## 🎮 Smartphone Gamepad Usage Guide

1. Ensure your PC and smartphone are connected to the same local Wi-Fi network (or connected via USB cable).
2. Navigate to the **"🎮 Gamepad (Remote Controller)"** tab in the PC dashboard, or open `http://<PC_IP>:3001/gamepad.html` directly in your phone browser.
3. Tap **"⛶ Fullscreen"** on the phone to lock landscape orientation.
4. Launch your game (such as **FIFA 18**, **Need for Speed**, or **PES**) and **click the game window once with the mouse** to ensure Windows active input focus.
5. For 2-player mode, connect a second phone to the same URL and select **"🎮 Player 2"**.

---

## 🧪 Testing & Verification

CellPhoneManager includes a comprehensive unit and integration test suite (26 test files / 86 tests passing 100%):

```bash
# Run all tests
npm test -- --run

# Build production bundle
npm run build
```

---

## 🏢 Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)

* **Company Website:** [https://irres.ir](https://irres.ir)
* **GitHub Repository:** [https://github.com/taimazus/CellPhoneManager](https://github.com/taimazus/CellPhoneManager)
* **Offline Deployment Guide:** [`docs/OFFLINE_DEPLOYMENT.md`](docs/OFFLINE_DEPLOYMENT.md)
* **Architecture Specs:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* **Changelog:** [`CHANGELOG.md`](CHANGELOG.md)
* **License:** MIT Open Source License
