import { exec } from 'child_process';
import util from 'util';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

const execAsync = util.promisify(exec);

export class FileManager {
  async listDirectory(serial, targetPath = '/sdcard/') {
    if (!serial || serial.startsWith('mock-')) {
      return [
        { name: 'DCIM', isDir: true, size: '4.2 GB', permissions: 'drwxrwx---', modified: '2026-10-01 14:20' },
        { name: 'Download', isDir: true, size: '1.8 GB', permissions: 'drwxrwx---', modified: '2026-10-06 09:12' },
        { name: 'Documents', isDir: true, size: '240 MB', permissions: 'drwxrwx---', modified: '2026-09-28 18:45' },
        { name: 'Pictures', isDir: true, size: '890 MB', permissions: 'drwxrwx---', modified: '2026-10-05 11:30' },
        { name: 'Music', isDir: true, size: '3.1 GB', permissions: 'drwxrwx---', modified: '2026-09-15 20:00' },
        { name: 'Movies', isDir: true, size: '6.5 GB', permissions: 'drwxrwx---', modified: '2026-08-20 16:10' },
        { name: 'Android', isDir: true, size: '12.4 GB', permissions: 'drwxrwx---', modified: '2026-10-07 08:00' },
        { name: 'sample_document.pdf', isDir: false, size: '2.4 MB', permissions: '-rw-rw----', modified: '2026-10-04 15:33' }
      ];
    }

    try {
      const adbPath = await toolManager.getAdbPath();
      const serialFlag = serial ? `-s ${serial}` : '';
      const safePath = targetPath.endsWith('/') ? targetPath : targetPath + '/';
      const cmd = `"${adbPath}" ${serialFlag} shell ls -l "${safePath}"`;
      
      const { stdout } = await execAsync(cmd);
      const lines = stdout.trim().split('\n');
      const items = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('total')) continue;
        
        const parts = trimmed.split(/\s+/);
        if (parts.length < 8) continue;

        const permissions = parts[0];
        const isDir = permissions.startsWith('d');
        const size = isDir ? 'Folder' : `${Math.round((parseInt(parts[4], 10) || 0) / 1024)} KB`;
        const date = `${parts[5]} ${parts[6]}`;
        const name = parts.slice(7).join(' ');

        if (name === '.' || name === '..') continue;

        items.push({
          name,
          isDir,
          size,
          permissions,
          modified: date
        });
      }

      // Sort folders first, then files alphabetically
      items.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      return items;
    } catch (err) {
      console.error('File list error:', err);
      return [];
    }
  }

  async pushFile(serial, localFilePath, remoteDirPath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'فایل با موفقیت ارسال شد (شبیه‌ساز)' };
    }
    const safeDest = remoteDirPath.endsWith('/') ? remoteDirPath : remoteDirPath + '/';
    return await adbManager.runAdb(`push "${localFilePath}" "${safeDest}"`, serial);
  }

  async pullFile(serial, remoteFilePath, localDestPath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'فایل با موفقیت دریافت شد' };
    }
    return await adbManager.runAdb(`pull "${remoteFilePath}" "${localDestPath}"`, serial);
  }

  async deleteFile(serial, remotePath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'فایل یا پوشه با موفقیت حذف شد' };
    }
    return await adbManager.runAdb(`shell rm -rf "${remotePath}"`, serial);
  }

  async createDirectory(serial, remoteDirPath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'پوشه ایجاد شد' };
    }
    return await adbManager.runAdb(`shell mkdir -p "${remoteDirPath}"`, serial);
  }

  async renameFile(serial, oldRemotePath, newRemotePath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'تغییر نام با موفقیت انجام شد (شبیه‌ساز)' };
    }
    return await adbManager.runAdb(`shell mv "${oldRemotePath}" "${newRemotePath}"`, serial);
  }

  async moveFile(serial, srcRemotePath, destDirPath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'انتقال با موفقیت انجام شد (شبیه‌ساز)' };
    }
    const safeDest = destDirPath.endsWith('/') ? destDirPath : destDirPath + '/';
    return await adbManager.runAdb(`shell mv "${srcRemotePath}" "${safeDest}"`, serial);
  }

  async copyFile(serial, srcRemotePath, destDirPath) {
    if (!serial || serial.startsWith('mock-')) {
      return { success: true, message: 'کپی با موفقیت انجام شد (شبیه‌ساز)' };
    }
    const safeDest = destDirPath.endsWith('/') ? destDirPath : destDirPath + '/';
    return await adbManager.runAdb(`shell cp -r "${srcRemotePath}" "${safeDest}"`, serial);
  }
}

export const fileManager = new FileManager();
