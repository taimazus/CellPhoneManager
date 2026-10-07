# 👑 CellPhoneManager v3.4.0 Royal Edition — Universal Smartphone Management Suite

[![Sahand Electronic Solutions](https://img.shields.io/badge/Developed%20By-Sahand%20Electronic%20Solutions%20(irres.ir)-d4af37?style=for-the-badge&logo=android)](https://irres.ir)
[![GitHub Repository](https://img.shields.io/badge/GitHub-taimazus%2FCellPhoneManager-181717?style=for-the-badge&logo=github)](https://github.com/taimazus/CellPhoneManager)
[![Release Version](https://img.shields.io/badge/Version-v3.4.0%20Royal%20Edition-eab308?style=for-the-badge)](https://github.com/taimazus/CellPhoneManager)
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

**CellPhoneManager v3.4.0 Royal Edition** is an enterprise-grade, modern smartphone bridge and device management suite designed for Windows 10 & 11 with an Imperial Charcoal & Royal 24k Gold aesthetic. It connects to Android (Xiaomi / HyperOS / MIUI, Samsung One UI, Huawei EMUI, Oppo ColorOS, Google Pixel) and Apple iOS devices over high-speed USB or Wireless ADB, providing rich diagnostics, hardware testing, audio streaming, screen recording, system cleaning, security auditing, and full data management.

---

## 🌟 Strategic Core Capabilities

* **🛡️ Device Capability Detection Engine (`capabilityManager`):** Real-time 5-state prerequisite evaluation (`READY`, `NEEDS_CONFIG`, `NEEDS_TOOL_OR_PERMISSION`, `UNSUPPORTED`, `INDETERMINATE`) with per-device caching and actionable step-by-step guidance.
* **📦 100% Offline Air-Gapped Deployment (`bin/wheels/`):** Bundled native Android tools (ADB, Fastboot, Scrcpy) and offline Python wheel fallbacks with zero mandatory internet dependency.
* **🔐 AES-256 Encrypted Backup & Universal Migration:** Military-grade encryption for local backups (Contacts, SMS, Calls, Photos, Apps) with pre-restore inspection and path-traversal prevention.
* **⚡ Multi-Device Task Queue (`taskQueueManager`):** Concurrent batch execution engine (e.g. multi-device APK installations, diagnostics, backups) with pause, resume, and per-device reporting.
* **📈 Historical Telemetry & Health Monitoring (`telemetryManager`):** Time-series logging of battery temperature, voltage, health cycle count, and storage metrics with automated overheating alerts.
* **🎛️ Configuration Profiles & Diff Rollback (`profileManager`):** Instant application of tuned device profiles (*Gaming Pro*, *Eco Power Saver*, *Dev Studio*) with JSON snapshot comparisons and 1-click restore.
* **🔒 Safe Firmware Flashing Guard (`firmwareGuardManager`):** SHA-256 integrity verification, target partition checks, and payload validation prior to fastboot operations.
* **🤖 Smart Connection Automations (`automationManager`):** Event-driven trigger engine running automated health checks, notifications, or backup tasks upon USB connection.
* **🔊 PC-to-Phone Speaker Mode:** Ultra-low latency system audio streaming from Windows to your connected smartphone over USB (`adb reverse`) or local Wi-Fi with an interactive visualizer.
* **👑 Harmonized Royal Gold Aesthetics:** Fully accessible WCAG AA compliant dark charcoal & 24k gold UI across all 30+ tabs, modals, and interactive guides.

---

## 🚀 Quick Start Guide

### 1. Clone Repository
```bash
git clone https://github.com/taimazus/CellPhoneManager.git
cd CellPhoneManager
```

### 2. Start Application
Double-click **`cpmStart.bat`** or run in PowerShell:
```bat
.\cpmStart.bat
```
The automated script validates runtime dependencies, starts the backend server on `http://127.0.0.1:3001` and Vite client on `http://127.0.0.1:5173`, and opens the dashboard in your default browser.

### 3. Stop Application
To safely stop all running background processes and release system ports:
```bat
.\cpmStop.bat
```

---

## 🧪 Testing & Verification

CellPhoneManager includes a comprehensive unit and integration test suite (25 test files / 80 tests):

```bash
# Run all tests
npm test -- --run

# Build production bundle
npm run build
```

---

## 🏢 Sahand Electronic Solutions Co. (راهکار الکترونیک سهند)

* **Company Website:** [https://irres.ir](https://irres.ir)
* **GitHub Repository:** [https://github.com/taimazus/CellPhoneManager](https://github.com/taimazus/CellPhoneManager)
* **Offline Deployment Guide:** [`docs/OFFLINE_DEPLOYMENT.md`](docs/OFFLINE_DEPLOYMENT.md)
* **Architecture Specs:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* **License:** MIT Open Source License
