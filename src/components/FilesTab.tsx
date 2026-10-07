import React, { useState, useEffect } from 'react';
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
  Maximize2,
  Volume2,
  Play,
  FileCode,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; ext: string } | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFiles = async (targetPath = currentPath) => {
    if (!device) return;
    setLoading(true);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !device) return;

    setIsUploading(true);
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
        showToast(`فایل ${file.name} با موفقیت به گوشی منتقل شد.`, 'success');
        fetchFiles(currentPath);
      } else {
        showToast(`خطا در انتقال: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (fileName: string) => {
    if (!device) return;
    const fullPath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    window.open(`/api/devices/${device.id}/files/download?remotePath=${encodeURIComponent(fullPath)}`);
  };

  const handleDelete = async (fileName: string) => {
    if (!device) return;
    if (!confirm(`آیا از حذف "${fileName}" اطمینان دارید؟`)) return;

    const fullPath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    try {
      const res = await fetch(`/api/devices/${device.id}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remotePath: fullPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast('مورد با موفقیت حذف شد.', 'success');
        fetchFiles(currentPath);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !device) return;
    const newDirPath = currentPath.endsWith('/') ? `${currentPath}${newFolderName}` : `${currentPath}/${newFolderName}`;
    try {
      const res = await fetch(`/api/devices/${device.id}/files/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: newDirPath })
      });
      const data = await res.json();
      if (data.success) {
        showToast('پوشه جدید ایجاد شد.', 'success');
        setShowNewFolderModal(false);
        setNewFolderName('');
        fetchFiles(currentPath);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
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

  // Keyboard navigation for preview modal (Left/Right arrow and Escape)
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & Quick Paths */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-cyan-400" />
            <span>مدیریت فایل و پیش‌نمایش چندرسانه‌ای (File & Media Explorer)</span>
          </h2>
          <p className="text-xs text-slate-400">
            مشاهده بندانگشتی (Thumbnail) و زنده تصاویر، پخش ویدیوها و آهنگ‌ها، خواندن اسناد و انتقال دوطرفه فایل‌ها
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            id="fileUploadInput"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
          <label
            htmlFor="fileUploadInput"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md ${
              isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'در حال ارسال...' : 'ارسال فایل به این پوشه'}</span>
          </label>

          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>پوشه جدید</span>
          </button>
        </div>
      </div>

      {/* Quick Jump Shortcuts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'حافظه اصلی (/sdcard/)', path: '/sdcard/' },
          { label: 'دانلودها (Downloads)', path: '/sdcard/Download/' },
          { label: 'دوربین و عکس‌ها (DCIM)', path: '/sdcard/DCIM/' },
          { label: 'تصاویر (Pictures)', path: '/sdcard/Pictures/' },
          { label: 'موزیک (Music)', path: '/sdcard/Music/' },
          { label: 'اسناد (Documents)', path: '/sdcard/Documents/' }
        ].map((q) => (
          <button
            key={q.path}
            onClick={() => fetchFiles(q.path)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              currentPath === q.path 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Breadcrumb Path, Search Bar & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto font-mono text-xs text-cyan-300">
          <button
            onClick={handleGoUp}
            disabled={currentPath === '/sdcard/' || currentPath === '/'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            title="پوشه بالاتر (Up)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className="px-2 py-1 bg-[#050914] rounded-lg border border-slate-800/80">
            {currentPath}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#050914] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="نمای لیستی"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="نمای گالری و شبکه‌ای (پیش‌نمایش بزرگ)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1 bg-[#050914] px-2 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="name_asc" className="bg-slate-900 text-slate-200">نام (الف - ی)</option>
              <option value="name_desc" className="bg-slate-900 text-slate-200">نام (ی - الف)</option>
              <option value="size_desc" className="bg-slate-900 text-slate-200">بزرگترین حجم</option>
              <option value="size_asc" className="bg-slate-900 text-slate-200">کوچکترین حجم</option>
              <option value="date_desc" className="bg-slate-900 text-slate-200">جدیدترین</option>
              <option value="date_asc" className="bg-slate-900 text-slate-200">قدیمی‌ترین</option>
            </select>
          </div>

          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در نام فایل‌ها..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#050914] border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            onClick={() => fetchFiles(currentPath)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-400"
            title="تازه سازی"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Files Display Container (List or Grid View) */}
      {loading ? (
        <div className="p-16 rounded-2xl glass-panel border border-slate-800 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
          <span className="text-xs">در حال بارگذاری محتوای پوشه...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 rounded-2xl glass-panel border border-slate-800 text-center text-slate-500 text-sm">
          این پوشه خالی است یا فایلی با این نام پیدا نشد.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID / GALLERY VIEW WITH PROMINENT THUMBNAILS */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((item) => {
            const cat = getFileCategory(item.name);
            const isImage = !item.isDir && cat === 'image';
            const isVideo = !item.isDir && cat === 'video';

            return (
              <div
                key={item.name}
                onClick={() => {
                  if (item.isDir) {
                    handleNavigate(item.name);
                  } else {
                    handleOpenPreview(item);
                  }
                }}
                className="group relative rounded-2xl p-3 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-cyan-950/40 select-none overflow-hidden"
              >
                {/* Thumbnail / Large Preview Area */}
                <div className="w-full aspect-square rounded-xl bg-slate-950/80 border border-slate-800/80 mb-2.5 overflow-hidden flex items-center justify-center relative">
                  {item.isDir ? (
                    <Folder className="w-12 h-12 text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform" />
                  ) : isImage ? (
                    <img
                      src={getItemPreviewUrl(item.name)}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : isVideo ? (
                    <div className="flex flex-col items-center justify-center text-rose-400">
                      <Film className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono text-rose-300/80 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Video</span>
                    </div>
                  ) : cat === 'audio' ? (
                    <div className="flex flex-col items-center justify-center text-purple-400">
                      <Music className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Audio</span>
                    </div>
                  ) : cat === 'text' ? (
                    <FileCode className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <FileText className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform" />
                  )}

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPreview(item);
                      }}
                      className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold shadow-lg transform hover:scale-110 transition-transform"
                      title="پیش‌نمایش"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!item.isDir && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item.name);
                        }}
                        className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-lg transform hover:scale-110 transition-transform"
                        title="دانلود"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* File Details */}
                <div className="text-right">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {item.isDir ? 'پوشه' : item.size}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW WITH CRISP INLINE THUMBNAILS */
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800/60 font-sans text-xs">
            {filteredItems.map((item) => {
              const cat = getFileCategory(item.name);
              const isImage = !item.isDir && cat === 'image';
              const isVideo = !item.isDir && cat === 'video';

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors group select-none"
                >
                  <div 
                    onClick={() => {
                      if (item.isDir) {
                        handleNavigate(item.name);
                      } else {
                        handleOpenPreview(item);
                      }
                    }}
                    className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer hover:text-cyan-300"
                  >
                    {/* Inline Thumbnail / Icon */}
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/40 transition-colors shadow-sm">
                      {item.isDir ? (
                        <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                      ) : isImage ? (
                        <img
                          src={getItemPreviewUrl(item.name)}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
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

                    {/* File Meta */}
                    <div className="truncate text-right">
                      <span className="font-semibold text-slate-200 group-hover:text-white truncate block">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.modified} • {item.size}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!item.isDir && (
                      <>
                        {/* Preview Button */}
                        <button
                          onClick={() => handleOpenPreview(item)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all flex items-center gap-1.5"
                          title="مشاهده و پخش پیش‌نمایش"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="hidden sm:inline text-[11px] font-semibold text-cyan-400">پیش‌نمایش</span>
                        </button>

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(item.name)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-slate-800 transition-all"
                          title="دانلود فایل روی کامپیوتر"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(item.name)}
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

      {/* Media Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#0c142b] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/90 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-800 bg-[#080d1d] gap-3 text-right">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 flex-shrink-0">
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
                  className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-800 transition-all"
                  title="دانلود فایل"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                  title="بستن (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="relative flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-[#050914] min-h-[350px]">
              {/* Floating Large Previous / Next Side Buttons */}
              {hasPrev && (
                <button
                  onClick={handlePrevFile}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-950/80 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-cyan-400 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 group"
                  title="فایل قبلی (کلید جهت‌نمای راست)"
                >
                  <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {hasNext && (
                <button
                  onClick={handleNextFile}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-950/80 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-cyan-400 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 group"
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
                      src={previewFile.url}
                      alt={previewFile.name}
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
                <div className="w-full flex flex-col items-center justify-center">
                  <video
                    key={previewFile.url}
                    src={previewFile.url}
                    controls
                    autoPlay
                    className="max-h-[60vh] max-w-full rounded-2xl border border-slate-800 shadow-2xl bg-black"
                  >
                    مرورگر شما از پخش مستقیم این ویدیو پشتیبانی نمی‌کند.
                  </video>
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
                    <div className="py-20 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                      <span>در حال خواندن فایل...</span>
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
                  <iframe src={previewFile.url} className="w-full h-full" title="PDF Preview" />
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
                    دانلود فایل
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c142b] border border-cyan-500/30 rounded-3xl p-6 w-full max-w-sm text-right space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">ایجاد پوشه جدید</h3>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">نام پوشه:</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder_Name"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all"
              >
                ایجاد پوشه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

