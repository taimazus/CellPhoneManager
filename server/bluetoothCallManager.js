/**
 * bluetoothCallManager.js
 * Comprehensive Bluetooth Hands-Free and Call Audio Routing Engine for CellPhoneManager
 * 
 * Developed by Sahand Electronic Solutions Co. (https://irres.ir)
 */

import { execFile, spawn } from 'child_process';
import util from 'util';
import { adbManager } from './adbManager.js';

const execFileAsync = util.promisify(execFile);

class BluetoothCallManager {
  /**
   * Check PC Bluetooth adapter and paired device status on Windows
   */
  async getPcBluetoothStatus() {
    try {
      // 1. Check for physical Bluetooth radio adapter on Windows host
      const psCheckScript = `
        $devs = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Present -eq $true -and $_.FriendlyName -notmatch 'Enumerator|RFCOMM|Service|Transport|Protocol' };
        $adapters = @($devs | Select-Object -ExpandProperty FriendlyName);
        $paired = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -notmatch 'Enumerator|RFCOMM|Service|Transport|Protocol|Adapter|Wireless Bluetooth|Intel|Realtek|Qualcomm|Broadcom' };
        $pairedList = @($paired | Select-Object -Property FriendlyName, Status, Present);
        [PSCustomObject]@{
          hasAdapter = ($adapters.Count -gt 0);
          adapters = $adapters;
          pairedDevices = $pairedList;
        } | ConvertTo-Json -Compress
      `;

      const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', psCheckScript], {
        timeout: 5000
      });

      if (!stdout || stdout.trim().length === 0) {
        return {
          available: false,
          hasAdapter: false,
          adapters: [],
          pairedDevices: [],
          message: 'سخت‌افزار بلوتوث در ویندوز یافت نشد'
        };
      }

      const parsed = JSON.parse(stdout.trim());
      const hasAdapter = Boolean(parsed.hasAdapter && parsed.adapters && parsed.adapters.length > 0);

      return {
        available: hasAdapter,
        hasAdapter,
        adapters: Array.isArray(parsed.adapters) ? parsed.adapters : [parsed.adapters].filter(Boolean),
        pairedDevices: Array.isArray(parsed.pairedDevices) ? parsed.pairedDevices : [parsed.pairedDevices].filter(Boolean),
        message: hasAdapter ? 'سخت‌افزار بلوتوث ویندوز فعال و آماده است' : 'سخت‌افزار بلوتوث روی کامپیوتر یافت نشد (نیاز به دانگل بلوتوث)'
      };
    } catch (err) {
      return {
        available: false,
        hasAdapter: false,
        adapters: [],
        pairedDevices: [],
        error: err.message,
        message: 'خطا در بررسی وضعیت بلوتوث ویندوز'
      };
    }
  }

  /**
   * Check Bluetooth state and details on Android Device
   */
  async getDeviceBluetoothStatus(serial) {
    if (!serial || serial.startsWith('mock-')) {
      return {
        available: true,
        enabled: true,
        name: 'Mock Galaxy Phone',
        address: '00:11:22:33:44:55',
        state: 'ON'
      };
    }

    try {
      const dumpRes = await adbManager.runAdb('shell dumpsys bluetooth_manager', serial);
      const isEnabled = dumpRes.stdout && (
        dumpRes.stdout.includes('enabled: true') ||
        dumpRes.stdout.includes('state: ON') ||
        dumpRes.stdout.includes('Bluetooth is enabled')
      );

      // Extract device name & MAC address
      let name = '';
      let address = '';

      const nameMatch = dumpRes.stdout?.match(/name:\s*([^\r\n,]+)/i);
      if (nameMatch) name = nameMatch[1].trim();

      const addrMatch = dumpRes.stdout?.match(/address:\s*([0-9a-fA-F:]{17})/i);
      if (addrMatch) address = addrMatch[1].trim();

      // Fallback props if not parsed from dumpsys
      if (!name) {
        const propName = await adbManager.runAdb('shell getprop net.bt.name', serial);
        name = propName.stdout?.trim() || '';
      }
      if (!name) {
        const modelProp = await adbManager.runAdb('shell getprop ro.product.model', serial);
        name = modelProp.stdout?.trim() || 'Android Device';
      }

      return {
        available: true,
        enabled: Boolean(isEnabled),
        name,
        address: address || '00:00:00:00:00:00',
        state: isEnabled ? 'ON' : 'OFF'
      };
    } catch (err) {
      return {
        available: false,
        enabled: false,
        name: 'Unknown Device',
        address: '',
        error: err.message
      };
    }
  }

  /**
   * Enable Bluetooth on device
   */
  async enableDeviceBluetooth(serial) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'بلوتوث دستگاه روشن شد (شبیه‌ساز)' };
    }

    try {
      await adbManager.runAdb('shell "svc bluetooth enable 2>/dev/null || cmd bluetooth_manager enable 2>/dev/null || true"', serial);
      return { success: true, message: 'بلوتوث گوشی با موفقیت روشن شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Open Bluetooth settings on phone to become discoverable/ready to pair
   */
  async openDeviceBluetoothSettings(serial) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'صفحه تنظیمات بلوتوث گوشی باز شد' };
    }

    try {
      await adbManager.runAdb('shell am start -a android.settings.BLUETOOTH_SETTINGS', serial);
      return { success: true, message: 'صفحه تنظیمات بلوتوث گوشی باز شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Open Windows Bluetooth settings panel
   */
  async openPcBluetoothSettings() {
    try {
      spawn('powershell.exe', ['-NoProfile', '-Command', 'Start-Process ms-settings:bluetooth'], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      return { success: true, message: 'تنظیمات بلوتوث ویندوز باز شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Open Windows Sound settings panel for Hands-free audio device inspection
   */
  async openPcSoundSettings() {
    try {
      spawn('powershell.exe', ['-NoProfile', '-Command', 'Start-Process ms-settings:sound'], {
        detached: true,
        stdio: 'ignore'
      }).unref();
      return { success: true, message: 'تنظیمات صدای ویندوز باز شد' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * One-click automated Bluetooth pairing preparation between PC and Phone
   */
  async prepareAutoPair(serial) {
    const pcStatus = await this.getPcBluetoothStatus();
    const deviceStatus = await this.getDeviceBluetoothStatus(serial);

    // If PC doesn't have bluetooth hardware
    if (!pcStatus.hasAdapter) {
      return {
        success: false,
        error: 'NO_PC_BLUETOOTH',
        pcStatus,
        deviceStatus,
        message: 'کامپیوتر شما فاقد دانگل یا سخت‌افزار بلوتوث است. برای مکالمه مستقیم با کامپیوتر، یک دانگل بلوتوث USB به سیستم متصل کنید یا از حالت «اسپیکرفون خودکار گوشی» استفاده فرمایید.'
      };
    }

    // 1. Enable Bluetooth on phone if off
    if (!deviceStatus.enabled) {
      await this.enableDeviceBluetooth(serial);
    }

    // 2. Open Bluetooth Settings on phone
    await this.openDeviceBluetoothSettings(serial);

    // 3. Open Windows Bluetooth Settings
    await this.openPcBluetoothSettings();

    // Check if device is already in paired list
    const isPaired = pcStatus.pairedDevices.some(d =>
      d.FriendlyName && deviceStatus.name &&
      (d.FriendlyName.toLowerCase().includes(deviceStatus.name.toLowerCase()) ||
       deviceStatus.name.toLowerCase().includes(d.FriendlyName.toLowerCase()))
    );

    return {
      success: true,
      isPaired,
      pcStatus,
      deviceStatus: { ...deviceStatus, enabled: true },
      message: isPaired
        ? `گوشی «${deviceStatus.name}» قبلاً با کامپیوتر جفت شده است. کافیست در تنظیمات بلوتوث گوشی گزینه Calls (تماس‌ها) فعال باشد.`
        : `بلوتوث هر دو طرف فعال شد. در پنجره باز شده ویندوز، روی Add device کلیک کرده و نام «${deviceStatus.name}» را برای جفت‌سازی انتخاب کنید.`
    };
  }

  /**
   * Make call with automatic audio routing (Speakerphone vs Hands-free Bluetooth vs Earpiece)
   */
  async makeCallWithRouting(serial, number, options = {}) {
    const { mode = 'speaker', simSlot } = options;

    if (!number) {
      return { success: false, error: 'شماره تماس الزامی است' };
    }

    if (serial && serial.startsWith('mock-')) {
      return {
        success: true,
        mode,
        message: mode === 'speaker'
          ? `تماس با شماره ${number} با بلندگوی خودکار (اسپیکرفون) برقرار شد (شبیه‌ساز)`
          : (mode === 'bluetooth'
             ? `تماس با شماره ${number} و هدایت صدا به هندزفری بلوتوث کامپیوتر برقرار شد (شبیه‌ساز)`
             : `تماس با شماره ${number} برقرار شد (شبیه‌ساز)`)
      };
    }

    // 1. Execute call command
    const callResult = await adbManager.makeCall(serial, number, { simSlot });
    if (!callResult.success && callResult.error) {
      return callResult;
    }

    // 2. Apply Audio Routing after brief delay to let Telecom initialize
    if (mode === 'speaker') {
      setTimeout(async () => {
        try {
          await adbManager.setAudioRoute(serial, 'speaker');
          // Also set volume stream 0 to max for clear hands-free speakerphone
          await adbManager.runAdb('shell media volume --stream 0 --set 100 2>/dev/null || true', serial);
        } catch (_) {}
      }, 700);
    } else if (mode === 'bluetooth') {
      setTimeout(async () => {
        try {
          await adbManager.setAudioRoute(serial, 'bluetooth');
        } catch (_) {}
      }, 700);
    }

    return {
      success: true,
      mode,
      message: mode === 'speaker'
        ? `تماس با شماره ${number} برقرار و بلندگوی گوشی (اسپیکرفون) فعال شد`
        : (mode === 'bluetooth'
           ? `تماس با شماره ${number} برقرار و صدا به هندزفری بلوتوث هدایت گردید`
           : `تماس با شماره ${number} برقرار شد`),
      details: callResult
    };
  }
}

const bluetoothCallManager = new BluetoothCallManager();
export default bluetoothCallManager;
