import fs from 'fs';
import path from 'path';
import { adbManager } from './adbManager.js';

export class PasswordManager {
  // 1. Get Saved Wi-Fi Passwords from Device
  async getWifiPasswords(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          networks: [
            { ssid: 'Home_HighSpeed_5G', psk: 'Ir@nTelec0m#2026', keyMgmt: 'WPA2-PSK', hidden: false, lastConnected: 'امروز ۱۱:۳۰' },
            { ssid: 'Office_Guest_WiFi', psk: 'CompanyGuest@9988', keyMgmt: 'WPA2-PSK', hidden: false, lastConnected: 'دیروز ۱۷:۴۵' },
            { ssid: 'Airport_VIP_Lounge', psk: 'FlyHigh!Pass2025', keyMgmt: 'WPA-EAP', hidden: true, lastConnected: '۳ روز پیش' },
            { ssid: 'Tehran_Cafe_Fiber', psk: 'cafe123456', keyMgmt: 'WPA2-PSK', hidden: false, lastConnected: 'هفته گذشته' },
            { ssid: 'Mobile_Hotspot_Galaxy', psk: '8877665544', keyMgmt: 'WPA3-SAE', hidden: false, lastConnected: '۲ هفته پیش' }
          ]
        };
      }

      const networks = [];

      // Try reading WifiConfigStore.xml via root/adb shell
      const wifiDump = await adbManager.runAdb('shell su -c "cat /data/misc/apexdata/com.android.wifi/WifiConfigStore.xml || cat /data/misc/wifi/WifiConfigStore.xml || cat /data/misc/wifi/wpa_supplicant.conf"', serial);

      if (wifiDump.success && wifiDump.stdout && wifiDump.stdout.length > 50) {
        const content = wifiDump.stdout;
        
        // Parse WifiConfigStore XML format
        const networkBlocks = content.split('<Network>');
        for (const block of networkBlocks) {
          const ssidMatch = block.match(/<string name="SSID">&quot;(.*?)&quot;<\/string>/) || block.match(/ssid="(.*?)"/);
          const pskMatch = block.match(/<string name="PreSharedKey">&quot;(.*?)&quot;<\/string>/) || block.match(/psk="(.*?)"/);
          const keyMgmtMatch = block.match(/<string name="ConfigKey">&quot;.*?&quot;(.*?)<\/string>/) || block.match(/key_mgmt=(.*?)\n/);

          if (ssidMatch && ssidMatch[1]) {
            networks.push({
              ssid: ssidMatch[1],
              psk: pskMatch ? pskMatch[1] : '(شبکه باز بدون رمز)',
              keyMgmt: keyMgmtMatch ? keyMgmtMatch[1].trim() : 'WPA2-PSK',
              hidden: block.includes('<boolean name="HiddenSSID" value="true" />'),
              lastConnected: 'ثبت شده'
            });
          }
        }
      }

      // If non-root fallback, read via dumpsys wifi
      if (networks.length === 0) {
        const dumpsys = await adbManager.runAdb('shell dumpsys wifi', serial);
        if (dumpsys.success && dumpsys.stdout) {
          const matches = [...dumpsys.stdout.matchAll(/SSID: "(.*?)"/g)];
          for (const m of matches) {
            if (m[1] && !networks.some(n => n.ssid === m[1])) {
              networks.push({
                ssid: m[1],
                psk: 'نیاز به روت جهت خواندن کلید خام',
                keyMgmt: 'WPA2/WPA3',
                hidden: false,
                lastConnected: 'شناسایی شده'
              });
            }
          }
        }
      }

      return {
        success: true,
        networks: networks.length > 0 ? networks : [
          { ssid: 'Default_Network', psk: 'رمز شناسایی نشد', keyMgmt: 'WPA2', hidden: false, lastConnected: 'ناشناخته' }
        ]
      };
    } catch (e) {
      return { success: false, error: e.message, networks: [] };
    }
  }

  // 2. Connect device to a Wi-Fi network using credentials
  async connectToWifi(serial, ssid, password) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return { success: true, message: `دستور اتصال به شبکه ${ssid} در شبیه‌ساز ارسال شد.` };
      }

      const safeSsid = (ssid || '').replace(/["\\$`!]/g, '');
      const safePass = (password || '').replace(/["\\$`!]/g, '');
      const res = await adbManager.runAdb(`shell cmd wifi connect-network "${safeSsid}" wpa2 "${safePass}"`, serial);
      return { success: true, message: `دستور اتصال به شبکه ${ssid} با موفقیت ارسال شد.`, output: res.stdout };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 3. Get Saved System & App Accounts
  async getSystemAccounts(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          accounts: [
            { type: 'Google (Gmail)', name: 'user.developer@gmail.com', syncEnabled: true, lastSync: 'امروز ۱۰:۱۵' },
            { type: 'Samsung Account', name: 'samsung.cloud.user@gmail.com', syncEnabled: true, lastSync: 'دیروز ۱۸:۰۰' },
            { type: 'Telegram Messenger', name: '+98 912 345 6789', syncEnabled: true, lastSync: 'زنده' },
            { type: 'WhatsApp Messenger', name: '+98 935 987 6543', syncEnabled: true, lastSync: 'زنده' },
            { type: 'Microsoft Exchange / Outlook', name: 'corporate@company.com', syncEnabled: true, lastSync: 'امروز ۰۹:۰۰' }
          ]
        };
      }

      const res = await adbManager.runAdb('shell dumpsys account', serial);
      const accounts = [];
      if (res.success && res.stdout) {
        const matches = [...res.stdout.matchAll(/Account \{name=(.*?), type=(.*?)\}/g)];
        for (const m of matches) {
          accounts.push({
            name: m[1],
            type: m[2].replace('com.google', 'Google').replace('com.whatsapp', 'WhatsApp').replace('org.telegram.messenger', 'Telegram'),
            syncEnabled: true,
            lastSync: 'ثبت شده'
          });
        }
      }

      return { success: true, accounts };
    } catch (e) {
      return { success: false, error: e.message, accounts: [] };
    }
  }
}

export const passwordManager = new PasswordManager();
