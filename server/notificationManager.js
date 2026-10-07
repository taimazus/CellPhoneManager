import { adbManager } from './adbManager.js';

export class NotificationManager {
  async getLiveNotifications(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return [
          {
            id: 'notif_1',
            packageName: 'org.telegram.messenger',
            appName: 'Telegram',
            title: 'پیام از طرف رضا احمدی',
            text: 'سلام مهندس، فایل‌های پروژه رو فرستادم لطفا چک کن.',
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'telegram'
          },
          {
            id: 'notif_2',
            packageName: 'com.whatsapp',
            appName: 'WhatsApp',
            title: 'گروه توسعه‌دهندگان',
            text: 'جلسه بازبینی کد ساعت ۱۵ برگزار می‌شود.',
            timestamp: new Date(Date.now() - 5 * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'whatsapp'
          },
          {
            id: 'notif_3',
            packageName: 'com.android.mms',
            appName: 'پیامک',
            title: 'بانک ملت',
            text: 'واریز مبلغ ۲,۵۰۰,۰۰۰ ریال به حساب شما.',
            timestamp: new Date(Date.now() - 25 * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'sms'
          }
        ];
      }

      // Query dumpsys notification
      const res = await adbManager.runAdb('shell dumpsys notification --noredact', serial);
      if (!res.success || !res.stdout) return [];

      const lines = res.stdout.split('\n');
      const notifs = [];
      let currentPkg = '';
      let currentTitle = '';
      let currentText = '';

      for (const line of lines) {
        if (line.includes('NotificationRecord(')) {
          const pkgMatch = line.match(/pkg=([^\s]+)/);
          if (pkgMatch) currentPkg = pkgMatch[1];
        }
        if (line.includes('android.title=String (')) {
          const m = line.match(/android\.title=String \((.*?)\)/);
          if (m) currentTitle = m[1];
        }
        if (line.includes('android.text=String (')) {
          const m = line.match(/android\.text=String \((.*?)\)/);
          if (m) {
            currentText = m[1];
            if (currentPkg && (currentTitle || currentText)) {
              notifs.push({
                id: `notif_${Math.random().toString(36).substr(2, 9)}`,
                packageName: currentPkg,
                appName: currentPkg.split('.').pop() || 'برنامه',
                title: currentTitle || 'اعلان جدید',
                text: currentText || '',
                timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                icon: currentPkg.includes('telegram') ? 'telegram' : currentPkg.includes('whatsapp') ? 'whatsapp' : 'app'
              });
              currentTitle = '';
              currentText = '';
            }
          }
        }
      }

      // Limit to last 20 notifications
      return notifs.slice(0, 20);
    } catch {
      return [];
    }
  }

  async quickReply(serial, { packageName, message }) {
    try {
      // 1. Launch app or send intent/text
      if (packageName) {
        await adbManager.launchApp(serial, packageName);
        await new Promise(r => setTimeout(r, 600));
      }
      return await adbManager.sendTextInput(serial, message);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async dismissNotifications(serial) {
    try {
      return await adbManager.runAdb('shell service call notification 1', serial);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const notificationManager = new NotificationManager();
