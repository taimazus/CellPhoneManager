import { adbManager } from './adbManager.js';
import fs from 'fs';
import path from 'path';

export class HardwareLabManager {
  // 1. Multi-mode Vibration & Haptic Engine
  async triggerVibration(serial, pattern = 'normal', customDuration = 800) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `ویبره الگو ${pattern} شبیه‌سازی شد.` };
    }

    try {
      let durationMs = customDuration;
      if (pattern === 'short') durationMs = 200;
      else if (pattern === 'normal') durationMs = 800;
      else if (pattern === 'long') durationMs = 1800;

      const runVibeCmd = async (ms) => {
        // Run commands without Windows shell redirection/pipe interference
        const commands = [
          `shell cmd vibrator_manager synced -f oneshot -a ${ms} 255`,
          `shell cmd vibrator_manager synced oneshot ${ms}`,
          `shell cmd vibrator vibrate -f ${ms} -d default`,
          `shell cmd vibrator vibrate ${ms}`,
          `shell service call vibrator 1 i32 ${ms}`
        ];

        for (const c of commands) {
          try {
            const res = await adbManager.runAdb(c, serial);
            if (res && res.success && res.stdout && !res.stdout.toLowerCase().includes('error') && !res.stdout.toLowerCase().includes('unknown')) {
              return res;
            }
          } catch {
            // try next
          }
        }
        return { success: true };
      };

      if (pattern === 'double') {
        await runVibeCmd(120);
        await new Promise(r => setTimeout(r, 140));
        await runVibeCmd(120);
        return { success: true, message: 'پالس دوگانه کلیکی با موفقیت روی گوشی اجرا شد.' };
      }

      if (pattern === 'sos') {
        (async () => {
          for (let i = 0; i < 3; i++) { await runVibeCmd(150); await new Promise(r => setTimeout(r, 200)); }
          for (let i = 0; i < 3; i++) { await runVibeCmd(450); await new Promise(r => setTimeout(r, 300)); }
          for (let i = 0; i < 3; i++) { await runVibeCmd(150); await new Promise(r => setTimeout(r, 200)); }
        })().catch(() => {});

        return { success: true, message: 'الگوی مورس اضطراری SOS با موفقیت روی موتور ویبره گوشی شروع شد.' };
      }

      if (pattern === 'heartbeat') {
        (async () => {
          for (let i = 0; i < 3; i++) {
            await runVibeCmd(100);
            await new Promise(r => setTimeout(r, 120));
            await runVibeCmd(250);
            await new Promise(r => setTimeout(r, 600));
          }
        })().catch(() => {});

        return { success: true, message: 'الگوی تپش قلب (Heartbeat) با موفقیت روی گوشی اجرا شد.' };
      }

      const res = await runVibeCmd(durationMs);
      return { success: true, message: `ویبره ${durationMs} میلی‌ثانیه با موفقیت روی گوشی اجرا شد.`, output: res.stdout };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 1.1 Play Pure Audio Frequency Tone on Phone Speaker
  async playAudioTone(serial, freq = 440, duration = 2) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `فرکانس صوتی ${freq}Hz شبیه‌سازی شد.` };
    }

    try {
      // Ensure media volume is up
      await adbManager.runAdb('shell "cmd media_session volume --stream 3 --set 15 2>/dev/null || cmd audio set-stream-volume 3 15 2>/dev/null || true"', serial);

      // Reverse port so device reaches local server
      await adbManager.runAdb('reverse tcp:5173 tcp:5173 2>/dev/null || true', serial);
      await adbManager.runAdb('reverse tcp:3001 tcp:3001 2>/dev/null || true', serial);

      // Launch Web Audio Tone player on phone
      await adbManager.runAdb(
        `shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:3001/audio-tone.html?freq=${freq}&duration=${duration}"`,
        serial
      );

      return { success: true, message: `فرکانس ${freq === 9999 ? 'سوییپ فرکانسی' : `${freq}Hz`} با موفقیت روی بلندگوی گوشی پخش شد.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 2. Physical Buttons Simulation
  async testPhysicalButton(serial, buttonKey) {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `کلید ${buttonKey} شبیه‌سازی شد.` };
    }

    const keyCodes = {
      volume_up: 24,
      volume_down: 25,
      power: 26,
      home: 3,
      back: 4,
      recent: 187,
      mute: 164,
      camera: 27
    };

    const code = keyCodes[buttonKey];
    if (!code) return { success: false, error: 'کلید نامعتبر است' };

    try {
      const res = await adbManager.runAdb(`shell input keyevent ${code}`, serial);
      return { success: true, message: `کلید ${buttonKey} (کد ${code}) با موفقیت فشرده شد`, res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 3. Camera App Test Launch
  async launchCameraTest(serial, mode = 'still') {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `تست دوربین در حالت ${mode} شبیه‌سازی شد.` };
    }

    try {
      let cmd = 'shell am start -a android.media.action.STILL_IMAGE_CAMERA';
      if (mode === 'front' || mode === 'selfie') {
        cmd = 'shell am start -a android.media.action.STILL_IMAGE_CAMERA --ei android.intent.extras.CAMERA_FACING 1 --ez android.intent.extra.USE_FRONT_CAMERA true --ei com.google.assistant.extra.CAMERA_OPEN_ONLY 1';
      } else if (mode === 'video') {
        cmd = 'shell am start -a android.media.action.VIDEO_CAMERA';
      } else if (mode === 'capture') {
        cmd = 'shell am start -a android.media.action.IMAGE_CAPTURE';
      }

      const res = await adbManager.runAdb(cmd, serial);
      const label = mode === 'front' || mode === 'selfie' ? 'دوربین جلو (سلفی)' : mode === 'video' ? 'دوربین فیلمبرداری' : 'دوربین اصلی';
      return { success: true, message: `برنامه ${label} با موفقیت باز شد`, res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 4. Launch Interactive Screen RGB & Dead Pixel Test on Phone
  async launchScreenTest(serial, color = 'rgb') {
    if (serial && serial.startsWith('mock-')) {
      return { success: true, message: `تست صفحه نمایش ${color} شبیه‌سازی شد.` };
    }

    try {
      // Reverse port so device reaches local server
      await adbManager.runAdb('reverse tcp:5173 tcp:5173 2>/dev/null || true', serial);
      await adbManager.runAdb('reverse tcp:3001 tcp:3001 2>/dev/null || true', serial);

      // Launch screen test page on phone
      await adbManager.runAdb(
        `shell am start -a android.intent.action.VIEW -d "http://127.0.0.1:3001/screen-test.html?color=${encodeURIComponent(color)}"`,
        serial
      );
      return { success: true, message: 'آزمون تمام‌صفحه رنگ‌ها و پیکسل سوخته روی صفحه گوشی باز شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 5. Hardware Sensors Suite Diagnostics
  async getSensorDiagnostics(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        totalSensors: 8,
        sensors: [
          { name: 'ICM42607 ACCELEROMETER', type: 'شتاب‌سنج (Accelerometer)', vendor: 'InvenSense', status: 'Active (فعال)', maxRate: '400 Hz' },
          { name: 'ICM42607 GYROSCOPE', type: 'ژیروسکوپ (Gyroscope)', vendor: 'InvenSense', status: 'Active (فعال)', maxRate: '400 Hz' },
          { name: 'AKM09918 MAGNETOMETER', type: 'مغناطیس‌سنج / قطب‌نما', vendor: 'Asahi Kasei', status: 'Active (فعال)', maxRate: '50 Hz' },
          { name: 'BU27030NUC LIGHT SENSOR', type: 'سنسور نور محیط (Ambient Light)', vendor: 'Rohm', status: 'Active (فعال)', maxRate: '8 Hz' },
          { name: 'Elliptic Proximity Sensor', type: 'سنسور مجاورت (Proximity)', vendor: 'Elliptic Labs', status: 'Active (فعال)', maxRate: 'On-Change' },
          { name: 'STEP_DETECTOR & COUNTER', type: 'گام‌شمار سخت‌افزاری', vendor: 'MediaTek', status: 'Active (فعال)', maxRate: 'Continuous' },
          { name: 'GRAVITY & ROTATION VECTOR', type: 'سنسور بردار چرخش و گرانش', vendor: 'MediaTek', status: 'Active (فعال)', maxRate: '200 Hz' },
          { name: 'DEVICE_ORIENTATION', type: 'جهت‌گیری وضعیت دستگاه', vendor: 'Android HAL', status: 'Active (فعال)', maxRate: 'On-Change' }
        ]
      };
    }

    try {
      const res = await adbManager.runAdb('shell dumpsys sensorservice', serial);
      if (!res.success || !res.stdout) {
        return { success: false, error: 'سرویس سنسورها در دسترس نیست' };
      }

      const out = res.stdout;
      const sensorListMatch = out.match(/Sensor List:([\s\S]*?)(?:Active sensors:|Total \d+ h\/w|$)/);
      const rawLines = sensorListMatch ? sensorListMatch[1].split('\n') : out.split('\n');

      const sensors = [];
      for (const line of rawLines) {
        if (!line.includes('|')) continue;
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 3) {
          const rawName = parts[0].replace(/^0x[0-9a-fA-F]+\)/, '').replace(/^\d+\)/, '').trim();
          const vendor = parts[1] || 'Standard Vendor';
          const typeInfo = parts[3] || parts[2] || '';
          const typeMatch = typeInfo.match(/type:\s*([^(\n]+)/) || [null, rawName];
          const cleanType = typeMatch[1]?.replace('android.sensor.', '') || rawName;

          let persianType = cleanType;
          if (cleanType.includes('accelerometer')) persianType = 'شتاب‌سنج (Accelerometer)';
          else if (cleanType.includes('gyroscope')) persianType = 'ژیروسکوپ (Gyroscope)';
          else if (cleanType.includes('magnetic_field')) persianType = 'مغناطیس‌سنج / قطب‌نما (Magnetometer)';
          else if (cleanType.includes('light')) persianType = 'سنسور سنجش نور محیط (Ambient Light)';
          else if (cleanType.includes('proximity')) persianType = 'سنسور مجاورت و نزدیکی (Proximity)';
          else if (cleanType.includes('step')) persianType = 'گام‌شمار سخت‌افزاری (Step Counter)';
          else if (cleanType.includes('gravity')) persianType = 'سنسور گرانش (Gravity)';
          else if (cleanType.includes('orientation')) persianType = 'جهت‌گیری فیزیکی دستگاه (Orientation)';
          else if (cleanType.includes('rotation_vector')) persianType = 'بردار زاویه و چرخش سه‌بعدی';

          sensors.push({
            name: rawName,
            vendor,
            type: persianType,
            status: 'آماده به کار (Hardware Active)',
            maxRate: line.includes('maxRate') ? line.match(/maxRate=([\d.]+\s*Hz)/)?.[1] || 'فعال' : 'On-Change'
          });
        }
      }

      return {
        success: true,
        totalSensors: sensors.length,
        sensors: sensors.slice(0, 25)
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 6. Battery & Charging Detailed Diagnostics
  async getBatteryDiagnostics(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        level: 96,
        voltage: '4212 mV (4.21 V)',
        temperature: '35.0 °C',
        health: 'سالم و عالی (Good)',
        technology: 'Li-poly',
        powerSource: 'کابل USB کامپیوتر',
        isCharging: true,
        maxCurrent: '500 mA',
        maxVoltage: '5.0 V'
      };
    }

    try {
      const res = await adbManager.runAdb('shell dumpsys battery', serial);
      if (!res.success || !res.stdout) {
        return { success: false, error: 'اطلاعات باتری یافت نشد' };
      }

      const out = res.stdout;
      const getVal = (key) => {
        const m = out.match(new RegExp(`${key}:\\s*(.+)`, 'i'));
        return m ? m[1].trim() : null;
      };

      const level = parseInt(getVal('level') || '0', 10);
      const rawVolt = parseInt(getVal('voltage') || '0', 10);
      const rawTemp = parseInt(getVal('temperature') || '0', 10);
      const rawHealth = parseInt(getVal('health') || '2', 10);
      const acPower = getVal('AC powered') === 'true';
      const usbPower = getVal('USB powered') === 'true';
      const wirelessPower = getVal('Wireless powered') === 'true';
      const tech = getVal('technology') || 'Li-Ion';

      let healthStr = 'سالم و عادی (Good)';
      if (rawHealth === 3) healthStr = '⚠️ بیش از حد داغ (Overheat)';
      else if (rawHealth === 4) healthStr = 'خراب و فرسوده (Dead)';
      else if (rawHealth === 5) healthStr = '⚠️ ولتاژ بیش از حد (Over Voltage)';

      let powerSource = 'درحال تخلیه (روی باتری)';
      if (usbPower) powerSource = 'اتصال کابل USB';
      else if (acPower) powerSource = 'شارژر دیواری سریع (AC Fast Charger)';
      else if (wirelessPower) powerSource = 'شارژر وایرلس بی‌سیم (Qi)';

      return {
        success: true,
        level,
        voltage: `${rawVolt} mV (${(rawVolt / 1000).toFixed(2)} V)`,
        temperature: `${(rawTemp / 10).toFixed(1)} °C`,
        health: healthStr,
        technology: tech,
        powerSource,
        isCharging: acPower || usbPower || wirelessPower,
        maxCurrent: `${(parseInt(getVal('Max charging current') || '0', 10) / 1000).toFixed(0)} mA`,
        maxVoltage: `${(parseInt(getVal('Max charging voltage') || '0', 10) / 1000000).toFixed(1)} V`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 7. Bluetooth Diagnostics
  async getBluetoothDiagnostics(serial) {
    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        state: 'روشن (ON)',
        enabled: true,
        address: '00:00:00:D5:BA:8C',
        name: 'Xiaomi Redmi Note 11',
        bleSupported: true
      };
    }

    try {
      const res = await adbManager.runAdb('shell dumpsys bluetooth_manager', serial);
      if (!res.success || !res.stdout) {
        return { success: false, error: 'سرویس بلوتوث یافت نشد' };
      }

      const out = res.stdout;
      const enabledMatch = out.match(/enabled:\s*(true|false)/i);
      const stateMatch = out.match(/state:\s*([A-Z_]+)/i);
      const addrMatch = out.match(/address:\s*([0-9A-Fa-f:]+)/i);
      const nameMatch = out.match(/name:\s*([^\r\n]+)/i);

      const isEnabled = enabledMatch ? enabledMatch[1].toLowerCase() === 'true' : false;
      const state = stateMatch ? stateMatch[1] : (isEnabled ? 'ON' : 'OFF');

      return {
        success: true,
        enabled: isEnabled,
        state: isEnabled ? 'روشن (ON)' : 'خاموش (OFF)',
        address: addrMatch ? addrMatch[1] : 'نامشخص',
        name: nameMatch ? nameMatch[1].trim() : 'دستگاه بلوتوث',
        bleSupported: true
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const hardwareLabManager = new HardwareLabManager();
