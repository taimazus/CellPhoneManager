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
import { appIconManager } from './appIconManager.js';
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
import { pcSpeakerManager } from './pcSpeakerManager.js';
import { pcGamepadManager } from './pcGamepadManager.js';
import { securityManager } from './securityManager.js';
import { taskQueueManager } from './taskQueueManager.js';
import { telemetryManager } from './telemetryManager.js';
import { profileManager } from './profileManager.js';
import { firmwareGuardManager } from './firmwareGuardManager.js';
import { capabilityManager } from './capabilityManager.js';
import bluetoothCallManager from './bluetoothCallManager.js';
import { taskProcessManager } from './taskProcessManager.js';
import { repairWorkbenchManager } from './repairWorkbenchManager.js';
import { iosToolkitManager } from './iosToolkitManager.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket Live Input and Stream Hub
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'GAMEPAD_INPUT') {
        pcGamepadManager.processGamepadEvent(data);
      } else if (data.type === 'MOUSE_INPUT') {
        pcGamepadManager.processMouseMove(data);
      } else if (data.type === 'CHANGE_PROFILE' && data.profile) {
        pcGamepadManager.setProfile(data.profile);
      }
    } catch {
      // ignore non-json
    }
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Restrict CORS to localhost, 127.0.0.1, and local private subnets (LAN)
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(regex => regex.test(origin));
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('CORS access denied for this origin.'));
  },
  credentials: true
}));

app.use(express.json());

// Global Security & Authentication Gate
app.use(securityManager.getAuthMiddleware());

// Serve public directory (gamepad.html, screen-test.html, icons, etc.)
const publicPath = path.join(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Explicit Gamepad route
app.get('/gamepad', (req, res) => {
  const gamepadFile = path.join(publicPath, 'gamepad.html');
  if (fs.existsSync(gamepadFile)) {
    res.sendFile(gamepadFile);
  } else {
    res.status(404).send('Gamepad HTML not found');
  }
});

// Multer upload destination with 500MB limit
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max
  }
});

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

app.get('/api/tools/catalog', (req, res) => {
  res.json({ success: true, catalog: toolManager.getToolCatalog() });
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

app.post('/api/tools/install-local', async (req, res) => {
  const { toolId, localPath } = req.body;
  if (!toolId || !localPath) {
    return res.status(400).json({ error: 'شناسه ابزار و مسیر محلی الزامی است.' });
  }
  try {
    const result = await toolManager.installFromLocalFile(toolId, localPath, (msg) => {
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
app.get('/api/devices/wireless/scan', async (req, res) => {
  try {
    const result = await networkManager.scanLocalSubnetForDevices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, devices: [] });
  }
});

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

app.get('/api/devices/:id/apps/:packageName/icon', async (req, res) => {
  const { id, packageName } = req.params;
  try {
    const iconData = await appIconManager.getAppIcon(id, packageName);
    if (iconData && iconData.buffer) {
      res.set('Content-Type', iconData.mime);
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(iconData.buffer);
    }
    return res.status(404).send('Icon not found');
  } catch (err) {
    return res.status(404).send('Icon not available');
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
app.get('/api/devices/:id/tweaks', async (req, res) => {
  const { id } = req.params;
  try {
    const tweaks = await adbManager.getCurrentTweaks(id);
    res.json({ success: true, tweaks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/tweaks', async (req, res) => {
  const { id } = req.params;
  const { action, value, type } = req.body;
  const devType = type || (id.startsWith('mock-') ? 'mock' : 'android');

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.updateTweak(id, action, value);
      mockDeviceManager.updateSetting(id, action, value);
      return res.json({ success: true, message: 'تنظیمات با موفقیت اعمال گردید' });
    }

    if (devType === 'android' || !devType) {
      if (action === 'density') {
        const result = value === 'reset' ? await adbManager.resetDisplayDensity(id) : await adbManager.setDisplayDensity(id, value);
        return res.json({ success: true, message: value === 'reset' ? 'تراکم صفحه به حالت پیش‌فرض بازگشت' : `تراکم صفحه روی ${value} DPI تنظیم شد`, ...result });
      }
      if (action === 'animation') {
        const result = await adbManager.setAnimationScale(id, value);
        return res.json({ success: true, message: `سرعت انیمیشن رابط کاربری روی ${value}x تنظیم گردید`, ...result });
      }
      if (action === 'demo_mode') {
        const result = await adbManager.setDemoMode(id, value);
        return res.json({ success: true, message: value ? 'حالت دمو استاتوس‌بار فعال شد' : 'حالت دمو غیرفعال شد', ...result });
      }
      if (action === 'simulate_location') {
        const result = value ? await adbManager.setSimulatedLocation(id, value.lat, value.lng) : await adbManager.clearSimulatedLocation(id);
        return res.json({ success: true, message: 'موقعیت مکانی شبیه‌سازی شد', ...result });
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
    } else if (devType === 'ios') {
      if (action === 'simulate_location') {
        const result = value ? await iosManager.setSimulatedLocation(id, value.lat, value.lng) : await iosManager.clearSimulatedLocation(id);
        return res.json(result);
      }
    }

    res.status(400).json({ error: `اقدام '${action}' برای این نوع دستگاه (${devType}) پشتیبانی نمی‌شود` });

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

// -------------------------------------------------------------
// PC-to-Phone Speaker (Reverse Audio Streaming) APIs
// -------------------------------------------------------------
app.get('/api/pc-speaker/stream.mp3', (req, res) => {
  pcSpeakerManager.registerClient(res);
});

app.get('/api/pc-speaker/status', (req, res) => {
  res.json(pcSpeakerManager.getStatus());
});

app.get('/api/pc-speaker/devices', async (req, res) => {
  try {
    const devices = await pcSpeakerManager.listAudioDevices();
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/pc-speaker/start', async (req, res) => {
  const { id } = req.params;
  const options = req.body || {};
  try {
    const result = await pcSpeakerManager.startStream({ ...options, serial: id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/pc-speaker/stop', (req, res) => {
  const { id } = req.params;
  const result = pcSpeakerManager.stopStream(id);
  res.json(result);
});

app.post('/api/devices/:id/pc-speaker/open-receiver', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pcSpeakerManager.launchMobileReceiver(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

app.post('/api/devices/:id/files/upload', upload.any(), async (req, res) => {
  const { id } = req.params;
  const targetDir = req.body.targetDir || '/sdcard/Download/';
  const files = req.files || (req.file ? [req.file] : []);
  let relativePaths = [];
  try {
    if (req.body.relativePaths) {
      relativePaths = JSON.parse(req.body.relativePaths);
    }
  } catch (_) {}

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'هیچ فایلی برای ارسال انتخاب نشده است' });
  }

  try {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let destDir = targetDir;
      if (relativePaths[i]) {
        const relDir = path.dirname(relativePaths[i]).replace(/\\/g, '/');
        if (relDir && relDir !== '.') {
          destDir = targetDir.endsWith('/') ? `${targetDir}${relDir}/` : `${targetDir}/${relDir}/`;
          await fileManager.createDirectory(id, destDir);
        }
      }
      const resPush = await fileManager.pushFile(id, file.path, destDir);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      results.push(resPush);
    }
    res.json({ success: true, count: files.length, results });
  } catch (err) {
    if (files) {
      files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/files/batch-download', async (req, res) => {
  const { id } = req.params;
  const { paths } = req.body;
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'حداقل یک فایل برای دانلود الزامی است' });
  }

  const batchFolder = path.join(uploadsDir, `batch_${Date.now()}`);
  const zipPath = path.join(uploadsDir, `bundle_${Date.now()}.zip`);
  fs.mkdirSync(batchFolder, { recursive: true });

  try {
    for (const remotePath of paths) {
      const safeName = path.basename(remotePath).replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
      const localFile = path.join(batchFolder, safeName);
      await fileManager.pullFile(id, remotePath, localFile);
    }

    // Zip with powershell Compress-Archive on Windows
    await execAsync(`powershell -Command "Compress-Archive -Path '${batchFolder}\\*' -DestinationPath '${zipPath}' -Force"`);

    if (fs.existsSync(zipPath)) {
      res.download(zipPath, `Selected_Files_${Date.now()}.zip`, () => {
        try {
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          if (fs.existsSync(batchFolder)) fs.rmSync(batchFolder, { recursive: true, force: true });
        } catch (_) {}
      });
    } else {
      res.status(500).json({ error: 'خطا در ایجاد فایل فشرده' });
    }
  } catch (err) {
    try {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      if (fs.existsSync(batchFolder)) fs.rmSync(batchFolder, { recursive: true, force: true });
    } catch (_) {}
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
      const stat = fs.statSync(localDest);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(localDest, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        };
        res.writeHead(206, head);
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600'
        });
        fs.createReadStream(localDest).pipe(res);
      }

      // Schedule cleanup
      setTimeout(() => {
        if (fs.existsSync(localDest)) {
          try { fs.unlinkSync(localDest); } catch (_) {}
        }
      }, 120000); // 2 minutes retention
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

app.post('/api/devices/:id/files/rename', async (req, res) => {
  const { id } = req.params;
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'مسیر قبلی و نام جدید الزامی است.' });
  }
  try {
    const result = await fileManager.renameFile(id, oldPath, newPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/files/move', async (req, res) => {
  const { id } = req.params;
  const { srcPath, destDirPath } = req.body;
  if (!srcPath || !destDirPath) {
    return res.status(400).json({ error: 'مسیر مبدا و پوشه مقصد الزامی است.' });
  }
  try {
    const result = await fileManager.moveFile(id, srcPath, destDirPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/files/copy', async (req, res) => {
  const { id } = req.params;
  const { srcPath, destDirPath } = req.body;
  if (!srcPath || !destDirPath) {
    return res.status(400).json({ error: 'مسیر مبدا و پوشه مقصد الزامی است.' });
  }
  try {
    const result = await fileManager.copyFile(id, srcPath, destDirPath);
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
  const { number, name = 'تماس جدید', simSlot, mode = 'default', speakerphone } = req.body;
  if (!number) return res.status(400).json({ error: 'شماره تماس الزامی است' });

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.addCallLog(id, { name, number, type: 'outgoing', duration: '1m 05s' });
      return res.json({
        success: true,
        mode: mode || (speakerphone ? 'speaker' : 'default'),
        message: mode === 'speaker' || speakerphone
          ? `تماس با شماره ${number} با بلندگوی خودکار (اسپیکرفون) برقرار شد (شبیه‌ساز)`
          : (mode === 'bluetooth'
             ? `تماس با شماره ${number} و هدایت صدا به هندزفری بلوتوث کامپیوتر برقرار شد (شبیه‌ساز)`
             : `تماس با شماره ${number} برقرار شد`)
      });
    }
    const result = await bluetoothCallManager.makeCallWithRouting(id, number, {
      simSlot,
      mode: mode || (speakerphone ? 'speaker' : 'default')
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bluetooth Hands-Free & Pairing Endpoints
app.get('/api/bluetooth/status', async (req, res) => {
  const { deviceId } = req.query;
  try {
    const pcStatus = await bluetoothCallManager.getPcBluetoothStatus();
    let deviceStatus = null;
    if (deviceId) {
      deviceStatus = await bluetoothCallManager.getDeviceBluetoothStatus(deviceId);
    }
    res.json({
      success: true,
      pc: pcStatus,
      device: deviceStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bluetooth/auto-pair', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'شناسه دستگاه الزامی است' });
  try {
    const result = await bluetoothCallManager.prepareAutoPair(deviceId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bluetooth/enable-device', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'شناسه دستگاه الزامی است' });
  try {
    const result = await bluetoothCallManager.enableDeviceBluetooth(deviceId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bluetooth/open-pc-settings', async (req, res) => {
  try {
    const result = await bluetoothCallManager.openPcBluetoothSettings();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bluetooth/open-pc-sound', async (req, res) => {
  try {
    const result = await bluetoothCallManager.openPcSoundSettings();
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

app.post('/api/devices/:id/contacts/edit', async (req, res) => {
  const { id } = req.params;
  const { contactId, rawContactId, name, phone, email, notes } = req.body;
  try {
    if (id.startsWith('mock-')) {
      const updated = mockDeviceManager.updateContact(id, contactId, { name, phone, email, notes });
      return res.json({ success: true, contact: updated, message: 'مخاطب با موفقیت ویرایش شد' });
    }
    const result = await adbManager.updateContact(id, { id: contactId, rawContactId, name, phone, email, notes });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/contacts/delete', async (req, res) => {
  const { id } = req.params;
  const { contactId, rawContactId } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteContact(id, contactId);
      return res.json({ success: true, message: 'مخاطب با موفقیت حذف شد' });
    }
    const result = await adbManager.deleteContact(id, contactId, rawContactId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/contacts/delete-batch', async (req, res) => {
  const { id } = req.params;
  const { contactIds = [], rawContactIds = [] } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteContactsBatch(id, { contactIds, rawContactIds });
      return res.json({ success: true, message: 'مخاطبین انتخابی با موفقیت حذف شدند' });
    }
    const result = await adbManager.deleteContactsBatch(id, { contactIds, rawContactIds });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/contacts/clear', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.clearContacts(id);
      return res.json({ success: true, message: 'تمامی مخاطبین با موفقیت پاکسازی شدند' });
    }
    const result = await adbManager.clearAllContacts(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/contacts/merge', async (req, res) => {
  const { id } = req.params;
  const { targetContact, duplicateIds = [] } = req.body;
  if (!targetContact) return res.status(400).json({ error: 'اطلاعات مخاطب هدف برای ادغام الزامی است' });

  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.mergeContacts(id, { targetContact, duplicateIds });
      return res.json({ success: true, message: 'مخاطبین با موفقیت ادغام شدند' });
    }
    const result = await adbManager.mergeContacts(id, { targetContact, duplicateIds });
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
  const { messageId, messageIds } = req.body;
  const targetId = messageIds || messageId;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteSms(id, targetId);
      return res.json({ success: true, message: 'پیامک با موفقیت حذف گردید' });
    }
    const result = await adbManager.deleteSms(id, targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/sms/delete-thread', async (req, res) => {
  const { id } = req.params;
  const { threadKey, number } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteSmsThread(id, threadKey, number);
      return res.json({ success: true, message: 'گفتگوی انتخابی با موفقیت حذف شد' });
    }
    const result = await adbManager.deleteSmsThread(id, threadKey, number);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/sms/delete-batch', async (req, res) => {
  const { id } = req.params;
  const { messageIds = [], threadKeys = [], numbers = [] } = req.body;
  try {
    if (id.startsWith('mock-')) {
      mockDeviceManager.deleteSmsBatch(id, { messageIds, threadKeys, numbers });
      return res.json({ success: true, message: 'پیام‌ها و گفتگوهای انتخابی با موفقیت حذف شدند' });
    }
    const result = await adbManager.deleteSmsBatch(id, { messageIds, threadKeys, numbers });
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

app.post('/api/devices/:id/sms/open-app', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('mock-')) {
      return res.json({ success: true, message: 'برنامه پیام‌رسان در شبیه‌ساز باز شد' });
    }
    const result = await adbManager.openSmsApp(id);
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

app.post('/api/devices/:id/hardware/audio-tone', async (req, res) => {
  const { id } = req.params;
  const { freq = 440, duration = 2 } = req.body;
  try {
    const result = await hardwareLabManager.playAudioTone(id, freq, duration);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Interactive Standalone HTML pages for phone testing (Dead Pixel & Web Audio Tone)
app.get('/screen-test.html', (req, res) => {
  const color = req.query.color || 'rgb';
  const initialBg = color === 'red' ? '#FF0000' :
                    color === 'green' ? '#00FF00' :
                    color === 'blue' ? '#0000FF' :
                    color === 'white' ? '#FFFFFF' :
                    color === 'black' ? '#000000' :
                    color === 'yellow' ? '#FFFF00' : '#FF0000';

  res.send(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>تست صفحه نمایش و پیکسل سوخته | CellPhoneManager</title>
<style>
  * { margin:0; padding:0; box-sizing: border-box; }
  html, body { width: 100vw; height: 100vh; background: ${initialBg}; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between; font-family: system-ui, sans-serif; user-select: none; }
  #info { margin-top: 20px; background: rgba(0,0,0,0.75); color: #fff; padding: 8px 18px; border-radius: 24px; font-size: 13px; font-weight: bold; pointer-events: none; backdrop-filter: blur(8px); }
  #controls { margin-bottom: 24px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; z-index: 10; max-width: 95%; background: rgba(0,0,0,0.6); padding: 8px; border-radius: 18px; backdrop-filter: blur(8px); }
  button { padding: 8px 14px; border: none; border-radius: 12px; font-weight: bold; font-size: 12px; cursor: pointer; color: #111; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
</style>
</head>
<body id="b">
  <div id="info">لمس صفحه برای تغییر رنگ و بررسی پیکسل‌های سوخته</div>
  <div id="controls">
    <button style="background:#FF0000;color:#fff" onclick="setCol('#FF0000')">قرمز</button>
    <button style="background:#00FF00;color:#000" onclick="setCol('#00FF00')">سبز</button>
    <button style="background:#0000FF;color:#fff" onclick="setCol('#0000FF')">آبی</button>
    <button style="background:#FFFFFF;color:#000" onclick="setCol('#FFFFFF')">سفید</button>
    <button style="background:#000000;color:#fff;border:1px solid #555" onclick="setCol('#000000')">مشکی</button>
    <button style="background:#FFFF00;color:#000" onclick="setCol('#FFFF00')">زرد</button>
  </div>
<script>
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#FFFF00'];
  let idx = colors.indexOf('${initialBg}');
  if (idx < 0) idx = 0;
  function setCol(c) { document.getElementById('b').style.background = c; }
  document.body.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      idx = (idx + 1) % colors.length;
      setCol(colors[idx]);
    }
  });
</script>
</body>
</html>`);
});

app.get('/audio-tone.html', (req, res) => {
  const freq = parseFloat(req.query.freq) || 440;
  const duration = parseFloat(req.query.duration) || 2;
  const isSweep = freq === 9999;

  res.send(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تست فرکانس صوتی بلندگو | CellPhoneManager</title>
<style>
  body { background: #050813; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
  .box { background: #0b1328; border: 1px solid #06b6d4; padding: 24px; border-radius: 24px; box-shadow: 0 10px 30px rgba(6,182,212,0.2); max-width: 90%; }
  h2 { margin: 0 0 8px 0; color: #38bdf8; }
  p { font-size: 13px; color: #94a3b8; }
  button { margin-top: 16px; background: #06b6d4; color: #000; border: none; padding: 12px 24px; border-radius: 14px; font-weight: bold; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
  <div class="box">
    <h2>🔊 تست سلامت بلندگوی گوشی</h2>
    <p>${isSweep ? 'سوییپ فرکانسی کامل (100Hz تا 8000Hz)' : `فرکانس سینوسی خالص ${freq} هرتز`}</p>
    <button id="btn" onclick="startTone()">▶️ پخش مجدد صدا</button>
  </div>
<script>
  function startTone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (${isSweep}) {
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + ${duration});
      } else {
        osc.frequency.setValueAtTime(${freq}, ctx.currentTime);
      }
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ${duration});
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ${duration});
    } catch (e) {
      console.error(e);
    }
  }
  window.addEventListener('DOMContentLoaded', () => {
    startTone();
  });
  window.addEventListener('click', () => {
    startTone();
  }, { once: true });
</script>
</body>
</html>`);
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

// Real-time AI Logcat Error Analyzer & 1-Click Repair
app.post('/api/devices/:id/diagnostics/analyze-errors', async (req, res) => {
  const { id } = req.params;
  const { logs = [] } = req.body;
  try {
    const result = await systemDoctorManager.analyzeLogcatErrors(id, logs);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/:id/diagnostics/fix-error', async (req, res) => {
  const { id } = req.params;
  const { action, targetPackage } = req.body;
  try {
    const result = await systemDoctorManager.fixDiagnosticError(id, action, targetPackage);
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

app.post('/api/backups/directory', (req, res) => {
  const { directory } = req.body;
  try {
    const result = universalBackupManager.setBackupDir(directory);
    res.json(result);
  } catch (err) {
    console.error('API /api/backups/directory error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/backups/open-folder', async (req, res) => {
  const { customPath } = req.body || {};
  try {
    const result = await universalBackupManager.openBackupFolder(customPath);
    res.json(result);
  } catch (err) {
    console.error('API /api/backups/open-folder error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/backups/:backupId/open-folder', async (req, res) => {
  const { backupId } = req.params;
  try {
    const result = await universalBackupManager.openBackupItemFolder(backupId);
    res.json(result);
  } catch (err) {
    console.error(`API /api/backups/${backupId}/open-folder error:`, err);
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

// -------------------------------------------------------------
// 30. Security Center & Audit Logging APIs
// -------------------------------------------------------------
app.get('/api/security/config', (req, res) => {
  res.json({ success: true, config: securityManager.getAuthConfig() });
});

app.post('/api/security/config', (req, res) => {
  const result = securityManager.setAuthConfig(req.body);
  res.json(result);
});

app.get('/api/security/audit', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  res.json({ success: true, logs: securityManager.getAuditLogs(limit) });
});

app.post('/api/security/audit/clear', (req, res) => {
  res.json(securityManager.clearAuditLogs());
});

// -------------------------------------------------------------
// 31. Multi-Device Task Queue Manager APIs
// -------------------------------------------------------------
app.get('/api/queue/status', (req, res) => {
  res.json({ success: true, ...taskQueueManager.getStatus() });
});

app.post('/api/queue/enqueue', (req, res) => {
  const result = taskQueueManager.enqueue(req.body);
  res.json(result);
});

app.post('/api/queue/cancel', (req, res) => {
  const { jobId } = req.body;
  res.json(taskQueueManager.cancelJob(jobId));
});

app.post('/api/queue/pause', (req, res) => {
  res.json(taskQueueManager.pause());
});

app.post('/api/queue/resume', (req, res) => {
  res.json(taskQueueManager.resume());
});

// -------------------------------------------------------------
// 32. Device Health & Telemetry History APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/telemetry', (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(telemetryManager.getHistory(id, limit));
});

app.post('/api/devices/:id/telemetry/record', (req, res) => {
  const { id } = req.params;
  res.json(telemetryManager.recordSnapshot(id, req.body));
});

// -------------------------------------------------------------
// 33. Configuration Profiles, Diff & Snapshot Rollback APIs
// -------------------------------------------------------------
app.get('/api/profiles', (req, res) => {
  res.json(profileManager.listProfiles());
});

app.post('/api/profiles', (req, res) => {
  res.json(profileManager.saveProfile(req.body));
});

app.delete('/api/profiles/:id', (req, res) => {
  res.json(profileManager.deleteProfile(req.params.id));
});

app.post('/api/devices/:id/profiles/diff', async (req, res) => {
  const { id } = req.params;
  const { targetSettings } = req.body;
  try {
    const currentTweaks = await adbManager.getCurrentTweaks(id);
    const diff = profileManager.calculateDiff(currentTweaks, targetSettings || {});
    res.json({ success: true, diff, current: currentTweaks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/devices/:id/profiles/snapshot', async (req, res) => {
  const { id } = req.params;
  try {
    const current = await adbManager.getCurrentTweaks(id);
    const snapshot = profileManager.createSnapshot(id, current);
    res.json({ success: true, snapshot, message: 'اسنپ‌شات وضعیت فعلی گوشی با موفقیت ثبت شد.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/devices/:id/profiles/snapshots', (req, res) => {
  res.json(profileManager.listSnapshots(req.params.id));
});

// -------------------------------------------------------------
// 34. Safe Firmware & ROM Flashing Guard APIs
// -------------------------------------------------------------
app.post('/api/firmware/inspect', async (req, res) => {
  const { filePath, targetDevice } = req.body;
  res.json(await firmwareGuardManager.inspectFirmware(filePath, targetDevice));
});

app.post('/api/firmware/checksum', async (req, res) => {
  const { filePath, algorithm = 'sha256' } = req.body;
  try {
    const hash = await firmwareGuardManager.computeChecksum(filePath, algorithm);
    res.json({ success: true, algorithm, hash });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 35. Advanced Backup Inspection & AES Encryption APIs
// -------------------------------------------------------------
app.get('/api/backups/:backupId/inspect', async (req, res) => {
  res.json(await universalBackupManager.inspectBackupContent(req.params.backupId));
});

app.post('/api/backups/:backupId/encrypt', async (req, res) => {
  const { password } = req.body;
  res.json(await universalBackupManager.encryptBackup(req.params.backupId, password));
});

app.post('/api/backups/:backupId/decrypt', async (req, res) => {
  const { password } = req.body;
  res.json(await universalBackupManager.decryptBackup(req.params.backupId, password));
});

// -------------------------------------------------------------
// 36. iOS Capability Transparency & Crash Logs APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/ios/capabilities', async (req, res) => {
  res.json(await iosManager.getCapabilities(req.params.id));
});

app.get('/api/devices/:id/ios/crash-logs', async (req, res) => {
  res.json(await iosManager.getCrashLogs(req.params.id));
});

// -------------------------------------------------------------
// 37. Smart Scheduled Automations APIs
// -------------------------------------------------------------
app.get('/api/automation/rules', (req, res) => {
  res.json(automationManager.listRules());
});

app.post('/api/automation/rules', (req, res) => {
  res.json(automationManager.saveRule(req.body));
});

app.delete('/api/automation/rules/:id', (req, res) => {
  res.json(automationManager.deleteRule(req.params.id));
});

app.get('/api/automation/history', (req, res) => {
  res.json({ success: true, history: automationManager.getHistory() });
});

app.post('/api/devices/:id/automation/trigger', async (req, res) => {
  const { triggerType = 'DEVICE_CONNECT' } = req.body;
  res.json(await automationManager.triggerAutomations(triggerType, { id: req.params.id }));
});

// -------------------------------------------------------------
// 38. Device Capability Detection & Policy Enforcement APIs
// -------------------------------------------------------------
app.get('/api/capabilities/definitions', (req, res) => {
  res.json({ success: true, definitions: capabilityManager.getCapabilityDefinitions() });
});

app.get('/api/devices/:id/capabilities', async (req, res) => {
  const { id } = req.params;
  const cached = capabilityManager.getCached(id);
  if (cached) {
    return res.json(cached);
  }
  // If not cached, evaluate on the fly
  const result = await capabilityManager.evaluateDevice({ id, serial: id });
  res.json(result);
});

app.post('/api/devices/:id/capabilities/evaluate', async (req, res) => {
  const { id } = req.params;
  const device = req.body || { id, serial: id };
  const result = await capabilityManager.evaluateDevice({ ...device, id, serial: id });
  res.json(result);
});

// -------------------------------------------------------------
// 39. Virtual PC Gamepad & Trackpad APIs
// -------------------------------------------------------------
app.get('/api/gamepad/status', (req, res) => {
  res.json({
    success: true,
    activeProfile: pcGamepadManager.activeProfile,
    profiles: pcGamepadManager.getProfiles(),
    latestInputs: pcGamepadManager.latestInputs,
    localIps: pcGamepadManager.getLocalIps()
  });
});

app.post('/api/gamepad/profile', (req, res) => {
  const { profileId } = req.body;
  res.json(pcGamepadManager.setProfile(profileId));
});

app.post('/api/devices/:id/gamepad/launch', async (req, res) => {
  const result = await pcGamepadManager.launchOnPhone(req.params.id);
  res.json(result);
});

app.post('/api/devices/:id/gamepad/reverse', async (req, res) => {
  const result = await pcGamepadManager.setupAdbReverse(req.params.id);
  res.json(result);
});

// -------------------------------------------------------------
// 39. AI Device Assistant & Operational Executor APIs
// -------------------------------------------------------------
app.post('/api/devices/:id/ai/ask', async (req, res) => {
  const { id } = req.params;
  const { query, deviceDetails } = req.body;
  try {
    const result = await aiManager.askDeviceAssistant({
      serial: id,
      query,
      deviceDetails: deviceDetails || { id, serial: id }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 39. Security, Authentication & Audit Trail APIs
// -------------------------------------------------------------
app.get('/api/security/auth/status', (req, res) => {
  const config = securityManager.getAuthConfig();
  res.json({
    success: true,
    authEnabled: config.authEnabled,
    createdAt: config.createdAt
  });
});

app.post('/api/security/auth/config', (req, res) => {
  const { authEnabled, apiKey } = req.body;
  res.json(securityManager.setAuthConfig({ authEnabled, apiKey }));
});

app.post('/api/security/auth/login', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'ارائه کلید API الزامی است' });
  }
  const result = securityManager.authenticate(apiKey);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.get('/api/security/audit/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({
    success: true,
    logs: securityManager.getAuditLogs(limit)
  });
});

// -------------------------------------------------------------
// 38. Task & Startup Process Manager APIs
// -------------------------------------------------------------
app.get('/api/devices/:id/tasks/running', async (req, res) => {
  const { id } = req.params;
  const result = await taskProcessManager.getRunningTasks(id);
  res.json(result);
});

app.get('/api/devices/:id/tasks/startup', async (req, res) => {
  const { id } = req.params;
  const result = await taskProcessManager.getStartupApps(id);
  res.json(result);
});

app.get('/api/devices/:id/tasks/background', async (req, res) => {
  const { id } = req.params;
  const result = await taskProcessManager.getBackgroundServices(id);
  res.json(result);
});

app.post('/api/devices/:id/tasks/kill', async (req, res) => {
  const { id } = req.params;
  const { pid, packageName } = req.body;
  const result = await taskProcessManager.killProcess(id, { pid, packageName });
  res.json(result);
});

app.post('/api/devices/:id/tasks/kill-all', async (req, res) => {
  const { id } = req.params;
  const result = await taskProcessManager.killAllBackground(id);
  res.json(result);
});

app.post('/api/devices/:id/tasks/startup/toggle', async (req, res) => {
  const { id } = req.params;
  const { packageName, receiver, enabled } = req.body;
  const result = await taskProcessManager.setStartupState(id, { packageName, receiver, enabled });
  res.json(result);
});

app.post('/api/devices/:id/tasks/background/limit', async (req, res) => {
  const { id } = req.params;
  const { packageName, allowBackground } = req.body;
  const result = await taskProcessManager.setBackgroundLimit(id, { packageName, allowBackground });
  res.json(result);
});

// -------------------------------------------------------------
// 39. Mobile Repair & Technician Workbench APIs
// -------------------------------------------------------------
// 1. Job Sheets & Intake Receipts
app.get('/api/repair/jobsheets', (req, res) => {
  res.json({ success: true, jobSheets: repairWorkbenchManager.getJobSheets() });
});

app.post('/api/repair/jobsheets', (req, res) => {
  res.json(repairWorkbenchManager.createJobSheet(req.body));
});

app.patch('/api/repair/jobsheets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  res.json(repairWorkbenchManager.updateJobSheetStatus(id, status));
});

app.delete('/api/repair/jobsheets/:id', (req, res) => {
  const { id } = req.params;
  res.json(repairWorkbenchManager.deleteJobSheet(id));
});

// 2. FRP & Account Bypass Helpers
app.post('/api/devices/:id/repair/frp/mtp-browser', async (req, res) => {
  const { id } = req.params;
  const { targetUrl } = req.body;
  const result = await repairWorkbenchManager.launchMtpBrowser(id, { targetUrl });
  res.json(result);
});

app.post('/api/devices/:id/repair/frp/samsung-adb', async (req, res) => {
  const { id } = req.params;
  const result = await repairWorkbenchManager.triggerSamsungTestModeAdb(id);
  res.json(result);
});

app.get('/api/devices/:id/repair/frp/xiaomi-status', async (req, res) => {
  const { id } = req.params;
  const result = await repairWorkbenchManager.checkMiAccountAndBootloader(id);
  res.json(result);
});

// 3. Broken Screen / Forensic Data Extraction
app.post('/api/devices/:id/repair/broken-screen/extract', async (req, res) => {
  const { id } = req.params;
  const { targetDir, categories } = req.body;
  const result = await repairWorkbenchManager.extractBrokenScreenData(id, { targetDir, categories });
  res.json(result);
});

app.post('/api/devices/:id/repair/broken-screen/inject-pin', async (req, res) => {
  const { id } = req.params;
  const { pinCode } = req.body;
  const result = await repairWorkbenchManager.injectPinOrPattern(id, pinCode);
  res.json(result);
});

// 4. Secret Codes Hub
app.get('/api/repair/secret-codes', (req, res) => {
  res.json({ success: true, codes: repairWorkbenchManager.getSecretCodesDatabase() });
});

app.post('/api/devices/:id/repair/secret-codes/execute', async (req, res) => {
  const { id } = req.params;
  const { codeItem } = req.body;
  const result = await repairWorkbenchManager.executeSecretCode(id, codeItem);
  res.json(result);
});

// 5. IMEI, Baseband & Radio Network Diagnostics
app.get('/api/devices/:id/repair/diagnostics/imei-baseband', async (req, res) => {
  const { id } = req.params;
  const result = await repairWorkbenchManager.getImeiAndBasebandDiagnostics(id);
  res.json(result);
});

// 6. Charging & Power Telemetry
app.get('/api/devices/:id/repair/diagnostics/charging-power', async (req, res) => {
  const { id } = req.params;
  const result = await repairWorkbenchManager.getChargingPowerTelemetry(id);
  res.json(result);
});

// 7. 1-Click Software Glitch Fixer
app.post('/api/devices/:id/repair/glitch-fix', async (req, res) => {
  const { id } = req.params;
  const { glitchType } = req.body;
  const result = await repairWorkbenchManager.fixGlitch(id, glitchType);
  res.json(result);
});

// ==========================================
// 🍏 iOS Pro Studio Exclusive Endpoints
// ==========================================

// 1. Hardware Authenticity & 3uTools Verification Report
app.get('/api/ios/authenticity/:id', async (req, res) => {
  const { id } = req.params;
  const result = await iosToolkitManager.getHardwareAuthenticityReport(id);
  res.json(result);
});

// 2. Deep Battery Analytics & Factory Cycles
app.get('/api/ios/battery/:id', async (req, res) => {
  const { id } = req.params;
  const result = await iosToolkitManager.getDetailedBatteryAnalytics(id);
  res.json(result);
});

// 3. Panic Log Analyzer (Kernel Crash Hardware Diagnoser)
app.get('/api/ios/panic-logs/:id', async (req, res) => {
  const { id } = req.params;
  const result = await iosToolkitManager.getPanicLogAnalysis(id);
  res.json(result);
});

// 4. Recovery & DFU Mode Manager
app.post('/api/ios/recovery/:id', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const result = await iosToolkitManager.manageRecoveryMode(id, action);
  res.json(result);
});

// 5. iCloud, FMI & Carrier Lock Checker
app.get('/api/ios/icloud-fmi/:id', async (req, res) => {
  const { id } = req.params;
  const result = await iosToolkitManager.checkICloudFmiStatus(id);
  res.json(result);
});

// 6. OTA iOS Update Blocker
app.post('/api/ios/ota-blocker/:id', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const result = await iosToolkitManager.manageOtaBlocker(id, action);
  res.json(result);
});

// 7. System-wide Apple Virtual GPS Location Simulator
app.post('/api/ios/virtual-gps/:id', async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, reset } = req.body;
  const result = await iosToolkitManager.simulateLocation(id, latitude, longitude, reset);
  res.json(result);
});

// 8. Direct IPA Sideloading
app.post('/api/ios/sideload-ipa/:id', async (req, res) => {
  const { id } = req.params;
  const { ipaPath, options } = req.body;
  const result = await iosToolkitManager.sideloadIpa(id, ipaPath, options);
  res.json(result);
});

// API 404 Handler - Never return HTML for /api/* requests
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `آدرس وب‌سرویس یافت نشد: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler (Handles Multer limits, CORS, and generic exceptions)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'حجم فایل ارسالی بیش از حد مجاز (۵۰۰ مگابایت) است.' });
    }
    return res.status(400).json({ success: false, error: `خطای آپلود: ${err.message}` });
  }
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ success: false, error: err.message });
  }
  console.error('Express Server Error:', err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'خطای داخلی سرور' });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.send('CellPhoneManager Backend Server is Running on ' + HOST + ':' + PORT);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 CellPhoneManager backend bridge running at http://${HOST}:${PORT}`);
});
