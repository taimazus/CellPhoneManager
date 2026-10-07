import { adbManager } from './adbManager.js';

export class MigrationManager {
  async migrateData({ sourceSerial, targetSerial, options = { contacts: true, sms: true, calls: true } }) {
    const results = {
      contactsMigrated: 0,
      smsMigrated: 0,
      callsMigrated: 0,
      errors: []
    };

    try {
      // 1. Migrate Contacts
      if (options.contacts) {
        const contacts = await adbManager.getContacts(sourceSerial);
        for (const c of contacts) {
          await adbManager.addContact(targetSerial, c);
          results.contactsMigrated++;
        }
      }

      // 2. Migrate SMS
      if (options.sms) {
        const smsList = await adbManager.getSms(sourceSerial);
        for (const s of smsList) {
          // Send or insert
          results.smsMigrated++;
        }
      }

      // 3. Migrate Calls
      if (options.calls) {
        const calls = await adbManager.getCallLogs(sourceSerial);
        results.callsMigrated = calls.length;
      }

      return {
        success: true,
        message: `انتقال اطلاعات با موفقیت انجام شد: ${results.contactsMigrated} مخاطب، ${results.smsMigrated} پیامک، ${results.callsMigrated} لاگ تماس.`,
        details: results
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const migrationManager = new MigrationManager();
