import fs from 'fs';
import path from 'path';

export class TelemetryManager {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'telemetry');
    this.initDir();
  }

  initDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  getDeviceFilePath(serial) {
    this.initDir();
    const safeSerial = (serial || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.dataDir, `${safeSerial}_history.json`);
  }

  recordSnapshot(serial, { batteryLevel = 85, temperature = 32.5, voltage = 4.1, freeStorageMb = 15420, isCharging = false, cpuUsage = 18 }) {
    try {
      const filePath = this.getDeviceFilePath(serial);
      let history = [];
      if (fs.existsSync(filePath)) {
        try {
          history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
          history = [];
        }
      }

      const snapshot = {
        timestamp: new Date().toISOString(),
        batteryLevel: Number(batteryLevel),
        temperature: Number(temperature),
        voltage: Number(voltage),
        freeStorageMb: Number(freeStorageMb),
        isCharging: Boolean(isCharging),
        cpuUsage: Number(cpuUsage)
      };

      history.push(snapshot);
      // Keep last 300 data points (approx 24-48 hours of intervals)
      if (history.length > 300) {
        history = history.slice(-300);
      }

      fs.writeFileSync(filePath, JSON.stringify(history, null, 2));

      // Check alerts
      const alerts = [];
      if (temperature > 45) {
        alerts.push({ type: 'OVERHEAT', message: `هشدار دمای بالا: باتری به ${temperature}°C رسیده است!` });
      }
      if (freeStorageMb < 2048) {
        alerts.push({ type: 'LOW_STORAGE', message: `هشدار حافظه: فضای خالی گوشی کمتر از ۲ گیگابایت است!` });
      }

      return { success: true, snapshot, alerts };
    } catch (err) {
      console.error('[TelemetryManager] Error recording snapshot:', err);
      return { success: false, error: err.message };
    }
  }

  getHistory(serial, limit = 50) {
    try {
      const filePath = this.getDeviceFilePath(serial);
      if (!fs.existsSync(filePath)) {
        // Generate initial mock baseline if empty for immediate visualization
        const now = Date.now();
        const initialPoints = Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(now - (11 - i) * 3600000).toISOString(),
          batteryLevel: Math.max(20, Math.min(100, Math.round(90 - i * 4 + (Math.random() * 6 - 3)))),
          temperature: +(31 + Math.random() * 5).toFixed(1),
          voltage: +(3.8 + Math.random() * 0.4).toFixed(2),
          freeStorageMb: 18450 + Math.round(Math.random() * 200 - 100),
          isCharging: i % 4 === 0,
          cpuUsage: Math.round(15 + Math.random() * 30)
        }));
        return { success: true, history: initialPoints };
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { success: true, history: data.slice(-limit) };
    } catch (err) {
      return { success: false, error: err.message, history: [] };
    }
  }

  clearHistory(serial) {
    try {
      const filePath = this.getDeviceFilePath(serial);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true, message: 'تاریخچه پایش سلامت دستگاه با موفقیت پاک شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const telemetryManager = new TelemetryManager();
