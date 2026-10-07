import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import http from 'http';
import net from 'net';
import { toolManager } from './toolManager.js';

console.log('\n======================================================');
console.log('   🔍 CellPhoneManager System Diagnostic & Preflight');
console.log('   بررسی و آماده‌سازی نیازمندی‌های سیستم');
console.log('======================================================\n');

async function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false); // In use
        } else {
          resolve(true);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port);
  });
}

async function runPreflight() {
  const issues = [];
  const fixes = [];

  // 1. Check Node.js version
  const nodeVer = process.version;
  const majorVer = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  console.log(`[1/5] 🟢 Node.js Runtime: ${nodeVer} (تأیید شد)`);
  if (majorVer < 18) {
    issues.push(`نسخه Node.js شما (${nodeVer}) قدیمی است. حداقل نسخه پیشنهادی v18 به بالا می‌باشد.`);
  }

  // 2. Ensure Required Directories
  const requiredDirs = ['uploads', 'bin', 'recordings', 'dist'];
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      fixes.push(`پوشه ضروری ${dir}/ ایجاد شد.`);
    }
  }
  console.log('[2/5] 🟢 ساختار پوشه‌های سیستمی: آماده و اعتبارسنجی شده');

  // 3. Check Platform Tools (ADB & Fastboot)
  try {
    const adbPath = await toolManager.getAdbPath();
    const adbCheck = await toolManager.checkTool(`"${adbPath}" version`);
    if (adbCheck.installed) {
      console.log(`[3/5] 🟢 ابزار ارتباطی ADB: فعال (${adbCheck.version})`);
    } else {
      console.log('[3/5] ⚠️ ابزار ADB در سیستم یافت نشد (حالت شبیه‌ساز یا دانلود خودکار در دسترس است)');
      fixes.push('می‌توانید در تب «پزشک درایورها» ابزار ADB را با ۱ کلیک به طور کامل دانلود و نصب کنید.');
    }
  } catch (err) {
    console.log(`[3/5] ⚠️ خطا در بررسی ADB: ${err.message}`);
  }

  // 4. Check Scrcpy for Screen Mirroring
  try {
    const scrcpyPath = await toolManager.getScrcpyPath();
    const scrcpyCheck = await toolManager.checkTool(`"${scrcpyPath}" --version`);
    if (scrcpyCheck.installed) {
      console.log(`[4/5] 🟢 موتور تصویر Scrcpy: فعال (${scrcpyCheck.version})`);
    } else {
      console.log('[4/5] ℹ️ موتور Scrcpy فعال نیست (نمایش زنده در وب آماده است و دانلود Scrcpy در تب پزشک درایورها ممکن است)');
    }
  } catch (err) {
    console.log(`[4/5] ℹ️ وضعیت Scrcpy: اختیاری`);
  }

  // 5. Check Ports
  const port3001Free = await checkPort(3001);
  const port5173Free = await checkPort(5173);

  console.log(`[5/5] 🌐 پورت‌های ارتباطی: Backend (3001): ${port3001Free ? 'آزاد' : 'در حال استفاده'} | Frontend (5173): ${port5173Free ? 'آزاد' : 'در حال استفاده'}`);

  if (fixes.length > 0) {
    console.log('\n🛠️ اقدامات خودکار انجام شده:');
    fixes.forEach(f => console.log(`   + ${f}`));
  }

  if (issues.length > 0) {
    console.log('\n⚠️ هشدارهای مهم:');
    issues.forEach(i => console.log(`   ! ${i}`));
  }

  console.log('\n✨ آماده‌سازی اولیه با موفقیت به پایان رسید.\n');
}

runPreflight().catch(err => {
  console.error('❌ خطای پیش‌بینی نشده در بررسی اولیه:', err.message);
});
