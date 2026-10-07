import { EventEmitter } from 'events';

export class TaskQueueManager extends EventEmitter {
  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
    this.queue = [];
    this.activeJobs = new Map(); // jobId -> job
    this.history = [];
    this.isPaused = false;
  }

  enqueue({ type, targetDevices = [], payload = {}, priority = 'normal', createdBy = 'user' }) {
    const batchId = 'batch_' + Date.now();
    const jobs = targetDevices.map((serial, index) => ({
      id: `${batchId}_${index}_${serial}`,
      batchId,
      type,
      serial,
      payload,
      priority,
      createdBy,
      status: 'pending', // pending, running, completed, failed, cancelled
      progress: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null
    }));

    if (priority === 'high') {
      this.queue.unshift(...jobs);
    } else {
      this.queue.push(...jobs);
    }

    this.emit('queue_updated', this.getStatus());
    this.processNext();

    return {
      success: true,
      batchId,
      queuedJobsCount: jobs.length,
      jobs: jobs.map(j => ({ id: j.id, serial: j.serial, status: j.status }))
    };
  }

  async processNext() {
    if (this.isPaused) return;
    if (this.activeJobs.size >= this.concurrency) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job || job.status === 'cancelled') {
      return this.processNext();
    }

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.progress = 10;
    this.activeJobs.set(job.id, job);
    this.emit('job_started', job);

    // Simulated task execution or hook
    setTimeout(async () => {
      try {
        job.progress = 100;
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.result = { message: `عملیات ${job.type} روی دستگاه ${job.serial} با موفقیت اجرا شد.` };
      } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        job.completedAt = new Date().toISOString();
      } finally {
        this.activeJobs.delete(job.id);
        this.history.unshift({ ...job });
        if (this.history.length > 100) this.history.pop();
        this.emit('job_completed', job);
        this.processNext();
      }
    }, 1200);
  }

  cancelJob(jobId) {
    const queueIndex = this.queue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      const [removed] = this.queue.splice(queueIndex, 1);
      removed.status = 'cancelled';
      removed.completedAt = new Date().toISOString();
      this.history.unshift(removed);
      this.emit('queue_updated', this.getStatus());
      return { success: true, message: 'عملیات در صف لغو شد.' };
    }

    const active = this.activeJobs.get(jobId);
    if (active) {
      active.status = 'cancelled';
      active.completedAt = new Date().toISOString();
      this.activeJobs.delete(jobId);
      this.history.unshift({ ...active });
      this.emit('queue_updated', this.getStatus());
      this.processNext();
      return { success: true, message: 'عملیات فعال متوقف و لغو گردید.' };
    }

    return { success: false, error: 'عملیات یافت نشد.' };
  }

  pause() {
    this.isPaused = true;
    this.emit('queue_updated', this.getStatus());
    return { success: true, isPaused: true };
  }

  resume() {
    this.isPaused = false;
    this.emit('queue_updated', this.getStatus());
    this.processNext();
    return { success: true, isPaused: false };
  }

  getStatus() {
    return {
      isPaused: this.isPaused,
      concurrency: this.concurrency,
      activeCount: this.activeJobs.size,
      queuedCount: this.queue.length,
      activeJobs: Array.from(this.activeJobs.values()),
      queue: this.queue.slice(0, 20),
      recentHistory: this.history.slice(0, 30)
    };
  }

  clearHistory() {
    this.history = [];
    return { success: true, message: 'تاریخچه صف عملیات پاک شد.' };
  }
}

export const taskQueueManager = new TaskQueueManager(2);
