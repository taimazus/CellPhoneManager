# 👑 CellPhoneManager v3.8.0 — Royal Edition

[![Sahand Electronic Solutions Co.](https://img.shields.io/badge/Developed%20By-Sahand%20Electronic%20Solutions%20Co.%20(irres.ir)-d4af37?style=for-the-badge&logo=android)](https://irres.ir)
[![GitHub Repository](https://img.shields.io/badge/GitHub-taimazus%2FCellPhoneManager-181717?style=for-the-badge&logo=github)](https://github.com/taimazus/CellPhoneManager)
[![Version](https://img.shields.io/badge/Version-v3.8.0%20Royal%20Edition-eab308?style=for-the-badge)](https://github.com/taimazus/CellPhoneManager)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20(x64)-blue?style=for-the-badge&logo=windows)](https://irres.ir)
[![Mobile Support](https://img.shields.io/badge/Devices-Android%20%26%20iOS-purple?style=for-the-badge&logo=apple)](https://irres.ir)

<div align="center">
  <img src="banner.jpg" alt="CellPhoneManager Royal Edition Banner" width="100%" style="border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />
  <p><em>Exclusively engineered and maintained by <strong>Sahand Electronic Solutions Co.</strong> (<a href="https://irres.ir">https://irres.ir</a>)</em></p>
  <p><strong><a href="README.fa.md">🇮🇷 برای مشاهده مستندات فارسی اینجا کلیک کنید</a></strong></p>
</div>

---

## 📌 Executive Overview

**CellPhoneManager v3.7.0 Royal Edition** is an enterprise-grade, ultra-responsive Windows desktop management, diagnostics, rooting, flashing, media studio, mobile technician workbench, and iOS pro studio suite featuring a bespoke 24K Royal Gold and Obsidian UI theme.

### 🌟 Key Capabilities

* **🛰️ Active mDNS & Multi-Port Subnet Discovery Radar:**
  * **Zero-Traffic Subnet Wakeup:** Dispatches UDP mDNS Bonjour queries (`224.0.0.251:5353` and subnet broadcast `*.255:5353`) that wake up dormant iPhones, iPads, AirPrint printers, and Bonjour services across the local `/24` subnet.
  * **Parallel Multi-Port Sweep:** Concurrently scans ports `5555` (ADB), `62078` (Apple Sync), `9100`/`631` (Printers), `445` (PCs), and `80`/`8080` (Routers) in under 800ms.
  * **IEEE 802 Private Wi-Fi MAC Classifier:** Identifies randomized MAC addresses and classifies devices into **Smartphones & iPhones**, **Network Printers & Scanners**, **Windows PCs**, and **Routers/Gateways** with 1-click Fast Connect and Pairing.

* **🍏 iOS Pro Studio (8-in-1 Apple Diagnostics & Tools):**
  * **3uTools Hardware Verification Score:** Compares encrypted factory serials of Motherboard, Battery, Screen, Front/Rear Cameras, and Face ID against live hardware to calculate a 0-100% authenticity score.
  * **AI Panic Log Analyzer:** Extracts `panic-full.ips` kernel crashes and pinpoints faulty hardware ICs (charging port flex `prsh_wdt`, proximity sensor `AOP PANIC`, NAND, audio codec) with technician repair guide.
  * **Deep Battery & Gas Gauge BMS Analytics:** Reads true factory design capacity, current capacity, exact cycle count, voltage, and cell temperature directly from the Power Management IC (PMIC).
  * **Recovery & DFU Hub:** 1-click Exit Recovery Loop (fixes restart loops), Force Enter Recovery, and step-by-step hardware timing guide for DFU Mode.
  * **iCloud, FMI & Carrier Lock Checker:** Live check of Find My iPhone (FMI ON/OFF), Factory SimLock / Carrier lock status, and GSMA international blacklist.
  * **Permanent OTA Update Blocker:** Installs Apple tvOS developer profile to block unwanted iOS updates and preserve battery/jailbreak stability without jailbreaking.
  * **System-Wide Apple DDI Virtual GPS:** Injects custom latitude and longitude coordinates into the iOS kernel via Developer Disk Image (works across Apple Maps, Find My, social apps, and ridesharing).
  * **Direct IPA Sideloading:** Sideloads custom or enterprise IPA packages via Apple InstallationProxy service over USB.
* **🔧 Mobile Technician Workbench & Diagnostics Suite (8-in-1):**
  * **Customer Job Sheet & Intake Generator:** Auto-fills connected phone info (Model, S/N, IMEI, Battery Health), manages customer name, phone, problem description, estimated cost, and deposit with persistent JSON storage.
  * **Printable Official Repair Invoice & Receipt:** High-resolution printable receipt layout with shop branding, unique job barcode/ID, terms and conditions, and dual signature lines.
  * **FRP & Account Bypass Helper:** MTP Open Browser launcher (YouTube/Chrome intent), Samsung `*#0*#` Mode AT Command ADB activator, and Xiaomi Bootloader/Mi Account lock status inspector.
  * **Broken Screen & Touch Forensic Data Rescue:** 1-Click "Extract Everything" dumping DCIM Photos, Downloads, Contacts, and SMS directly to a customer folder on PC, with virtual PIN/pattern keypad injection for unresponsive digitizers.
  * **Multi-Brand Secret Codes & Engineering Menus Database:** Database of hardware test codes for Samsung (*#0*#, *#0228#, *#0808#, *#1234#, *#9900#), Xiaomi (CIT *#*#6484#*#*), Huawei (ProjectMenu *#*#2846579#*#*), Oppo/Realme (Engineering *#899#) with direct ADB Intent execution without physical touch input.
  * **IMEI, Baseband & Radio Network Diagnostics:** Live readout of IMEI 1/2, MEID, Baseband firmware string, Baseband health indicator (Healthy vs Corrupt/Null), and 1-click RadioInfo launcher.
  * **Charging & Power Meter Analyzer:** Live charging current (`mA`), voltage (`mV`), power wattage (`W`), battery temperature, and Fast Charge protocol detection (QC/PD/SuperVOOC).
  * **1-Click Software Glitch Fixer:** 1-click fixes for "Google Play Services Keeps Stopping", "Storage Full Bootloop", "Force MTP USB Mode", and "Reset App Permissions".
* **📂 Single-Open Accordion Sidebar Navigation:** Streamlined 28 tabs into 4 organized accordion categories (Core, Media, Tools, Pro) with smooth auto-syncing with the active tab.
* **⚡ Task, Startup & Background Process Manager:** Live RAM and CPU % meters, real-time PID table, 1-click RAM cleaner, Boot/Startup App manager (`BOOT_COMPLETED`), and background execution limits (`RUN_IN_BACKGROUND`).
* **🎧 Bluetooth Dual Auto-Pairing & 3-Mode Call Audio Routing:** Dial and receive calls with 3 audio paths (Windows Hands-Free via PC mic & speakers, Auto-Speakerphone, or Standard Earpiece) with 1-click Bluetooth auto-pairing.
* **⚡ Anti-Freeze Virtualization & Pagination:** Instant pagination bar (`PaginationBar.tsx`) and DOM optimization rendering 6,000+ contacts, hundreds of call logs, and installed apps in under 3ms without browser freezes.
* **🌀 Global ActionOverlay & Multi-Click Lock:** Smooth frosted backdrop with dual rotating neon gold rings, progress pulsing bar, and temporary button locking during long ADB/Fastboot operations.
* **📩 Smart SMS Classifier & Multi-line Parser:** Robust regex engine resolving bank SMS body truncation (e.g., Parsian Bank OTPs and multi-line comma-rich receipts), automated categorizer (**Inbox**, **Sent**, **Banking & OTP**, **Spam & Promo**, **Blocked**, **Drafts & Failed**), category pills, and 1-click clipboard copying.
* **🎨 Real APK Icon Extractor (`appIconManager.js` & `AppIcon.tsx`):** On-the-fly extraction of high-resolution application icons directly from Android APKs with server-side caching and dynamic SVG fallback badges.
* **👥 Contact Merge & Avatar Studio:** Intelligent duplicate detection (by shared phone number or name), multi-account source distinction, avatar photo support, job titles/notes, and standardized vCard 3.0 export.
* **📁 Advanced File Explorer & Media Studio:**
  * **Recursive Drag & Drop:** Seamlessly drop multiple files or entire folder trees from Windows explorer with recursive subfolder hierarchy preserved on mobile storage.
  * **Publish & Upload Suite:** Dedicated actions for multi-file upload and entire folder tree upload with real-time percentage progress bars.
  * **Accurate 8-Way Sorting:** Exact byte-level sorting (`size_desc`, `size_asc`), Persian/English alphabetical (`name_asc`, `name_desc`), timestamp (`date_desc`, `date_asc`), and file extension grouping (`type_asc`, `type_desc`).
  * **Prominent Size Badging:** High-contrast emerald badge size indicators across all 5 view layouts (**Compact**, **Standard Grid**, **Large Showcase**, **Horizontal Tiles**, and **Detailed List**).
  * **Intelligent Selection:** Shift-click range selection, Select All, Invert Selection, and dynamic Floating Action Bar.
  * **Batch ZIP Download:** Pack and stream all selected files and directories into a single `.zip` archive on demand.
  * **Live Media & Office Studio Preview:** Live video player, in-app music player, image viewer with rotation/zoom, Word/Excel/PowerPoint preview, web/code syntax inspector, and embedded PDF viewer.
* **🎮 Wireless PC Gamepad Engine:** Zero-latency (< 2ms) mobile-to-PC controller with direct C# hardware ScanCode injection (PS/2 scan codes), independent of Windows active IME/keyboard layout (Persian/English), supporting 2 concurrent players (Player 1 & Player 2), haptic vibration, and tactile sound feedback.
* **🛡️ 5-State Capability Evaluation Matrix (`capabilityManager`):** Real-time prerequisite validation (`READY`, `NEEDS_CONFIG`, `NEEDS_TOOL`, `UNSUPPORTED_OS`, `INDETERMINATE`) with actionable guidance.
* **📦 100% Offline Air-Gapped Ready (`bin/wheels/`):** Bundled native toolkits (ADB, Fastboot, Scrcpy) and offline Python wheels.
* **🔐 Military-Grade AES-256 Backups (`universalBackupManager`):** Encrypted backup containers for contacts, SMS, call logs, photos, and apps with pre-restore inspection.
* **⚡ Multi-Device Task Queue (`taskQueueManager`):** Concurrent batch execution across multiple connected smartphones.
* **📈 Real-Time Telemetry (`telemetryManager`):** Time-series battery health, thermal statistics, voltage tracking, and alerts.
* **🎛️ Configuration Profiles (`profileManager`):** Switch between presets (*Gaming Pro*, *Eco Power*, *Dev Studio*) with diff inspections.
* **🔊 Low-Latency PC Speaker Mode (`pcSpeakerManager`):** Real-time Windows audio loopback stream to smartphone speakers.

---

## ⚙️ Prerequisites & Step-by-Step Installation

### System Requirements:
- **Operating System:** Windows 10 or 11 (64-bit x64)
- **Runtime Environment:** [Node.js](https://nodejs.org) (v18 or higher)
- **Python (Optional for specialized tools):** Python 3.10+ (all offline wheels pre-bundled in `bin/wheels/`)

### Installation Steps:
1. **Clone the repository:**
   ```bash
   git clone https://github.com/taimazus/CellPhoneManager.git
   cd CellPhoneManager
   ```
2. **Install project dependencies:**
   ```bash
   npm install
   ```
3. **Register Global PATH & Create Desktop Shortcut (Run Once):**
   ```bash
   npm run setup:shortcut
   ```
   *(Or double-click `setupDesktopShortcut.bat`)*

---

## 🖥️ PATH Integration & Desktop Shortcut Setup

To launch the suite by double-clicking the desktop icon or running **`cpm`** from any terminal:

### Automatic Installer (Recommended)
Run the automated shortcut & environment setup:
```bash
npm run setup:shortcut
```
Or double-click **`setupDesktopShortcut.bat`**.

This automatically:
1. **Adds CellPhoneManager to User PATH:** Allows typing `cpm` in CMD, PowerShell, or the Windows Run dialog (`Win + R`).
2. **Creates a Desktop Shortcut:** Places **Cell Phone Manager** with custom icon on `%USERPROFILE%\Desktop`.
3. **Adds Start Menu Shortcut:** Integrates the application into the Windows Start Menu.

---

## 🚀 Quick Launch Guide

### 1. Global Terminal Command
```bash
cpm             # Starts the suite & launches browser
cpm --restart   # Clean restart on port 3001 / 5173
cpm --stop      # Gracefully shuts down all background workers
```

### 2. Standard Launch
```bat
.\cpmStart.bat
```

---

## 🎮 Mobile Gamepad Instructions

1. Connect PC and phone to the same local Wi-Fi or USB tether.
2. In the dashboard, open the **«🎮 Remote Controller»** tab or open `http://<PC-IP>:3001/gamepad.html` on your mobile browser.
3. Tap **«⛶ Fullscreen»** to lock landscape orientation.
4. Launch your game (e.g. **FIFA 18**, **Need for Speed**, **PES**) and **click once on the game window with your mouse** to focus input.
5. For 2-player multiplayer, open the same URL on a second phone and select **«🎮 Player 2»**.

---

## 🧪 Verification & Test Suite

All 26 test suites and 87 unit/integration tests pass with 100% success rate:

```bash
npm test -- --run
npm run build
```

---

## 🏢 Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)

* **Official Portal:** [https://irres.ir](https://irres.ir)
* **Technical Maintenance:** Engineering Division, Sahand Electronic Solutions Co.
* **GitHub Repository:** [taimazus/CellPhoneManager](https://github.com/taimazus/CellPhoneManager)
