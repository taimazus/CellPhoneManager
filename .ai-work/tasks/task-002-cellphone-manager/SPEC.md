# Functional Specification: CellPhoneManager Desktop Suite

## 1. Overview & Objective
A unified Windows management control center for both **Android** and **iOS (iPhone/iPad)** devices providing:
1. Automated Driver & Tool Setup (ADB, Fastboot, Scrcpy, Apple Drivers, pymobiledevice3).
2. Real-time Device Discovery, Telemetry, and Multi-device selection.
3. Screen Mirroring & Remote Interaction (Low-latency display, click/touch, key navigation, recording, screenshots).
4. App Manager (Install APK/XAPK/IPA, Uninstall, Disable Bloatware, Extract, Clear Cache).
5. Deep Diagnostics & Troubleshooting (Logcat/Syslog live streaming, Battery health & cycle analysis, Storage inspector, Network test).
6. Hidden & System Settings Tweaks (DPI/Resolution modifier, Animation scales, Global/Secure settings editor, Developer mode, Location spoofer).
7. File Explorer & Transfer (Push, Pull, Delete, Explore internal storage).

## 2. Architecture & Modules
- **Backend Bridge (`server/`)**:
  - Express + WebSocket server on port 5174 / 3001.
  - Native process spawners with robust error handling and stream forwarding.
  - `adbManager.js`: Android ADB & Fastboot commands wrapper (file push/pull, apk extraction, permissions, fastboot flashing).
  - `fileManager.js`: File push/pull, directory tree navigation, file deletions and creations.
  - `iosManager.js`: iOS device detection and management wrapper.
  - `toolManager.js`: Automated dependency checker, downloader, and driver doctor.
  - `mirrorManager.js`: Scrcpy orchestrator and in-browser live frame stream.
- **Frontend App (`src/`)**:
  - React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
  - Dedicated Modules:
    - Overview & Telemetry (`OverviewTab.tsx`)
    - Real-time Screen Mirror & Remote Control (`MirrorControlTab.tsx`)
    - App Manager & Bloatware Freezing (`AppsTab.tsx`)
    - File Explorer & Transfer (`FilesTab.tsx`)
    - Fastboot & Flashing Toolkit (`FastbootTab.tsx`)
    - Backup, APK Extractor & Remote Typing (`BackupTab.tsx`)
    - Hardware Lab & Sensor Diagnostics (`HardwareLabTab.tsx`)
    - Hidden & System Settings Tweaks (`TweaksTab.tsx`)
    - Live Logs & Diagnostics (`DiagnosticsTab.tsx`)
    - Driver & Tool Doctor (`DoctorTab.tsx`)
    - Task, Startup & Background Process Manager (`TaskManagerTab.tsx`)
    - Mobile Repair & Technician Workbench Suite (`RepairWorkbenchTab.tsx`):
      1. Customer Job Sheet, Intake & Printable Official Invoice Generator
      2. FRP & Account Bypass Helpers (MTP Browser Launch, Samsung *#0*# AT ADB, Xiaomi Bootloader/Mi Account Check)
      3. Broken Screen & Touch Forensic Data Rescue (1-Click Extract Everything & Virtual PIN Injector)
      4. Multi-Brand Secret Codes & Engineering Menus Database (Samsung, Xiaomi CIT, Huawei, Oppo)
      5. IMEI, Baseband & Radio Network Diagnostics (LTE/NR Lock, Modem Health)
      6. Charging & Power Meter Analyzer (mA, mV, Wattage, QC/PD Protocol detection)
      7. 1-Click Common Software Glitch Fixer (GMS Stopped, Storage Bootloop, Force MTP, Permissions)
    - iOS Pro Studio & Apple Diagnostics Toolkit (`IosToolkitTab.tsx` / `iosToolkitManager.js`):
      1. Hardware Authenticity & 3uTools Verification Score Report (Factory vs Read Serials)
      2. Panic Log Analyzer with AI Hardware Fault Classifier (mic2/thermal flex, proximity flex, audio codec, NAND)
      3. Deep Battery & Gas Gauge BMS Analytics (Design Capacity, Cycle Counts, True Chemical Health)
      4. 1-Click Recovery & DFU Mode Manager (Exit Recovery Loop, Enter Recovery, DFU Timing Guide)
      5. iCloud, Find My iPhone (FMI), Carrier SimLock & GSMA Blacklist Checker
      6. Permanent iOS OTA Update Blocker (tvOS Developer Profile method without jailbreak)
      7. System-Wide Apple DDI Virtual GPS Location Simulator (Developer Disk Image spoofing)
      8. Direct IPA Sideloading via Apple InstallationProxy over USB


## 3. Acceptance Criteria
- **Given** an Android or iOS device connected via USB or Wi-Fi (or simulated in mock mode for testing without hardware),
- **When** the user launches CellPhoneManager and accesses any module (Apps, Settings, Mirroring, Diagnostics, Files),
- **Then** the app accurately detects the device, presents telemetry, allows operations (app install/uninstall, settings tweaks, diagnostics, live log streaming), and gracefully handles errors with explicit actionable notifications.
