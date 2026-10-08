import { exec } from 'child_process';
import util from 'util';
import { toolManager } from './toolManager.js';
import { adbManager } from './adbManager.js';

const execAsync = util.promisify(exec);

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));
  return `${val} ${sizes[i]}`;
}

export class FileManager {
  async listDirectory(serial, targetPath = '/sdcard/') {
    if (!serial || serial.startsWith('mock-')) {
      return [
        { name: 'DCIM', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-10-01 14:20' },
        { name: 'Download', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-10-06 09:12' },
        { name: 'Documents', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-09-28 18:45' },
        { name: 'Pictures', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-10-05 11:30' },
        { name: 'Music', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-09-15 20:00' },
        { name: 'Movies', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-08-20 16:10' },
        { name: 'Android', isDir: true, size: 'پوشه', sizeBytes: 0, permissions: 'drwxrwx---', modified: '2026-10-07 08:00' },
        { name: 'sample_document.pdf', isDir: false, size: '2.4 MB', sizeBytes: 2516582, permissions: '-rw-rw----', modified: '2026-10-04 15:33' },
        { name: 'presentation.pptx', isDir: false, size: '14.8 MB', sizeBytes: 15518924, permissions: '-rw-rw----', modified: '2026-10-05 12:10' },
        { name: 'video_clip.mp4', isDir: false, size: '52.3 MB', sizeBytes: 54840320, permissions: '-rw-rw----', modified: '2026-10-06 18:40' },
        { name: 'photo_highres.jpg', isDir: false, size: '4.7 MB', sizeBytes: 4928307, permissions: '-rw-rw----', modified: '2026-10-07 10:30' },
        { name: 'audio_recording.mp3', isDir: false, size: '8.2 MB', sizeBytes: 8598323, permissions: '-rw-rw----', modified: '2026-10-07 11:15' },
        { name: 'quick_notes.txt', isDir: false, size: '14.2 KB', sizeBytes: 14540, permissions: '-rw-rw----', modified: '2026-10-07 12:00' }
      ];
    }

    try {
      const adbPath = await toolManager.getAdbPath();
      const serialFlag = serial ? `-s ${serial}` : '';
      const cleanPath = (targetPath || '/sdcard/').replace(/["`$!]/g, '');
      const safePath = cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';
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
        const isDir = permissions.startsWith('d') || permissions.startsWith('l');
        const rawBytes = parseInt(parts[4], 10) || 0;
        const size = isDir ? 'پوشه' : formatFileSize(rawBytes);
        const date = `${parts[5]} ${parts[6]}`;
        const name = parts.slice(7).join(' ');

        if (name === '.' || name === '..') continue;

        items.push({
          name,
          isDir,
          size,
          sizeBytes: isDir ? 0 : rawBytes,
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
