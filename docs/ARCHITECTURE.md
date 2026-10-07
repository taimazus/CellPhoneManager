# 🏗️ CellPhoneManager v3.4.0 — Architectural Specifications

Developed exclusively for **Sahand Electronic Solutions Co. (شرکت راهکار الکترونیک سهند)** — [https://irres.ir](https://irres.ir).

---

## 1. System Topology & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Technician
    participant UI as React 19 Frontend (Port 5173)
    participant Sec as Security & Audit Guard (Port 3001)
    participant Cap as Capability Engine (Evaluator)
    participant WS as WebSocket Live Hub (Port 3001)
    participant API as Express API Server (Port 3001)
    participant Mgr as Domain Managers (Backup, ROM, Tools)
    participant Dev as Mobile Device (Android / iOS)

    User->>UI: Select Action / Connect Device
    UI->>Cap: Check Capability Matrix (5 Statuses)
    Cap-->>UI: Return READY / NEEDS_CONFIG / NEEDS_TOOL
    
    alt REST Interaction
        UI->>Sec: Validate Session Token & Endpoint Policy
        Sec->>API: Authorized Request Dispatch
        API->>Mgr: Execute Managed Operation (Pre-flight Assert)
        Mgr->>Dev: Execute Native Bridge (ADB / Fastboot / USBMuxd)
        Dev-->>Mgr: Return Hardware Payload / Telemetry
        Mgr-->>API: Format Structured JSON Response
        API-->>Sec: Log Event to Persistent Audit Trail
        Sec-->>UI: Return 200 OK + JSON Payload
    else WebSocket Real-time Stream
        UI->>WS: Connect WebSocket (ws://127.0.0.1:3001)
        WS->>Mgr: Spawn Scrcpy / Logcat / Audio Pipeline
        Dev-->>Mgr: Stream Video Frames / Audio / Logs
        Mgr-->>WS: Broadcast Binary / Log Packets
        WS-->>UI: Real-time Canvas Rendering & Audio Player
    end
    UI-->>User: Visual Feedback & Notifications
```

---

## 2. Core Architecture Modules & Responsibilities

| Module | Location | Primary Responsibilities |
| :--- | :--- | :--- |
| **`capabilityManager`** | `server/capabilityManager.js` | 5-state prerequisite matrix, OS version & permission validation, Persian guidance. |
| **`securityManager`** | `server/securityManager.js` | Session tokens, localhost binding enforcement, persistent audit logging. |
| **`universalBackupManager`** | `server/universalBackupManager.js` | AES-256 encrypted backups, vCard/JSON/SMS extraction, path-traversal prevention. |
| **`taskQueueManager`** | `server/taskQueueManager.js` | Multi-device concurrent task execution queue with pause/resume controls. |
| **`telemetryManager`** | `server/telemetryManager.js` | Time-series hardware telemetry (battery, temp, voltage, storage) and threshold alerts. |
| **`profileManager`** | `server/profileManager.js` | Device configuration presets (*Gaming Pro*, *Eco Power*, *Dev Studio*) & diff rollback. |
| **`firmwareGuardManager`** | `server/firmwareGuardManager.js` | SHA-256 image verification and fastboot pre-flash safety assertions. |
| **`automationManager`** | `server/automationManager.js` | Device connection event triggers and scheduled automation execution logs. |
| **`toolManager`** | `server/toolManager.js` | Offline wheels fallback (`bin/wheels/`), tool diagnosis, transparent downloads. |
| **`pcSpeakerManager`** | `server/pcSpeakerManager.js` | Windows loopback audio capture and ultra-low latency WebAudio streaming. |

---

## 3. Security & Air-Gapped Deployment Invariants

1. **Localhost Binding:** Express and WebSocket servers are bound strictly to `127.0.0.1` preventing unauthorized remote network access.
2. **Zero Injections:** Native tool execution uses `execFileAsync` argument vectors without raw shell string concatenation.
3. **Offline Invariant:** Core Android workflows operate with zero internet access; optional iOS tools utilize bundled wheels in `bin/wheels/`.
