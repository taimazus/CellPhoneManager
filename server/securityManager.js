import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class SecurityManager {
  constructor() {
    this.securityDir = path.join(process.cwd(), 'data', 'security');
    this.auditLogFile = path.join(this.securityDir, 'audit_log.json');
    this.authConfigFile = path.join(this.securityDir, 'auth_config.json');
    this.activeSessions = new Map(); // token -> { createdAt, lastActive, role }
    this.initSecurity();
  }

  initSecurity() {
    if (!fs.existsSync(this.securityDir)) {
      fs.mkdirSync(this.securityDir, { recursive: true });
    }
    if (!fs.existsSync(this.auditLogFile)) {
      fs.writeFileSync(this.auditLogFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.authConfigFile)) {
      const defaultKey = crypto.randomBytes(24).toString('hex');
      fs.writeFileSync(this.authConfigFile, JSON.stringify({
        authEnabled: false, // Default local open, toggleable by user
        apiKey: defaultKey,
        createdAt: new Date().toISOString()
      }, null, 2));
    }
  }

  getAuthConfig() {
    try {
      this.initSecurity();
      return JSON.parse(fs.readFileSync(this.authConfigFile, 'utf8'));
    } catch {
      return { authEnabled: false, apiKey: '' };
    }
  }

  setAuthConfig({ authEnabled, apiKey }) {
    try {
      const current = this.getAuthConfig();
      const updated = {
        ...current,
        authEnabled: typeof authEnabled === 'boolean' ? authEnabled : current.authEnabled,
        apiKey: apiKey && typeof apiKey === 'string' ? apiKey.trim() : current.apiKey,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.authConfigFile, JSON.stringify(updated, null, 2));
      this.logEvent({
        action: 'SECURITY_CONFIG_UPDATE',
        status: 'SUCCESS',
        details: `تنظیمات احراز هویت بروز شد (وضعیت: ${updated.authEnabled ? 'فعال' : 'غیرفعال'})`
      });
      return { success: true, config: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  createSession(role = 'admin') {
    const token = 'cpm_' + crypto.randomBytes(32).toString('hex');
    const session = {
      token,
      role,
      createdAt: new Date().toISOString(),
      lastActive: Date.now()
    };
    this.activeSessions.set(token, session);
    this.logEvent({
      action: 'SESSION_CREATE',
      status: 'SUCCESS',
      details: 'نشست جدید امنیتی ایجاد شد'
    });
    return session;
  }

  validateToken(token) {
    const config = this.getAuthConfig();
    if (!config.authEnabled) return { valid: true, role: 'admin' };
    if (!token) return { valid: false, error: 'توکن امنیتی ارسال نشده است' };

    // Check Master API Key
    if (token === config.apiKey) return { valid: true, role: 'admin' };

    // Check Active Sessions
    const session = this.activeSessions.get(token);
    if (session) {
      session.lastActive = Date.now();
      return { valid: true, role: session.role };
    }
    return { valid: false, error: 'توکن نامعتبر یا منقضی شده است' };
  }

  logEvent({ action, status = 'SUCCESS', targetDevice = null, details = '', ip = '127.0.0.1' }) {
    try {
      this.initSecurity();
      const entry = {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        action,
        status,
        targetDevice,
        details,
        ip
      };
      const logs = this.getAuditLogs(199);
      logs.unshift(entry);
      fs.writeFileSync(this.auditLogFile, JSON.stringify(logs.slice(0, 200), null, 2));
      return entry;
    } catch (err) {
      console.error('[SecurityManager] Error logging audit event:', err);
      return null;
    }
  }

  getAuditLogs(limit = 100) {
    try {
      this.initSecurity();
      const data = fs.readFileSync(this.auditLogFile, 'utf8');
      const logs = JSON.parse(data);
      return Array.isArray(logs) ? logs.slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  clearAuditLogs() {
    try {
      this.initSecurity();
      fs.writeFileSync(this.auditLogFile, JSON.stringify([]));
      return { success: true, message: 'لاگ‌های امنیتی با موفقیت پاک شدند.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const securityManager = new SecurityManager();
