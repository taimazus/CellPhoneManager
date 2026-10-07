import { adbManager } from './adbManager.js';

export class GpsManager {
  constructor() {
    this.activeSimulations = new Map(); // serial -> intervalId
  }

  async setLocation(serial, { lat, lng }) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return { success: true, lat, lng, message: `موقعیت مکانی شبیه‌ساز به (${lat}, ${lng}) تغییر یافت.` };
      }
      return await adbManager.setSimulatedLocation(serial, lat, lng);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async clearLocation(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return { success: true, message: 'موقعیت مکانی جعلی بازنشانی شد.' };
      }
      return await adbManager.clearSimulatedLocation(serial);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  startRouteSimulation(serial, { startLat, startLng, endLat, endLng, speedKmH = 30 }) {
    this.stopRouteSimulation(serial);

    let currentLat = startLat;
    let currentLng = startLng;
    const steps = 100;
    const latStep = (endLat - startLat) / steps;
    const lngStep = (endLng - startLng) / steps;
    let stepCount = 0;

    const interval = setInterval(async () => {
      if (stepCount >= steps) {
        this.stopRouteSimulation(serial);
        return;
      }
      currentLat += latStep;
      currentLng += lngStep;
      stepCount++;
      await this.setLocation(serial, { lat: currentLat, lng: currentLng });
    }, Math.max(200, 3600 / speedKmH));

    this.activeSimulations.set(serial, interval);
    return { success: true, message: `شبیه‌سازی حرکت با سرعت ${speedKmH} km/h آغاز شد.` };
  }

  stopRouteSimulation(serial) {
    if (this.activeSimulations.has(serial)) {
      clearInterval(this.activeSimulations.get(serial));
      this.activeSimulations.delete(serial);
      return { success: true, message: 'شبیه‌سازی حرکت متوقف شد.' };
    }
    return { success: true, message: 'شبیه‌سازی فعالی در حال اجرا نبود.' };
  }
}

export const gpsManager = new GpsManager();
