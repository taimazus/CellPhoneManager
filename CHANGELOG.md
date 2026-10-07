# 📜 Changelog — CellPhoneManager

All notable changes to the **CellPhoneManager** project are documented in this file.

Developed and maintained exclusively by **Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)** — [https://irres.ir](https://irres.ir).

---

## [3.4.2] — 2026-10-07 (Royal Edition Enterprise)

### 🌟 Fixed & Enhanced
- **AI Operational Assistant:** Connected `/api/devices/:id/ai/ask` endpoint in `server/index.js` and upgraded `AiAssistantTab` to use `safeFetchJson` with zero-fail resilience.
- **Global Zero-Trust Auth Gate:** Implemented `securityManager.getAuthMiddleware()` and automatic bearer token injection for frontend requests.

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
- **Safe Firmware Flashing Guard (`firmwareGuardManager`):**
  - SHA-256 checksumming, ROM metadata inspection, and fastboot safety verification.
- **Connection Automations (`automationManager`):**
  - Event triggers on USB connection with execution history logs.

### 🎨 Theme & UI Enhancements
- Complete harmonization of `UserGuideModal` and `TabGuideCard` to the **Royal 24k Gold & Imperial Dark Charcoal** palette.
- Dynamic React.lazy code splitting reducing the initial JS chunk size from 820 KB down to **314 KB**.

### 🧪 Quality & Tests
- 25 test suites with 80 unit & integration tests passing 100%.

---

## [3.3.0] — 2026-10-07

### 🌟 Added
- Multi-device batch operations and initial capability resolution.
- Apple iOS device bridge foundation via pymobiledevice3 diagnostics.
- Advanced Audio FX and PC-to-Phone Speaker streaming.

---

## [3.2.0] — 2026-10-07

### 🌟 Added
- Imperial Royal 24k Gold design system.
- Full Persian localization and RTL layout.
- Official Sahand Electronic Solutions Co. enterprise branding and metadata.
