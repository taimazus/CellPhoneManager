<div align="center">

# 📱 CellPhoneManager (مدیریت پیشرفته تلفن همراه)

<p align="center">
  <b>Comprehensive Smartphone Diagnostics, Audio Streaming, Automation & Device Control Platform</b>
  <br />
  <i>نرم‌افزار جامع مدیریت، عیب‌یابی، استریم صوتی و کنترل پیشرفته گوشی‌های هوشمند</i>
</p>

<p align="center">
  <a href="README.fa.md"><b>🇮🇷 مطالعه به زبان فارسی</b></a> •
  <a href="#-key-features"><b>Features</b></a> •
  <a href="#-quick-start"><b>Quick Start</b></a> •
  <a href="#-architecture"><b>Architecture</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.8.0-blue?style=for-the-badge" alt="Version 3.8.0" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Express-4-black?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

</div>

---

## 🌟 Overview

**CellPhoneManager** is an enterprise-grade desktop & web-based smartphone management solution developed by **Sahand Electronic Solutions Co. ([irres.ir](https://irres.ir))**. Built with **React 19**, **Vite 6**, **TypeScript**, and **Express.js**, it bridges modern web interfaces with low-level device automation protocols, providing real-time telemetry, diagnostics, screen sharing/control, and high-fidelity audio streaming.

---

## ✨ Key Features

- ⚡ **Real-Time Device Telemetry**: Live CPU, RAM, battery, thermal status, and storage monitoring over WebSockets (`ws`).
- 🎵 **Low-Latency Audio Streaming**: High-performance audio forwarding from mobile devices to PC with zero lag.
- 📱 **Advanced Device Operations**: Automated ADB tooling, deep diagnostics, filesystem navigation, and backup/restore workflows.
- 🖥️ **Desktop Companion & Web UI**: Modern glassmorphic interface powered by Tailwind CSS and Lucide React icons.
- 🧪 **Production-Grade Test Suite**: Integrated unit and regression testing with **Vitest**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React, clsx, tailwind-merge.
- **Backend / Server**: Node.js (ES Modules), Express.js, WebSockets (`ws`), Multer, CORS, Dotenv.
- **Testing**: Vitest.
- **Hardware Integration**: ADB (Android Debug Bridge), Win32 audio routing, local hardware bridges.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- `npm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/taimazus/CellPhoneManager.git
   cd CellPhoneManager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode (Client + Server):**
   ```bash
   npm run dev
   ```
   * Client runs on: `http://localhost:5173`
   * Backend server runs on: `http://localhost:3000`

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
CellPhoneManager/
├── server/               # Express backend & WebSocket server
│   ├── index.js          # Main server entrypoint
│   └── setupShortcut.js  # Desktop integration helper
├── src/                  # React 19 Frontend application
│   ├── components/       # Reusable UI widgets and dialogs
│   ├── hooks/            # Custom hooks for WebSocket & device state
│   ├── App.tsx           # Application root
│   └── main.tsx          # React DOM entrypoint
├── tests/                # Vitest unit & integration test suites
├── package.json          # Manifest & scripts
└── vite.config.ts        # Vite configuration
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<div align="center">
  <sub>Developed by <a href="https://irres.ir">Sahand Electronic Solutions Co.</a> & Maintainer <a href="https://github.com/taimazus">Taimaz</a></sub>
</div>
