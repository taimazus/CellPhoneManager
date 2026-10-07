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
