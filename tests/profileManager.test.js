import { describe, it, expect } from 'vitest';
import { profileManager } from '../server/profileManager.js';

describe('ProfileManager Test Suite', () => {
  it('should list default profiles and calculate diff', () => {
    const listRes = profileManager.listProfiles();
    expect(listRes.success).toBe(true);
    expect(listRes.profiles.length).toBeGreaterThan(0);

    const diff = profileManager.calculateDiff(
      { refreshRate: 60, darkMode: false },
      { refreshRate: 120, darkMode: true }
    );
    expect(diff.length).toBe(2);
    expect(diff[0].key).toBe('refreshRate');
  });

  it('should create and list snapshots for rollback', () => {
    const snap = profileManager.createSnapshot('test-dev-snap', {
      refreshRate: 90,
      animationScale: 1.0
    });
    expect(snap).toHaveProperty('snapshotId');

    const snapsList = profileManager.listSnapshots('test-dev-snap');
    expect(snapsList.success).toBe(true);
    expect(snapsList.snapshots.length).toBeGreaterThan(0);
  });
});
