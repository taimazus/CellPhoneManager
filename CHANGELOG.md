# 📜 Changelog — CellPhoneManager

All notable changes to the **CellPhoneManager** project are documented in this file.

Developed and maintained exclusively by **Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)** — [https://irres.ir](https://irres.ir).

---

## [3.4.4] — 2026-10-07 (Advanced File Explorer & Media Studio, Drag-Drop, Batch Download, and PATH Integration)

### 🌟 Added & Enhanced
- **📁 Advanced File Explorer & Media Studio Suite (`src/components/FilesTab.tsx` & `server/fileManager.js`):**
  - **Recursive Directory & Multi-File Drag & Drop:** HTML5 `webkitGetAsEntry` / `FileSystemDirectoryReader` recursive traversal preserving complete nested folder trees when dropped from Windows Explorer to phone storage.
  - **Publish & Upload Buttons:** Dedicated direct actions for multi-file upload and full directory upload (`webkitdirectory`) with real-time percentage progress bars and item counters.
  - **Comprehensive 8-Way Sorting System:** Exact byte-level sorting (`size_desc`, `size_asc`), Persian/English alphabetical (`name_asc`, `name_desc`), date modified (`date_desc`, `date_asc`), and file extension grouping (`type_asc`, `type_desc`).
  - **Prominent Emerald File Size Indicators:** Distinct badges across all 5 view layouts (**Compact**, **Standard Grid**, **Large Showcase Cards**, **Horizontal Tiles**, and **Detailed List**).
  - **Advanced Selection System:** Shift-click range selection, Select All, Deselect All, and Invert Selection.
  - **Batch ZIP Download (`/api/devices/:id/files/batch-download`):** High-speed server-side packaging of selected files and directories into a single `.zip` archive on demand.
  - **Live Media Studio Preview Modal:** In-app video player with responsive controls, music player, photo viewer with 90° rotation and multi-step zoom, code/text syntax viewer, and embedded PDF document viewer.
- **🖥️ Automated PATH Registration & Desktop Shortcut Creator (`setupDesktopShortcut.bat` & `server/setupShortcut.js` & `cpm.bat`):**
  - Automatic addition of project path to Windows User `PATH` and `CPM_HOME`.
  - Global `cpm` terminal command execution from CMD, PowerShell, and the Windows Run dialog (`Win + R`).
  - Creation of high-resolution **Cell Phone Manager** desktop and Start Menu shortcuts with custom `.ico` icon branding.
- **🎮 Native Windows Hardware ScanCode Gamepad Engine (`winInputBridge.ps1` & `pcGamepadManager.js`):**
  - Upgraded Windows input simulation from virtual keys to low-level hardware ScanCodes (`keybd_event` with dual Virtual-Key + PS/2 Set 1 Hardware ScanCodes).
  - 100% Windows input locale independence: all gamepad keys work seamlessly in DirectX games (such as FIFA 18, Racing, FPS) regardless of active Windows keyboard language (Persian / English).
  - Sub-2ms real-time input pipeline with persistent PowerShell C# input bridge.
- **🕹️ Luxury Smartphone Gamepad UI (`public/gamepad.html`):**
  - 8-Way multi-touch directional sliding D-pad with seamless diagonal recognition (Up-Right, Down-Right, Up-Left, Down-Left).
  - Floating virtual analog thumbstick mode toggle.
  - Multi-intensity haptic vibration (Strong / Light / Off) with specialized kick on Shoot/Sprint.
  - Web Audio API zero-latency mechanical switch click sound synthesis.
  - 4-level button sizing (`Compact`, `Normal`, `Large`, `Max`).
  - Instant **Player 1 / Player 2** multi-controller switcher with dedicated neon blue and pink theme accents.
  - 1-tap fullscreen with automatic landscape screen lock.
- **📘 Interactive In-App Remote Controller Guide (`RemoteControllerTab.tsx`):**
  - Added rich Persian step-by-step game focus troubleshooting, QR code scanner launcher, and safe key formatters.
- **🧪 Comprehensive Test Coverage:**
  - Verified with **26 test suites / 87 tests** with 100% pass rate.

---

## [3.4.2] — 2026-10-07 (Royal Edition Enterprise)

### 🌟 Fixed & Enhanced
- **AI Operational Assistant:** Connected `/api/devices/:id/ai/ask` endpoint in `server/index.js` and upgraded `AiAssistantTab` to use `safeFetchJson` with zero-fail resilience.
- **Global Zero-Trust Auth Gate:** Implemented `securityManager.getAuthMiddleware()` and automatic bearer token injection for frontend requests.

---

## [3.4.0] — 2026-10-07 (Royal Edition Enterprise)

### 🌟 Added
- **Device Capability Detection Engine (`capabilityManager`):**
  - Standardized 5-state evaluation matrix (`READY`, `NEEDS_CONFIG`, `NEEDS_TOOL_OR_PERMISSION`, `UNSUPPORTED`, `INDETERMINATE`).
  - Step-by-step actionable Persian guides for unauthorized devices, iOS Trust requirements, and missing tool installations.
  - Backend execution protection with `assertCapability` pre-flight enforcement.
- **100% Offline Air-Gapped Deployment (`docs/OFFLINE_DEPLOYMENT.md`):**
  - Offline Python wheels fallback in `bin/wheels/` with `--no-index --find-links` support.
  - Transparent download catalog (`getToolCatalog`) exposing download size, upstream sources, and enabled features before install.
- **Security & Access Control Center (`securityManager`):**
  - Local session tokens, client authorization, and persistent audit logging in `data/security/audit_log.json`.
  - Bound server host strictly to `127.0.0.1` and restricted CORS to authorized local origins.
- **AES-256 Encrypted Backups (`universalBackupManager`):**
  - Password-derived AES-256-CBC encryption for contacts, SMS, call logs, photos, and apps.
  - Path traversal protection with `validateAndResolveBackupPath`.
- **Multi-Device Task Queue (`taskQueueManager`):**
  - Concurrent batch job queue with pause/resume and per-device reporting.
- **Historical Telemetry & Battery Health (`telemetryManager`):**
  - Time-series monitoring of battery temperature, voltage, and storage with automated overheat alerts.
- **Configuration Profiles & Diff Rollback (`profileManager`):**
  - Preset tuning profiles (*Gaming Pro*, *Eco Power*, *Dev Studio*) and snapshot comparisons.
