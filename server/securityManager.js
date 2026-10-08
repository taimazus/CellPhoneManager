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

  isLoopbackIp(ip) {
    if (!ip) return false;
    const clean = String(ip).trim();
    return clean === '127.0.0.1' || clean === '::1' || clean === '::ffff:127.0.0.1' || clean === 'localhost';
  }

  getSafeAuthConfig(isAuthenticated = false) {
    const config = this.getAuthConfig();
    return {
      authEnabled: config.authEnabled,
      apiKey: isAuthenticated ? config.apiKey : (config.apiKey ? '••••••••' + config.apiKey.slice(-4) : ''),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };
  }

  setAuthConfig({ authEnabled, apiKey }, callerIp = '127.0.0.1') {
    try {
      const current = this.getAuthConfig();
      const updated = {
        ...current,
        authEnabled: typeof authEnabled === 'boolean' ? authEnabled : current.authEnabled,
        apiKey: apiKey && typeof apiKey === 'string' && apiKey.trim().length >= 8 ? apiKey.trim() : current.apiKey,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.authConfigFile, JSON.stringify(updated, null, 2));
      this.logEvent({
        action: 'SECURITY_CONFIG_UPDATE',
        status: 'SUCCESS',
        details: `تنظیمات احراز هویت بروز شد (وضعیت: ${updated.authEnabled ? 'فعال' : 'غیرفعال'})`,
        ip: callerIp
      });
      return { success: true, config: this.getSafeAuthConfig(true) };
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
    if (!token) return { valid: false, error: 'توکن امنیتی ارسال نشده است' };

    // Check Master API Key
    if (token === config.apiKey) return { valid: true, role: 'admin' };

    // Check Active Sessions
    const session = this.activeSessions.get(token);
    if (session) {
      // 24h session expiration
      if (Date.now() - session.lastActive > 24 * 60 * 60 * 1000) {
        this.activeSessions.delete(token);
        return { valid: false, error: 'نشست امنیتی منقضی شده است' };
      }
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
      fs.writeFileSync(this.auditLogFile, JSON.stringify([]));
      return { success: true, message: 'لاگ‌های ممیزی پاکسازی شدند.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  authenticate(key) {
    const config = this.getAuthConfig();
    if (key && (key === config.apiKey || (config.authEnabled === false && key === 'local_admin'))) {
      const session = this.createSession('admin');
      this.logEvent({
        action: 'LOGIN_SUCCESS',
        status: 'SUCCESS',
        details: 'ورود موفق مدیر سیستم'
      });
      return { success: true, session };
    }
    this.logEvent({
      action: 'LOGIN_FAILURE',
      status: 'FAILED',
      details: 'تلاش ناموفق برای ورود با کلید API نامعتبر'
    });
    return { success: false, error: 'کلید API نامعتبر است' };
  }

  getAuthMiddleware() {
    return (req, res, next) => {
      // Exclude public non-API assets, health check, and login endpoint
      const publicPaths = [
        '/api/health',
        '/api/security/auth/status',
        '/api/security/auth/login'
      ];
      if (publicPaths.includes(req.path) || !req.path.startsWith('/api/')) {
        return next();
      }

      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const isLoopback = this.isLoopbackIp(clientIp);
      const config = this.getAuthConfig();

      // Non-loopback callers ALWAYS require authentication regardless of authEnabled
      const requiresAuth = config.authEnabled || !isLoopback || req.path.includes('/security/auth/config') || req.path.includes('/security/config');

      if (!requiresAuth) {
        return next();
      }

      const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || req.query.apiKey;
      let token = null;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (authHeader) {
        token = String(authHeader).trim();
      }

      const validation = this.validateToken(token);
      if (!validation.valid) {
        this.logEvent({
          action: 'UNAUTHORIZED_API_CALL',
          status: 'BLOCKED',
          details: `مسیر ${req.method} ${req.path} به دلیل نبود یا نامعتبر بودن توکن مسدود شد (IP: ${clientIp})`,
          ip: clientIp
        });
        return res.status(401).json({
          success: false,
          error: validation.error || 'دسترسی غیرمجاز: لطفاً کلید امنیتی یا توکن ورود را ارائه دهید'
        });
      }

      req.user = { role: validation.role };
      next();
    };
  }
}

export const securityManager = new SecurityManager();

