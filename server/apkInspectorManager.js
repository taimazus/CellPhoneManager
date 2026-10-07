import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

const execAsync = util.promisify(exec);

export class ApkInspectorManager {
  async inspectInstalledApp(serial, packageName) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return {
          success: true,
          packageName,
          appName: 'برنامه نمونه',
          versionName: '2.4.1',
          versionCode: '241',
          minSdk: '26 (Android 8.0)',
          targetSdk: '34 (Android 14)',
          riskScore: 'کم‌خطر (Safe)',
          permissions: [
            { name: 'android.permission.INTERNET', category: 'normal', desc: 'دسترسی به اینترنت' },
            { name: 'android.permission.ACCESS_NETWORK_STATE', category: 'normal', desc: 'مشاهده وضعیت اتصال شبکه' },
            { name: 'android.permission.VIBRATE', category: 'normal', desc: 'استفاده از ویبراتور' }
          ]
        };
      }

      // 1. Query package dump
      const res = await adbManager.runAdb(`shell dumpsys package ${packageName}`, serial);
      if (!res.success || !res.stdout) {
        return { success: false, error: 'اطلاعات پکیج یافت نشد.' };
      }

      const out = res.stdout;
      const verNameMatch = out.match(/versionName=([^\s\r\n]+)/);
      const verCodeMatch = out.match(/versionCode=(\d+)/);
      const targetSdkMatch = out.match(/targetSdk=(\d+)/);
      const minSdkMatch = out.match(/minSdk=(\d+)/);

      // 2. Extract requested permissions
      const permLines = out.match(/requested permissions:([\s\S]*?)install permissions:/) || 
                        out.match(/declared permissions:([\s\S]*?)(?:runtime permissions:|$)/) || [];
      const rawPerms = permLines[1] ? permLines[1].split('\n') : [];
      const permissions = [];

      const criticalPerms = [
        'READ_SMS', 'SEND_SMS', 'RECEIVE_SMS', 'READ_CALL_LOG', 'WRITE_CALL_LOG', 
        'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION',
        'READ_CONTACTS', 'WRITE_CONTACTS', 'SYSTEM_ALERT_WINDOW', 'BIND_ACCESSIBILITY_SERVICE'
      ];

      const mediumPerms = [
        'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'READ_MEDIA_IMAGES', 
        'READ_MEDIA_VIDEO', 'BLUETOOTH', 'BLUETOOTH_CONNECT', 'POST_NOTIFICATIONS'
      ];

      let criticalCount = 0;

      for (const line of rawPerms) {
        const clean = line.trim();
        if (!clean || !clean.includes('.')) continue;
        const name = clean.split(':').pop().trim();
        const shortName = name.split('.').pop() || name;

        let category = 'normal';
        let desc = 'دسترسی عمومی سیستم';

        if (criticalPerms.some(cp => name.includes(cp))) {
          category = 'critical';
          criticalCount++;
          desc = '🚨 دسترسی حساس (دوربین / میکروفون / پیامک / مخاطبین / موقعیت)';
        } else if (mediumPerms.some(mp => name.includes(mp))) {
          category = 'medium';
          desc = '⚠️ دسترسی سطح متوسط (حافظه / بلوتوث / اعلان)';
        }

        permissions.push({ name, shortName, category, desc });
      }

      let riskScore = 'ایمن (Safe)';
      if (criticalCount >= 4) riskScore = '🚨 پرخطر (High Risk)';
      else if (criticalCount >= 1) riskScore = '⚠️ نیاز به احتیاط (Moderate)';

      return {
        success: true,
        packageName,
        versionName: verNameMatch ? verNameMatch[1] : 'نامشخص',
        versionCode: verCodeMatch ? verCodeMatch[1] : 'نامشخص',
        targetSdk: targetSdkMatch ? targetSdkMatch[1] : 'نامشخص',
        minSdk: minSdkMatch ? minSdkMatch[1] : 'نامشخص',
        riskScore,
        criticalCount,
        permissionsCount: permissions.length,
        permissions
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const apkInspectorManager = new ApkInspectorManager();
