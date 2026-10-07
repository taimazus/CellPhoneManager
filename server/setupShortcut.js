import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('===============================================================================');
console.log('  نرم‌افزار جامع مدیریت گوشی (Cell Phone Manager)');
console.log('  شرکت راهکار الکترونیک سهند - https://irres.ir');
console.log('  نصب شورتکات روی دسکتاپ و ثبت در PATH ویندوز');
console.log('===============================================================================');
console.log(`\n[1/3] مسیر پروژه: ${projectRoot}`);

// 1. Add to User PATH
console.log('\n[2/3] در حال بررسی و افزودن مسیر برنامه به متغیر PATH کاربر...');
try {
  const psAddPath = `
    $proj = '${projectRoot.replace(/'/g, "''")}';
    [Environment]::SetEnvironmentVariable('CPM_HOME', $proj, 'User');
    $userPath = [Environment]::GetEnvironmentVariable('PATH', 'User');
    if ($userPath -notlike ('*' + $proj + '*')) {
      [Environment]::SetEnvironmentVariable('PATH', $userPath + ';' + $proj, 'User');
      Write-Host '   + مسیر به PATH کاربر اضافه شد.' -ForegroundColor Green;
    } else {
      Write-Host '   + مسیر برنامه قبلاً در PATH ثبت شده است.' -ForegroundColor Cyan;
    }
  `;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psAddPath.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('   ! خطا در افزودن به PATH:', err.message);
}

// 2. Create Desktop and Start Menu Shortcuts
console.log('\n[3/3] در حال ایجاد میانبر (Shortcut) روی دسکتاپ با آیکون اختصاصی...');
try {
  const icoPath = fs.existsSync(path.join(projectRoot, 'app-icon.ico')) 
    ? path.join(projectRoot, 'app-icon.ico') 
    : path.join(projectRoot, 'public', 'app-icon.ico');

  const psShortcut = `
    $WshShell = New-Object -ComObject WScript.Shell;
    $proj = '${projectRoot.replace(/'/g, "''")}';
    $targetBat = Join-Path $proj 'cpmStart.bat';
    $ico = '${icoPath.replace(/'/g, "''")}';

    # Desktop Shortcut
    $desktopPath = [Environment]::GetFolderPath('Desktop');
    $shortcutDesk = $WshShell.CreateShortcut((Join-Path $desktopPath 'Cell Phone Manager.lnk'));
    $shortcutDesk.TargetPath = $targetBat;
    $shortcutDesk.WorkingDirectory = $proj;
    $shortcutDesk.Description = 'نرم‌افزار جامع مدیریت و عیب‌یابی گوشی - شرکت راهکار الکترونیک سهند';
    if (Test-Path $ico) { $shortcutDesk.IconLocation = $ico + ', 0'; }
    $shortcutDesk.Save();
    Write-Host '   + میانبر دسکتاپ با موفقیت ساخته شد.' -ForegroundColor Green;

    # Start Menu Shortcut
    $programsPath = [Environment]::GetFolderPath('Programs');
    $shortcutSM = $WshShell.CreateShortcut((Join-Path $programsPath 'Cell Phone Manager.lnk'));
    $shortcutSM.TargetPath = $targetBat;
    $shortcutSM.WorkingDirectory = $proj;
    $shortcutSM.Description = 'نرم‌افزار جامع مدیریت گوشی';
    if (Test-Path $ico) { $shortcutSM.IconLocation = $ico + ', 0'; }
    $shortcutSM.Save();
    Write-Host '   + میانبر منوی Start با موفقیت اضافه شد.' -ForegroundColor Green;
  `;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psShortcut.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('   ! خطا در ساخت میانبر:', err.message);
}

console.log('\n===============================================================================');
console.log('  عملیات با موفقیت به پایان رسید:');
console.log('  ۱. میانبر "Cell Phone Manager" روی دسکتاپ شما قرار گرفت.');
console.log('  ۲. با تایپ دستور cpm در هر ترمینال (CMD یا PowerShell) برنامه اجرا می‌شود.');
console.log('  ۳. در منوی Start نیز Cell Phone Manager افزوده شد.');
console.log('===============================================================================\n');
