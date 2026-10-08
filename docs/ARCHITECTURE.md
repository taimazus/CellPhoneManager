# 🏗️ CellPhoneManager v3.5.0 — Architectural Specifications

Developed exclusively for **Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)** — [https://irres.ir](https://irres.ir).

---

## 1. System Topology & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Gamer / Technician
    participant Phone as Mobile Gamepad / File Explorer (Browser / Touch)
    participant UI as React 19 Frontend (Port 5173)
    participant Sec as Security & Audit Guard (Port 3001)
    participant Cap as Capability Engine (Evaluator)
    participant WS as WebSocket Live Hub (Port 3001)
    participant GPad as PC Gamepad Engine (pcGamepadManager)
    participant Bridge as Native C# Input Bridge (winInputBridge.ps1)
    participant Win as Windows Host / DirectX Game (e.g. FIFA 18)
    participant FileMgr as File & Media Studio (fileManager)
    participant IconMgr as App Icon Extractor (appIconManager)
    participant Mgr as Domain Managers (Backup, ROM, Tools)
    participant Dev as Mobile Device (Android / iOS)

    alt Real-time Gamepad Input Pipeline (< 2ms)
        Phone->>WS: Send JSON { type: GAMEPAD_INPUT, player: 1, button: 'BTN_A', state: 'down' }
        WS->>GPad: Route Gamepad Event (Player 1/2 Profile Mapping)
        GPad->>Bridge: Pipe "KEY_DOWN:0x53,0x1F,0" (VK + Hardware ScanCode)
        Bridge->>Win: Native keybd_event (DirectX ScanCode Injection)
        Win-->>User: In-Game Action (Pass / Shoot / Move)
    else App Icon Extraction & Local Cache
        UI->>IconMgr: GET /api/devices/:id/apps/:pkg/icon
        IconMgr->>Dev: Pull APK & extract icon drawable via aapt/unzip
        IconMgr-->>UI: Cache on disk & stream image/png (200 OK)
    else File Management & Recursive Drag-Drop Upload
        User->>UI: Drop Folders & Files / Batch Download ZIP
        UI->>FileMgr: POST /api/devices/:id/files/upload (Multipart with relativePaths)
        FileMgr->>Dev: Push files recursively via ADB (preserving subdirectories)
        Dev-->>FileMgr: Transfer Acknowledgment
        FileMgr-->>UI: 200 OK + Refreshed Tree
    else Management & Diagnostics
        User->>UI: Select Action / Connect Device
        UI->>Cap: Check Capability Matrix (5 Statuses)
        Cap-->>UI: Return READY / NEEDS_CONFIG / NEEDS_TOOL
        UI->>Sec: Validate Session Token & Endpoint Policy
        Sec->>Mgr: Execute Managed Operation (Pre-flight Assert)
        Mgr->>Dev: Execute Native Bridge (ADB / Fastboot / USBMuxd)
        Dev-->>Mgr: Return Hardware Payload / Telemetry
        Mgr-->>UI: Return 200 OK + JSON Payload
    end
```

---

## 2. Core Architecture Modules & Responsibilities

| Module | Location | Primary Responsibilities |
| :--- | :--- | :--- |
| **`appIconManager`** | `server/appIconManager.js` | Direct APK icon extraction, local server file caching, MIME streaming, and SVG fallbacks. |
| **`fileManager`** | `server/fileManager.js` | Recursive file and folder push/pull, exact byte extraction (`sizeBytes`), human formatting, deletion, batch ZIP archiving, preview streaming. |
| **`pcGamepadManager`** | `server/pcGamepadManager.js` | Real-time multi-player gamepad mapping (Player 1 & 2), profiles (FIFA, Racing, Action, Retro), and WebSocket routing. |
| **`winInputBridge`** | `server/winInputBridge.ps1` | Persistent native C# `keybd_event` Windows hardware ScanCode injection bypassing Windows keyboard layout (FA/EN). |
| **`setupShortcut`** | `server/setupShortcut.js` | Automated Windows User PATH registration, `CPM_HOME` environment setup, and `.ico` desktop/start menu shortcut generation. |
| **`capabilityManager`** | `server/capabilityManager.js` | 5-state prerequisite matrix, OS version & permission validation, Persian guidance. |
| **`securityManager`** | `server/securityManager.js` | Session tokens, localhost binding enforcement, persistent audit logging. |
| **`universalBackupManager`** | `server/universalBackupManager.js` | AES-256 encrypted backups, vCard/JSON/SMS extraction, path-traversal prevention. |
| **`taskQueueManager`** | `server/taskQueueManager.js` | Multi-device concurrent task execution queue with pause/resume controls. |
| **`telemetryManager`** | `server/telemetryManager.js` | Time-series hardware telemetry (battery, temp, voltage, storage) and threshold alerts. |
| **`profileManager`** | `server/profileManager.js` | Device configuration presets (*Gaming Pro*, *Eco Power*, *Dev Studio*) & diff rollback. |
| **`firmwareGuardManager`** | `server/firmwareGuardManager.js` | SHA-256 image verification and fastboot pre-flash safety assertions. |
| **`automationManager`** | `server/automationManager.js` | Device connection event triggers and scheduled automation execution logs. |
| **`toolManager`** | `server/toolManager.js` | Offline wheels fallback (`bin/wheels/`), tool diagnosis, transparent downloads. |
| **`aiManager`** | `server/aiManager.js` | Intent parsing, guardrail enforcement, and direct device operation execution. |
| **`pcSpeakerManager`** | `server/pcSpeakerManager.js` | Windows loopback audio capture and ultra-low latency WebAudio streaming. |

---

## 3. Security & Input Invariants

1. **Hardware ScanCode Independence:** Gamepad keyboard injection relies strictly on PS/2 hardware scan codes (`scan`) and virtual keys (`vk`), completely isolating gameplay inputs from Windows active IME/keyboard layout (Persian vs English).
2. **Localhost Binding:** Express and WebSocket servers are bound strictly to `127.0.0.1` preventing unauthorized remote network access, with controlled LAN exposure only for mobile gamepad pairing.
3. **Zero Shell Injections:** Native tool execution uses `execFileAsync` argument vectors without raw shell string concatenation.
4. **Offline Invariant:** Core Android workflows operate with zero internet access; optional iOS tools utilize bundled wheels in `bin/wheels/`.
5. **Path Traversal Protection:** All file operations validate remote and local paths against illegal character injections or escaping directory boundaries.
