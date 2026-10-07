import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  FolderPlus, 
  ArrowUp, 
  RefreshCw, 
  Search, 
  HardDrive, 
  FileText, 
  Image, 
  Music, 
  Film, 
  Archive,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileCode,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Move,
  Copy,
  Scissors,
  Clipboard,
  CheckSquare,
  Square,
  CornerDownLeft,
  Camera,
  Mic,
  Share2,
  Grid3X3,
  Maximize2,
  ChevronsRight,
  ChevronsLeft,
  Layers
} from 'lucide-react';
import { Device } from '../types';

interface FileItem {
  name: string;
  isDir: boolean;
  size: string;
  permissions: string;
  modified: string;
}

interface FilesTabProps {
  device: Device | null;
}

export const FilesTab: React.FC<FilesTabProps> = ({ device }) => {
  const [currentPath, setCurrentPath] = useState('/sdcard/');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'date_desc' | 'date_asc'>('name_asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact' | 'large' | 'tiles'>('grid');
  const [gridZoom, setGridZoom] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [pageSize, setPageSize] = useState<number | 'all'>(48);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals State
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [moveItem, setMoveItem] = useState<FileItem | null>(null);
  const [targetMoveDir, setTargetMoveDir] = useState('/sdcard/');

  // Clipboard (Cut / Copy & Paste)
  const [clipboard, setClipboard] = useState<{ mode: 'cut' | 'copy'; item: FileItem; srcDir: string } | null>(null);

  // Multi-select
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; ext: string } | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFiles = async (targetPath = currentPath) => {
    if (!device) return;
    setLoading(true);
    setSelectedItems(new Set());
    try {
      const res = await fetch(`/api/devices/${device.id}/files?path=${encodeURIComponent(targetPath)}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setCurrentPath(data.currentPath || targetPath);
      }
    } catch (err: any) {
      showToast(`خطا در بارگذاری فایل‌ها: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles('/sdcard/');
  }, [device?.id]);

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath.endsWith('/') 
      ? `${currentPath}${folderName}/` 
      : `${currentPath}/${folderName}/`;
    fetchFiles(newPath);
  };

  const handleGoUp = () => {
    if (currentPath === '/' || currentPath === '/sdcard/') return;
    const parts = currentPath.replace(/\/$/, '').split('/');
    parts.pop();
    const parentPath = parts.join('/') + '/';
    fetchFiles(parentPath || '/sdcard/');
  };

  const handleBreadcrumbClick = (index: number, parts: string[]) => {
    const target = '/' + parts.slice(0, index + 1).join('/') + '/';
    fetchFiles(target);
  };

  // Upload Multiple Files
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !device) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetDir', currentPath);

      try {
        const res = await fetch(`/api/devices/${device.id}/files/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        }
      } catch (err: any) {
        console.error('Upload error:', err);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      showToast(`${successCount} فایل با موفقیت به این پوشه منتقل شد.`, 'success');
      fetchFiles(currentPath);
    } else {
      showToast('خطا در ارسال فایل‌ها.', 'error');
    }
  };

  // Download File
  const handleDownload = (fileName: string) => {
    if (!device) return;
    const fullPath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    window.open(`/api/devices/${device.id}/files/download?remotePath=${encodeURIComponent(fullPath)}`);
  };

  // Delete Single Item (File or Folder)
  const handleDelete = async (item: FileItem) => {
    if (!device) return;
    const label = item.isDir ? `پوشه "${item.name}" و تمام محتویات آن` : `فایل "${item.name}"`;
    if (!confirm(`آیا از حذف ${label} اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`)) return;

    const fullPath = currentPath.endsWith('/') ? `${currentPath}${item.name}` : `${currentPath}/${item.name}`;
    try {
      const res = await fetch(`/api/devices/${device.id}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remotePath: fullPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${item.name} با موفقیت حذف شد.`, 'success');
        fetchFiles(currentPath);
      } else {
        showToast(`خطا در حذف: ${data.error || 'ناشناخته'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Batch Delete Selected Items
  const handleBatchDelete = async () => {
    if (!device || selectedItems.size === 0) return;
    if (!confirm(`آیا از حذف ${selectedItems.size} مورد انتخاب شده اطمینان دارید؟`)) return;

    let successCount = 0;
    for (const name of Array.from(selectedItems)) {
      const fullPath = currentPath.endsWith('/') ? `${currentPath}${name}` : `${currentPath}/${name}`;
      try {
        const res = await fetch(`/api/devices/${device.id}/files/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remotePath: fullPath })
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch {}
    }

    showToast(`${successCount} مورد با موفقیت حذف شد.`, 'success');
    fetchFiles(currentPath);
  };

  // Create Folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !device) return;
    const newDirPath = currentPath.endsWith('/') ? `${currentPath}${newFolderName.trim()}` : `${currentPath}/${newFolderName.trim()}`;
    try {
      const res = await fetch(`/api/devices/${device.id}/files/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: newDirPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`پوشه "${newFolderName.trim()}" ایجاد شد.`, 'success');
        setShowNewFolderModal(false);
        setNewFolderName('');
        fetchFiles(currentPath);
      } else {
        showToast(`خطا در ایجاد پوشه: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Open Rename Modal
  const handleOpenRename = (item: FileItem) => {
    setRenameItem(item);
    setRenameInput(item.name);
  };

  // Submit Rename
  const handleRenameSubmit = async () => {
    if (!renameItem || !renameInput.trim() || !device) return;
    if (renameInput.trim() === renameItem.name) {
      setRenameItem(null);
      return;
    }

    const oldPath = currentPath.endsWith('/') ? `${currentPath}${renameItem.name}` : `${currentPath}/${renameItem.name}`;
    const newPath = currentPath.endsWith('/') ? `${currentPath}${renameInput.trim()}` : `${currentPath}/${renameInput.trim()}`;

    try {
      const res = await fetch(`/api/devices/${device.id}/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath, newPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast('نام با موفقیت تغییر کرد.', 'success');
        setRenameItem(null);
        fetchFiles(currentPath);
      } else {
        showToast(`خطا در تغییر نام: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Cut / Move Clipboard Actions
  const handleCutItem = (item: FileItem) => {
    setClipboard({ mode: 'cut', item, srcDir: currentPath });
    showToast(`"${item.name}" برش داده شد. به پوشه مقصد بروید و "جای‌گذاری (Paste)" را بزنید.`);
  };

  const handleCopyItem = (item: FileItem) => {
    setClipboard({ mode: 'copy', item, srcDir: currentPath });
    showToast(`"${item.name}" کپی شد. به پوشه مقصد بروید و "جای‌گذاری (Paste)" را بزنید.`);
  };

  const handlePasteClipboard = async () => {
    if (!clipboard || !device) return;
    const srcPath = clipboard.srcDir.endsWith('/') ? `${clipboard.srcDir}${clipboard.item.name}` : `${clipboard.srcDir}/${clipboard.item.name}`;
    const endpoint = clipboard.mode === 'cut' ? '/api/devices/${device.id}/files/move' : '/api/devices/${device.id}/files/copy';

    try {
      const res = await fetch(endpoint.replace('${device.id}', device.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srcPath, destDirPath: currentPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast(clipboard.mode === 'cut' ? 'انتقال با موفقیت انجام شد.' : 'کپی با موفقیت انجام شد.', 'success');
        setClipboard(null);
        fetchFiles(currentPath);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Open Direct Move Modal
  const handleOpenMoveModal = (item: FileItem) => {
    setMoveItem(item);
    setTargetMoveDir(currentPath);
  };

  const handleDirectMoveSubmit = async () => {
    if (!moveItem || !targetMoveDir.trim() || !device) return;
    const srcPath = currentPath.endsWith('/') ? `${currentPath}${moveItem.name}` : `${currentPath}/${moveItem.name}`;
    try {
      const res = await fetch(`/api/devices/${device.id}/files/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srcPath, destDirPath: targetMoveDir.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${moveItem.name}" به پوشه مقصد منتقل شد.`, 'success');
        setMoveItem(null);
        fetchFiles(currentPath);
      } else {
        showToast(`خطا در انتقال: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  // Toggle Item Selection
  const toggleSelect = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedItems(next);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.name)));
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (item: FileItem) => {
    if (!device || item.isDir) return;

    const fullPath = currentPath.endsWith('/') ? `${currentPath}${item.name}` : `${currentPath}/${item.name}`;
    const previewUrl = `/api/devices/${device.id}/files/preview?remotePath=${encodeURIComponent(fullPath)}`;
    const ext = item.name.split('.').pop()?.toLowerCase() || '';

    setImageRotation(0);
    setImageZoom(1);
    setIsMediaLoading(true);
    setPreviewTextContent(null);
    setPreviewFile({ name: item.name, url: previewUrl, ext });

    // If text file, fetch text directly
    if (['txt', 'log', 'json', 'xml', 'md', 'js', 'ts', 'html', 'css', 'py', 'sh', 'ini', 'prop'].includes(ext)) {
      setPreviewLoading(true);
      try {
        const res = await fetch(previewUrl);
        const text = await res.text();
        setPreviewTextContent(text);
      } catch (e: any) {
        setPreviewTextContent(`خطا در خواندن فایل متنی: ${e.message}`);
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const getFileCategory = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return 'audio';
    if (['txt', 'log', 'json', 'xml', 'md', 'js', 'py', 'sh', 'html', 'css'].includes(ext)) return 'text';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'other';
  };

  const getItemPreviewUrl = (fileName: string) => {
    if (!device) return '';
    const fullPath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    return `/api/devices/${device.id}/files/preview?remotePath=${encodeURIComponent(fullPath)}`;
  };

  const filteredItems = items
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Always keep directories on top
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;

      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'fa');
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'fa');
      if (sortBy === 'size_desc') return (parseFloat(b.size) || 0) - (parseFloat(a.size) || 0);
      if (sortBy === 'size_asc') return (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0);
      if (sortBy === 'date_desc') return (new Date(b.modified || 0).getTime()) - (new Date(a.modified || 0).getTime());
      if (sortBy === 'date_asc') return (new Date(a.modified || 0).getTime()) - (new Date(b.modified || 0).getTime());
      return 0;
    });

  // Reset page when search, sort, path or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentPath, search, sortBy, pageSize]);

  // Pagination calculations
  const totalItems = filteredItems.length;
  const effectivePageSize = pageSize === 'all' ? totalItems : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = pageSize === 'all' ? 0 : (safeCurrentPage - 1) * effectivePageSize;
  const paginatedItems = pageSize === 'all' ? filteredItems : filteredItems.slice(startIndex, startIndex + effectivePageSize);

  // Previous & Next file navigation in preview modal
  const previewableFiles = filteredItems.filter(i => !i.isDir);
  const currentFileIndex = previewFile ? previewableFiles.findIndex(i => i.name === previewFile.name) : -1;
  const hasPrev = currentFileIndex > 0;
  const hasNext = currentFileIndex >= 0 && currentFileIndex < previewableFiles.length - 1;

  const handlePrevFile = () => {
    if (hasPrev) {
      handleOpenPreview(previewableFiles[currentFileIndex - 1]);
    }
  };

  const handleNextFile = () => {
    if (hasNext) {
      handleOpenPreview(previewableFiles[currentFileIndex + 1]);
    }
  };

  // Keyboard navigation for preview modal
  useEffect(() => {
    if (!previewFile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setPreviewFile(null);
      } else if (e.key === 'ArrowRight') {
        if (hasPrev) {
          e.preventDefault();
          handlePrevFile();
        }
      } else if (e.key === 'ArrowLeft') {
        if (hasNext) {
          e.preventDefault();
          handleNextFile();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewFile, currentFileIndex, previewableFiles, hasPrev, hasNext]);

  // Clean breadcrumb parts
  const breadcrumbParts = currentPath.split('/').filter(Boolean);

  return (
    <div 
      className="space-y-6 animate-fadeIn"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleUploadFiles(e.dataTransfer.files);
      }}
    >
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-cyan-400" />
            <span>مدیریت فایل و چندرسانه‌ای گوشی (File Explorer & Studio)</span>
          </h2>
          <p className="text-xs text-slate-400">
            حذف، تغییر نام، انتقال به پوشه‌ها، دانلود، آپلود دسته‌جمعی، ساخت و حذف پوشه، و پیش‌نمایش زنده تصاویر و موزیک
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Upload Button */}
          <input
            type="file"
            id="fileUploadInput"
            multiple
            onChange={(e) => handleUploadFiles(e.target.files)}
            disabled={isUploading}
            className="hidden"
          />
          <label
            htmlFor="fileUploadInput"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md ${
              isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'در حال ارسال...' : 'آپلود فایل به این پوشه'}</span>
          </label>

          {/* New Folder Button */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>پوشه جدید</span>
          </button>

          {/* Clipboard Paste Button */}
          {clipboard && (
            <button
              onClick={handlePasteClipboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-lg animate-pulse"
              title={`جای‌گذاری "${clipboard.item.name}" در این پوشه`}
            >
              <Clipboard className="w-4 h-4" />
              <span>جای‌گذاری ({clipboard.mode === 'cut' ? 'انتقال' : 'کپی'})</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchFiles(currentPath)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all shadow-sm"
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Drag & Drop Overlay Indicator */}
      {isDragOver && (
        <div className="p-8 border-2 border-dashed border-cyan-400 rounded-3xl bg-cyan-500/10 text-center animate-pulse">
          <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">فایل‌ها را همین‌جا رها کنید تا در این پوشه آپلود شوند</h3>
          <p className="text-xs text-cyan-300 font-mono mt-1">{currentPath}</p>
        </div>
      )}

      {/* Navigation Path & Quick Folder Shortcuts */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs py-1">
          <button
            onClick={handleGoUp}
            disabled={currentPath === '/' || currentPath === '/sdcard/'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all flex-shrink-0"
            title="پوشه بالا (Up)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchFiles('/sdcard/')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 font-mono font-bold flex items-center gap-1.5 flex-shrink-0"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>حافظه اصلی</span>
          </button>

          {breadcrumbParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <span className="text-slate-600 font-mono">/</span>
              <button
                onClick={() => handleBreadcrumbClick(idx, breadcrumbParts)}
                className={`px-2.5 py-1 rounded-lg font-mono transition-all flex-shrink-0 ${
                  idx === breadcrumbParts.length - 1 
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Quick Shortcut Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-thin">
          {[
            { name: 'حافظه اصلی', path: '/sdcard/', icon: HardDrive },
            { name: 'دانلودها', path: '/sdcard/Download/', icon: Download },
            { name: 'فیلم و ویدیو', path: '/sdcard/Movies/', icon: Film },
            { name: 'دوربین و عکس', path: '/sdcard/DCIM/Camera/', icon: Camera },
            { name: 'تصاویر', path: '/sdcard/Pictures/', icon: Image },
            { name: 'موزیک', path: '/sdcard/Music/', icon: Music },
            { name: 'اسناد', path: '/sdcard/Documents/', icon: FileText },
            { name: 'ضبط صدا', path: '/sdcard/Recordings/', icon: Mic },
            { name: 'اسکرین‌شات', path: '/sdcard/Pictures/Screenshots/', icon: Scissors },
            { name: 'بلوتوث', path: '/sdcard/Bluetooth/', icon: Share2 }
          ].map(shortcut => {
            const Icon = shortcut.icon;
            const isActive = currentPath === shortcut.path;
            return (
              <button
                key={shortcut.path}
                onClick={() => fetchFiles(shortcut.path)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20' 
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{shortcut.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="جستجو در نام فایل‌ها و پوشه‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Multi-Select & Sort & View Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Select All Toggle */}
          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5"
            title="انتخاب همه موارد"
          >
            {selectedItems.size === filteredItems.length && filteredItems.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline">انتخاب همه ({selectedItems.size})</span>
          </button>

          {/* Batch Delete */}
          {selectedItems.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 animate-scaleIn"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>حذف ({selectedItems.size})</span>
            </button>
          )}

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="name_asc">نام (الف - ی)</option>
            <option value="name_desc">نام (ی - الف)</option>
            <option value="size_desc">حجم (بیشترین)</option>
            <option value="size_asc">حجم (کمترین)</option>
            <option value="date_desc">تاریخ (جدیدترین)</option>
            <option value="date_asc">تاریخ (قدیمی‌ترین)</option>
          </select>

          {/* Zoom Controller */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
                const idx = sizes.indexOf(gridZoom);
                if (idx > 0) setGridZoom(sizes[idx - 1]);
              }}
              disabled={gridZoom === 'sm'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="کوچک‌تر کردن پیش‌نمایش‌ها (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1.5 text-cyan-400 select-none">
              {gridZoom === 'sm' ? 'ریز' : gridZoom === 'md' ? 'متوسط' : gridZoom === 'lg' ? 'بزرگ' : 'خیلی بزرگ'}
            </span>
            <button
              onClick={() => {
                const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
                const idx = sizes.indexOf(gridZoom);
                if (idx < sizes.length - 1) setGridZoom(sizes[idx + 1]);
              }}
              disabled={gridZoom === 'xl'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="بزرگ‌تر کردن پیش‌نمایش‌ها (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Switcher (5 Modes: list, grid, compact, large, tiles) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 gap-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمایش لیستی با جزئیات"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمایش شبکه‌ای استاندارد"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'compact' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمایش شبکه‌ای فشرده و ریز"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('large')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'large' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمایش کارت‌های بزرگ پیش‌نمایش"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tiles')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'tiles' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمایش تایل‌های عریض"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display Section */}
      {loading ? (
        <div className="p-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm font-semibold">در حال بارگذاری فایل‌های پوشه...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-20 text-center text-slate-500 space-y-3 glass-panel rounded-3xl border border-slate-800">
          <Folder className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">این پوشه خالی است یا فایلی با این نام یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. COMPACT DENSE GRID */}
          {viewMode === 'compact' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
              {paginatedItems.map((item) => {
                const cat = getFileCategory(item.name);
                const isImage = !item.isDir && cat === 'image';
                const isVideo = !item.isDir && cat === 'video';
                const isSelected = selectedItems.has(item.name);

                return (
                  <div
                    key={item.name}
                    onClick={() => item.isDir ? handleNavigate(item.name) : handleOpenPreview(item)}
                    className={`relative group rounded-xl p-2 border transition-all cursor-pointer flex flex-col items-center text-center space-y-1 select-none ${
                      isSelected 
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-950/80' 
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <button
                      onClick={(e) => toggleSelect(item.name, e)}
                      className="absolute top-1 right-1 p-0.5 rounded bg-slate-950/80 text-slate-400 hover:text-cyan-300 z-10"
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> : <Square className="w-3.5 h-3.5" />}
                    </button>

                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                      {item.isDir ? (
                        <Folder className="w-7 h-7 text-amber-400 fill-amber-400/20" />
                      ) : isImage ? (
                        <img
                          src={getItemPreviewUrl(item.name)}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : isVideo ? (
                        <Film className="w-6 h-6 text-rose-400" />
                      ) : cat === 'audio' ? (
                        <Music className="w-6 h-6 text-purple-400" />
                      ) : cat === 'text' ? (
                        <FileCode className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <span className="font-medium text-[11px] text-slate-200 group-hover:text-white truncate block w-full" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. STANDARD GRID (Zoom Responsive) */}
          {viewMode === 'grid' && (
            <div className={`grid gap-4 ${
              gridZoom === 'sm' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' :
              gridZoom === 'md' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
              gridZoom === 'lg' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4' :
              'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {paginatedItems.map((item) => {
                const cat = getFileCategory(item.name);
                const isImage = !item.isDir && cat === 'image';
                const isVideo = !item.isDir && cat === 'video';
                const isSelected = selectedItems.has(item.name);

                const thumbSizeClass = 
                  gridZoom === 'sm' ? 'w-16 h-16' :
                  gridZoom === 'md' ? 'w-20 h-20' :
                  gridZoom === 'lg' ? 'w-28 h-28' :
                  'w-36 h-36';

                return (
                  <div
                    key={item.name}
                    onClick={() => item.isDir ? handleNavigate(item.name) : handleOpenPreview(item)}
                    className={`relative group rounded-2xl p-3 border transition-all cursor-pointer flex flex-col items-center text-center space-y-2 select-none ${
                      isSelected 
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-950/80' 
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <button
                      onClick={(e) => toggleSelect(item.name, e)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-slate-950/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 z-10"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className={`${thumbSizeClass} rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md`}>
                      {item.isDir ? (
                        <Folder className="w-10 h-10 text-amber-400 fill-amber-400/20" />
                      ) : isImage ? (
                        <img
                          src={getItemPreviewUrl(item.name)}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : isVideo ? (
                        <Film className="w-8 h-8 text-rose-400" />
                      ) : cat === 'audio' ? (
                        <Music className="w-8 h-8 text-purple-400" />
                      ) : cat === 'text' ? (
                        <FileCode className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    <div className="w-full truncate">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-white truncate block" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {item.isDir ? 'پوشه' : item.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pt-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenRename(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300"
                        title="تغییر نام"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenMoveModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300"
                        title="انتقال به پوشه دیگر"
                      >
                        <Move className="w-3.5 h-3.5" />
                      </button>
                      {!item.isDir && (
                        <button
                          onClick={() => handleDownload(item.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300"
                          title="دانلود فایل"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. LARGE PREVIEW SHOWCASE CARDS */}
          {viewMode === 'large' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedItems.map((item) => {
                const cat = getFileCategory(item.name);
                const isImage = !item.isDir && cat === 'image';
                const isVideo = !item.isDir && cat === 'video';
                const isSelected = selectedItems.has(item.name);

                return (
                  <div
                    key={item.name}
                    onClick={() => item.isDir ? handleNavigate(item.name) : handleOpenPreview(item)}
                    className={`relative group rounded-3xl overflow-hidden border transition-all cursor-pointer flex flex-col select-none ${
                      isSelected 
                        ? 'bg-[#0b152d] border-cyan-400 shadow-xl shadow-cyan-950/90' 
                        : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-cyan-500/40 shadow-lg'
                    }`}
                  >
                    <button
                      onClick={(e) => toggleSelect(item.name, e)}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 z-10 shadow-md"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                    </button>

                    {/* Big Showcase Cover */}
                    <div className="w-full h-44 bg-slate-950 flex items-center justify-center overflow-hidden relative border-b border-slate-800/80">
                      {item.isDir ? (
                        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                          <Folder className="w-16 h-16 text-amber-400 fill-amber-400/20" />
                        </div>
                      ) : isImage ? (
                        <img
                          src={getItemPreviewUrl(item.name)}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : isVideo ? (
                        <div className="flex flex-col items-center gap-2 text-rose-400">
                          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                            <Film className="w-12 h-12" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">ویدیو آماده پخش</span>
                        </div>
                      ) : cat === 'audio' ? (
                        <div className="flex flex-col items-center gap-2 text-purple-400">
                          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                            <Music className="w-12 h-12" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">فایل صوتی</span>
                        </div>
                      ) : cat === 'text' ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-400">
                          <FileCode className="w-14 h-14" />
                          <span className="text-[11px] font-mono text-slate-400">سورس کد / متن</span>
                        </div>
                      ) : (
                        <FileText className="w-14 h-14 text-slate-500" />
                      )}
                    </div>

                    {/* Card Content & Action Footer */}
                    <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <h4 className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                          <span>{item.isDir ? 'پوشه' : item.size}</span>
                          <span>{item.modified || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {!item.isDir && (
                            <button
                              onClick={() => handleOpenPreview(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>نمایش</span>
                            </button>
                          )}
                          {!item.isDir && (
                            <button
                              onClick={() => handleDownload(item.name)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300"
                              title="دانلود"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenRename(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300"
                            title="تغییر نام"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenMoveModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-300"
                            title="انتقال"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. TILES VIEW (Horizontal 2-Column Cards) */}
          {viewMode === 'tiles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedItems.map((item) => {
                const cat = getFileCategory(item.name);
                const isImage = !item.isDir && cat === 'image';
                const isVideo = !item.isDir && cat === 'video';
                const isSelected = selectedItems.has(item.name);

                return (
                  <div
                    key={item.name}
                    onClick={() => item.isDir ? handleNavigate(item.name) : handleOpenPreview(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      isSelected 
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md' 
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={(e) => toggleSelect(item.name, e)}
                        className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 flex-shrink-0"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                      </button>

                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.isDir ? (
                          <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                        ) : isImage ? (
                          <img
                            src={getItemPreviewUrl(item.name)}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : isVideo ? (
                          <Film className="w-6 h-6 text-rose-400" />
                        ) : cat === 'audio' ? (
                          <Music className="w-6 h-6 text-purple-400" />
                        ) : cat === 'text' ? (
                          <FileCode className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-right">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 truncate block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.isDir ? 'پوشه' : item.size} • {item.modified || ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!item.isDir && (
                        <button
                          onClick={() => handleOpenPreview(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300"
                          title="پیش‌نمایش"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenRename(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300"
                        title="تغییر نام"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. LIST VIEW (Detailed Row View) */}
          {viewMode === 'list' && (
            <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800/60 font-sans text-xs">
                {paginatedItems.map((item) => {
                  const cat = getFileCategory(item.name);
                  const isImage = !item.isDir && cat === 'image';
                  const isVideo = !item.isDir && cat === 'video';
                  const isSelected = selectedItems.has(item.name);

                  const listThumbClass = 
                    gridZoom === 'sm' ? 'w-8 h-8' :
                    gridZoom === 'lg' || gridZoom === 'xl' ? 'w-14 h-14' :
                    'w-11 h-11';

                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-3 transition-colors group select-none ${
                        isSelected ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={(e) => toggleSelect(item.name, e)}
                          className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 flex-shrink-0"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                        </button>

                        <div 
                          onClick={() => item.isDir ? handleNavigate(item.name) : handleOpenPreview(item)}
                          className={`${listThumbClass} rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/40 transition-colors shadow-sm cursor-pointer`}
                        >
                          {item.isDir ? (
                            <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                          ) : isImage ? (
                            <img
                              src={getItemPreviewUrl(item.name)}
                              alt={item.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : isVideo ? (
                            <Film className="w-5 h-5 text-rose-400" />
                          ) : cat === 'audio' ? (
                            <Music className="w-5 h-5 text-purple-400" />
                          ) : cat === 'text' ? (
                            <FileCode className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div 
                          onClick={() => item.isDir ? handleNavigate(item.name) : handleOpenPreview(item)}
                          className="truncate text-right flex-1 min-w-0 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.modified} • {item.isDir ? 'پوشه' : item.size}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!item.isDir && (
                          <button
                            onClick={() => handleOpenPreview(item)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all flex items-center gap-1.5"
                            title="پیش‌نمایش"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden sm:inline text-[11px] font-semibold text-cyan-400">نمایش</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenRename(item)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-800 transition-all"
                          title="تغییر نام"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenMoveModal(item)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 border border-slate-800 transition-all"
                          title="انتقال به پوشه دیگر"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCutItem(item)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-blue-500/20 text-slate-400 hover:text-blue-300 border border-slate-800 transition-all"
                          title="برش و کات (Cut)"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                        </button>
                        {!item.isDir && (
                          <button
                            onClick={() => handleDownload(item.name)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-all"
                            title="دانلود روی کامپیوتر"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PAGINATION & SHOW-ALL CONTROLLER */}
          {filteredItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs text-slate-300 shadow-xl">
              {/* Left: Page Size Selector & Count info */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-medium">تعداد در هر صفحه:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageSize(val === 'all' ? 'all' : Number(val));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
                >
                  <option value={24}>۲۴ مورد</option>
                  <option value={48}>۴۸ مورد</option>
                  <option value={96}>۹۶ مورد</option>
                  <option value={200}>۲۰۰ مورد</option>
                  <option value="all">نمایش همه ({totalItems})</option>
                </select>
                <span className="text-slate-500 font-mono text-[11px] pr-2 border-r border-slate-800">
                  نمایش {startIndex + 1} تا {Math.min(startIndex + effectivePageSize, totalItems)} از {totalItems} فایل
                </span>
              </div>

              {/* Right: Page Navigation Controls */}
              {pageSize !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition-all"
                    title="صفحه اول"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition-all flex items-center gap-1 text-xs"
                    title="صفحه قبلی"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>قبلی</span>
                  </button>

                  {/* Dynamic Page Buttons */}
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        return Math.abs(page - safeCurrentPage) <= 1;
                      })
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={page}>
                            {prev && page - prev > 1 && (
                              <span className="text-slate-600 px-1 font-mono">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[32px] h-[32px] rounded-xl font-mono text-xs font-bold transition-all ${
                                safeCurrentPage === page
                                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition-all flex items-center gap-1 text-xs"
                    title="صفحه بعدی"
                  >
                    <span>بعدی</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none border border-slate-800 transition-all"
                    title="صفحه آخر"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RENAME MODAL */}
      {renameItem && createPortal(
        <div 
          onClick={() => setRenameItem(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>تغییر نام {renameItem.isDir ? 'پوشه' : 'فایل'}</span>
              </h3>
              <button onClick={() => setRenameItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-right">
              <label className="text-xs text-slate-400">نام جدید را وارد کنید:</label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRenameItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
              >
                تایید و تغییر نام
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MOVE TO FOLDER MODAL */}
      {moveItem && createPortal(
        <div 
          onClick={() => setMoveItem(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Move className="w-5 h-5 text-purple-400" />
                <span>انتقال "{moveItem.name}" به پوشه دیگر</span>
              </h3>
              <button onClick={() => setMoveItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-right">
              <label className="text-xs text-slate-400">مسیر پوشه مقصد در حافظه گوشی:</label>
              <input
                type="text"
                value={targetMoveDir}
                onChange={(e) => setTargetMoveDir(e.target.value)}
                placeholder="/sdcard/Download/"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-sm focus:outline-none focus:border-purple-500 font-mono"
              />

              {/* Quick Destination Folders */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  '/sdcard/Download/',
                  '/sdcard/Movies/',
                  '/sdcard/DCIM/Camera/',
                  '/sdcard/Pictures/',
                  '/sdcard/Pictures/Screenshots/',
                  '/sdcard/Music/',
                  '/sdcard/Recordings/',
                  '/sdcard/Documents/',
                  '/sdcard/Bluetooth/',
                  '/sdcard/'
                ].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTargetMoveDir(p)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 text-[11px] font-mono border border-slate-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMoveItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleDirectMoveSubmit}
                className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
              >
                <CornerDownLeft className="w-4 h-4" />
                <span>انتقال به این پوشه</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE NEW FOLDER MODAL */}
      {showNewFolderModal && createPortal(
        <div 
          onClick={() => setShowNewFolderModal(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <span>ایجاد پوشه جدید</span>
              </h3>
              <button onClick={() => setShowNewFolderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-right">
              <label className="text-xs text-slate-400">نام پوشه را وارد کنید:</label>
              <input
                type="text"
                placeholder="مثلاً: MyMusic یا Backups"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 font-mono">محل ایجاد: {currentPath}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20"
              >
                ایجاد پوشه
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MEDIA PREVIEW MODAL */}
      {previewFile && createPortal(
        <div 
          onClick={() => setPreviewFile(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn"
          dir="rtl"
        >
          {/* Floating High-Visibility Quick Close Button */}
          <button
            onClick={() => setPreviewFile(null)}
            className="fixed top-4 left-4 z-[110] p-3 rounded-full bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 shadow-2xl transition-all hover:scale-110 active:scale-95 group"
            title="بستن پنجره (Esc یا کلیک روی پس‌زمینه)"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-[#0c142b] border border-cyan-500/50 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950 flex flex-col max-h-[92vh] z-[105]"
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-800 bg-[#080d1d] gap-3 text-right flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 flex-shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md" title={previewFile.name}>
                    {previewFile.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    فرمت: {previewFile.ext.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Navigation Pill (Previous / Next / Counter) */}
              {previewableFiles.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-inner">
                  <button
                    onClick={handlePrevFile}
                    disabled={!hasPrev}
                    className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs"
                    title="فایل قبلی (کلید جهت‌نمای راست)"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium text-[11px]">قبلی</span>
                  </button>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 font-mono text-[11px] text-cyan-400 border border-slate-800/80 font-bold">
                    {currentFileIndex + 1} / {previewableFiles.length}
                  </span>
                  <button
                    onClick={handleNextFile}
                    disabled={!hasNext}
                    className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs"
                    title="فایل بعدی (کلید جهت‌نمای چپ)"
                  >
                    <span className="hidden sm:inline font-medium text-[11px]">بعدی</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewFile.name)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="دانلود فایل"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">دانلود</span>
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                  title="بستن (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="relative flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-[#050914] min-h-[380px]">
              {/* Floating Media Loading Indicator Overlay */}
              {isMediaLoading && getFileCategory(previewFile.name) !== 'text' && getFileCategory(previewFile.name) !== 'other' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050914]/90 backdrop-blur-md rounded-2xl p-6 text-center space-y-4 pointer-events-none animate-fadeIn transition-all">
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <RefreshCw className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-100 flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                      در حال دریافت و بارگذاری فایل از حافظه گوشی...
                    </p>
                    <p className="text-xs text-slate-400 font-mono max-w-sm truncate" dir="ltr">{previewFile.name}</p>
                  </div>
                </div>
              )}

              {/* Floating Large Previous / Next Side Buttons */}
              {hasPrev && (
                <button
                  onClick={handlePrevFile}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-slate-950/85 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-cyan-400 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 group"
                  title="فایل قبلی (کلید جهت‌نمای راست)"
                >
                  <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {hasNext && (
                <button
                  onClick={handleNextFile}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-slate-950/85 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-cyan-400 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 group"
                  title="فایل بعدی (کلید جهت‌نمای چپ)"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {/* IMAGE PREVIEW */}
              {getFileCategory(previewFile.name) === 'image' && (
                <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
                  <div className="overflow-hidden max-h-[60vh] flex items-center justify-center rounded-2xl border border-slate-800 bg-black/40 p-2">
                    <img
                      key={previewFile.url}
                      src={previewFile.url}
                      alt={previewFile.name}
                      onLoad={() => setIsMediaLoading(false)}
                      onError={() => setIsMediaLoading(false)}
                      style={{
                        transform: `rotate(${imageRotation}deg) scale(${imageZoom})`,
                        transition: 'transform 0.2s ease'
                      }}
                      className="max-h-[55vh] max-w-full object-contain rounded-lg"
                    />
                  </div>
                  {/* Image Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
                    <button
                      onClick={handlePrevFile}
                      disabled={!hasPrev}
                      className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs"
                      title="تصویر قبلی"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span className="hidden sm:inline">قبلی</span>
                    </button>
                    <div className="h-4 w-px bg-slate-800 mx-1" />
                    <button
                      onClick={() => setImageRotation(r => r + 90)}
                      className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                      title="چرخش تصویر"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImageZoom(z => Math.min(z + 0.25, 3))}
                      className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                      title="بزرگ‌نمایی"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImageZoom(z => Math.max(z - 0.25, 0.5))}
                      className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                      title="کوچک‌نمایی"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setImageRotation(0); setImageZoom(1); }}
                      className="px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                    >
                      اندازه اصلی
                    </button>
                    <div className="h-4 w-px bg-slate-800 mx-1" />
                    <button
                      onClick={handleNextFile}
                      disabled={!hasNext}
                      className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs"
                      title="تصویر بعدی"
                    >
                      <span className="hidden sm:inline">بعدی</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {getFileCategory(previewFile.name) === 'video' && (
                <div className="w-full flex flex-col items-center justify-center space-y-4">
                  <video
                    key={previewFile.url}
                    src={previewFile.url}
                    controls
                    autoPlay
                    playsInline
                    onLoadedData={() => setIsMediaLoading(false)}
                    onCanPlay={() => setIsMediaLoading(false)}
                    onWaiting={() => setIsMediaLoading(true)}
                    onPlaying={() => setIsMediaLoading(false)}
                    onError={() => setIsMediaLoading(false)}
                    className="max-h-[60vh] max-w-full rounded-2xl border border-slate-800 shadow-2xl bg-black"
                  >
                    مرورگر شما از پخش مستقیم این ویدیو پشتیبانی نمی‌کند.
                  </video>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
                    <span>در صورت عدم پخش یا ناسازگاری کدک، می‌توانید فایل را مستقیماً دانلود نمایید:</span>
                    <button
                      onClick={() => handleDownload(previewFile.name)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود ویدیو</span>
                    </button>
                  </div>
                </div>
              )}

              {/* AUDIO PREVIEW */}
              {getFileCategory(previewFile.name) === 'audio' && (
                <div className="w-full max-w-md p-8 bg-slate-900/80 rounded-3xl border border-slate-800 flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-pink-500/30 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-950/50 animate-pulse">
                    <Music className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1 truncate max-w-xs">{previewFile.name}</h4>
                    <p className="text-xs text-slate-400">پخش زنده فایل صوتی از حافظه گوشی</p>
                  </div>
                  <audio 
                    key={previewFile.url}
                    src={previewFile.url}
                    controls 
                    autoPlay 
                    onLoadedData={() => setIsMediaLoading(false)}
                    onCanPlay={() => setIsMediaLoading(false)}
                    onWaiting={() => setIsMediaLoading(true)}
                    onPlaying={() => setIsMediaLoading(false)}
                    onError={() => setIsMediaLoading(false)}
                    className="w-full"
                  >
                    مرورگر شما از پخش مستقیم این فایل صوتی پشتیبانی نمی‌کند.
                  </audio>
                </div>
              )}

              {/* TEXT / CODE PREVIEW */}
              {getFileCategory(previewFile.name) === 'text' && (
                <div className="w-full h-full flex flex-col">
                  {previewLoading ? (
                    <div className="py-20 text-center text-slate-400 space-y-3">
                      <div className="relative w-12 h-12 mx-auto">
                        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                        <RefreshCw className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-slate-200">در حال خواندن و بارگذاری فایل متنی از گوشی...</p>
                    </div>
                  ) : (
                    <pre className="p-4 bg-[#080d1a] border border-slate-800 rounded-2xl font-mono text-xs text-cyan-300 max-h-[60vh] overflow-y-auto whitespace-pre-wrap select-text text-left">
                      {previewTextContent || 'فایل خالی است.'}
                    </pre>
                  )}
                </div>
              )}

              {/* PDF PREVIEW */}
              {getFileCategory(previewFile.name) === 'pdf' && (
                <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-800">
                  <iframe 
                    key={previewFile.url} 
                    src={previewFile.url} 
                    onLoad={() => setIsMediaLoading(false)}
                    className="w-full h-full" 
                    title="PDF Preview" 
                  />
                </div>
              )}

              {/* OTHER FILES */}
              {getFileCategory(previewFile.name) === 'other' && (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Archive className="w-16 h-16 text-slate-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">امکان پیش‌نمایش مستقیم این نوع فایل وجود ندارد</h4>
                  <p className="text-xs text-slate-400">می‌توانید فایل را مستقیماً روی کامپیوتر دانلود کنید:</p>
                  <button
                    onClick={() => handleDownload(previewFile.name)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                  >
                    دانلود مستقیم
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
