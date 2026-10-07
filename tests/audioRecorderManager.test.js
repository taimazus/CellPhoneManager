import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { audioRecorderManager } from '../server/audioRecorderManager.js';
import fs from 'fs';
import path from 'path';

describe('AudioRecorderManager Test Suite', () => {
  const originalDir = audioRecorderManager.getAudioDir();
  const testDir = path.join(process.cwd(), 'scratch', 'test-audio-recordings');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    audioRecorderManager.setAudioDir(originalDir);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should get valid audio recordings directory', () => {
    const dir = audioRecorderManager.getAudioDir();
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(0);
  });

  it('should change audio directory and persist config', () => {
    const res = audioRecorderManager.setAudioDir(testDir);
    expect(res.success).toBe(true);
    expect(audioRecorderManager.getAudioDir()).toBe(path.resolve(testDir));
  });

  it('should list and delete audio recording files', () => {
    audioRecorderManager.setAudioDir(testDir);
    const dummyAudioPath = path.join(testDir, 'Audio_test.opus');
    fs.writeFileSync(dummyAudioPath, 'dummy audio stream data');

    const list = audioRecorderManager.listAudioRecordings();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Audio_test.opus');

    const delRes = audioRecorderManager.deleteAudio('Audio_test.opus');
    expect(delRes.success).toBe(true);
    expect(fs.existsSync(dummyAudioPath)).toBe(false);
  });

  it('should return initial status correctly', () => {
    const status = audioRecorderManager.getStatus('nonexistent-device');
    expect(status.isStreaming).toBe(false);
    expect(status.isRecording).toBe(false);
  });
});
