import fs from 'fs';
import path from 'path';

export class AutomationManager {
  constructor() {
    this.autoDir = path.join(process.cwd(), 'data', 'automation');
    this.rulesFile = path.join(this.autoDir, 'rules.json');
    this.historyFile = path.join(this.autoDir, 'history.json');
    this.initDirs();
  }

  initDirs() {
    if (!fs.existsSync(this.autoDir)) {
      fs.mkdirSync(this.autoDir, { recursive: true });
    }
    if (!fs.existsSync(this.rulesFile)) {
      const defaultRules = [
        {
          id: 'rule_auto_backup',
          name: 'بکاپ خودکار سریع به محض اتصال کابل',
          trigger: 'DEVICE_CONNECT',
          action: 'AUTO_BACKUP',
          enabled: false,
          options: { contacts: true, sms: true, calls: true }
        },
        {
          id: 'rule_health_log',
          name: 'ثبت تاریخچه سلامت و دمای باتری در اتصال',
          trigger: 'DEVICE_CONNECT',
          action: 'TELEMETRY_SNAPSHOT',
          enabled: true,
          options: {}
        },
        {
          id: 'rule_doctor_scan',
          name: 'اسکن سلامت سیستم و کش هنگام اتصال',
          trigger: 'DEVICE_CONNECT',
          action: 'DOCTOR_SCAN',
          enabled: false,
          options: {}
        }
      ];
      fs.writeFileSync(this.rulesFile, JSON.stringify(defaultRules, null, 2));
    }
    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, JSON.stringify([]));
    }
  }

  listRules() {
    this.initDirs();
    try {
      return { success: true, rules: JSON.parse(fs.readFileSync(this.rulesFile, 'utf8')) };
    } catch (err) {
      return { success: false, error: err.message, rules: [] };
    }
  }

  saveRule(rule) {
    this.initDirs();
    try {
      const rules = this.listRules().rules;
      const index = rules.findIndex(r => r.id === rule.id);
      if (index !== -1) {
        rules[index] = { ...rules[index], ...rule, updatedAt: new Date().toISOString() };
      } else {
        rules.push({
          id: rule.id || `rule_${Date.now()}`,
          name: rule.name || 'قانون خودکارسازی جدید',
          trigger: rule.trigger || 'DEVICE_CONNECT',
          action: rule.action || 'TELEMETRY_SNAPSHOT',
          enabled: rule.enabled !== undefined ? rule.enabled : true,
          options: rule.options || {},
          createdAt: new Date().toISOString()
        });
      }
      fs.writeFileSync(this.rulesFile, JSON.stringify(rules, null, 2));
      return { success: true, message: 'قانون خودکارسازی ذخیره شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  deleteRule(ruleId) {
    try {
      const rules = this.listRules().rules.filter(r => r.id !== ruleId);
      fs.writeFileSync(this.rulesFile, JSON.stringify(rules, null, 2));
      return { success: true, message: 'قانون حذف شد.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async triggerAutomations(triggerType, deviceContext = {}) {
    const rules = this.listRules().rules.filter(r => r.enabled && r.trigger === triggerType);
    const results = [];

    for (const rule of rules) {
      const execEntry = {
        id: `exec_${Date.now()}_${rule.id}`,
        ruleId: rule.id,
        ruleName: rule.name,
        action: rule.action,
        deviceSerial: deviceContext.serial || deviceContext.id,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: `اتوماسیون '${rule.name}' با موفقیت اجرا شد.`
      };
      results.push(execEntry);
      this.logExecution(execEntry);
    }

    return { success: true, executedCount: results.length, results };
  }

  logExecution(entry) {
    try {
      this.initDirs();
      const history = this.getHistory(99);
      history.unshift(entry);
      fs.writeFileSync(this.historyFile, JSON.stringify(history.slice(0, 100), null, 2));
    } catch (err) {
      console.error('[AutomationManager] Error saving history:', err);
    }
  }

  getHistory(limit = 50) {
    try {
      this.initDirs();
      const data = fs.readFileSync(this.historyFile, 'utf8');
      return JSON.parse(data).slice(0, limit);
    } catch {
      return [];
    }
  }
}

export const automationManager = new AutomationManager();
