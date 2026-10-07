# 🏗️ CellPhoneManager v3.0 — Architectural Specifications

Developed for **Sahand Electronic Solutions Co.** ([https://irres.ir](https://irres.ir))

---

## 1. System Topology & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Admin
    participant UI as React 19 Frontend (Port 5173)
    participant WS as WebSocket Live Hub (Port 3001)
    participant API as Express API Server (Port 3001)
    participant Manager as Managers (ADB, Root, ROM, Backup)
    participant Device as Mobile Device (Android / iOS)

    User->>UI: Select Action (e.g. Flash ROM / Backup / Mirror)
    alt REST Interaction
        UI->>API: POST /api/devices/:id/action (JSON)
        API->>Manager: Execute Managed Operation
        Manager->>Device: Execute CLI/Bridge Command (ADB / Fastboot / USBMuxd)
        Device-->>Manager: Return Hardware Result / Buffer
        Manager-->>API: Format Structured Response
        API-->>UI: Return 200 OK + JSON Payload
    else WebSocket Real-time Stream
        UI->>WS: Connect WebSocket (ws://localhost:3001)
        WS->>Manager: Spawn Scrcpy / Logcat Process
        Device-->>Manager: Stream Video Frames / Audio / Logs
        Manager-->>WS: Broadcast Binary / Log Packets
        WS-->>UI: Real-time Canvas Rendering / VU Meter
    end
    UI-->>User: Visual Feedback & Notifications
```

---

## 2. Component Hierarchy & Module Mapping

```mermaid
classDiagram
    class AdbManager {
        +runAdb(args, serial)
        +listDevices()
        +getDeviceDetails(serial)
        +captureScreenshot(serial)
        +sendTap(serial, x, y)
        +sendKey(serial, keycode)
    }

    class RootManager {
        +checkRootStatus(serial)
        +installMagiskApp(serial)
        +temporaryBoot(patchedBootPath)
        +flashBoot(patchedBootPath, slot)
        +unrootDevice(serial, stockBootPath)
    }

    class RomManager {
        +getDeviceRomInfo(serial)
        +sideloadPackage(serial, zipFilePath)
        +flashPartition(partition, imagePath, disableVerity)
        +fastbootWipeData()
        +rebootMode(serial, targetMode)
    }

    class UniversalBackupManager {
        +listBackups()
        +createBackup(options)
        +restoreBackup(backupId, targetSerial, options)
        +deleteBackup(backupId)
    }

    class PasswordManager {
        +getWifiPasswords(serial)
        +connectToWifi(serial, ssid, password)
        +getSystemAccounts(serial)
    }

    AdbManager <|-- RootManager
    AdbManager <|-- RomManager
    AdbManager <|-- UniversalBackupManager
    AdbManager <|-- PasswordManager
```

---

## 3. Security Boundary & Permissions

- **Localhost Isolation:** Backend binds to `localhost:3001` with explicit CORS origin verification.
- **Input Sanitization:** Filename regex validation (`/[^a-zA-Z0-9._-]/g`) prevents path traversal.
- **Fail-Safe Fastboot Booting:** Temporary boot (`fastboot boot`) enables RAM-only kernel testing prior to permanent flash commits.
