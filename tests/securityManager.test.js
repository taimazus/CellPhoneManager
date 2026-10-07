import { describe, it, expect } from 'vitest';
import { securityManager } from '../server/securityManager.js';

describe('SecurityManager Test Suite', () => {
  it('should initialize auth config and handle sessions', () => {
    const config = securityManager.getAuthConfig();
    expect(config).toHaveProperty('apiKey');
    expect(typeof config.authEnabled).toBe('boolean');

    const session = securityManager.createSession('admin');
    expect(session).toHaveProperty('token');
    expect(session.token.startsWith('cpm_')).toBe(true);

    const valid = securityManager.validateToken(session.token);
    expect(valid.valid).toBe(true);
  });

  it('should authenticate with API key and reject invalid keys', () => {
    const config = securityManager.getAuthConfig();
    const successRes = securityManager.authenticate(config.apiKey);
    expect(successRes.success).toBe(true);
    expect(successRes.session).toHaveProperty('token');

    const failRes = securityManager.authenticate('wrong_key_123');
    expect(failRes.success).toBe(false);
    expect(failRes.error).toBeDefined();
  });

  it('should enforce auth middleware when authEnabled is true', () => {
    const middleware = securityManager.getAuthMiddleware();
    expect(typeof middleware).toBe('function');

    // Test bypass for health / status
    let nextCalled = false;
    middleware({ path: '/api/health', headers: {} }, {}, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it('should log and retrieve audit events', () => {
    const logged = securityManager.logEvent({
      action: 'TEST_ACTION',
      status: 'SUCCESS',
      targetDevice: 'mock-phone-1',
      details: 'Audit logging unit test'
    });
    expect(logged).toHaveProperty('id');

    const logs = securityManager.getAuditLogs(10);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('TEST_ACTION');
  });
});
