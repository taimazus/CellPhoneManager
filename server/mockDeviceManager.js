export class MockDeviceManager {
  constructor() {
    this.devices = [
      {
        id: 'mock-android-s24',
        name: 'Samsung Galaxy S24 Ultra (Virtual Demo)',
        type: 'android',
        serial: 'SM-S928B-DEMO',
        model: 'Galaxy S24 Ultra',
        manufacturer: 'Samsung',
        osVersion: 'Android 14 (OneUI 6.1)',
        apiLevel: 34,
        battery: {
          level: 84,
          status: 'Discharging',
          temperature: 31.4,
          health: 'Good (98%)',
          voltage: 4120,
          cycles: 142
        },
        storage: {
          total: '512 GB',
          used: '184 GB',
          free: '328 GB',
          usedPercentage: 36
        },
        ram: {
          total: '12 GB',
          used: '5.8 GB',
          free: '6.2 GB'
        },
        display: {
          resolution: '1440x3120',
          density: 500,
          refreshRate: '120Hz'
        },
        developerOptions: {
          usbDebugging: true,
          demoMode: false,
          pointerLocation: false,
          animScale: 1.0,
          layoutBounds: false,
          stayAwake: false
        },
        apps: [
          { packageName: 'com.whatsapp', appName: 'WhatsApp', version: '2.24.5', isSystem: false, size: '78 MB', enabled: true },
          { packageName: 'org.telegram.messenger', appName: 'Telegram', version: '10.8.2', isSystem: false, size: '92 MB', enabled: true },
          { packageName: 'com.instagram.android', appName: 'Instagram', version: '320.0', isSystem: false, size: '110 MB', enabled: true },
          { packageName: 'com.spotify.music', appName: 'Spotify', version: '8.9.14', isSystem: false, size: '64 MB', enabled: true },
          { packageName: 'com.sec.android.app.camera', appName: 'Samsung Camera', version: '14.0', isSystem: true, size: '45 MB', enabled: true },
          { packageName: 'com.samsung.android.bixby.agent', appName: 'Bixby Voice (Bloatware)', version: '3.3.4', isSystem: true, size: '54 MB', enabled: false },
          { packageName: 'com.google.android.youtube', appName: 'YouTube', version: '19.09', isSystem: true, size: '125 MB', enabled: true },
          { packageName: 'com.facebook.services', appName: 'Facebook Services (Bloatware)', version: '1.0', isSystem: true, size: '12 MB', enabled: false }
        ],
        contacts: [
          { id: '1', name: 'علی رضایی', phone: '09121234567', email: 'ali.rezaei@gmail.com', notes: 'همکار پروژه' },
          { id: '2', name: 'سارا احمدی', phone: '09359876543', email: 'sara.a@yahoo.com', notes: 'خانواده' },
          { id: '3', name: 'محمد حسینی', phone: '09195554433', email: 'm.hosseini@company.ir', notes: 'مدیر فنی' },
          { id: '4', name: 'پشتیبانی اسنپ', phone: '02141849000', email: 'support@snapp.cab', notes: 'خدمات مشتریان' },
          { id: '5', name: 'دفتر مهندسی', phone: '02188776655', email: 'info@engineering.com', notes: 'محل کار' }
        ],
        callLogs: [
          { id: '101', name: 'سارا احمدی', number: '09359876543', type: 'incoming', duration: '3m 42s', timestamp: 'امروز ۱۱:۱۰', date: '2026-10-07' },
          { id: '102', name: 'علی رضایی', number: '09121234567', type: 'outgoing', duration: '1m 15s', timestamp: 'دیروز ۱۸:۳۰', date: '2026-10-06' },
          { id: '103', name: 'ناشناس', number: '09109998877', type: 'missed', duration: '0s', timestamp: 'دیروز ۱۴:۱۵', date: '2026-10-06' },
          { id: '104', name: 'پشتیبانی اسنپ', number: '02141849000', type: 'incoming', duration: '45s', timestamp: '۳ روز پیش ۰۹:۲۰', date: '2026-10-04' },
          { id: '105', name: 'محمد حسینی', number: '09195554433', type: 'rejected', duration: '0s', timestamp: '۴ روز پیش ۲۰:۰۵', date: '2026-10-03' }
        ],
        smsMessages: [
          { id: '201', threadId: 't1', sender: 'بانک ملت', number: 'BankMellat', body: 'واریز: 5,000,000 ریال\nمانده: 48,250,000 ریال\n1405/07/16 - 10:45', timestamp: 'امروز ۱۰:۴۵', type: 'inbox', read: true },
          { id: '202', threadId: 't2', sender: 'اسنپ', number: 'Snapp', body: 'کد تایید ورود شما به اسنپ: 78421\nلطفا این کد را در اختیار دیگران قرار ندهید.', timestamp: 'امروز ۰۸:۳۰', type: 'inbox', read: true },
          { id: '203', threadId: 't3', sender: 'علی رضایی', number: '09121234567', body: 'سلام، فایل‌های پروژه رو برات ارسال کردم، بررسی کردی؟', timestamp: 'دیروز ۱۹:۰۰', type: 'inbox', read: true },
          { id: '204', threadId: 't3', sender: 'شما', number: '09121234567', body: 'سلام علی جان، بله دریافت شد. الان دارم نگاه می‌کنم.', timestamp: 'دیروز ۱۹:۰۵', type: 'sent', read: true },
          { id: '205', threadId: 't4', sender: 'سارا احمدی', number: '09359876543', body: 'ممنون، فردا ساعت ۵ عصر می‌بینمت.', timestamp: '۲ روز پیش ۱۶:۴۰', type: 'inbox', read: true }
        ]
      },
      {
        id: 'mock-ios-15pro',
        name: 'iPhone 15 Pro Max (Virtual Demo)',
        type: 'ios',
        serial: '00008130-001234567890ABC',
        model: 'iPhone 15 Pro Max (A3106)',
        manufacturer: 'Apple',
        osVersion: 'iOS 17.5.1',
        battery: {
          level: 92,
          status: 'Charging',
          temperature: 29.8,
          health: 'Maximum Capacity 100%',
          voltage: 4210,
          cycles: 68
        },
        storage: {
          total: '256 GB',
          used: '98 GB',
          free: '158 GB',
          usedPercentage: 38
        },
        ram: {
          total: '8 GB',
          used: '3.9 GB',
          free: '4.1 GB'
        },
        display: {
          resolution: '1290x2796',
          density: 460,
          refreshRate: '120Hz ProMotion'
        },
        developerOptions: {
          developerMode: true,
          uiAutomation: true,
          locationSpoofed: false
        },
        apps: [
          { packageName: 'com.apple.mobilesafari', appName: 'Safari', version: '17.0', isSystem: true, size: '24 MB', enabled: true },
          { packageName: 'com.apple.camera', appName: 'Camera', version: '17.0', isSystem: true, size: '18 MB', enabled: true },
          { packageName: 'ph.telegra.Telegraph', appName: 'Telegram Messenger', version: '10.8', isSystem: false, size: '140 MB', enabled: true },
          { packageName: 'com.burbn.instagram', appName: 'Instagram', version: '319.0', isSystem: false, size: '180 MB', enabled: true },
          { packageName: 'com.spotify.client', appName: 'Spotify Music', version: '8.9.10', isSystem: false, size: '115 MB', enabled: true },
          { packageName: 'com.google.Maps', appName: 'Google Maps', version: '6.98', isSystem: false, size: '135 MB', enabled: true }
        ],
        contacts: [
          { id: '1', name: 'مهرداد کریمی', phone: '09123334455', email: 'mehrdad@apple.com', notes: 'دوست دانشگاه' },
          { id: '2', name: 'خدمات اپل', phone: '02199887766', email: 'care@apple.ir', notes: 'گارانتی و سرویس' }
        ],
        callLogs: [
          { id: '101', name: 'مهرداد کریمی', number: '09123334455', type: 'incoming', duration: '2m 10s', timestamp: 'امروز ۱۰:۰۰', date: '2026-10-07' },
          { id: '102', name: 'ناشناس', number: '09301112233', type: 'missed', duration: '0s', timestamp: 'دیروز ۱۶:۰۰', date: '2026-10-06' }
        ],
        smsMessages: [
          { id: '201', threadId: 't1', sender: 'Apple Support', number: 'AppleID', body: 'Your Apple ID verification code is: 492014.', timestamp: 'امروز ۰۹:۰۰', type: 'inbox', read: true },
          { id: '202', threadId: 't2', sender: 'مهرداد کریمی', number: '09123334455', body: 'جلسه برای ساعت ۴ اوکی شد؟', timestamp: 'دیروز ۲۰:۳۰', type: 'inbox', read: true }
        ]
      }
    ];
  }

  getDevices() {
    return this.devices;
  }

  getDevice(id) {
    return this.devices.find(d => d.id === id || d.serial === id);
  }

  updateSetting(deviceId, settingKey, value) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    if (dev.developerOptions) {
      dev.developerOptions[settingKey] = value;
    }
    return true;
  }

  setAppStatus(deviceId, packageName, enabled) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    const app = dev.apps.find(a => a.packageName === packageName);
    if (app) {
      app.enabled = enabled;
      return true;
    }
    return false;
  }

  removeApp(deviceId, packageName) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    dev.apps = dev.apps.filter(a => a.packageName !== packageName);
    return true;
  }

  addApp(deviceId, newApp) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    dev.apps.unshift(newApp);
    return true;
  }

  // --- Contacts Management ---
  getContacts(deviceId) {
    const dev = this.getDevice(deviceId);
    return dev ? dev.contacts || [] : [];
  }

  addContact(deviceId, contact) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    if (!dev.contacts) dev.contacts = [];
    const newContact = { id: `c_${Date.now()}`, ...contact };
    dev.contacts.unshift(newContact);
    return newContact;
  }

  updateContact(deviceId, id, updatedData) {
    const dev = this.getDevice(deviceId);
    if (!dev || !dev.contacts) return false;
    const idx = dev.contacts.findIndex(c => c.id === id);
    if (idx !== -1) {
      dev.contacts[idx] = { ...dev.contacts[idx], ...updatedData };
      return dev.contacts[idx];
    }
    return false;
  }

  deleteContact(deviceId, id) {
    const dev = this.getDevice(deviceId);
    if (!dev || !dev.contacts) return false;
    dev.contacts = dev.contacts.filter(c => c.id !== id);
    return true;
  }

  // --- Call Logs & State Management ---
  getCallState(deviceId) {
    const dev = this.getDevice(deviceId);
    if (!dev) return { success: true, state: 'idle', isRinging: false, isInCall: false };
    if (!dev.activeCallState) {
      dev.activeCallState = { state: 'idle', incomingNumber: '', isRinging: false, isInCall: false };
    }
    return { success: true, ...dev.activeCallState };
  }

  simulateIncomingCall(deviceId, number = '09129876543') {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    dev.activeCallState = {
      state: 'ringing',
      incomingNumber: number,
      isRinging: true,
      isInCall: false,
      startTime: Date.now()
    };
    return dev.activeCallState;
  }

  answerCall(deviceId) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    const num = dev.activeCallState?.incomingNumber || '09129876543';
    dev.activeCallState = {
      state: 'offhook',
      incomingNumber: num,
      isRinging: false,
      isInCall: true,
      startTime: Date.now()
    };
    return { success: true, message: 'تماس با موفقیت پاسخ داده شد' };
  }

  endCall(deviceId) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    if (dev.activeCallState && dev.activeCallState.state !== 'idle') {
      const isWasRinging = dev.activeCallState.isRinging;
      this.addCallLog(deviceId, {
        name: 'مخاطب',
        number: dev.activeCallState.incomingNumber || 'ناشناس',
        type: isWasRinging ? 'missed' : 'incoming',
        duration: isWasRinging ? '0s' : '45s'
      });
    }
    dev.activeCallState = {
      state: 'idle',
      incomingNumber: '',
      isRinging: false,
      isInCall: false
    };
    return { success: true, message: 'تماس قطع / رد شد' };
  }

  getCallLogs(deviceId) {
    const dev = this.getDevice(deviceId);
    return dev ? dev.callLogs || [] : [];
  }

  addCallLog(deviceId, call) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    if (!dev.callLogs) dev.callLogs = [];
    const newCall = { id: `call_${Date.now()}`, timestamp: 'هم‌اکنون', ...call };
    dev.callLogs.unshift(newCall);
    return newCall;
  }

  deleteCallLog(deviceId, id) {
    const dev = this.getDevice(deviceId);
    if (!dev || !dev.callLogs) return false;
    dev.callLogs = dev.callLogs.filter(c => c.id !== id);
    return true;
  }

  clearCallLogs(deviceId) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    dev.callLogs = [];
    return true;
  }

  // --- SMS Messages Management ---
  getSms(deviceId) {
    const dev = this.getDevice(deviceId);
    return dev ? dev.smsMessages || [] : [];
  }

  sendSms(deviceId, { number, body, sender = 'شما' }) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    if (!dev.smsMessages) dev.smsMessages = [];
    const newMsg = {
      id: `sms_${Date.now()}`,
      threadId: `t_${number}`,
      sender,
      number,
      body,
      timestamp: 'هم‌اکنون',
      type: 'sent',
      read: true
    };
    dev.smsMessages.unshift(newMsg);
    return newMsg;
  }

  deleteSms(deviceId, id) {
    const dev = this.getDevice(deviceId);
    if (!dev || !dev.smsMessages) return false;
    dev.smsMessages = dev.smsMessages.filter(s => s.id !== id);
    return true;
  }

  clearSms(deviceId) {
    const dev = this.getDevice(deviceId);
    if (!dev) return false;
    dev.smsMessages = [];
    return true;
  }
}

export const mockDeviceManager = new MockDeviceManager();
