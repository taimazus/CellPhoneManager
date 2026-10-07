import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { adbManager } from './adbManager.js';
import { iosManager } from './iosManager.js';
import { fileManager } from './fileManager.js';

export class UniversalBackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  getBackupDir() {
    this.ensureBackupDir();
    return this.backupDir;
  }

  // 1. List all local PC backups
  async listBackups() {
    try {
      this.ensureBackupDir();
      const entries = fs.readdirSync(this.backupDir, { withFileTypes: true });
      const backups = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metaPath = path.join(this.backupDir, entry.name, 'manifest.json');
          if (fs.existsSync(metaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
              backups.push({
                id: entry.name,
                path: path.join(this.backupDir, entry.name),
                ...meta
              });
            } catch (err) {
              console.error(`[UniversalBackupManager] Error parsing manifest for ${entry.name}:`, err);
            }
          }
        }
      }

      // Sort newest first
      return {
        success: true,
        backups: backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      };
    } catch (e) {
      console.error('[UniversalBackupManager] listBackups error:', e);
      return { success: false, error: e.message, backups: [] };
    }
  }

  // 2. Create Full or Custom Backup
  async createBackup({ serial, type = 'android', deviceName = 'Device', options = {}, destinationTarget = 'pc' }) {
    try {
      this.ensureBackupDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeDeviceName = (deviceName || 'Device').replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_');
      const backupFolderName = `backup_${timestamp}_${safeDeviceName}`;
      const targetDir = path.join(this.backupDir, backupFolderName);
      fs.mkdirSync(targetDir, { recursive: true });

      const isFull = options.contacts && options.sms && options.calls && options.apps && options.media;

      const manifest = {
        deviceName,
        deviceType: type,
        serial,
        createdAt: new Date().toISOString(),
        backupMode: isFull ? 'full' : 'custom',
        destinationTarget,
        items: {
          contactsCount: 0,
          smsCount: 0,
          callsCount: 0,
          mediaFilesCount: 0,
          appsCount: 0
        },
        included: options
      };

      if (serial.startsWith('mock-')) {
        // Mock data backup
        if (options.contacts) manifest.items.contactsCount = 142;
        if (options.sms) manifest.items.smsCount = 589;
        if (options.calls) manifest.items.callsCount = 76;
        if (options.media) manifest.items.mediaFilesCount = 312;
        if (options.apps) manifest.items.appsCount = 48;

        fs.writeFileSync(path.join(targetDir, 'contacts.json'), JSON.stringify([
          { name: 'علی رضایی', phone: '09121112233' },
          { name: 'سارا محمدی', phone: '09359998877' }
        ], null, 2));

        fs.writeFileSync(path.join(targetDir, 'contacts.vcf'), `BEGIN:VCARD\nVERSION:3.0\nFN:علی رضایی\nTEL;TYPE=CELL:09121112233\nEND:VCARD\nBEGIN:VCARD\nVERSION:3.0\nFN:سارا محمدی\nTEL;TYPE=CELL:09359998877\nEND:VCARD\n`, 'utf8');

        fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        return {
          success: true,
          message: isFull ? 'پشتیبان‌گیری کامل (شبیه‌ساز) با موفقیت انجام شد.' : 'پشتیبان‌گیری سفارشی (شبیه‌ساز) با موفقیت انجام شد.',
          manifest,
          backupId: backupFolderName,
          destinationTarget
        };
      }

      // Live Device Backup
      if (type === 'android') {
        // 1. Contacts
        if (options.contacts) {
          try {
            const contacts = await adbManager.getContacts(serial);
            manifest.items.contactsCount = contacts.length;
            fs.writeFileSync(path.join(targetDir, 'contacts.json'), JSON.stringify(contacts, null, 2));

            // Also generate standard .vcf (vCard 3.0) for universal cross-platform iOS & PC compatibility
            let vcfContent = '';
            contacts.forEach(c => {
              vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name || 'بدون نام'}\nTEL;TYPE=CELL:${c.phone || ''}\nEND:VCARD\n`;
            });
            fs.writeFileSync(path.join(targetDir, 'contacts.vcf'), vcfContent, 'utf8');
          } catch (cErr) {
            console.error('[UniversalBackupManager] Error backing up contacts:', cErr);
          }
        }

        // 2. SMS Messages
        if (options.sms) {
          try {
            const smsList = await adbManager.getSms(serial);
            manifest.items.smsCount = smsList.length;
            fs.writeFileSync(path.join(targetDir, 'messages.json'), JSON.stringify(smsList, null, 2));
          } catch (sErr) {
            console.error('[UniversalBackupManager] Error backing up SMS:', sErr);
          }
        }

        // 3. Call Logs
        if (options.calls) {
          try {
            const callLogs = await adbManager.getCallLogs(serial);
            manifest.items.callsCount = callLogs.length;
            fs.writeFileSync(path.join(targetDir, 'calls.json'), JSON.stringify(callLogs, null, 2));
          } catch (clErr) {
            console.error('[UniversalBackupManager] Error backing up call logs:', clErr);
          }
        }

        // 4. Installed Apps List
        if (options.apps) {
          try {
            const appsRes = await adbManager.getInstalledApps(serial);
            manifest.items.appsCount = appsRes.length;
            fs.writeFileSync(path.join(targetDir, 'apps_list.json'), JSON.stringify(appsRes, null, 2));
          } catch (aErr) {
            console.error('[UniversalBackupManager] Error backing up apps list:', aErr);
          }
        }

        // 5. Media (Camera Photos / DCIM Sample / Directory info)
        if (options.media) {
          try {
            const mediaDir = path.join(targetDir, 'media');
            fs.mkdirSync(mediaDir, { recursive: true });
            const files = await fileManager.listFiles(serial, '/sdcard/DCIM/Camera', 'android');
            if (files && files.length > 0) {
              manifest.items.mediaFilesCount = files.length;
              fs.writeFileSync(path.join(mediaDir, 'media_manifest.json'), JSON.stringify(files, null, 2));
            }
          } catch (mErr) {
            console.error('[UniversalBackupManager] Error indexing media:', mErr);
          }
        }

        // Destination: Phone Storage (/sdcard/CellPhoneManager_Backups)
        if (destinationTarget === 'phone' || destinationTarget === 'both') {
          try {
            const phoneBackupDir = `/sdcard/CellPhoneManager_Backups/${backupFolderName}`;
            await adbManager.executeCommand(serial, `mkdir -p "${phoneBackupDir}"`);
            
            // Push manifest and vCard to device
            if (fs.existsSync(path.join(targetDir, 'contacts.vcf'))) {
              await adbManager.pushFile(serial, path.join(targetDir, 'contacts.vcf'), `${phoneBackupDir}/contacts.vcf`);
            }
            if (fs.existsSync(path.join(targetDir, 'contacts.json'))) {
              await adbManager.pushFile(serial, path.join(targetDir, 'contacts.json'), `${phoneBackupDir}/contacts.json`);
            }
          } catch (pErr) {
            console.error('[UniversalBackupManager] Error pushing backup to phone:', pErr);
          }
        }
      }

      // Write Manifest
      fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

      const modeText = isFull ? 'کامل' : 'سفارشی';
      const destText = destinationTarget === 'phone' ? 'حافظه گوشی' : (destinationTarget === 'both' ? 'کامپیوتر و گوشی' : 'کامپیوتر');

      return {
        success: true,
        message: `عملیات پشتیبان‌گیری ${modeText} با موفقیت در ${destText} ذخیره گردید.`,
        manifest,
        backupId: backupFolderName,
        destinationTarget
      };
    } catch (e) {
      console.error('[UniversalBackupManager] createBackup error:', e);
      return { success: false, error: e.message };
    }
  }

  validateAndResolveBackupPath(backupId) {
    if (!backupId || typeof backupId !== 'string') {
      return null;
    }
    const cleanId = backupId.trim();
    if (!/^[a-zA-Z0-9_\-\u0600-\u06FF.]+$/.test(cleanId) || cleanId.includes('..')) {
      return null;
    }
    const resolvedBackupDir = path.resolve(this.backupDir);
    const resolvedTarget = path.resolve(resolvedBackupDir, cleanId);
    if (!resolvedTarget.startsWith(resolvedBackupDir + path.sep)) {
      return null;
    }
    return resolvedTarget;
  }

  // 3. Restore Backup to Any Device (Cross-Platform)
  async restoreBackup({ backupId, targetSerial, targetType = 'android', options = { contacts: true, sms: true, calls: true } }) {
    try {
      const backupPath = this.validateAndResolveBackupPath(backupId);
      if (!backupPath) {
        return { success: false, error: 'شناسه نسخه پشتیبان نامعتبر است (مسیر غیرمجاز).' };
      }
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'پوشه نسخه پشتیبان یافت نشد.' };
      }

      const metaPath = path.join(backupPath, 'manifest.json');
      const manifest = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : null;

      const results = {
        contactsRestored: 0,
        smsRestored: 0,
        smsStaged: 0,
        callsRestored: 0,
        callsStaged: 0,
        notes: []
      };

      if (targetSerial && targetSerial.startsWith('mock-')) {
        return {
          success: true,
          message: `بازیابی اطلاعات (${manifest?.deviceName || 'بک‌آپ'}) روی دستگاه ${targetSerial} با موفقیت انجام شد (شبیه‌ساز).`,
          details: { contactsRestored: 142, smsStaged: 589, callsStaged: 76 }
        };
      }

      // Restore Contacts
      if (options.contacts && fs.existsSync(path.join(backupPath, 'contacts.json'))) {
        const contacts = JSON.parse(fs.readFileSync(path.join(backupPath, 'contacts.json'), 'utf8'));
        if (targetType === 'android' && Array.isArray(contacts)) {
          for (const c of contacts) {
            try {
              await adbManager.addContact(targetSerial, c);
              results.contactsRestored++;
            } catch (err) {
              console.error('[UniversalBackupManager] Error adding contact during restore:', err);
            }
          }
        }
      }

      // Restore SMS and Calls staging on device
      if (targetType === 'android' && targetSerial) {
        const stageDir = '/sdcard/CellPhoneManager_Restore/';
        if (options.sms && fs.existsSync(path.join(backupPath, 'messages.json'))) {
          const smsList = JSON.parse(fs.readFileSync(path.join(backupPath, 'messages.json'), 'utf8'));
          if (Array.isArray(smsList)) {
            results.smsStaged = smsList.length;
            try {
              await fileManager.pushFile(targetSerial, path.join(backupPath, 'messages.json'), stageDir);
              results.notes.push(`تعداد ${smsList.length} پیامک در مسیر ${stageDir}messages.json قرار گرفت.`);
            } catch (err) {
              console.error('[UniversalBackupManager] Error staging SMS:', err);
            }
          }
        }

        if (options.calls && fs.existsSync(path.join(backupPath, 'calls.json'))) {
          const calls = JSON.parse(fs.readFileSync(path.join(backupPath, 'calls.json'), 'utf8'));
          if (Array.isArray(calls)) {
            results.callsStaged = calls.length;
            try {
              await fileManager.pushFile(targetSerial, path.join(backupPath, 'calls.json'), stageDir);
              results.notes.push(`تعداد ${calls.length} تماس در مسیر ${stageDir}calls.json قرار گرفت.`);
            } catch (err) {
              console.error('[UniversalBackupManager] Error staging Calls:', err);
            }
          }
        }
      }

      let summaryMsg = `بازیابی انجام شد: ${results.contactsRestored} مخاطب بازگردانی شد.`;
      if (results.smsStaged > 0 || results.callsStaged > 0) {
        summaryMsg += ` فایل‌های پیامک (${results.smsStaged}) و تماس (${results.callsStaged}) در حافظه گوشی ذخیره شدند.`;
      }

      return {
        success: true,
        message: summaryMsg,
        details: results
      };
    } catch (e) {
      console.error('[UniversalBackupManager] restoreBackup error:', e);
      return { success: false, error: e.message };
    }
  }

  // 4. Delete Backup
  async deleteBackup(backupId) {
    try {
      const backupPath = this.validateAndResolveBackupPath(backupId);
      if (!backupPath) {
        return { success: false, error: 'شناسه نسخه پشتیبان نامعتبر است (مسیر غیرمجاز).' };
      }
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
        return { success: true, message: 'نسخه پشتیبان با موفقیت حذف شد.' };
      }
      return { success: false, error: 'نسخه پشتیبان یافت نشد.' };
    } catch (e) {
      console.error('[UniversalBackupManager] deleteBackup error:', e);
      return { success: false, error: e.message };
    }
  }

  // 5. Open Backup Folder in Windows Explorer
  async openBackupFolder() {
    this.ensureBackupDir();
    return new Promise((resolve) => {
      exec(`explorer.exe "${this.backupDir}"`, (err) => {
        if (err) {
          console.error('[UniversalBackupManager] explorer error:', err);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, message: 'پوشه بک‌آپ‌ها در ویندوز باز شد.' });
        }
      });
    });
  }
}

export const universalBackupManager = new UniversalBackupManager();
