# 📜 Changelog — CellPhoneManager

All notable changes to the **CellPhoneManager** project are documented in this file.

Developed and maintained exclusively by **Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)** — [https://irres.ir](https://irres.ir).

---

## [3.8.0] — 2026-10-10 (Deep SMS Notification Jump, High-Reliability Thread Deletion, Multi-SIM Call Dismissal & Full Offline Drivers Bundle)

### 🌟 Added & Enhanced
- **🗑️ موتور بازمهندسی‌شده و قطعی حذف پیامک و گفتگوها (`server/adbManager.js` & `src/components/MessagesTab.tsx`):**
  - **حذف قطعی گفتگوها و پیامک‌ها:** رفع کامل خطای کاذب محدودیت امنیتی اندروید (`countAfter >= countBefore` trap) که مانع از حذف گفتگوهای پیامکی می‌شد.
  - **پشتیبانی از شناسه‌های یکتای پیامک (`_id IN (...)`):** استخراج تمامی شناسه‌های موجود در گفتگو و ارسال مستقیم به پایگاه داده پیامک‌ها جهت تضمین پاکسازی کامل.
  - **پاکسازی چندلایه‌ای:** پاکسازی همزمان از طریق روت گفتگو `content://sms/conversations/<id>`، فیلتر `thread_id` با استخراج صحیح شناسه عددی (حذف پیشوند `t_`)، و فیلتر آدرس فرستنده با نگارش‌های مختلف شماره (شامل `+98`، بدون کد کشور و صفر محلی).
  - **به‌روزرسانی آنی رابط کاربری (Optimistic UI Update):** حذف بلادرنگ پیام یا گفتگوی حذف‌شده از حافظه فرانت‌اند و بستن گفتگوی جاری جهت تجربه کاربری بدون تأخیر.
- **🎯 پرش هوشمند و هایلایت پیامک از مرکز اعلان‌ها (Deep Notification Navigation):**
  - کلیک روی هر اعلان پیامک در زبانه «اعلان‌های زنده» یا بنر دسکتاپ، کاربر را مستقیماً وارد همان گفتگوی پیامکی مشخص کرده و پیام هدف را با نشانگر کهربایی متحرک در دیدرس کاربر قرار می‌دهد.
  - تعبیه دکمه اختصاصی **«مشاهده پیامک»** با آیکون چت در کارت اعلان‌های پیامکی.
  - ایجاد صف ناوبری تعلیقی (`pendingNavTargetRef`) برای مواقعی که لیست پیامک‌ها هنوز از گوشی بارگذاری نشده است تا پس از اتمام لودینگ فوراً پرش انجام شود.
- **📞 پایش بی‌درنگ قطع تماس و پالایش چند سیم‌کارته (`server/adbManager.js` & `src/components/MessagesTab.tsx`):**
  - تشخیص سریع اتمام مکالمه‌های خروجی و ورودی از طریق ترکیب بررسی چند سیم‌کارته Telephony Registry و Telecom Active Call Filter با پایش تطبیقی ۱۰۰۰ میلی‌ثانیه‌ای، و بسته شدن فوری HUD تماس جاری.
  - تمایز بصری لوکس وضعیت تماس‌ها و پیامک‌ها با نشان‌ها و رنگ‌های اختصاصی:
    - تماس‌های دریافتی: زمردی (`emerald`)
    - تماس‌های خروجی: فیروزه‌ای (`cyan`)
    - تماس‌های ناموفق و از دست رفته: زرشکی (`rose`)
    - تماس‌های رد شده: کهربایی (`amber`)
    - پیامک‌های دریافتی: زمردی (`emerald`) | پیامک‌های ارسالی: فیروزه‌ای (`cyan`).
- **🔊 دکمه بازنشانی اضطراری مسیر صدای مکالمه (Call Audio Route Reset):**
  - تعبیه دکمه ویژه «بازنشانی خروجی صدا» در زبانه تماس‌ها جهت خروج از حالت اسپیکرفون یا قطع ارتباط صوتی و هدایت مجدد صدا به بلندگوی مکالمه گوشی (Earpiece).
- **📦 بسته جامع درایورهای آفلاین و نصاب ریشه‌ای (`installDrivers.bat` & `bin/drivers/`):**
  - ساخت فایل اسکریپت ریشه‌ای `installDrivers.bat` با دسترسی ادمین جهت نصب ۱-کلیکه کلیه درایورهای Universal Android USB / Fastboot گوگل، درایور کابل صدای مجازی VB-Cable و درایور دسته بازی ViGEmBus به صورت ۱۰۰٪ آفلاین.
- **🔍 نام‌یاب بسته‌های نرم‌افزاری با پشتیبانی فارسی (App Name Resolver):**
  - نگاشت هوشمند بیش از ۵۰ برنامه پرکاربرد ایرانی و بین‌المللی (ایتا، روبیکا، بله، دیجی‌کالا، اسنپ، دیوار، تلگرام، واتساپ و...) جهت نمایش نام تمیز فارسی در اعلانات و فرآیندها به جای نام پکیج انگلیسی.

---

## [3.7.0] — 2026-10-08 (Active mDNS Subnet Discovery, Multi-Device Radar, iPhone/Printer/PC Auto-Detection & Accordion Navigation)

### 🌟 Added & Enhanced
- **🛰️ Active mDNS & Multi-Port Subnet Discovery Radar (`server/networkManager.js` & `src/components/WirelessModal.tsx`):**
  - **Active Subnet Wakeup:** Dispatches DNS-SD / Bonjour mDNS query packets to multicast `224.0.0.251:5353` and subnet broadcast `*.255:5353`, actively waking up dormant iPhones, iPads, AirPrint printers, and Bonjour services across the local `/24` subnet.
  - **Parallel Multi-Port Sweep:** Performs ultra-fast, concurrent TCP port sweeps across ports `5555` (Android ADB Wireless), `62078` (Apple Lockdown / Wi-Fi Sync), `9100` / `631` (RAW JetDirect & IPP Network Printers), `445` (Windows SMB PC), and `80` / `8080` (Routers/Gateways) in under 800ms.
  - **IEEE 802 Private Wi-Fi MAC Classifier:** Detects randomized MAC addresses (locally administered bit: 2nd hex digit `2`, `6`, `A`, `E`) used by iOS 14+ and modern Android devices.
  - **Comprehensive Hardware OUI Database:** Auto-identifies Apple, Samsung, Xiaomi, Huawei, HP, Canon, Epson, Brother, Ricoh, Asus, Gigabyte, and TP-Link devices.
  - **Smart Category Filter Tabs in Wi-Fi Modal:** Instant filtering by **همه دستگاه‌ها (All Devices)**, **گوشی‌ها و آیفون (Smartphones & Apple iOS)**, **پرینترها (Printers & Scanners)**, and **سیستم‌ها و PC (Windows PCs)** with dedicated icons (`Apple`, `Smartphone`, `Printer`, `Laptop`, `Wifi`) and 1-click Fast Connect / Pairing buttons.
- **🍏 iOS Pro Studio Suite (8-in-1 Apple Diagnostics & Tools) (`server/iosToolkitManager.js` & `src/components/IosToolkitTab.tsx`):**
  - **3uTools Hardware Verification Score:** Compares encrypted factory serials of Motherboard, Battery, Screen, Front/Rear Cameras, and Face ID against live hardware to calculate a 0-100% authenticity score.
  - **AI Panic Log Analyzer:** Extracts `panic-full.ips` kernel crashes and pinpoints faulty hardware ICs (charging port flex `prsh_wdt`, proximity sensor `AOP PANIC`, NAND, audio codec) with technician repair guide.
  - **Deep Battery & Gas Gauge BMS Analytics:** Reads true factory design capacity, current capacity, exact cycle count, voltage, and cell temperature directly from the Power Management IC (PMIC).
  - **Recovery & DFU Hub:** 1-click Exit Recovery Loop (fixes restart loops), Force Enter Recovery, and step-by-step hardware timing guide for DFU Mode.
  - **iCloud, FMI & Carrier Lock Checker:** Live check of Find My iPhone (FMI ON/OFF), Factory SimLock / Carrier lock status, and GSMA international blacklist.
  - **Permanent OTA Update Blocker:** Installs Apple tvOS developer profile to block unwanted iOS updates and preserve battery/jailbreak stability without jailbreaking.
  - **System-Wide Apple DDI Virtual GPS:** Injects custom latitude and longitude coordinates into the iOS kernel via Developer Disk Image (works across Apple Maps, Find My, social apps, and ridesharing).
  - **Direct IPA Sideloading:** Sideloads custom or enterprise IPA packages via Apple InstallationProxy service over USB.
- **🔧 Mobile Technician Workbench & Diagnostics Suite (8-in-1) (`server/repairWorkbenchManager.js` & `src/components/RepairWorkbenchTab.tsx`):**
  - **Customer Job Sheet & Intake Generator:** Auto-fills connected phone info (Model, S/N, IMEI, Battery Health), manages customer name, phone, problem description, estimated cost, and deposit with persistent JSON storage.
  - **Printable Official Repair Invoice & Receipt:** High-resolution printable receipt layout with shop branding, unique job barcode/ID, terms and conditions, and dual signature lines.
  - **FRP & Account Bypass Helper:** MTP Open Browser launcher (YouTube/Chrome intent), Samsung `*#0*#` Mode AT Command ADB activator, and Xiaomi Bootloader/Mi Account lock status inspector.
  - **Broken Screen & Touch Forensic Data Rescue:** 1-Click "Extract Everything" dumping DCIM Photos, Downloads, Contacts, and SMS directly to a customer folder on PC, with virtual PIN/pattern keypad injection for unresponsive digitizers.
  - **Multi-Brand Secret Codes & Engineering Menus Database:** Database of hardware test codes for Samsung (*#0*#, *#0228#, *#0808#, *#1234#, *#9900#), Xiaomi (CIT *#*#6484#*#*), Huawei (ProjectMenu *#*#2846579#*#*), Oppo/Realme (Engineering *#899#) with direct ADB Intent execution without physical touch input.
  - **IMEI, Baseband & Radio Network Diagnostics:** Live readout of IMEI 1/2, MEID, Baseband firmware string, Baseband health indicator (Healthy vs Corrupt/Null), and 1-click RadioInfo launcher.
  - **Charging & Power Meter Analyzer:** Live charging current (`mA`), voltage (`mV`), power wattage (`W`), battery temperature, and Fast Charge protocol detection (QC/PD/SuperVOOC).
  - **1-Click Software Glitch Fixer:** 1-click fixes for "Google Play Services Keeps Stopping", "Storage Full Bootloop", "Force MTP USB Mode", and "Reset App Permissions".
- **📂 Single-Open Accordion Sidebar Navigation (`src/components/Sidebar.tsx`):**
  - Streamlined 28 tabs into 4 organized accordion categories (Core, Media, Tools, Pro) with auto-closing of sibling groups and auto-synchronization with active tab.

---

## [3.6.0] — 2026-10-08 (iOS Pro Studio & Technician Workbench Royal Edition)

### 🌟 Added & Enhanced
- **🎧 Bluetooth Hands-Free & Call Audio Routing Engine (`server/bluetoothCallManager.js` & `src/components/MessagesTab.tsx`):**
  - **Automated Dual Bluetooth Status & Pairing Engine:** Real-time query of Windows Bluetooth adapters, paired devices, and Android Bluetooth state. Automated 1-click pairing prep (`/api/bluetooth/auto-pair`) turning on phone Bluetooth, launching phone pairing discovery, and opening Windows Bluetooth device dialog.
  - **Hardware Failure Protection:** Automatically warns if the Windows PC lacks a Bluetooth adapter/dongle and guides the user.
  - **3 Call Audio Modes:** 🔊 **اسپیکرفون خودکار (Auto-Speakerphone)** (activates Android speakerphone via ADB telecom routing upon dialing), 🎧 **هندزفری ویندوز (Windows Hands-free)** (routes bidirectional voice call through PC mic/speaker via Bluetooth HFP), and 📱 **گوشی معمولی (Default Earpiece)**.
  - **Direct Sound & Bluetooth Shortcuts:** One-click triggers for `ms-settings:bluetooth` and `ms-settings:sound`.
- **⚡ Anti-Freeze Virtualization & Pagination (`src/components/PaginationBar.tsx`):**
  - Instant page-based chunking across contacts, SMS messages, call logs, and installed applications.
  - Effortlessly handles 6,304+ contacts with under 3ms rendering latency and 0 browser DOM freezes.
  - Customizable page sizes (15, 30, 50, 100, 200 items per page) with luxury gold styling and keyboard-friendly navigation.
- **🌀 Global ActionOverlay & Anti-Multi-Click Safety (`src/components/LoadingSpinner.tsx` & `src/App.tsx`):**
  - Translucent frosted glass backdrop with dual rotating neon gold rings and pulsing progress status bar during long ADB/Fastboot operations.
  - Automatically disables duplicate clicks and prevents accidental double-submits on heavy actions.
- **📩 Multi-line SMS Parser & Smart Category Tabs (`server/adbManager.js` & `src/components/MessagesTab.tsx`):**
  - Fixed long-standing SMS truncation bugs on bank messages (e.g. PARSIANBANK OTPs with comma-separated numbers and multi-line formatting).
  - Intelligent regex categorizer sorting messages into **Inbox**, **Sent**, **Banking & OTP (Parsian, Mellat, Melli, Pasargad, etc.)**, **Spam & Promo**, **Blocked**, and **Drafts & Failed**.
  - Added dedicated 1-click clipboard copy button for rapid OTP & transaction copying.
- **🎨 Real APK Icon Extractor (`server/appIconManager.js` & `src/components/AppIcon.tsx`):**
  - Direct high-resolution icon extraction from installed APKs using native Android packaging tools.
  - Server-side disk caching in `data/app_icons/` with dynamic SVG fallback badges.
- **👥 Contact Merge & Avatar Studio (`src/components/MessagesTab.tsx`):**
  - Smart duplicate contact discovery and 1-click merging based on identical phone numbers or names.
  - Account source indicators (Google, Telegram, SIM, Device Phonebook), avatar photo management, and vCard 3.0 export.
- **📁 Office & Web Document Previewer (`src/components/FilesTab.tsx`):**
  - In-browser preview for Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), HTML, JSON, Python, and code syntax files.
- **🧪 Comprehensive Test Coverage:**
  - Expanded test suite to **27 test suites / 93 tests** with 100% passing rate.

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
