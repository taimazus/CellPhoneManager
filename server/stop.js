import { execSync } from 'child_process';

const PORTS = [3001, 5173, 5174, 5175];

console.log('🔍 Checking and releasing active ports...');

for (const port of PORTS) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const state = parts[3];
          const pid = parts[4];
          if (state === 'LISTENING' && pid && pid !== '0' && pid !== `${process.pid}`) {
            pids.add(pid);
          }
        }
      }
      
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`🟢 Terminated process PID ${pid} on port ${port}`);
        } catch {
          // ignore if already exited
        }
      }
    }
  } catch {
    // Port not in use
  }
}

// Also kill any orphaned scrcpy processes
if (process.platform === 'win32') {
  try {
    execSync('taskkill /F /IM scrcpy.exe', { stdio: 'ignore' });
    console.log('🟢 Terminated scrcpy mirror sessions.');
  } catch {
    // scrcpy wasn't running
  }
}

console.log('✅ All CellPhoneManager services stopped successfully.');
