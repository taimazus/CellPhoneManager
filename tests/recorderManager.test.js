import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { recorderManager } from '../server/recorderManager.js';
import fs from 'fs';
import path from 'path';

describe('RecorderManager Test Suite', () => {
  const originalDir = recorderManager.getRecordingsDir();
  const testDir = path.join(process.cwd(), 'scratch', 'test-recordings');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    recorderManager.setRecordingsDir(originalDir);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should get default recordings directory', () => {
    const dir = recorderManager.getRecordingsDir();
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(0);
  });

  it('should change recordings directory and save config', () => {
    const res = recorderManager.setRecordingsDir(testDir);
    expect(res.success).toBe(true);
    expect(recorderManager.getRecordingsDir()).toBe(path.resolve(testDir));
  });

  it('should list and delete recorded files correctly', () => {
    recorderManager.setRecordingsDir(testDir);
    const dummyVideoPath = path.join(testDir, 'Recording_test.mp4');
    fs.writeFileSync(dummyVideoPath, 'dummy video data');

    const list = recorderManager.listRecordings();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Recording_test.mp4');

    const delRes = recorderManager.deleteRecording('Recording_test.mp4');
    expect(delRes.success).toBe(true);
    expect(fs.existsSync(dummyVideoPath)).toBe(false);
  });

  it('should return isRecording status correctly', () => {
    const status = recorderManager.getRecordingStatus('nonexistent-serial');
    expect(status.isRecording).toBe(false);
  });
});
