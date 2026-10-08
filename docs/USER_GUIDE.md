# 👑 Comprehensive Module Reference & User Guide — CellPhoneManager v3.5.0 Royal Edition

<div align="center">
  <p><strong>Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)</strong> — <a href="https://irres.ir">https://irres.ir</a></p>
  <p><em>Complete functional and technical guide covering all 25+ specialized modules and tabs.</em></p>
  <p><strong><a href="USER_GUIDE.fa.md">🇮🇷 برای مشاهده نسخه فارسی راهنما اینجا کلیک کنید</a></strong></p>
</div>

---

## 📑 Table of Contents

1. [🔌 Wireless Connection & Network Pairing](#1-wireless-connection--network-pairing)
2. [📁 Files, Gallery & Storage Management](#2-files-gallery--storage-management)
3. [💬 SMS Messages, Contacts & Call Logs](#3-sms-messages-contacts--call-logs)
4. [📦 Apps Management, APK Inspector & Debloater](#4-apps-management-apk-inspector--debloater)
5. [🔐 AES-256 Military Encrypted Backup & Direct Migration](#5-aes-256-military-encrypted-backup--direct-migration)
6. [🩺 System Doctor, OS Diagnostics & Hardware Lab](#6-system-doctor-os-diagnostics--hardware-lab)
7. [🔋 Battery Health, Thermal Time-Series & Telemetry](#7-battery-health-thermal-time-series--telemetry)
8. [🖥️ Low-Latency Screen Mirroring & Recording](#8-low-latency-screen-mirroring--recording)
9. [🔊 PC-to-Phone Audio Streaming & Microphone Bridge](#9-pc-to-phone-audio-streaming--microphone-bridge)
10. [🎮 Wireless PC Gamepad & Remote Controller](#10-wireless-pc-gamepad--remote-controller)
11. [🛠️ Root Toolkit, Safe ROM Flashing & Fastboot](#11-root-toolkit-safe-rom-flashing--fastboot)
12. [🗺️ GPS Location Simulator & Screen OCR](#12-gps-location-simulator--screen-ocr)
13. [🤖 Automations, AI Assistant & Multi-Device Queue](#13-automations-ai-assistant--multi-device-queue)
14. [🎛️ System Tweaks, Profiles & Password Vault](#14-system-tweaks-profiles--password-vault)

---

## 1. 🔌 Wireless Connection & Network Pairing

### 🔹 OverviewTab
* **Live Telemetry & Device Specs:** Displays exact hardware brand, model, Android/iOS version, security patch level, serial number, battery percentage, charging voltage, and internal storage utilization graphs.
* **1-Click System Actions:** Instant Reboot, Reboot to Recovery, Reboot to Fastboot (Bootloader), and Power Off.

### 🔹 WirelessModal & NetworkTab
* **Wired USB Setup:** Enable **USB Debugging** in your smartphone's Developer Options.
* **Auto-Scan Network Discovery:** Automatically scans your local Wi-Fi subnet and lists smartphones waiting for Wireless ADB on port `5555`.
* **Direct IP Wireless ADB:** Connect via local IP address (e.g. `192.168.1.108:5555`) for completely cable-free management.
* **Apple iOS Support:** Native support via `usbmuxd` and `pymobiledevice3` for battery health, syslog streaming, and device diagnostics.

---

## 2. 📁 Files, Gallery & Storage Management

### 🔹 FilesTab
* **Full Tree & Directory Explorer:** Direct access to `/sdcard`, external SD cards, and download folders.
* **High-Speed Batch Upload & Download:** Drag & drop files and entire nested folder trees between PC and phone with ADB-accelerated transfer rates.
* **Multi-Format Media & Office Studio:**
  * **Video & Audio Player:** Native in-browser streaming with volume and progress controls.
  * **Image Viewer:** Full zoom, rotation, and high-resolution inspection.
  * **Office & Code Viewer:** Built-in preview for `.docx`, `.xlsx`, `.pptx`, `.html`, `.json`, `.xml`, `.py`, `.js`, `.ts`, and text files.
  * **PDF Reader:** Embedded document viewer with page navigation.
* **Accurate 8-Way Sorting & Emerald Badges:** Byte-level size indicators across all 5 layout modes (Compact, Grid, Large, Tiles, List).
* **1-Click ZIP Packaging:** Stream and download multiple selected files as a compressed `.zip` archive.

---

## 3. 💬 SMS Messages, Contacts & Call Logs

### 🔹 MessagesTab & Anti-Freeze Pagination
* **Anti-Freeze Virtualized Pagination (`PaginationBar.tsx`):** Effortlessly render and navigate across 6,000+ contacts, 1,000+ SMS threads, and call logs with page size toggles (15, 30, 50, 100, 200 items).
* **3-Mode Call Audio Routing Engine (`bluetoothCallManager.js`):**
  * 🔊 **Auto-Speakerphone (اسپیکرفون خودکار):** Automatically activates Android speakerphone via ADB telecom routing upon placing a call.
  * 🎧 **Windows Hands-Free (هندزفری ویندوز):** Routes bidirectional phone call audio and PC microphone directly through Windows using Bluetooth Hands-Free Profile (HFP/HSP) without picking up the phone.
  * 📱 **Standard Earpiece (گوشی معمولی):** Standard mobile phone routing.
* **Automated Bluetooth Pairing Assistant:** 1-click status scan of Windows PC Bluetooth hardware and mobile Bluetooth state. Automatically enables device Bluetooth, makes it discoverable, and opens Windows Bluetooth/Sound control dialogs with failure warnings if PC lacks a Bluetooth adapter.
* **Smart SMS Categorization:** Automated classification into **Inbox**, **Sent**, **Banking & OTP (Parsian, Mellat, Melli, Pasargad, etc.)**, **Spam & Ads**, **Blocked**, and **Drafts & Failed**.
* **Un-truncated Multi-line Body Parser:** Completely preserves multi-line, comma-separated, and special character messages without body truncation.
* **1-Click Message Copying:** Quick copy button for OTPs and transaction receipts directly to the Windows clipboard.
* **Contact Merge & Avatar Studio:**
  * Detect and merge duplicate contacts sharing identical phone numbers or names.
  * Account source indicators (Google, Telegram, SIM, Device Phonebook).
  * Avatar photo management, job title/notes fields, and RFC vCard 3.0 export.
* **Call Log Analyzer:** Incoming, outgoing, and missed call analysis with duration metrics.

---

## 4. 📦 Apps Management, APK Inspector & Debloater

### 🔹 AppsTab & Real App Icon Extractor
* **Real APK Icon Extractor (`appIconManager.js`):** Extracts authentic high-res APK icons from installed packages with server-side caching and dynamic fallback badges.
* **Anti-Freeze Pagination:** Clean page navigation for devices with 300+ user and system applications.
* **1-Click Batch APK Installation:** Drag & drop `.apk` and `.xapk` files for direct silent background installation.
* **APK Extraction:** Export raw installer APKs of any installed app directly to your computer.
* **Deep APK Inspector:** Analyze package names, Target SDK, requested Android permissions, and cryptographic signature certificates.

### 🔹 DebloaterTab (Safe Bloatware Removal)
* **Pre-tested Safe Removal Presets:** Ready-made profiles for **Xiaomi (MIUI/HyperOS)**, **Samsung (One UI)**, **Google (GApps)**, and **Huawei (EMUI)**.
* **Rootless Freezing/Uninstall:** Safely freeze or uninstall heavy telemetry and manufacturer ad apps without voiding warranty.

### 🔹 AppClonerTab
* **Dual Accounts:** Clone social and messaging applications for simultaneous multi-account operation.

---

## 5. 🔐 AES-256 Military Encrypted Backup & Direct Migration

### 🔹 BackupTab
* **AES-256-CBC Encryption:** Secure full backups (SMS, Contacts, Calls, Photos, APKs) with password-derived encryption.
* **Granular Data Selection:** Selectively choose which categories to include in the backup archive.
* **Pre-Restore Inspection:** Inspect backup archive contents before applying to a new device.

### 🔹 MigrationTab
* **Phone-to-Phone Cloning:** Connect two devices simultaneously and transfer data directly with 1 click.

---

## 6. 🩺 System Doctor, OS Diagnostics & Hardware Lab

### 🔹 DoctorTab & DiagnosticsTab
* **Real-time CPU & RAM Monitor:** Interactive visual charts displaying per-core processor load and RAM consumption.
* **Process & Task Manager:** Inspect running background processes and terminate misbehaving or heavy apps.
* **System Cache Cleaner:** Reclaim wasted storage by clearing cached application files.
* **Live Logcat Stream:** Filter and capture real-time Android system crashes and debug logs.

### 🔹 HardwareLabTab
* **Touch Screen Grid Test:** Interactive touch grid to identify touch digitizer dead zones.
* **Dead Pixel Screen Test:** Fullscreen RGB color cycles to locate defective display pixels.
* **Vibrator & Haptic Test:** Execute custom haptic vibration pulses to verify motor integrity.
* **Loudspeaker & Earpiece Frequency Test:** Tone generator to inspect audio drivers.
* **Microphone & Sensor Diagnostics:** Record & playback mic test, flashlight toggle, accelerometer, and compass sensors.

---

## 7. 🔋 Battery Health, Thermal Time-Series & Telemetry

### 🔹 BatteryHealthTab & TelemetryManager
* **Cycle Count & Health Calculation:** Measure true battery wear based on charging cycles.
* **Historical Temperature & Voltage Logging:** Time-series logging of device thermals.
* **Automated Overheat Alerts:** Real-time warnings when battery exceeds safety threshold (e.g. 45°C).

---

## 8. 🖥️ Low-Latency Screen Mirroring & Recording

### 🔹 MirrorControlTab
* **60 FPS Full HD Stream:** Powered by native Scrcpy with ultra-low input latency.
* **Keyboard & Mouse Control:** Full PC keyboard typing and mouse interaction.
* **Adjustable Bitrate & FPS:** Customize resolution and bitrate for slower Wi-Fi connections.

### 🔹 ScreenRecorderTab
* **High-Bitrate MP4 Recording:** Record phone screen video with internal audio or microphone capture.

---

## 9. 🔊 PC-to-Phone Audio Streaming & Microphone Bridge

### 🔹 AudioFxTab (PC Speaker Mode)
* **Zero-Latency Audio Stream:** Stream Windows system audio directly to your smartphone over USB or Wi-Fi.
* **10-Band Equalizer & Bass Boost:** Real-time audio DSP equalizer and bass amplification.

### 🔹 MicrophoneTab
* **Smartphone as PC Microphone:** Bridge high-fidelity smartphone microphone directly into Windows for voice chats and streams.

---

## 10. 🎮 Wireless PC Gamepad & Remote Controller

### 🔹 RemoteControllerTab & Gamepad UI
* **Hardware ScanCode Injection (`winInputBridge.ps1`):** Complete independence from Windows typing language (FA/EN).
* **8-Way Diagonal Touch D-Pad & Virtual Thumbstick:** Ideal for football games (FIFA 18, PES) and racing simulators.
* **Multiplayer Support (Player 1 & Player 2):** Connect two phones simultaneously for local co-op and versus games.
* **Multi-Level Haptics & Mechanical Click Sound:** Tactile vibration kicks on shoot/sprint and audible switch click feedback.

---

## 11. 🛠️ Root Toolkit, Safe ROM Flashing & Fastboot

### 🔹 RootToolkitTab, RomFlasherTab & FastbootTab
* **Root Detection:** Verify Magisk, KernelSU, or APatch root environments.
* **Firmware Flashing Guard:** SHA-256 image validation and target partition assertions prior to flashing.
* **Fastboot Partition Tools:** Flash `boot.img`, `recovery.img`, switch active A/B slot, and recover from bootloops.

---

## 12. 🗺️ GPS Location Simulator & Screen OCR

### 🔹 GpsSimulatorTab
* **Mock GPS Coordinates:** Set custom location coordinates for privacy or app testing.
* **Automated Route Simulation:** Simulate walking, cycling, or driving movement along custom map waypoints.

### 🔹 ScreenOcrTab
* **Live Screen Text Extractor:** Capture screenshot and extract text (Persian, English, numbers) via Optical Character Recognition.

---

## 13. 🤖 Automations, AI Assistant & Multi-Device Queue

### 🔹 AutomationTab
* **Event-Driven Rules:** Trigger automated actions (e.g. auto-backup or health check) upon USB device connection.

### 🔹 AiAssistantTab
* **Natural Language Voice & Text Assistant:** Ask device status or trigger actions using conversational Persian or English prompts.

### 🔹 MultiDeviceTab
* **Fleet Management:** Execute batch APK installations, backups, or diagnostics across multiple connected devices simultaneously.

---

## 14. 🎛️ System Tweaks, Profiles & Password Vault

### 🔹 TweaksTab & ProfileManager
* **Tuning Profiles:** Apply *Gaming Pro* (max performance), *Eco Power* (battery saver), or *Dev Studio* configurations.
* **Snapshot & Instant Rollback:** Save system state snapshots and restore previous settings with 1 click.

### 🔹 PasswordVaultTab
* **Encrypted Credential Storage:** AES-256 local encrypted vault for passwords and sensitive keys with zero cloud dependency.

---

<div align="center">
  <p><strong>Developed Exclusively by Sahand Electronic Solutions Co.</strong></p>
  <p><a href="https://irres.ir">Official Website: https://irres.ir</a> | <a href="https://github.com/taimazus/CellPhoneManager">GitHub: github.com/taimazus/CellPhoneManager</a></p>
</div>
