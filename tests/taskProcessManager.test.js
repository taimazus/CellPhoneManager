import { describe, it, expect } from 'vitest';
import { taskProcessManager } from '../server/taskProcessManager.js';

describe('TaskProcessManager Test Suite', () => {
  const mockId = 'mock-android-s24';

  it('should get running processes and tasks summary', async () => {
    const res = await taskProcessManager.getRunningTasks(mockId);
    expect(res.success).toBe(true);
    expect(res.tasks.length).toBeGreaterThan(0);
    expect(res.summary).toBeDefined();
    expect(res.summary.totalRamUsedMb).toBeGreaterThan(0);
  });

  it('should query startup apps', async () => {
    const res = await taskProcessManager.getStartupApps(mockId);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.startupApps)).toBe(true);
    expect(res.startupApps.length).toBeGreaterThan(0);
  });

  it('should query background services', async () => {
    const res = await taskProcessManager.getBackgroundServices(mockId);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.backgroundServices)).toBe(true);
  });

  it('should toggle startup state for an app', async () => {
    const res = await taskProcessManager.setStartupState(mockId, {
      packageName: 'org.telegram.messenger',
      enabled: false
    });
    expect(res.success).toBe(true);

    const apps = await taskProcessManager.getStartupApps(mockId);
    const tg = apps.startupApps.find(a => a.packageName === 'org.telegram.messenger');
    expect(tg?.bootEnabled).toBe(false);
  });

  it('should limit background activity', async () => {
    const res = await taskProcessManager.setBackgroundLimit(mockId, {
      packageName: 'org.telegram.messenger',
      allowBackground: false
    });
    expect(res.success).toBe(true);
  });

  it('should kill a specific process and purge all background tasks', async () => {
    const killRes = await taskProcessManager.killProcess(mockId, { packageName: 'com.spotify.music' });
    expect(killRes.success).toBe(true);

    const purgeRes = await taskProcessManager.killAllBackground(mockId);
    expect(purgeRes.success).toBe(true);
    expect(purgeRes.freedRamMb).toBeGreaterThan(0);
  });
});
