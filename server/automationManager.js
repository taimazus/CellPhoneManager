import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

const execAsync = util.promisify(exec);

export class AutomationManager {
  constructor() {
    this.activeRecordings = new Map(); // serial -> actions[]
    this.runningMacros = new Map(); // serial -> boolean
  }

  // Record an action
  recordAction(serial, action) {
    if (!this.activeRecordings.has(serial)) {
      this.activeRecordings.set(serial, []);
    }
    const list = this.activeRecordings.get(serial);
    list.push({ ...action, timestamp: Date.now() });
    return list;
  }

  startRecording(serial) {
    this.activeRecordings.set(serial, []);
    return { success: true, message: 'ضبط ماکرو آغاز شد.' };
  }

  stopRecording(serial) {
    const list = this.activeRecordings.get(serial) || [];
    return { success: true, actions: list, count: list.length, message: 'ضبط ماکرو متوقف شد.' };
  }

  getRecordedActions(serial) {
    return this.activeRecordings.get(serial) || [];
  }

  // Play a sequence of macro actions
  async playMacro(serial, { actions, repeat = 1, speed = 1 }, progressCallback = () => {}) {
    if (!actions || actions.length === 0) {
      return { success: false, error: 'هیچ عملیاتی برای اجرا وجود ندارد.' };
    }

    this.runningMacros.set(serial, true);

    try {
      for (let r = 1; r <= repeat; r++) {
        if (!this.runningMacros.get(serial)) break;
        progressCallback({ iteration: r, totalIterations: repeat, status: 'running' });

        for (let i = 0; i < actions.length; i++) {
          if (!this.runningMacros.get(serial)) break;
          const act = actions[i];

          if (act.type === 'tap') {
            await adbManager.sendTap(serial, act.x, act.y);
          } else if (act.type === 'swipe') {
            await adbManager.runAdb(`shell input swipe ${act.x1} ${act.y1} ${act.x2} ${act.y2} ${act.duration || 300}`, serial);
          } else if (act.type === 'key') {
            await adbManager.sendKeyEvent(serial, act.keycode);
          } else if (act.type === 'text') {
            await adbManager.sendTextInput(serial, act.text);
          } else if (act.type === 'delay') {
            const ms = Math.max(50, (act.duration || 500) / speed);
            await new Promise(res => setTimeout(res, ms));
          }

          // Default small delay between macro steps
          const stepDelay = Math.max(50, (act.delay || 300) / speed);
          await new Promise(res => setTimeout(res, stepDelay));
        }
      }

      this.runningMacros.set(serial, false);
      return { success: true, message: `ماکرو با موفقیت ${repeat} بار اجرا شد.` };
    } catch (err) {
      this.runningMacros.set(serial, false);
      return { success: false, error: err.message };
    }
  }

  stopMacro(serial) {
    this.runningMacros.set(serial, false);
    return { success: true, message: 'اجرای ماکرو متوقف شد.' };
  }
}

export const automationManager = new AutomationManager();
