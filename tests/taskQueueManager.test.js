import { describe, it, expect } from 'vitest';
import { taskQueueManager } from '../server/taskQueueManager.js';

describe('TaskQueueManager Test Suite', () => {
  it('should enqueue batch jobs and monitor queue status', () => {
    const res = taskQueueManager.enqueue({
      type: 'HEALTH_CHECK',
      targetDevices: ['dev-1', 'dev-2'],
      priority: 'high'
    });
    expect(res.success).toBe(true);
    expect(res.queuedJobsCount).toBe(2);

    const status = taskQueueManager.getStatus();
    expect(status).toHaveProperty('concurrency');
    expect(status).toHaveProperty('activeJobs');
  });

  it('should handle pause and resume safely', () => {
    const pauseRes = taskQueueManager.pause();
    expect(pauseRes.isPaused).toBe(true);

    const resumeRes = taskQueueManager.resume();
    expect(resumeRes.isPaused).toBe(false);
  });
});
