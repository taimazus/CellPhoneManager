import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { spawn } from 'child_process';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';
import { iosManager } from './iosManager.js';
import { mockDeviceManager } from './mockDeviceManager.js';
import { mirrorManager } from './mirrorManager.js';
import { fileManager } from './fileManager.js';
import { networkManager } from './networkManager.js';
import { automationManager } from './automationManager.js';
import { notificationManager } from './notificationManager.js';
import { recorderManager } from './recorderManager.js';
import { apkInspectorManager } from './apkInspectorManager.js';
import { aiManager } from './aiManager.js';
import { gpsManager } from './gpsManager.js';
import { debloaterManager } from './debloaterManager.js';
import { clonerManager } from './clonerManager.js';
import { migrationManager } from './migrationManager.js';
import { rescueManager } from './rescueManager.js';
import { audioFxManager } from './audioFxManager.js';
import { ocrManager } from './ocrManager.js';
import { rootManager } from './rootManager.js';
import { romManager } from './romManager.js';
import { universalBackupManager } from './universalBackupManager.js';
import { passwordManager } from './passwordManager.js';
import { audioRecorderManager } from './audioRecorderManager.js';
import { hardwareLabManager } from './hardwareLabManager.js';
import { systemDoctorManager } from './systemDoctorManager.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Multer upload destination
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const upload = multer({ dest: uploadsDir });

// Serve static frontend build if present
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// -------------------------------------------------------------
// 1. Tool Diagnostics & Installer APIs
// -------------------------------------------------------------
app.get('/api/tools/status', async (req, res) => {
  try {
    const status = await toolManager.getDiagnosticStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tools/install', async (req, res) => {
  const { toolId } = req.body;
  if (!toolId) {
    return res.status(400).json({ error: 'toolId is required' });
  }
  try {
    const result = await toolManager.installTool(toolId, (msg) => {
      broadcastWs({ type: 'TOOL_INSTALL_LOG', toolId, message: msg });
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. Device Discovery & Information APIs
// -------------------------------------------------------------
app.get('/api/devices', async (req, res) => {
  try {
    const androidDevices = await adbManager.listDevices();
    const iosDevices = await iosManager.listDevices();
    const realDevices = [...androidDevices, ...iosDevices];
    const mockDevices = mockDeviceManager.getDevices();

    // Prioritize real connected devices; show mock devices only when no physical device is detected
    const devices = realDevices.length > 0 ? realDevices : mockDevices;
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/details', async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  try {
    if (id.startsWith('mock-')) {
      const dev = mockDeviceManager.getDevice(id);
      return res.json(dev || {});
    }

    if (type === 'android') {
      const details = await adbManager.getDeviceDetails(id);
      return res.json(details);
    } else if (type === 'ios') {
      const details = await iosManager.getDeviceDetails(id);
      return res.json(details);
    }

    res.status(400).json({ error: 'نوع دستگاه نامشخص است' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wireless connection & pairing APIs
app.post('/api/devices/wireless/pair', async (req, res) => {
  const { ip, port, code } = req.body;
  if (!ip || !port || !code) {
    return res.status(400).json({ error: 'آدرس IP، پورت و کد جفت‌سازی الزامی هستند' });
  }
  try {
    const result = await adbManager.pairWireless(ip, port, code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/wireless/connect', async (req, res) => {
  const { ip, port } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'آدرس IP الزامی است' });
  }
  try {
    const result = await adbManager.connectWireless(ip, port || 5555);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/wireless/enable-tcpip', async (req, res) => {
  const { serial, port } = req.body;
  try {
    const result = await adbManager.enableTcpip(serial, port || 5555);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// 3. App Management APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/apps', async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  try {
    if (id.startsWith('mock-')) {
      const dev = mockDeviceManager.getDevice(id);
      return res.json({ apps: dev ? dev.apps : [] });
    }

    if (type === 'android') {
      const apps = await adbManager.listApps(id);
      return res.json({ apps });
    } else if (type === 'ios') {
      const apps = await iosManager.listApps(id);
      return res.json({ apps });
    }

    res.json({ apps: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/apps/install', upload.single('packageFile'), async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'فایل برنامه (.apk / .ipa) ارسال نشده است' });
  }

  try {
    if (id.startsWith('mock-')) {
      const appName = file.originalname.replace(/\.(apk|ipa|xapk)$/i, '');
      const newApp = {
        packageName: `com.user.${Date.now()}`,
        appName: appName,
        version: '1.0.0',
        isSystem: false,
        size: `${Math.round(file.size / (1024 * 1024))} MB`,
        enabled: true
      };
      mockDeviceManager.addApp(id, newApp);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.json({ success: true, message: 'برنامه با موفقیت نصب شد (شبیه‌سازی)' });
    }

    if (type === 'android') {
      const result = await adbManager.installApk(id, file.path);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.json(result);
    } else if (type === 'ios') {
      const result = await iosManager.installIpa(id, file.path);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.json(result);
    }

    res.status(400).json({ error: 'نوع دستگاه نامشخص است' });
  } catch (err) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/apps/uninstall', async (req, res) => {
  const { id } = req.params;
  const { packageName, type } = req.body;

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.removeApp(id, packageName);
      return res.json({ success: true, message: 'برنامه با موفقیت حذف شد' });
    }

    if (type === 'android') {
      const result = await adbManager.uninstallApp(id, packageName);
      return res.json(result);
    } else if (type === 'ios') {
      const result = await iosManager.uninstallApp(id, packageName);
      return res.json(result);
    }

    res.status(400).json({ error: 'دستگاه نامعتبر' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/apps/toggle-freeze', async (req, res) => {
  const { id } = req.params;
  const { packageName, enable, type } = req.body;

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.setAppStatus(id, packageName, enable);
      return res.json({ success: true, message: enable ? 'برنامه فعال شد' : 'برنامه با موفقیت غیرفعال (Freeze) شد' });
    }

    if (type === 'android') {
      const result = enable ? await adbManager.enableApp(id, packageName) : await adbManager.disableApp(id, packageName);
      return res.json(result);
    }

    res.status(400).json({ error: 'فقط در اندروید پشتیبانی می‌شود' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. Hidden Settings & System Tweaks APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/tweaks', async (req, res) => {
  const { id } = req.params;
  const { action, value, type } = req.body;

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.updateSetting(id, action, value);
      return res.json({ success: true, message: 'تنظیمات با موفقیت اعمال گردید' });
    }

    if (type === 'android') {
      if (action === 'density') {
        const result = value === 'reset' ? await adbManager.resetDisplayDensity(id) : await adbManager.setDisplayDensity(id, value);
        return res.json(result);
      }
      if (action === 'animation') {
        const result = await adbManager.setAnimationScale(id, value);
        return res.json(result);
      }
      if (action === 'demo_mode') {
        const result = await adbManager.setDemoMode(id, value);
        return res.json(result);
      }
      if (action === 'simulate_location') {
        const result = value ? await adbManager.setSimulatedLocation(id, value.lat, value.lng) : await adbManager.clearSimulatedLocation(id);
        return res.json(result);
      }
      if (action === 'refresh_rate') {
        const result = await adbManager.setRefreshRate(id, value);
        return res.json(result);
      }
      if (action === 'custom_resolution') {
        const result = await adbManager.setCustomResolution(id, value);
        return res.json(result);
      }
      if (action === 'private_dns') {
        const result = await adbManager.setPrivateDns(id, value);
        return res.json(result);
      }
      if (action === 'show_touches') {
        const result = await adbManager.setShowTouches(id, value);
        return res.json(result);
      }
      if (action === 'pointer_location') {
        const result = await adbManager.setShowPointerLocation(id, value);
        return res.json(result);
      }
      if (action === 'show_fps') {
        const result = await adbManager.setShowFpsOverlay(id, value);
        return res.json(result);
      }
      if (action === 'dark_mode') {
        const result = await adbManager.setDarkMode(id, value);
        return res.json(result);
      }
      if (action === 'stay_awake') {
        const result = await adbManager.setStayAwake(id, value);
        return res.json(result);
      }
      if (action === 'clock_seconds') {
        const result = await adbManager.setClockSeconds(id, value);
        return res.json(result);
      }
      if (action === 'force_msaa') {
        const result = await adbManager.setForceMsaa(id, value);
        return res.json(result);
      }
      if (action === 'doze_mode') {
        const result = await adbManager.setAggressiveDoze(id);
        return res.json(result);
      }
      if (action === 'shell') {
        const result = await adbManager.runAdb(`shell ${value}`, id);
        return res.json(result);
      }
    } else if (type === 'ios') {
      if (action === 'simulate_location') {
        const result = value ? await iosManager.setSimulatedLocation(id, value.lat, value.lng) : await iosManager.clearSimulatedLocation(id);
        return res.json(result);
      }
    }

    res.status(400).json({ error: `اقدام '${action}' برای این نوع دستگاه (${type}) پشتیبانی نمی‌شود` });


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. Screen Mirroring & Controls APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/mirror/start', async (req, res) => {
  const { id } = req.params;
  const options = req.body || {};

  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'نمایشگر زنده شبیه‌ساز فعال شد' });
    }

    const result = await mirrorManager.startScrcpy(id, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/mirror/stop', (req, res) => {
  const { id } = req.params;
  const result = mirrorManager.stopScrcpy(id);
  res.json(result);
});

// Camera Webcam Streaming & Controls
app.post('/api/devices/:id/camera/webcam/start', async (req, res) => {
  const { id } = req.params;
  const options = req.body || {};

  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `وب‌کم دوربین ${options.facing === 'front' ? 'سلفی' : 'اصلی'} شبیه‌سازی شد.` });
    }

    const result = await mirrorManager.startCameraWebcam(id, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/camera/webcam/stop', (req, res) => {
  const { id } = req.params;
  const result = mirrorManager.stopScrcpy(id);
  res.json(result);
});

app.post('/api/devices/:id/camera/torch', async (req, res) => {
  const { id } = req.params;
  const { enable } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: enable ? 'فلش دوربین روشن شد (شبیه‌ساز)' : 'فلش خاموش شد' });
    }
    const result = await adbManager.setTorch(id, enable);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/camera/shutter', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'عکس گرفته شد (شبیه‌ساز)' });
    }
    const result = await adbManager.triggerCameraShutter(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/camera/launch', async (req, res) => {
  const { id } = req.params;
  const { facing } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `دوربین ${facing} باز شد` });
    }
    const result = await adbManager.launchCamera(id, facing || 'back');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/screencap.png', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      const svg = '<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#050c1e"/><circle cx="640" cy="360" r="120" fill="#06b6d4" opacity="0.3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00f0ff" font-size="28" font-family="sans-serif">منظره‌یاب زنده دوربین (پیش‌نمایش)</text></svg>';
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }
    const adbPath = await toolManager.getAdbPath();
    const child = spawn(adbPath, ['-s', id, 'exec-out', 'screencap', '-p']);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    child.stdout.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Microphone & Audio Streaming APIs
app.post('/api/devices/:id/mic/start', async (req, res) => {
  const { id } = req.params;
  const options = req.body || {};

  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'استریم میکروفون شبیه‌سازی شد' });
    }

    const result = await audioRecorderManager.startMicStream(id, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/mic/stop', (req, res) => {
  const { id } = req.params;
  const result = audioRecorderManager.stopMicStream(id);
  res.json(result);
});

app.get('/api/devices/:id/mic/status', (req, res) => {
  const { id } = req.params;
  const status = audioRecorderManager.getStatus(id);
  res.json(status);
});

// Audio Recordings & File Management APIs
app.get('/api/audio-recordings', (req, res) => {
  const recordings = audioRecorderManager.listAudioRecordings();
  const directory = audioRecorderManager.getAudioDir();
  res.json({ recordings, directory });
});

app.get('/api/audio-recordings/directory', (req, res) => {
  res.json({ directory: audioRecorderManager.getAudioDir() });
});

app.post('/api/audio-recordings/directory', (req, res) => {
  const { directory } = req.body;
  const result = audioRecorderManager.setAudioDir(directory);
  res.json(result);
});

app.post('/api/audio-recordings/open-folder', (req, res) => {
  const { customPath } = req.body || {};
  const result = audioRecorderManager.openDirectoryInExplorer(customPath);
  res.json(result);
});

app.post('/api/audio-recordings/open-file', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'نام فایل صوتی الزامی است' });
  const result = audioRecorderManager.openFileInExplorer(filename);
  res.json(result);
});

app.delete('/api/audio-recordings/:filename', (req, res) => {
  const { filename } = req.params;
  const result = audioRecorderManager.deleteAudio(filename);
  res.json(result);
});

app.get('/api/audio-recordings/stream/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(audioRecorderManager.getAudioDir(), safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'فایل صوتی یافت نشد' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'audio/ogg';
  if (safeFilename.endsWith('.aac') || safeFilename.endsWith('.m4a')) contentType = 'audio/mp4';
  else if (safeFilename.endsWith('.mp3')) contentType = 'audio/mpeg';
  else if (safeFilename.endsWith('.wav')) contentType = 'audio/wav';
  else if (safeFilename.endsWith('.opus')) contentType = 'audio/opus';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/api/audio-recordings/download/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(audioRecorderManager.getAudioDir(), safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'فایل صوتی یافت نشد' });
  }
  res.download(filePath, safeFilename);
});

// Live in-browser screencap endpoint
app.get('/api/devices/:id/screencap.png', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.status(404).send('Mock device');
    }
    const buffer = await adbManager.getScreenBuffer(id);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/screencap-base64', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, base64: null, mock: true });
    }
    const buffer = await adbManager.getScreenBuffer(id);
    res.json({ success: true, base64: buffer.toString('base64') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/devices/:id/deep-info', async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;

  try {
    if (id.startsWith('mock-')) {
      return res.json({
        cpuAbi: 'arm64-v8a (64-Bit Octa-Core)',
        securityPatch: '2024-06-01',
        bootloaderLocked: 'Locked (قفل ایمن)',
        selinux: 'Enforcing',
        uptime: 'Up 72 hours, 14 min',
        socPlatform: 'Snapdragon 8 Gen 2 / Dimensity 9200'
      });
    }

    if (type === 'android') {
      const info = await adbManager.getDeepDeviceInfo(id);
      return res.json(info);
    }

    res.json({
      cpuAbi: 'Apple A16 / A17 Bionic 64-Bit',
      securityPatch: 'iOS 17.5.1 Security Update',
      bootloaderLocked: 'Secure Boot (Active)',
      selinux: 'Sandboxed (Mach-O)',
      uptime: 'Up 120 hours',
      socPlatform: 'Apple Silicon'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/control/action', async (req, res) => {
  const { id } = req.params;
  const { action, keycode, x, y, type, packageName, url } = req.body;

  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `دستور ${action} شبیه‌سازی شد` });
    }

    if (type === 'android') {
      if (action === 'key') {
        const result = await adbManager.sendKey(id, keycode);
        return res.json(result);
      }
      if (action === 'tap') {
        const result = await adbManager.sendTap(id, x, y);
        return res.json(result);
      }
      if (action === 'screenshot') {
        const result = await adbManager.captureScreenshot(id);
        return res.json(result);
      }
      if (action === 'reboot') {
        const result = await adbManager.reboot(id, req.body.mode || 'normal');
        return res.json(result);
      }
      if (action === 'clean_cache') {
        const result = await adbManager.cleanCacheAndMemory(id);
        return res.json(result);
      }
      if (action === 'launch_app') {
        const result = await adbManager.launchApp(id, packageName);
        return res.json(result);
      }
      if (action === 'open_url') {
        const result = await adbManager.openUrl(id, url);
        return res.json(result);
      }
      if (action === 'expand_notifications') {
        const result = await adbManager.expandNotifications(id);
        return res.json(result);
      }
      if (action === 'expand_settings') {
        const result = await adbManager.expandQuickSettings(id);
        return res.json(result);
      }
      if (action === 'collapse_panels') {
        const result = await adbManager.collapsePanels(id);
        return res.json(result);
      }
    } else if (type === 'ios') {
      if (action === 'reboot') {
        const result = await iosManager.reboot(id);
        return res.json(result);
      }
      if (action === 'shutdown') {
        const result = await iosManager.shutdown(id);
        return res.json(result);
      }
    }

    res.status(400).json({ error: 'دستور نامعتبر' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. File Explorer & Transfer APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/files', async (req, res) => {
  const { id } = req.params;
  const pathQuery = req.query.path || '/sdcard/';
  try {
    const items = await fileManager.listDirectory(id, pathQuery);
    res.json({ items, currentPath: pathQuery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/files/upload', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const targetDir = req.body.targetDir || '/sdcard/Download/';
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'هیچ فایلی برای ارسال انتخاب نشده است' });
  }

  try {
    const result = await fileManager.pushFile(id, file.path, targetDir);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.json(result);
  } catch (err) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/files/download', async (req, res) => {
  const { id } = req.params;
  const remotePath = req.query.remotePath;
  if (!remotePath) return res.status(400).json({ error: 'مسیر فایل الزامی است' });

  const rawName = path.basename(remotePath);
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'downloaded_file';
  const localDest = path.join(uploadsDir, `pulled_${Date.now()}_${safeName}`);

  try {
    await fileManager.pullFile(id, remotePath, localDest);
    if (fs.existsSync(localDest)) {
      res.download(localDest, safeName, () => {
        if (fs.existsSync(localDest)) fs.unlinkSync(localDest);
      });
    } else {
      res.status(404).json({ error: 'فایل یافت نشد' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/files/preview', async (req, res) => {
  const { id } = req.params;
  const remotePath = req.query.remotePath;
  if (!remotePath) return res.status(400).json({ error: 'مسیر فایل الزامی است' });

  const rawName = path.basename(remotePath);
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'preview_file';
  const ext = path.extname(safeName).toLowerCase().replace('.', '');
  const localDest = path.join(uploadsDir, `preview_${Date.now()}_${safeName}`);

  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mkv: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    txt: 'text/plain; charset=utf-8',
    log: 'text/plain; charset=utf-8',
    json: 'text/plain; charset=utf-8',
    xml: 'text/plain; charset=utf-8',
    md: 'text/plain; charset=utf-8'
  };

  const contentType = mimeMap[ext] || 'application/octet-stream';

  try {
    if (id.startsWith('mock-')) {
      return res.status(200).send('Mock preview');
    }

    await fileManager.pullFile(id, remotePath, localDest);
    if (fs.existsSync(localDest)) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const fileStream = fs.createReadStream(localDest);
      fileStream.pipe(res);
      fileStream.on('end', () => {
        setTimeout(() => {
          if (fs.existsSync(localDest)) fs.unlinkSync(localDest);
        }, 5000);
      });
    } else {
      res.status(404).json({ error: 'فایل یافت نشد' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/devices/:id/files/delete', async (req, res) => {
  const { id } = req.params;
  const { remotePath } = req.body;
  try {
    const result = await fileManager.deleteFile(id, remotePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/files/mkdir', async (req, res) => {
  const { id } = req.params;
  const { dirPath } = req.body;
  try {
    const result = await fileManager.createDirectory(id, dirPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. App Package Extractor (Android APK & iOS IPA/App) & Remote Typing APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/apps/extract', async (req, res) => {
  const { id } = req.params;
  const packageName = req.query.packageName;
  const type = req.query.type || 'android';
  if (!packageName) return res.status(400).json({ error: 'نام پکیج / Bundle ID الزامی است' });

  const ext = type === 'ios' ? 'ipa' : 'apk';
  const localDest = path.join(uploadsDir, `${packageName}.${ext}`);
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `استخراج ${packageName}.${ext} در حالت شبیه‌ساز انجام شد.` });
    }

    if (type === 'ios') {
      const result = await iosManager.extractApp(id, packageName, localDest);
      if (fs.existsSync(localDest)) {
        res.download(localDest, `${packageName}.${ext}`, () => {
          if (fs.existsSync(localDest)) fs.unlinkSync(localDest);
        });
      } else {
        res.status(500).json({ error: result.error || 'خطا در استخراج برنامه iOS' });
      }
      return;
    }

    // Android APK Extraction
    const result = await adbManager.extractApk(id, packageName, localDest);
    if (fs.existsSync(localDest)) {
      res.download(localDest, `${packageName}.apk`, () => {
        if (fs.existsSync(localDest)) fs.unlinkSync(localDest);
      });
    } else {
      res.status(500).json({ error: result.error || 'خطا در استخراج APK' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/input/text', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `تایپ متن "${text}" شبیه‌سازی شد.` });
    }
    const result = await adbManager.sendTextInput(id, text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. Calls & Dialer APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/calls/state', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json(mockDeviceManager.getCallState(id));
    }
    const state = await adbManager.getCallState(id);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message, state: 'idle', isRinging: false, isInCall: false });
  }
});

app.post('/api/devices/:id/calls/answer', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      const result = mockDeviceManager.answerCall(id);
      return res.json(result);
    }
    const result = await adbManager.answerCall(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/end', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      const result = mockDeviceManager.endCall(id);
      return res.json(result);
    }
    const result = await adbManager.endCall(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/mute', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'میکروفون بی‌صدا / فعال شد' });
    }
    const result = await adbManager.toggleMute(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/speaker', async (req, res) => {
  const { id } = req.params;
  const { route } = req.body; // 'speaker' | 'earpiece' | 'bluetooth'
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `خروجی به ${route === 'speaker' ? 'بلندگو' : 'گوشی'} تغییر یافت` });
    }
    const result = await adbManager.setAudioRoute(id, route);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/dtmf', async (req, res) => {
  const { id } = req.params;
  const { digit } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `کلید ${digit} ارسال شد` });
    }
    const result = await adbManager.sendDtmf(id, digit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/reject-sms', async (req, res) => {
  const { id } = req.params;
  const { number, message } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.endCall(id);
      if (number) mockDeviceManager.sendSms(id, { number, body: message });
      return res.json({ success: true, message: 'تماس رد شد و پیامک پاسخ سریع ارسال گردید' });
    }
    const result = await adbManager.rejectCallWithSms(id, { number, message });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/mock-incoming', async (req, res) => {
  const { id } = req.params;
  const { number } = req.body;
  if (id.startsWith('mock-')) {
    const result = mockDeviceManager.simulateIncomingCall(id, number || '09129876543');
    return res.json({ success: true, state: result });
  }
  res.status(400).json({ error: 'تنها برای دستگاه‌های شبیه‌ساز قابل استفاده است' });
});

app.get('/api/devices/:id/calls', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ calls: mockDeviceManager.getCallLogs(id) });
    }
    const calls = await adbManager.getCallLogs(id);
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/make', async (req, res) => {
  const { id } = req.params;
  const { number, name = 'تماس جدید', simSlot } = req.body;
  if (!number) return res.status(400).json({ error: 'شماره تماس الزامی است' });

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.addCallLog(id, { name, number, type: 'outgoing', duration: '1m 05s' });
      return res.json({ success: true, message: `تماس با شماره ${number} برقرار شد` });
    }
    const result = await adbManager.makeCall(id, number, { simSlot });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/ussd/run', async (req, res) => {
  const { id } = req.params;
  const { code, simSlot } = req.body;
  if (!code) return res.status(400).json({ error: 'کد دستوری USSD الزامی است' });

  try {
    if (id.startsWith('mock-')) {
      const mockDialog = await adbManager.getActiveDialog(id);
      return res.json({ success: true, message: `کد دستوری ${code} با موفقیت اجرا شد (شبیه‌ساز)`, dialog: mockDialog });
    }
    const result = await adbManager.sendUssd(id, code, { simSlot });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/ussd/dialog', async (req, res) => {
  const { id } = req.params;
  try {
    const dialog = await adbManager.getActiveDialog(id);
    res.json({ success: true, dialog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/ussd/reply', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const dialog = await adbManager.replyToDialog(id, text);
    res.json({ success: true, dialog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/ussd/dismiss', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await adbManager.dismissDialog(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/telephony/default-sim', async (req, res) => {
  const { id } = req.params;
  const { voiceSlot, smsSlot, dataSlot } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'سیم‌کارت پیش‌فرض با موفقیت تنظیم شد (شبیه‌ساز)' });
    }
    const result = await adbManager.setDefaultSim(id, { voiceSlot, smsSlot, dataSlot });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/telephony/launch-dialer', async (req, res) => {
  const { id } = req.params;
  const { number } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'برنامه تماس روی گوشی باز شد (شبیه‌ساز)' });
    }
    const result = await adbManager.launchDialer(id, number);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/delete', async (req, res) => {
  const { id } = req.params;
  const { callId } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteCallLog(id, callId);
      return res.json({ success: true, message: 'مورد از تاریخچه تماس حذف شد' });
    }
    const result = await adbManager.deleteCallLog(id, callId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/calls/clear', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.clearCallLogs(id);
      return res.json({ success: true, message: 'کل تاریخچه تماس‌ها پاکسازی شد' });
    }
    const result = await adbManager.clearAllCallLogs(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 9. Contacts Management APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/contacts', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ contacts: mockDeviceManager.getContacts(id) });
    }
    const contacts = await adbManager.getContacts(id);
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/contacts/add', async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'نام و شماره مخاطب الزامی است' });

  try {
    if (id.startsWith('mock-')) {
      const added = mockDeviceManager.addContact(id, { name, phone, email, notes });
      return res.json({ success: true, contact: added, message: 'مخاطب با موفقیت ذخیره شد' });
    }
    const result = await adbManager.addContact(id, { name, phone, email, notes });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/contacts/delete', async (req, res) => {
  const { id } = req.params;
  const { contactId } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteContact(id, contactId);
      return res.json({ success: true, message: 'مخاطب با موفقیت حذف شد' });
    }
    const result = await adbManager.deleteContact(id, contactId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 10. SMS & Messaging APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/sms', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ messages: mockDeviceManager.getSms(id) });
    }
    const messages = await adbManager.getSms(id);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/sms/send', async (req, res) => {
  const { id } = req.params;
  const { number, body, simSlot } = req.body;
  if (!number || !body) return res.status(400).json({ error: 'شماره مقصد و متن پیامک الزامی است' });

  try {
    if (id.startsWith('mock-')) {
      const sent = mockDeviceManager.sendSms(id, { number, body });
      return res.json({ success: true, message: 'پیامک با موفقیت ارسال شد', data: sent });
    }
    const result = await adbManager.sendSms(id, { number, body, simSlot });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/sms/delete', async (req, res) => {
  const { id } = req.params;
  const { messageId } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteSms(id, messageId);
      return res.json({ success: true, message: 'پیامک با موفقیت حذف گردید' });
    }
    const result = await adbManager.deleteSms(id, messageId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/sms/clear', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.clearSms(id);
      return res.json({ success: true, message: 'کلیه پیامک‌ها پاکسازی شدند' });
    }
    const result = await adbManager.clearAllSms(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 11. Network, USB Tethering & VPN Sharing APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/network/tether/enable', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'اشتراک‌گذاری اینترنت با کابل (USB Tethering) شبیه‌سازی شد.' });
    }
    const result = await networkManager.enableUsbTethering(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/network/tether/disable', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'اشتراک اینترنت با کابل غیرفعال شد.' });
    }
    const result = await networkManager.disableUsbTethering(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/network/tether/settings', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'صفحه تنظیمات Tethering شبیه‌سازی شد.' });
    }
    const result = await networkManager.openTetherSettings(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/network/vpn/forward', async (req, res) => {
  const { id } = req.params;
  const { port = 10809 } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, port, message: `پورت ${port} در حالت شبیه‌ساز فوروارد شد.` });
    }
    const result = await networkManager.forwardVpnPort(id, port);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/network/vpn/remove-forward', async (req, res) => {
  const { id } = req.params;
  const { port = 10809 } = req.body;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: `فوروارد پورت ${port} حذف شد.` });
    }
    const result = await networkManager.removeVpnPortForward(id, port);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/network/vpn/forwards', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ forwards: [{ serial: id, local: 'tcp:10809', remote: 'tcp:10809' }] });
    }
    const forwards = await networkManager.listForwardedPorts(id);
    res.json({ forwards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/network/proxy/set', async (req, res) => {
  const { enabled, proxyServer = '127.0.0.1:10809' } = req.body;
  try {
    const result = await networkManager.setWindowsProxy(enabled, proxyServer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/network/proxy/status', async (req, res) => {
  try {
    const status = await networkManager.getWindowsProxyStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/network/ping', async (req, res) => {
  const host = req.query.host || '8.8.8.8';
  try {
    const result = await networkManager.pingHost(host);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/network/public-ip', async (req, res) => {
  try {
    const result = await networkManager.getPublicIp();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/network/vpn-location', async (req, res) => {
  try {
    const result = await networkManager.getVpnLocation();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 12. Hardware & Fastboot Diagnostics APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/hardware/vibrate', async (req, res) => {
  const { id } = req.params;
  const { pattern = 'normal', duration = 800 } = req.body;
  try {
    const result = await hardwareLabManager.triggerVibration(id, pattern, duration);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/hardware/button', async (req, res) => {
  const { id } = req.params;
  const { buttonKey } = req.body;
  try {
    const result = await hardwareLabManager.testPhysicalButton(id, buttonKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/hardware/camera', async (req, res) => {
  const { id } = req.params;
  const { mode = 'still' } = req.body;
  try {
    const result = await hardwareLabManager.launchCameraTest(id, mode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/hardware/screen-test', async (req, res) => {
  const { id } = req.params;
  const { color = 'rgb' } = req.body;
  try {
    const result = await hardwareLabManager.launchScreenTest(id, color);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/hardware/sensors', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await hardwareLabManager.getSensorDiagnostics(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/hardware/battery', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await hardwareLabManager.getBatteryDiagnostics(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/hardware/bluetooth', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await hardwareLabManager.getBluetoothDiagnostics(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/hardware/network', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({
        success: true,
        ip: '192.168.1.108',
        mac: '74:8D:08:B2:1A:4C',
        wifiSsid: 'Home_Network_5G',
        rssi: '-46 dBm (سیگنال عالی)',
        linkSpeed: '866 Mbps',
        dns: '8.8.8.8, 1.1.1.1'
      });
    }
    const stats = await adbManager.getNetworkStats(id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 12.1 Deep Junk Cleaning & Automated System Repairs APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/system/junk/scan', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await systemDoctorManager.scanJunk(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/system/junk/clean', async (req, res) => {
  const { id } = req.params;
  const { categories = ['all'] } = req.body;
  try {
    const result = await systemDoctorManager.cleanJunk(id, categories);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:id/system/diagnostics/health', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await systemDoctorManager.runHealthDiagnostics(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/system/repair', async (req, res) => {
  const { id } = req.params;
  const { action = 'fix_all' } = req.body;
  try {
    const result = await systemDoctorManager.performRepair(id, action);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fastboot/run', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'دستور Fastboot الزامی است' });
  try {
    const result = await adbManager.runFastboot(command);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 13. Automation & Macro Studio APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/automation/record/start', (req, res) => {
  const { id } = req.params;
  const result = automationManager.startRecording(id);
  res.json(result);
});

app.post('/api/devices/:id/automation/record/action', (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const list = automationManager.recordAction(id, action);
  res.json({ success: true, count: list.length });
});

app.post('/api/devices/:id/automation/record/stop', (req, res) => {
  const { id } = req.params;
  const result = automationManager.stopRecording(id);
  res.json(result);
});

app.post('/api/devices/:id/automation/play', async (req, res) => {
  const { id } = req.params;
  const { actions, repeat = 1, speed = 1 } = req.body;
  const result = await automationManager.playMacro(id, { actions, repeat, speed });
  res.json(result);
});

app.post('/api/devices/:id/automation/stop', (req, res) => {
  const { id } = req.params;
  const result = automationManager.stopMacro(id);
  res.json(result);
});

// -------------------------------------------------------------
// 14. Live Notification Center APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/notifications', async (req, res) => {
  const { id } = req.params;
  const notifs = await notificationManager.getLiveNotifications(id);
  res.json({ notifications: notifs });
});

app.post('/api/devices/:id/notifications/reply', async (req, res) => {
  const { id } = req.params;
  const { packageName, message } = req.body;
  const result = await notificationManager.quickReply(id, { packageName, message });
  res.json(result);
});

app.post('/api/devices/:id/notifications/dismiss', async (req, res) => {
  const { id } = req.params;
  const result = await notificationManager.dismissNotifications(id);
  res.json(result);
});

// -------------------------------------------------------------
// 15. HD Screen & Internal Audio Recorder APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/recorder/start', async (req, res) => {
  const { id } = req.params;
  const { resolution, bitrate, captureAudio } = req.body;
  const result = await recorderManager.startScreenRecording(id, { resolution, bitrate, captureAudio });
  res.json(result);
});

app.post('/api/devices/:id/recorder/stop', (req, res) => {
  const { id } = req.params;
  const result = recorderManager.stopScreenRecording(id);
  res.json(result);
});

app.get('/api/devices/:id/recorder/status', (req, res) => {
  const { id } = req.params;
  const status = recorderManager.getRecordingStatus(id);
  res.json(status);
});

app.get('/api/recordings', (req, res) => {
  const recordings = recorderManager.listRecordings();
  const directory = recorderManager.getRecordingsDir();
  res.json({ recordings, directory });
});

app.get('/api/recordings/directory', (req, res) => {
  res.json({ directory: recorderManager.getRecordingsDir() });
});

app.post('/api/recordings/directory', (req, res) => {
  const { directory } = req.body;
  const result = recorderManager.setRecordingsDir(directory);
  res.json(result);
});

app.post('/api/recordings/open-folder', (req, res) => {
  const { customPath } = req.body || {};
  const result = recorderManager.openDirectoryInExplorer(customPath);
  res.json(result);
});

app.post('/api/recordings/open-file', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'نام فایل الزامی است' });
  const result = recorderManager.openFileInExplorer(filename);
  res.json(result);
});

app.delete('/api/recordings/:filename', (req, res) => {
  const { filename } = req.params;
  const result = recorderManager.deleteRecording(filename);
  res.json(result);
});

app.get('/api/recordings/stream/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(recorderManager.getRecordingsDir(), safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ویدیو یافت نشد' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': safeFilename.endsWith('.mkv') ? 'video/x-matroska' : 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': safeFilename.endsWith('.mkv') ? 'video/x-matroska' : 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/api/recordings/download/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(recorderManager.getRecordingsDir(), safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ویدیو یافت نشد' });
  }
  res.download(filePath, safeFilename);
});

// -------------------------------------------------------------
// 16. APK Security & Permission Inspector APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/apps/inspect', async (req, res) => {
  const { id } = req.params;
  const { packageName } = req.query;
  if (!packageName) return res.status(400).json({ error: 'نام پکیج الزامی است' });
  const result = await apkInspectorManager.inspectInstalledApp(id, packageName);
  res.json(result);
});

// -------------------------------------------------------------
// 17. Multi-Device Bulk Sync Control APIs
// -------------------------------------------------------------
app.post('/api/devices/bulk/action', async (req, res) => {
  const { deviceIds, action, payload } = req.body;
  if (!Array.isArray(deviceIds)) return res.status(400).json({ error: 'لیست دستگاه‌ها الزامی است' });

  const results = [];
  for (const id of deviceIds) {
    if (action === 'tap') {
      await adbManager.sendTap(id, payload.x, payload.y);
      results.push({ id, success: true });
    } else if (action === 'key') {
      await adbManager.sendKeyEvent(id, payload.keycode);
      results.push({ id, success: true });
    } else if (action === 'clean_cache') {
      const r = await adbManager.cleanCacheAndMemory(id);
      results.push({ id, result: r });
    } else if (action === 'reboot') {
      const r = await adbManager.reboot(id, payload?.mode || 'normal');
      results.push({ id, result: r });
    }
  }
  res.json({ success: true, count: deviceIds.length, results });
});

// -------------------------------------------------------------
// 19. GPS Spoofing & Route Simulator APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/gps/set', async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.body;
  const result = await gpsManager.setLocation(id, { lat, lng });
  res.json(result);
});

app.post('/api/devices/:id/gps/clear', async (req, res) => {
  const { id } = req.params;
  const result = await gpsManager.clearLocation(id);
  res.json(result);
});

app.post('/api/devices/:id/gps/route/start', (req, res) => {
  const { id } = req.params;
  const { startLat, startLng, endLat, endLng, speedKmH } = req.body;
  const result = gpsManager.startRouteSimulation(id, { startLat, startLng, endLat, endLng, speedKmH });
  res.json(result);
});

app.post('/api/devices/:id/gps/route/stop', (req, res) => {
  const { id } = req.params;
  const result = gpsManager.stopRouteSimulation(id);
  res.json(result);
});

// -------------------------------------------------------------
// 20. Deep System Debloater APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/debloat/scan', async (req, res) => {
  const { id } = req.params;
  const result = await debloaterManager.scanDeviceBloatware(id);
  res.json(result);
});

app.post('/api/devices/:id/debloat/uninstall', async (req, res) => {
  const { id } = req.params;
  const { packageName } = req.body;
  const result = await debloaterManager.uninstallBloatware(id, packageName);
  res.json(result);
});

app.post('/api/devices/:id/debloat/restore', async (req, res) => {
  const { id } = req.params;
  const { packageName } = req.body;
  const result = await debloaterManager.restoreBloatware(id, packageName);
  res.json(result);
});

// -------------------------------------------------------------
// 21. Dual Apps & Profile Cloner APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/cloner/profiles', async (req, res) => {
  const { id } = req.params;
  const result = await clonerManager.getProfiles(id);
  res.json(result);
});

app.post('/api/devices/:id/cloner/create-profile', async (req, res) => {
  const { id } = req.params;
  const result = await clonerManager.createDualProfile(id);
  res.json(result);
});

app.post('/api/devices/:id/cloner/clone', async (req, res) => {
  const { id } = req.params;
  const { packageName, userId } = req.body;
  const result = await clonerManager.cloneAppToProfile(id, { packageName, userId });
  res.json(result);
});

// -------------------------------------------------------------
// 22. Phone-to-Phone Migration APIs
// -------------------------------------------------------------
app.post('/api/devices/migration/start', async (req, res) => {
  const { sourceSerial, targetSerial, options } = req.body;
  const result = await migrationManager.migrateData({ sourceSerial, targetSerial, options });
  res.json(result);
});

// -------------------------------------------------------------
// 23. Screen OCR & Text Extraction APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/ocr/extract', async (req, res) => {
  const { id } = req.params;
  const { mode = 'hybrid' } = req.query;
  const result = await ocrManager.extractScreenText(id, mode);
  res.json(result);
});

// -------------------------------------------------------------
// 24. Audio FX & Volume Hack & Phone-to-PC Audio Relay APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/audio/volumes', async (req, res) => {
  const { id } = req.params;
  const result = await audioFxManager.getVolumes(id);
  res.json(result);
});

app.post('/api/devices/:id/audio/volume', async (req, res) => {
  const { id } = req.params;
  const { stream = 3, level = 15 } = req.body;
  const result = await audioFxManager.setVolume(id, { stream, level });
  res.json(result);
});

app.post('/api/devices/:id/audio/boost', async (req, res) => {
  const { id } = req.params;
  const { enable } = req.body;
  const result = await audioFxManager.boostGain(id, { enable });
  res.json(result);
});

app.post('/api/devices/:id/audio/relay/start', async (req, res) => {
  const { id } = req.params;
  const { mode, codec, buffer } = req.body || {};
  const result = await audioFxManager.startAudioRelay(id, { mode, codec, buffer });
  res.json(result);
});

app.post('/api/devices/:id/audio/relay/stop', (req, res) => {
  const { id } = req.params;
  const result = audioFxManager.stopAudioRelay(id);
  res.json(result);
});

app.get('/api/devices/:id/audio/relay/status', (req, res) => {
  const { id } = req.params;
  const result = audioFxManager.getAudioRelayStatus(id);
  res.json(result);
});

// -------------------------------------------------------------
// 25. Lockscreen & Forensic Rescue APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/rescue/dismiss-lock', async (req, res) => {
  const { id } = req.params;
  const result = await rescueManager.dismissKeyguard(id);
  res.json(result);
});

app.post('/api/devices/:id/rescue/safemode', async (req, res) => {
  const { id } = req.params;
  const result = await rescueManager.rebootSafeMode(id);
  res.json(result);
});

app.post('/api/devices/:id/rescue/emergency-dialer', async (req, res) => {
  const { id } = req.params;
  const result = await rescueManager.openEmergencyDialer(id);
  res.json(result);
});

app.post('/api/devices/:id/rescue/wipe-recovery', async (req, res) => {
  const { id } = req.params;
  const result = await rescueManager.wipeDataRecovery(id);
  res.json(result);
});

app.post('/api/devices/:id/rescue/remove-root-keys', async (req, res) => {
  const { id } = req.params;
  const result = await rescueManager.removeRootLockKeys(id);
  res.json(result);
});

// -------------------------------------------------------------
// 27. Official & Custom ROM Update / Flasher Studio APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/rom/info', async (req, res) => {
  const { id } = req.params;
  const result = await romManager.getDeviceRomInfo(id);
  res.json(result);
});

app.post('/api/devices/:id/rom/sideload', async (req, res) => {
  const { id } = req.params;
  const { zipFilePath } = req.body;
  const result = await romManager.sideloadPackage(id, zipFilePath);
  res.json(result);
});

app.post('/api/devices/:id/rom/flash-partition', async (req, res) => {
  const { partition, imagePath, disableVerity } = req.body;
  const result = await romManager.flashPartition(partition, imagePath, disableVerity);
  res.json(result);
});

app.post('/api/devices/:id/rom/fastboot-wipe', async (req, res) => {
  const result = await romManager.fastbootWipeData();
  res.json(result);
});

app.post('/api/devices/:id/rom/reboot-mode', async (req, res) => {
  const { id } = req.params;
  const { targetMode } = req.body;
  const result = await romManager.rebootMode(id, targetMode);
  res.json(result);
});

// -------------------------------------------------------------
// 26. Rooting, Magisk, KernelSU & Unroot Toolkit APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/root/status', async (req, res) => {
  const { id } = req.params;
  const result = await rootManager.checkRootStatus(id);
  res.json(result);
});

app.post('/api/devices/:id/root/magisk/install', async (req, res) => {
  const { id } = req.params;
  const result = await rootManager.installMagiskApp(id);
  res.json(result);
});

app.post('/api/devices/:id/root/unroot', async (req, res) => {
  const { id } = req.params;
  const { stockBootPath } = req.body;
  const result = await rootManager.unrootDevice(id, stockBootPath);
  res.json(result);
});

app.post('/api/devices/:id/root/fastboot/temp-boot', async (req, res) => {
  const { patchedBootPath } = req.body;
  const result = await rootManager.temporaryBoot(patchedBootPath);
  res.json(result);
});

app.post('/api/devices/:id/root/fastboot/flash-boot', async (req, res) => {
  const { patchedBootPath, slot } = req.body;
  const result = await rootManager.flashBoot(patchedBootPath, slot);
  res.json(result);
});

// -------------------------------------------------------------
// 28. Universal Cross-Platform Full & Custom Backup / Restore APIs
// -------------------------------------------------------------
app.get('/api/backups', async (req, res) => {
  const result = await universalBackupManager.listBackups();
  res.json(result);
});

app.post('/api/devices/:id/backup/create', async (req, res) => {
  const { id } = req.params;
  const { type, deviceName, options } = req.body;
  const result = await universalBackupManager.createBackup({
    serial: id,
    type: type || 'android',
    deviceName: deviceName || 'Phone',
    options: options || { contacts: true, sms: true, calls: true, apps: true }
  });
  res.json(result);
});

app.post('/api/backups/:backupId/restore', async (req, res) => {
  const { backupId } = req.params;
  const { targetSerial, targetType, options } = req.body;
  const result = await universalBackupManager.restoreBackup({
    backupId,
    targetSerial,
    targetType: targetType || 'android',
    options: options || { contacts: true, sms: true, calls: true }
  });
  res.json(result);
});

app.delete('/api/backups/:backupId', async (req, res) => {
  const { backupId } = req.params;
  const result = await universalBackupManager.deleteBackup(backupId);
  res.json(result);
});

app.post('/api/backups/open-folder', (req, res) => {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  if (process.platform === 'win32') {
    spawn('explorer.exe', [backupDir], { detached: true });
  }
  res.json({ success: true, message: 'پوشه نسخه‌های پشتیبان در کامپیوتر باز شد' });
});

// -------------------------------------------------------------
// 29. Password Vault, Wi-Fi Keys & Account Manager APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/passwords/wifi', async (req, res) => {
  const { id } = req.params;
  const result = await passwordManager.getWifiPasswords(id);
  res.json(result);
});

app.post('/api/devices/:id/passwords/wifi/connect', async (req, res) => {
  const { id } = req.params;
  const { ssid, password } = req.body;
  const result = await passwordManager.connectToWifi(id, ssid, password);
  res.json(result);
});

app.get('/api/devices/:id/passwords/accounts', async (req, res) => {
  const { id } = req.params;
  const result = await passwordManager.getSystemAccounts(id);
  res.json(result);
});


// -------------------------------------------------------------
// 6. WebSocket for Live Log Streams & Event Broadcasting
// -------------------------------------------------------------
function broadcastWs(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  let logProcess = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'START_LOGCAT') {
        const { deviceId } = data;
        if (logProcess) {
          logProcess.kill();
          logProcess = null;
        }

        if (deviceId && deviceId.startsWith('mock-')) {
          // Stream mock realistic log lines
          const mockInterval = setInterval(() => {
            if (ws.readyState !== 1) {
              clearInterval(mockInterval);
              return;
            }
            const logs = [
              `[DEBUG] ActivityManager: Displayed ${deviceId}/.MainActivity: +124ms`,
              `[INFO] BatteryStatsService: Battery Level Changed: 84% - Health: GOOD`,
              `[VERBOSE] WindowManager: Layout pass completed in 4.2ms (120Hz)`,
              `[INFO] WifiStateMachine: Connected to Wi-Fi SSID 'Home_5G' RSSI: -42dBm`,
              `[WARN] PackageManager: Background app refresh optimized`
            ];
            const randLog = logs[Math.floor(Math.random() * logs.length)];
            ws.send(JSON.stringify({ type: 'LOG_LINE', line: `${new Date().toLocaleTimeString()} ${randLog}` }));
          }, 1500);
          return;
        }

        // Live ADB Logcat
        const adbPath = await toolManager.getAdbPath();
        const args = deviceId ? ['-s', deviceId, 'logcat', '-v', 'time', '*:V'] : ['logcat', '-v', 'time', '*:V'];
        logProcess = spawn(adbPath, args);

        logProcess.stdout.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'LOG_LINE', line: chunk.toString() }));
        });

        logProcess.stderr.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'LOG_LINE', line: `[ERR] ${chunk.toString()}` }));
        });
      }

      if (data.type === 'STOP_LOGCAT') {
        if (logProcess) {
          logProcess.kill();
          logProcess = null;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (logProcess) {
      logProcess.kill();
      logProcess = null;
    }
  });
});

// AI Diagnostic Assistant & Phone Health Analysis (Action-Oriented)
app.post('/api/devices/:id/ai/ask', async (req, res) => {
  const { id } = req.params;
  const { query, deviceDetails } = req.body;

  try {
    const result = await aiManager.askDeviceAssistant({
      serial: id,
      query,
      deviceDetails
    });
    res.json(result);
  } catch (err) {
    console.error(`API /api/devices/${id}/ai/ask error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Universal Backup & Restore API Suite
// -------------------------------------------------------------
app.get('/api/backups', async (req, res) => {
  try {
    const result = await universalBackupManager.listBackups();
    res.json(result);
  } catch (err) {
    console.error('API /api/backups error:', err);
    res.status(500).json({ success: false, error: err.message, backups: [] });
  }
});

app.post('/api/devices/:id/backup/create', async (req, res) => {
  const { id } = req.params;
  const { type = 'android', deviceName = 'Phone', options = {}, destinationTarget = 'pc' } = req.body;
  try {
    const result = await universalBackupManager.createBackup({
      serial: id,
      type,
      deviceName,
      options,
      destinationTarget
    });
    res.json(result);
  } catch (err) {
    console.error(`API /api/devices/${id}/backup/create error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/backups/:backupId/restore', async (req, res) => {
  const { backupId } = req.params;
  const { targetSerial, targetType = 'android', options = {} } = req.body;
  try {
    const result = await universalBackupManager.restoreBackup({
      backupId,
      targetSerial,
      targetType,
      options
    });
    res.json(result);
  } catch (err) {
    console.error(`API /api/backups/${backupId}/restore error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/backups/:backupId', async (req, res) => {
  const { backupId } = req.params;
  try {
    const result = await universalBackupManager.deleteBackup(backupId);
    res.json(result);
  } catch (err) {
    console.error(`API /api/backups/${backupId} delete error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/backups/open-folder', async (req, res) => {
  try {
    const result = await universalBackupManager.openBackupFolder();
    res.json(result);
  } catch (err) {
    console.error('API /api/backups/open-folder error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Screen Recorder & Video Streaming API Suite
// -------------------------------------------------------------
app.get('/api/recordings', (req, res) => {
  try {
    const list = recorderManager.listRecordings();
    const directory = recorderManager.getRecordingsDir();
    res.json({ success: true, recordings: list, directory });
  } catch (err) {
    console.error('API /api/recordings error:', err);
    res.status(500).json({ success: false, error: err.message, recordings: [] });
  }
});

app.post('/api/recordings/directory', (req, res) => {
  const { directory } = req.body;
  const result = recorderManager.setRecordingsDir(directory);
  res.json(result);
});

app.post('/api/recordings/open-folder', (req, res) => {
  const { path: customPath } = req.body;
  const result = recorderManager.openDirectoryInExplorer(customPath);
  res.json(result);
});

app.post('/api/recordings/open-file', (req, res) => {
  const { fileName } = req.body;
  const result = recorderManager.openFileInExplorer(fileName);
  res.json(result);
});

app.delete('/api/recordings/:fileName', (req, res) => {
  const { fileName } = req.params;
  const result = recorderManager.deleteRecording(fileName);
  res.json(result);
});

app.post('/api/devices/:id/recorder/start', async (req, res) => {
  const { id } = req.params;
  const { resolution = '1080', bitrate = 16, captureAudio = true } = req.body;
  try {
    const result = await recorderManager.startScreenRecording(id, { resolution, bitrate, captureAudio });
    res.json(result);
  } catch (err) {
    console.error(`API /api/devices/${id}/recorder/start error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/devices/:id/recorder/stop', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await recorderManager.stopScreenRecording(id);
    res.json(result);
  } catch (err) {
    console.error(`API /api/devices/${id}/recorder/stop error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/devices/:id/recorder/status', (req, res) => {
  const { id } = req.params;
  const status = recorderManager.getRecordingStatus(id);
  res.json({ success: true, ...status });
});

// Video Stream endpoint with HTTP 206 partial range streaming
app.get('/api/recordings/stream/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(recorderManager.getRecordingsDir(), safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'فایل ویدیو یافت نشد' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'video/mp4';
  if (safeFilename.endsWith('.mkv')) contentType = 'video/x-matroska';
  else if (safeFilename.endsWith('.webm')) contentType = 'video/webm';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/api/recordings/download/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(recorderManager.getRecordingsDir(), safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'فایل ویدیو یافت نشد' });
  }
  res.download(filePath, safeFilename);
});

// API 404 Handler - Never return HTML for /api/* requests
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `آدرس وب‌سرویس یافت نشد: ${req.method} ${req.originalUrl}` });
});

// Global JSON Error Handler
app.use((err, req, res, next) => {
  console.error('Express Server Error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'خطای داخلی سرور' });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.send('CellPhoneManager Backend Server is Running on port ' + PORT);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CellPhoneManager backend bridge running at http://localhost:${PORT}`);
});
