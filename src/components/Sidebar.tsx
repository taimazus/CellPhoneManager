import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  Layers, 
  Sliders, 
  Activity, 
  Stethoscope,
  HardDrive,
  Flame,
  Archive,
  Gauge,
  Apple,
  Bot,
  PhoneCall,
  Camera,
  Mic,
  Globe,
  Zap,
  BellRing,
  ShieldCheck,
  Film,
  BatteryCharging,
  Sparkles,
  Gamepad2,
  Navigation,
  Trash2,
  Copy,
  ArrowLeftRight,
  ScanText,
  Volume2,
  Key,
  KeyRound,
  DownloadCloud,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Radio,
  FolderLock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  deviceType?: 'android' | 'ios';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  desc: string;
  platform: 'universal' | 'android' | 'ios';
  category: 'core' | 'media' | 'tools' | 'pro';
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  deviceType,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'core', title: 'داشبورد و کنترل زنده', icon: Compass },
    { id: 'media', title: 'ارتباطات و چندرسانه‌ای', icon: Radio },
    { id: 'tools', title: 'مدیریت داده‌ها و برنامه‌ها', icon: FolderLock },
    { id: 'pro', title: 'تست، روت و ابزار تخصصی', icon: Flame },
  ];

  const navItems: NavItem[] = [
    // Core & Live Control
    { id: 'overview', label: 'داشبورد و وضعیت', icon: LayoutDashboard, desc: 'مشخصات، باتری و سخت‌افزار', platform: 'universal', category: 'core' },
    { id: 'ai', label: 'دستیار هوش مصنوعی', icon: Bot, desc: 'پزشک هوشمند و عیب‌یابی گوشی', platform: 'universal', category: 'core' },
    { id: 'mirror', label: 'نمایش و کنترل زنده', icon: Smartphone, desc: 'استریم زنده درون وب و Scrcpy', platform: 'universal', category: 'core' },
    { id: 'gamepad', label: 'دسته بازی و ماوس PC', icon: Gamepad2, desc: 'تبدیل به گیم‌پد و تاچ‌پد', platform: 'android', category: 'core' },
    { id: 'notifications', label: 'اعلان‌ها و پاسخ فوری', icon: BellRing, desc: 'نوتیفیکیشن‌های زنده روی ویندوز', platform: 'universal', category: 'core' },
    { id: 'multidevice', label: 'کنترل همزمان چند دستگاه', icon: Layers, desc: 'مدیریت و سینک گروهی گوشی‌ها', platform: 'universal', category: 'core' },

    // Media & Connectivity
    { id: 'messages', label: 'تماس، مخاطبین و پیامک', icon: PhoneCall, desc: 'شماره‌گیر، دفترچه تلفن و SMS', platform: 'universal', category: 'media' },
    { id: 'camera', label: 'استودیو و وب‌کم دوربین', icon: Camera, desc: 'تبدیل به وب‌کم 4K و سلفی', platform: 'universal', category: 'media' },
    { id: 'microphone', label: 'استودیو و میکروفون گوشی', icon: Mic, desc: 'تبدیل به میکروفون کامپیوتر', platform: 'universal', category: 'media' },
    { id: 'audiofx', label: 'تقویت صدا و اکولایزر', icon: Volume2, desc: 'افزایش بلندی تا ۲۰۰٪ و بیس', platform: 'universal', category: 'media' },
    { id: 'network', label: 'اشتراک اینترنت و VPN', icon: Globe, desc: 'انتقال فیلترشکن و USB Tethering', platform: 'universal', category: 'media' },
    { id: 'gps', label: 'جعل موقعیت و حرکت GPS', icon: Navigation, desc: 'شبیه‌ساز حرکت خودرو و پیاده‌روی', platform: 'universal', category: 'media' },

    // Tools & Management
    { id: 'apps', label: 'مدیریت برنامه‌ها', icon: Layers, desc: 'نصب، حذف و استخراج APK/IPA', platform: 'universal', category: 'tools' },
    { id: 'files', label: 'مدیریت و انتقال فایل‌ها', icon: HardDrive, desc: 'مرور حافظه، ارسال و دریافت', platform: 'universal', category: 'tools' },
    { id: 'recorder', label: 'ضبط صفحه و صدا 60fps', icon: Film, desc: 'فیلم‌برداری با صدای داخلی', platform: 'universal', category: 'tools' },
    { id: 'ocr', label: 'استخراج متن و OCR', icon: ScanText, desc: 'کپی متون عکس‌ها و استوری‌ها', platform: 'universal', category: 'tools' },
    { id: 'automation', label: 'اتوماسیون و ماکرو', icon: Zap, desc: 'اتوکلیکر و ضبط لمس‌های خودکار', platform: 'android', category: 'tools' },
    { id: 'cloner', label: 'ساخت نسخه دوم برنامه‌ها', icon: Copy, desc: 'داشتن ۲ اکانت همزمان در فضای دوم', platform: 'android', category: 'tools' },
    { id: 'debloater', label: 'حذف تبلیغات سیستمی', icon: Trash2, desc: 'پاکسازی Bloatware شیائومی/سامسونگ', platform: 'android', category: 'tools' },
    { id: 'passwords', label: 'صندوق رمز و وای‌فای', icon: KeyRound, desc: 'مشاهده رمز Wi-Fi و پشتیبان پسوردها', platform: 'android', category: 'tools' },
    { id: 'rescue', label: 'امداد قفل صفحه و ریکاوری', icon: Key, desc: 'بازگشایی اضطراری و Safe Mode', platform: 'android', category: 'tools' },

    // Pro & Advanced Toolkit
    { id: 'backup', label: 'پشتیبان‌گیری و بازیابی جامع', icon: Archive, desc: 'بکاپ کامل/سفارشی روی PC یا گوشی', platform: 'universal', category: 'pro' },
    { id: 'hardware', label: 'آزمایشگاه تست سخت‌افزار', icon: Gauge, desc: 'تست ویبره، صدا، سنسور و شبکه', platform: 'universal', category: 'pro' },
    { id: 'battery', label: 'سلامت باتری و آلارم', icon: BatteryCharging, desc: 'هشدار ۸۰٪ شارژ و مانیتور دما', platform: 'universal', category: 'pro' },
    { id: 'migration', label: 'انتقال مستقیم دو گوشی', icon: ArrowLeftRight, desc: 'مهاجرت سریع اطلاعات با کابل', platform: 'universal', category: 'pro' },
    { id: 'inspector', label: 'آنالایزر امنیتی APK', icon: ShieldCheck, desc: 'اسکن دسترسی‌ها و ریسک برنامه‌ها', platform: 'android', category: 'pro' },
    { id: 'diagnostics', label: 'عیب‌یابی و لاگ زنده', icon: Activity, desc: 'مشاهده Logcat و Syslog', platform: 'universal', category: 'pro' },
    { id: 'doctor', label: 'پزشک سیستم و پاکسازی', icon: Stethoscope, desc: 'پاکسازی فایل‌های اضافی و تعمیرات', platform: 'universal', category: 'pro' },
    { id: 'tweaks', label: 'تنظیمات مخفی و سیستمی', icon: Sliders, desc: 'تغییر DPI، انیمیشن، GPS', platform: 'android', category: 'pro' },
    { id: 'root', label: 'روت و آن‌روت کامل', icon: Flame, desc: 'روت Magisk، تست فست‌بوت و Unroot', platform: 'android', category: 'pro' },
    { id: 'rom', label: 'فلش رام و آپدیت OS', icon: DownloadCloud, desc: 'آپدیت رسمی، LineageOS، GSI و Sideload', platform: 'android', category: 'pro' },
    { id: 'fastboot', label: 'ابزارهای فست‌بوت و فلش', icon: Flame, desc: 'بوت‌لودر، اسلات‌ها و ریکاوری', platform: 'android', category: 'pro' },
  ];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const q = searchQuery.toLowerCase().trim();
    return navItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  }, [searchQuery, navItems]);

  return (
    <aside 
      className={`bg-[#0c1220]/95 border-l border-slate-800/80 flex flex-col justify-between p-3 select-none transition-all duration-300 backdrop-blur-2xl z-40 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* App Branding & Collapse Toggle */}
        <div className="flex items-center justify-between px-1.5 py-2.5 mb-2 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/25 text-white shrink-0">
              <Smartphone className="w-4.5 h-4.5 font-bold" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-black text-white tracking-wide font-sans truncate">
                    CellPhone<span className="text-blue-400">Manager</span>
                  </h1>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/15 text-blue-400 font-mono font-bold border border-blue-500/25">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate block mt-0.5">
                  استودیوی مدیریت پیشرفته
                </span>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0"
              title={isCollapsed ? 'گسترش منو' : 'جمع کردن منو'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Quick Search in Sidebar (Only if expanded) */}
        {!isCollapsed && (
          <div className="relative my-2 shrink-0">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="جستجوی ابزارها (مثلاً: روت، باتری، فایل)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800/90 rounded-xl pr-8 pl-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Categorized Navigation List */}
        <nav className="flex-1 overflow-y-auto space-y-4 pr-0.5 mt-1">
          {searchQuery.trim() ? (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                نتایج جستجو ({filteredItems.length})
              </div>
              {filteredItems.map(item => renderNavItem(item))}
            </div>
          ) : (
            categories.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat.id);
              if (catItems.length === 0) return null;
              const CatIcon = cat.icon;

              return (
                <div key={cat.id} className="space-y-1">
                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                      <CatIcon className="w-3.5 h-3.5 text-blue-400/80" />
                      <span>{cat.title}</span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {catItems.map(item => renderNavItem(item))}
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </div>

      {/* Target Status Footer */}
      <div className="mt-3 p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {deviceType === 'ios' ? (
            <Apple className="w-3.5 h-3.5 text-slate-300" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {!isCollapsed && (
            <span className="font-mono text-slate-300 text-[10px] truncate">
              {deviceType === 'ios' ? 'Apple iOS' : 'Android ADB'}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            متصل
          </span>
        )}
      </div>
    </aside>
  );

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isAndroidExclusive = item.platform === 'android';

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 text-right group relative ${
          isActive
            ? 'bg-blue-600/15 text-blue-300 border border-blue-500/35 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-l-full" />
        )}

        <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          isActive 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700/80'
        }`}>
          <Icon className="w-4 h-4" />
        </div>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {item.label}
              </span>
              {isAndroidExclusive && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
                  Android
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
              {item.desc}
            </div>
          </div>
        )}
      </button>
    );
  }
};
