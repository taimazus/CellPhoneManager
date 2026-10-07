import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('============================================================================');
console.log('  Cell Phone Manager - Sahand Electronic Solutions (https://irres.ir)');
console.log('  Desktop Shortcut & User PATH Setup');
console.log('===========================================================================');
console.log(`[1/3] Project Root: ${projectRoot}`);

console.log('\n[2/3] Adding project directory to User PATH...');
try {
  const projEsc = projectRoot.replace(/'/g, "''");
  const psScript = `$cpmHome='${projEsc}'; [Environment]::SetEnvironmentVariable('CPM_HOME',$cpmHome,'User'); $upath=[Environment]::GetEnvironmentVariable('PATH','User'); if($upath -notlike ('*' + $cpmHome + '*')){ [Environment]::SetEnvironmentVariable('PATH',$upath+';'+$cpmHome,'User'); Write-Host '   + PATH registered successfully.' -ForegroundColor Green; } else { Write-Host '   + PATH already registered.' -ForegroundColor Cyan; }`;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('   ! PATH setup warning:', err.message);
}

console.log('\n[3/3] Creating Desktop and Start Menu Shortcuts with custom icon...');
try {
  const icoPath = fs.existsSync(path.join(projectRoot, 'app-icon.ico'))
    ? path.join(projectRoot, 'app-icon.ico')
    : path.join(projectRoot, 'public', 'app-icon.ico');
  const targetBat = path.join(projectRoot, 'cpmStart.bat');

  const vbsLines = [
    'Set oWS = WScript.CreateObject("WScript.Shell")',
    'sDesk = oWS.SpecialFolders("Desktop")',
    'sProg = oWS.SpecialFolders("Programs")',
    'sTarget = ' + JSON.stringify(targetBat),
    'sWork = ' + JSON.stringify(projectRoot),
    'sIcon = ' + JSON.stringify(icoPath + ',0'),
    'Set oLink = oWS.CreateShortcut(sDesk & "\\Cell Phone Manager.lnk")',
    'oLink.TargetPath = sTarget',
    'oLink.WorkingDirectory = sWork',
    'oLink.Description = "Cell Phone Manager - Sahand Electronic Solutions"',
    'oLink.IconLocation = sIcon',
    'oLink.Save',
    'Set oLinkP = oWS.CreateShortcut(sProg & "\\Cell Phone Manager.lnk")',
    'oLinkP.TargetPath = sTarget',
    'oLinkP.WorkingDirectory = sWork',
    'oLinkP.Description = "Cell Phone Manager"',
    'oLinkP.IconLocation = sIcon',
    'oLinkP.Save'
  ].join('\r\n');

  const tempVbs = path.join(projectRoot, '_temp_sc.vbs');
  fs.writeFileSync(tempVbs, vbsLines, 'utf8');
  execSync(`cscript //nologo "${tempVbs}"`, { stdio: 'inherit' });
  if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
  console.log('   + Desktop shortcut created at: %USERPROFILE%\\Desktop\\Cell Phone Manager.lnk');
  console.log('   + Start Menu shortcut created in Programs.');
} catch (err) {
  console.error('   ! Shortcut creation error:', err.message);
}

console.log('\n=============================================================================');
console.log('  Setup completed successfully!');
console.log('  1. Desktop shortcut "Cell Phone Manager" is ready.');
console.log('  2. You can type "cpm" in any terminal (CMD / PowerShell / Run) to launch.');
console.log('=============================================================================\n');
