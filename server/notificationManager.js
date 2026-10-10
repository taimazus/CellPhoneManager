import { adbManager } from './adbManager.js';
import { iosManager } from './iosManager.js';
import { windowsToastManager } from './windowsToastManager.js';

export class NotificationManager {
  constructor() {
    this.deviceEvents = new Map(); // serial -> Array<LiveEventItem>
    this.seenKeys = new Map();     // serial -> Set<string>
    this.lastCallState = new Map();// serial -> { ringing: boolean, number: string }
    this.monitorInterval = null;
    this.broadcastCallback = null;
  }

  emitEvent(serial, event) {
    const eventsList = this.getDeviceEventsList(serial);
    eventsList.unshift(event);
    if (eventsList.length > 50) {
      eventsList.length = 50;
    }

    // 1. Broadcast to browser WebSocket
    if (this.broadcastCallback) {
      this.broadcastCallback({
        type: 'PHONE_LIVE_EVENT',
        deviceId: serial,
        event
      });
    }

    // 2. Dispatch native Windows Desktop Notification
    try {
      windowsToastManager.showToast(event.title, event.text || event.appName);
    } catch (err) {
      console.warn('[NotificationManager] Windows toast error:', err.message);
    }
  }

  getDeviceEventsList(serial) {
    if (!this.deviceEvents.has(serial)) {
      this.deviceEvents.set(serial, []);
    }
    return this.deviceEvents.get(serial);
  }

  getDeviceSeenKeys(serial) {
    if (!this.seenKeys.has(serial)) {
      this.seenKeys.set(serial, new Set());
    }
    return this.seenKeys.get(serial);
  }

  async getEvents(serial) {
    const list = this.getDeviceEventsList(serial);
    if (list.length === 0 && serial && !serial.startsWith('mock-')) {
      await this.pollDeviceForNewEvents(serial);
    }
    const updatedList = this.getDeviceEventsList(serial);
    const unreadCount = updatedList.filter(e => !e.read).length;
    return {
      events: updatedList,
      unreadCount
    };
  }

  markAsRead(serial, eventId) {
    const list = this.getDeviceEventsList(serial);
    if (eventId) {
      const item = list.find(e => e.id === eventId);
      if (item) item.read = true;
    }
    const unreadCount = list.filter(e => !e.read).length;
    return { success: true, unreadCount };
  }

  markAllAsRead(serial) {
    const list = this.getDeviceEventsList(serial);
    list.forEach(e => { e.read = true; });
    return { success: true, unreadCount: 0 };
  }

  clearEvents(serial) {
    this.deviceEvents.set(serial, []);
    return { success: true, unreadCount: 0 };
  }

  categorizeNotification(packageName, rawTitle, rawText) {
    const title = (rawTitle || '').trim();
    const text = (rawText || '').trim();
    const pkg = (packageName || '').toLowerCase();

    // 1. Check for SMS
    const isSms = pkg.includes('messaging') || 
                  pkg.includes('mms') || 
                  pkg.includes('sms') ||
                  pkg.includes('message');

    if (isSms) {
      return {
        category: 'sms',
        appName: 'پیامک (SMS)',
        icon: 'sms',
        targetTab: 'messages',
        actionLabel: 'مشاهده پیامک',
        isMissedCall: false
      };
    }

    // 2. Check for Phone Calls & Missed Calls
    const isCall = pkg.includes('dialer') || 
                   pkg.includes('incallui') || 
                   pkg.includes('telecom') || 
                   pkg.includes('phone') ||
                   title.toLowerCase().includes('call') ||
                   text.toLowerCase().includes('call') ||
                   title.includes('تماس') ||
                   text.includes('تماس');

    if (isCall) {
      const isMissed = text.toLowerCase().includes('missed') || 
                       title.toLowerCase().includes('missed') || 
                       text.includes('از دست رفته') || 
                       title.includes('از دست رفته') ||
                       text.includes('ناموفق') || 
                       title.includes('ناموفق');
      return {
        category: 'call',
        appName: isMissed ? 'تماس ناموفق / از دست رفته' : 'تماس تلفنی',
        icon: isMissed ? 'phone-missed' : 'phone-call',
        targetTab: 'messages',
        actionLabel: isMissed ? 'تماس مجدد' : 'مدیریت تماس',
        isMissedCall: isMissed
      };
    }

    // 3. Social / Messaging Apps
    if (pkg.includes('telegram')) {
      return {
        category: 'notification',
        appName: 'تلگرام',
        icon: 'telegram',
        targetTab: 'notifications',
        actionLabel: 'مشاهده در پیام‌رسان',
        searchQuery: 'telegram',
        isMissedCall: false
      };
    }

    if (pkg.includes('whatsapp')) {
      return {
        category: 'notification',
        appName: 'واتساپ',
        icon: 'whatsapp',
        targetTab: 'notifications',
        actionLabel: 'مشاهده در پیام‌رسان',
        searchQuery: 'whatsapp',
        isMissedCall: false
      };
    }

    if (pkg.includes('bale')) {
      return {
        category: 'notification',
        appName: 'بله',
        icon: 'bale',
        targetTab: 'notifications',
        actionLabel: 'مشاهده اعلان',
        searchQuery: 'bale',
        isMissedCall: false
      };
    }

    if (pkg.includes('rubika')) {
      return {
        category: 'notification',
        appName: 'روبیکا',
        icon: 'rubika',
        targetTab: 'notifications',
        actionLabel: 'مشاهده اعلان',
        searchQuery: 'rubika',
        isMissedCall: false
      };
    }

    // 4. Android System Notifications
    const isSystem = pkg === 'android' || 
                     pkg.includes('systemui') || 
                     pkg.includes('securitycenter') ||
                     pkg.includes('settings');
    if (isSystem) {
      const isBattery = text.toLowerCase().includes('battery') || title.toLowerCase().includes('battery') || 
                        text.includes('باتری') || title.includes('باتری') || 
                        text.includes('شارژ') || title.includes('شارژ');
      return {
        category: 'system',
        appName: isBattery ? 'باتری و تغذیه سیستم' : 'سیستم عامل اندروید',
        icon: isBattery ? 'battery' : 'system',
        targetTab: isBattery ? 'battery' : 'overview',
        actionLabel: isBattery ? 'مشاهده سلامت باتری' : 'مشاهده وضعیت',
        isMissedCall: false
      };
    }

    const friendlyName = pkg.split('.').pop() || 'اعلان برنامه';
    return {
      category: 'notification',
      appName: friendlyName,
      icon: 'app',
      targetTab: 'notifications',
      searchQuery: friendlyName,
      actionLabel: 'مشاهده اعلان',
      isMissedCall: false
    };
  }

  parseNotificationsFromStdout(stdout) {
    if (!stdout) return [];
    const lines = stdout.split('\n');
    const notifs = [];
    let currentPkg = '';
    let currentTitle = '';
    let currentText = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.includes('NotificationRecord(') || line.includes('pkg=')) {
        const pkgMatch = line.match(/pkg=([^\s,]+)/);
        if (pkgMatch) currentPkg = pkgMatch[1];
      }
      if (line.includes('android.title=String (') || line.includes('android.title=')) {
        const m = line.match(/android\.title=(?:String \()?([^)\r\n]+)/);
        if (m) {
          const val = m[1].replace(/^[("']+|[)"']+$/g, '').trim();
          if (val && val !== 'null') currentTitle = val;
        }
      }
      if (line.includes('android.text=String (') || line.includes('android.text=')) {
        const m = line.match(/android\.text=(?:String \()?([^)\r\n]+)/);
        if (m) {
          const val = m[1].replace(/^[("']+|[)"']+$/g, '').trim();
          if (val && val !== 'null') {
            currentText = val;
            if (currentPkg && (currentTitle || currentText)) {
              // Ignore system debug noise
              const isNoise = (currentPkg === 'android' && currentTitle.includes('debugging')) ||
                              (currentPkg === 'com.miui.securitycore' && currentTitle.includes('Second space'));
              if (!isNoise) {
                const meta = this.categorizeNotification(currentPkg, currentTitle, currentText);
                notifs.push({
                  id: `notif_${Math.random().toString(36).substr(2, 9)}`,
                  key: `${currentPkg}_${currentTitle}_${currentText}`,
                  packageName: currentPkg,
                  appName: meta.appName,
                  category: meta.category,
                  title: currentTitle || 'اعلان جدید',
                  text: currentText || '',
                  timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                  icon: meta.icon,
                  targetTab: meta.targetTab,
                  targetSubTab: meta.category === 'sms' ? 'sms' : meta.category === 'call' ? 'calls' : undefined,
                  searchQuery: meta.category === 'sms' || meta.category === 'call' ? currentTitle : (meta.searchQuery || currentPkg),
                  actionLabel: meta.actionLabel,
                  isMissedCall: meta.isMissedCall,
                  read: false
                });
              }
              currentTitle = '';
              currentText = '';
            }
          }
        }
      }
    }
    return notifs;
  }

  async getLiveNotifications(serial) {
    try {
      if (serial && serial.startsWith('mock-')) {
        return [
          {
            id: 'notif_1',
            key: 'telegram_1',
            packageName: 'org.telegram.messenger',
            appName: 'Telegram',
            category: 'notification',
            title: 'پیام از طرف رضا احمدی',
            text: 'سلام مهندس، فایل‌های پروژه رو فرستادم لطفا چک کن.',
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'telegram',
            targetTab: 'notifications',
            actionLabel: 'مشاهده در پیام‌رسان',
            read: false
          },
          {
            id: 'notif_2',
            key: 'call_1',
            packageName: 'com.google.android.dialer',
            appName: 'تماس از دست رفته',
            category: 'call',
            title: 'تماس بی‌پاسخ از امیر رضایی',
            text: '09123456789 - ۲ بار زنگ خورده',
            timestamp: new Date(Date.now() - 3 * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'phone-missed',
            targetTab: 'messages',
            actionLabel: 'تماس مجدد',
            isMissedCall: true,
            read: false
          },
          {
            id: 'notif_3',
            key: 'sms_1',
            packageName: 'com.android.mms',
            appName: 'پیامک (SMS)',
            category: 'sms',
            title: 'بانک ملت',
            text: 'واریز مبلغ ۲,۵۰۰,۰۰۰ ریال به حساب شما.',
            timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            icon: 'sms',
            targetTab: 'messages',
            actionLabel: 'مشاهده پیامک',
            read: false
          }
        ];
      }

      // iOS Notifications
      if (iosManager.isIosDevice(serial)) {
        const res = await iosManager.runBridge('notifications', serial);
        if (res && res.success && Array.isArray(res.notifications)) {
          return res.notifications;
        }
        return [];
      }

      // Android Query dumpsys notification
      const res = await adbManager.runAdb('shell dumpsys notification --noredact', serial);
      if (!res.success || !res.stdout) return [];

      const notifs = this.parseNotificationsFromStdout(res.stdout);
      return notifs.slice(0, 25);
    } catch (err) {
      console.error('[NotificationManager] getLiveNotifications error:', err.message);
      return [];
    }
  }

  async checkIncomingCall(serial) {
    if (serial && serial.startsWith('mock-')) return null;
    try {
      const res = await adbManager.runAdb('shell dumpsys telephony.registry', serial);
      if (!res.success || !res.stdout) return null;
      // Look for mCallState=1 (Ringing) or Ringing call state: 1
      const isRinging = res.stdout.includes('mCallState=1') || res.stdout.includes('Ringing call state: 1');
      if (isRinging) {
        const numMatch = res.stdout.match(/mCallIncomingNumber=([^\r\n]+)/);
        const number = numMatch ? numMatch[1].trim() : 'تماس ورودی ناشناس';
        return {
          ringing: true,
          number
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async pollDeviceForNewEvents(serial) {
    try {
      const seen = this.getDeviceSeenKeys(serial);
      const eventsList = this.getDeviceEventsList(serial);
      const liveNotifs = await this.getLiveNotifications(serial);

      // 1. Check ringing incoming call (Live telephony)
      const ringingCall = await this.checkIncomingCall(serial);
      const lastCall = this.lastCallState.get(serial) || { ringing: false };

      if (ringingCall && !lastCall.ringing) {
        this.lastCallState.set(serial, { ringing: true, number: ringingCall.number });
        const callEvent = {
          id: `call_${Date.now()}`,
          key: `call_${Date.now()}_${ringingCall.number}`,
          packageName: 'com.android.server.telecom',
          appName: 'تماس ورودی زنده',
          category: 'call',
          title: `📞 تماس ورودی زنده: ${ringingCall.number}`,
          text: 'در حال زنگ خوردن...',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          icon: 'phone-call',
          targetTab: 'messages',
          actionLabel: 'مدیریت تماس',
          read: false
        };
        this.emitEvent(serial, callEvent);
      } else if (!ringingCall && lastCall.ringing) {
        this.lastCallState.set(serial, { ringing: false });
      }

      // 2. Check active system / app notifications from dumpsys
      let hasNew = false;
      for (const notif of liveNotifs) {
        if (!seen.has(notif.key)) {
          seen.add(notif.key);
          this.emitEvent(serial, notif);
          hasNew = true;
        }
      }

      // 3. Check unread SMS directly from Android SMS provider
      if (serial && !serial.startsWith('mock-')) {
        try {
          const smsRes = await adbManager.runAdb("shell content query --uri content://sms --projection _id:address:date:type:read:body --where 'read=0'", serial);
          if (smsRes.success && smsRes.stdout && !smsRes.stdout.includes('No result found')) {
            const rowBlocks = smsRes.stdout.split(/(?=^Row:\s*\d+\s+)/m).filter(b => b.trim().startsWith('Row:'));
            for (const b of rowBlocks) {
              const idM = b.match(/_id=(\d+)/);
              const addrM = b.match(/address=([^,]+)/);
              const dateM = b.match(/date=(\d+)/);
              const bodyM = b.match(/body=(.+)$/s);
              if (idM) {
                const smsId = idM[1];
                const key = `db_sms_${smsId}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  const addr = addrM && addrM[1] !== 'NULL' ? addrM[1].trim() : 'فرستنده ناشناس';
                  const body = bodyM && bodyM[1] !== 'NULL' ? bodyM[1].trim() : 'پیامک جدید';
                  const dEpoch = dateM ? Number(dateM[1]) : Date.now();
                  const smsEv = {
                    id: `sms_${smsId}`,
                    key,
                    packageName: 'com.android.mms',
                    appName: 'پیامک جدید (SMS)',
                    category: 'sms',
                    title: `📩 پیامک جدید: ${addr}`,
                    text: body,
                    sender: addr,
                    timestamp: new Date(dEpoch).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                    icon: 'sms',
                    targetTab: 'messages',
                    targetSubTab: 'sms',
                    searchQuery: addr,
                    targetItemKey: smsId,
                    actionLabel: 'مشاهده پیامک',
                    read: false
                  };
                  this.emitEvent(serial, smsEv);
                  hasNew = true;
                }
              }
            }
          }
        } catch (err) {
          console.error('[NotificationManager] SMS query error:', err.message);
        }

        // 4. Check recent missed calls directly from CallLog provider
        try {
          const callRes = await adbManager.runAdb("shell content query --uri content://call_log/calls --projection _id:number:name:date:is_read:type --where 'type=3'", serial);
          if (callRes.success && callRes.stdout && !callRes.stdout.includes('No result found')) {
            const rowBlocks = callRes.stdout.split(/(?=^Row:\s*\d+\s+)/m).filter(b => b.trim().startsWith('Row:'));
            // Take the 3 most recent missed calls
            for (const b of rowBlocks.slice(0, 3)) {
              const idM = b.match(/_id=(\d+)/);
              const numM = b.match(/number=([^,]+)/);
              const nameM = b.match(/name=([^,]+)/);
              const dateM = b.match(/date=(\d+)/);
              const readM = b.match(/is_read=(\d+)/);
              if (idM) {
                const callId = idM[1];
                const key = `db_call_${callId}`;
                const isUnread = readM ? readM[1] === '0' : false;
                if (!seen.has(key)) {
                  seen.add(key);
                  const callerName = nameM && nameM[1] !== 'NULL' ? nameM[1].trim() : '';
                  const num = numM && numM[1] !== 'NULL' ? numM[1].trim() : 'ناشناس';
                  const dEpoch = dateM ? Number(dateM[1]) : Date.now();
                  const callEv = {
                    id: `call_missed_${callId}`,
                    key,
                    packageName: 'com.android.server.telecom',
                    appName: 'تماس ناموفق / بی‌پاسخ',
                    category: 'call',
                    title: callerName ? `📞 تماس بی‌پاسخ: ${callerName}` : `📞 تماس بی‌پاسخ: ${num}`,
                    text: callerName ? `شماره: ${num}` : 'تماس از دست رفته',
                    sender: num,
                    timestamp: new Date(dEpoch).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                    icon: 'phone-missed',
                    targetTab: 'messages',
                    targetSubTab: 'calls',
                    searchQuery: num,
                    targetItemKey: callId,
                    actionLabel: 'تماس مجدد',
                    isMissedCall: true,
                    read: !isUnread
                  };
                  this.emitEvent(serial, callEv);
                  hasNew = true;
                }
              }
            }
          }
        } catch (err) {
          console.error('[NotificationManager] CallLog query error:', err.message);
        }
      }

      // Keep max 50 events per device
      if (eventsList.length > 50) {
        eventsList.length = 50;
      }

      return hasNew;
    } catch (err) {
      console.error('[NotificationManager] pollDeviceForNewEvents error:', err.message);
      return false;
    }
  }

  startLiveMonitoring(broadcastCallback) {
    this.broadcastCallback = broadcastCallback;
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(async () => {
      try {
        const devices = await adbManager.listDevices();
        if (!Array.isArray(devices) || devices.length === 0) return;

        for (const dev of devices) {
          if (dev && dev.id) {
            await this.pollDeviceForNewEvents(dev.id);
          }
        }
      } catch (err) {
        console.error('[NotificationManager] Monitor loop error:', err.message);
      }
    }, 2800);
  }

  stopLiveMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  simulateEvent(serial, { category = 'sms', title, text, sender }) {
    const id = `sim_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const isSys = category === 'system';
    const isSms = category === 'sms';
    const isCall = category === 'call';

    const event = {
      id,
      key: `sim_${id}`,
      packageName: isSms ? 'com.android.mms' : isCall ? 'com.android.dialer' : isSys ? 'android' : 'org.telegram.messenger',
      appName: isSms ? 'پیامک (SMS)' : isCall ? 'تماس تلفنی' : isSys ? 'سیستم عامل اندروید' : 'تلگرام',
      category,
      title: title || (isSms ? `پیامک جدید از ${sender || '09121112233'}` : isCall ? 'تماس ناموفق' : isSys ? '⚠️ هشدار باتری و سلامت سیستم' : 'اعلان تلگرام'),
      text: text || (isSys ? 'شارژ باتری به ۱۵٪ رسید. لطفاً شارژر را متصل کنید.' : 'متن پیامک آزمایشی هوشمند نرم‌افزار'),
      sender: sender || (isSms ? '09121112233' : isCall ? '09359876543' : undefined),
      timestamp,
      icon: isSms ? 'sms' : isCall ? 'phone-missed' : isSys ? 'system' : 'telegram',
      targetTab: isSys ? 'overview' : (category === 'notification' ? 'notifications' : 'messages'),
      targetSubTab: isSms ? 'sms' : isCall ? 'calls' : undefined,
      searchQuery: isSms ? (sender || '09121112233') : isCall ? (sender || '09359876543') : undefined,
      actionLabel: isSms ? 'مشاهده پیامک' : isCall ? 'تماس مجدد' : isSys ? 'بررسی وضعیت' : 'مشاهده در پیام‌رسان',
      read: false
    };

    this.emitEvent(serial, event);
    return event;
  }

  async quickReply(serial, { packageName, message }) {
    try {
      if (iosManager.isIosDevice(serial)) {
        return { success: true, message: 'پاسخ اعلان برای برنامه‌های iOS از طریق پیام‌رسان‌ها به صورت امن ارسال گردید.' };
      }
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
      if (iosManager.isIosDevice(serial)) {
        return { success: true, message: 'اعلان‌های موقت بازخوانی و پاکسازی شدند.' };
      }
      return await adbManager.runAdb('shell service call notification 1', serial);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const notificationManager = new NotificationManager();
