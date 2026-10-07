import { spawn, exec } from 'child_process';
import os from 'os';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

export class PcSpeakerManager {
  constructor() {
    this.ffmpegProcess = null;
    this.isStreaming = false;
    this.currentDevice = 'CABLE Output (VB-Audio Virtual Cable)';
    this.bitrate = '192k';
    this.clients = new Set();
    this.cachedDevices = [];
    this.startTime = null;
    this.port = 5000;
  }

  async getFfmpegPath() {
    if (toolManager && typeof toolManager.getFfmpegPath === 'function') {
      return await toolManager.getFfmpegPath();
    }
    return 'ffmpeg';
  }

  getLocalIps() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push({ name, ip: iface.address });
        }
      }
    }
    return ips;
  }

  async listAudioDevices() {
    const ffmpegPath = await this.getFfmpegPath();
    return new Promise((resolve) => {
      exec(`"${ffmpegPath}" -list_devices true -f dshow -i dummy`, (error, stdout, stderr) => {
        const output = (stderr || '') + (stdout || '');
        const devices = [];
        const lines = output.split('\n');
        
        let isAudioSection = false;
        for (const line of lines) {
          const match = line.match(/\[dshow[^\]]*\]\s*"([^"]+)"\s*\((audio|video)\)/i) || line.match(/\[in#0[^\]]*\]\s*"([^"]+)"\s*\((audio|video)\)/i);
          if (match) {
            const name = match[1];
            const type = match[2].toLowerCase();
            if (type === 'audio' && !devices.includes(name)) {
              devices.push(name);
            }
          }
        }

        // Fallback default list if parsing was empty
        if (devices.length === 0) {
          devices.push('CABLE Output (VB-Audio Virtual Cable)');
          devices.push('Stereo Mix');
          devices.push('Microphone');
        }

        this.cachedDevices = devices;
        resolve(devices);
      });
    });
  }

  async startStream(options = {}) {
    const { deviceName, bitrate = '192k', serial } = options;
    if (deviceName) this.currentDevice = deviceName;
    if (bitrate) this.bitrate = bitrate;

    if (this.isStreaming && this.ffmpegProcess) {
      return { 
        success: true, 
        message: 'استریم صدای سیستم در حال اجراست',
        isStreaming: true,
        device: this.currentDevice,
        port: this.port,
        localIps: this.getLocalIps()
      };
    }

    const ffmpegPath = await this.getFfmpegPath();
    const targetDevice = this.currentDevice || 'CABLE Output (VB-Audio Virtual Cable)';

    // FFmpeg args for low-latency live MP3 audio stream over pipe
    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', 'dshow',
      '-i', `audio=${targetDevice}`,
      '-acodec', 'libmp3lame',
      '-b:a', this.bitrate,
      '-ac', '2',
      '-ar', '44100',
      '-flush_packets', '1',
      '-f', 'mp3',
      'pipe:1'
    ];

    try {
      this.ffmpegProcess = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      this.isStreaming = true;
      this.startTime = Date.now();

      this.ffmpegProcess.stdout.on('data', (chunk) => {
        for (const res of this.clients) {
          try {
            res.write(chunk);
          } catch {
            this.clients.delete(res);
          }
        }
      });

      this.ffmpegProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('Error') || msg.includes('cannot find')) {
          console.error('[PcSpeakerManager FFmpeg]', msg);
        }
      });

      this.ffmpegProcess.on('close', () => {
        this.isStreaming = false;
        this.ffmpegProcess = null;
        for (const res of this.clients) {
          try {
            res.end();
          } catch {}
        }
        this.clients.clear();
      });

      // Forward ADB port 5000 so the connected phone can access http://127.0.0.1:5000
      if (serial && !serial.startsWith('mock-')) {
        try {
          await adbManager.runAdb(`reverse tcp:5000 tcp:5000`, serial);
        } catch (e) {
          console.error('[PcSpeakerManager] ADB reverse failed:', e.message);
        }
      }

      return {
        success: true,
        message: 'استریم صدای کامپیوتر با موفقیت آغاز شد',
        isStreaming: true,
        device: targetDevice,
        port: this.port,
        localIps: this.getLocalIps()
      };
    } catch (err) {
      this.isStreaming = false;
      this.ffmpegProcess = null;
      return { success: false, error: `خطا در راه‌اندازی استریم صدا: ${err.message}` };
    }
  }

  stopStream(serial) {
    if (this.ffmpegProcess) {
      try {
        this.ffmpegProcess.kill('SIGTERM');
      } catch {}
      this.ffmpegProcess = null;
    }
    this.isStreaming = false;
    this.startTime = null;

    for (const res of this.clients) {
      try {
        res.end();
      } catch {}
    }
    this.clients.clear();

    if (serial && !serial.startsWith('mock-')) {
      try {
        adbManager.runAdb(`reverse --remove tcp:5000`, serial);
      } catch {}
    }

    return { success: true, message: 'استریم صدای کامپیوتر متوقف شد' };
  }

  registerClient(res) {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    this.clients.add(res);

    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  async launchMobileReceiver(serial) {
    if (!serial) return { success: false, error: 'شناسه دستگاه الزامی است' };
    try {
      // Ensure ADB reverse is active
      if (!serial.startsWith('mock-')) {
        await adbManager.runAdb(`reverse tcp:5000 tcp:5000`, serial);
        // Start browser intent on the phone
        const res = await adbManager.runAdb(
          `shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:5000/pc-speaker-player.html"`,
          serial
        );
        return { success: true, message: 'پلیر پخش صدای کامپیوتر روی گوشی باز شد' };
      }
      return { success: true, message: 'پلیر در شبیه‌ساز باز شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getStatus() {
    return {
      isStreaming: this.isStreaming,
      currentDevice: this.currentDevice,
      bitrate: this.bitrate,
      clientCount: this.clients.size,
      uptimeSeconds: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
      port: this.port,
      localIps: this.getLocalIps()
    };
  }
}

export const pcSpeakerManager = new PcSpeakerManager();
export default pcSpeakerManager;
