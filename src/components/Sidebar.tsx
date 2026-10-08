import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  X,
  Compass,
  Radio,
  FolderLock,
  Crown,
  ExternalLink,
  Wrench
} from 'lucide-react';
import { APP_VERSION } from '../constants';

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
    { id: 'audiofx', label: 'استودیو صدا و بلندگوی PC', icon: Volume2, desc: 'استریم صدای سیستم + بوست ۲۰۰٪', platform: 'universal', category: 'media' },
    { id: 'network', label: 'اشتراک اینترنت و VPN', icon: Globe, desc: 'انتقال فیلترشکن و USB Tethering', platform: 'universal', category: 'media' },
    { id: 'gps', label: 'جعل موقعیت و حرکت GPS', icon: Navigation, desc: 'شبیه‌ساز حرکت خودرو و پیاده‌روی', platform: 'universal', category: 'media' },

    // Tools & Management
    { id: 'taskmanager', label: 'تسک‌ها، استارت‌آپ و پردازش‌ها', icon: Activity, desc: 'مدیریت رم، برنامه‌های پس‌زمینه و بوت', platform: 'android', category: 'tools' },
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
    { id: 'repair', label: 'میزکار و عیب‌یابی تعمیرات', icon: Wrench, desc: 'قبض پذیرش، FRP، تاچ شکسته، کدهای تست', platform: 'universal', category: 'pro' },
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

  // Accordion State: only one category is open at a time
  const [openCategory, setOpenCategory] = useState<string>(() => {
    const item = navItems.find(i => i.id === activeTab);
    return item ? item.category : 'core';
  });

  // Auto-sync open accordion category when active tab changes
  useEffect(() => {
    const item = navItems.find(i => i.id === activeTab);
    if (item && item.category !== openCategory && !searchQuery.trim()) {
      setOpenCategory(item.category);
    }
  }, [activeTab]);

  const toggleCategory = (catId: string) => {
    setOpenCategory(prev => prev === catId ? '' : catId);
  };

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
      className={`bg-[#0d0e13]/95 border-l border-amber-500/15 flex flex-col justify-between p-3 select-none transition-all duration-300 backdrop-blur-2xl z-40 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* App Royal Branding & Collapse Toggle */}
        <div className="flex items-center justify-between px-1.5 py-2.5 mb-2 border-b border-amber-500/15 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950 shrink-0 font-bold">
              <Crown className="w-5 h-5 fill-stone-950/20" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-black text-white tracking-wide font-sans truncate">
                    CellPhone<span className="text-yellow-400">Manager</span>
                  </h1>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-yellow-300 font-mono font-bold border border-amber-500/40">
                    {APP_VERSION}
                  </span>
                </div>
                <a
                  href="https://irres.ir"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-amber-200/70 hover:text-yellow-300 transition-colors font-medium truncate flex items-center gap-1 mt-0.5 group"
                  title="شرکت راهکار الکترونیک سهند"
                >
                  <span>راهکار الکترونیک سهند</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                </a>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-stone-400 hover:text-yellow-300 hover:bg-stone-800/80 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title={isCollapsed ? 'گسترش منو' : 'جمع کردن منو'}
              aria-label={isCollapsed ? 'گسترش منو' : 'جمع کردن منو'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>


        {/* Quick Search in Sidebar */}
        {!isCollapsed && (
          <div className="relative my-2 shrink-0">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="جستجوی ابزارها (مثلاً: روت، باتری، فایل)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="جستجوی ابزارها"
              className="w-full bg-[#121318] border border-amber-500/20 rounded-xl pr-8 pl-7 py-1.5 text-xs text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-stone-500 hover:text-amber-300 focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
                title="پاک کردن جستجو"
                aria-label="پاک کردن جستجو"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Accordion Categorized Navigation List */}
        <nav className="flex-1 overflow-y-auto space-y-2 pr-0.5 mt-1" aria-label="منوی بخش‌ها">
          {searchQuery.trim() ? (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                نتایج جستجو ({filteredItems.length})
              </div>
              {filteredItems.map(item => renderNavItem(item))}
            </div>
          ) : (
            categories.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat.id);
              if (catItems.length === 0) return null;
              const CatIcon = cat.icon;
              const isOpen = openCategory === cat.id;
              const hasActiveItem = catItems.some(i => i.id === activeTab);

              return (
                <div key={cat.id} className="rounded-2xl overflow-hidden border border-amber-500/10 bg-[#121318]/50 transition-all duration-200">
                  {/* Accordion Category Header Button */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-right transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
                      isOpen
                        ? 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border-b border-amber-500/20 text-yellow-300'
                        : hasActiveItem
                        ? 'text-amber-200 bg-amber-500/5 hover:bg-amber-500/10'
                        : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/40'
                    }`}
                    title={cat.title}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isOpen || hasActiveItem
                          ? 'bg-amber-500/20 text-yellow-300'
                          : 'bg-stone-800/80 text-stone-400 group-hover:text-amber-300'
                      }`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-xs font-bold ${isOpen ? 'text-yellow-300 font-extrabold' : 'text-stone-300'}`}>
                            {cat.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono font-bold">
                            {catItems.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-stone-400 group-hover:text-amber-300 ${
                        isOpen ? 'rotate-180 text-yellow-300' : ''
                      }`} />
                    )}
                  </button>

                  {/* Accordion Sub-Menu Items */}
                  {(isOpen || isCollapsed) && (
                    <div className="p-1 space-y-0.5 animate-fadeIn">
                      {catItems.map(item => renderNavItem(item))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </div>

      {/* Target Status & Company Credit Footer */}
      <div className="mt-3 space-y-2 shrink-0">
        <div className="p-2 rounded-xl bg-[#121318] border border-amber-500/20 text-[11px] text-stone-400 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {deviceType === 'ios' ? (
              <Apple className="w-3.5 h-3.5 text-stone-300" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            )}
            {!isCollapsed && (
              <span className="font-mono text-stone-300 text-[10px] truncate" dir="ltr">
                {deviceType === 'ios' ? 'Apple iOS' : 'Android ADB'}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-yellow-300 border border-amber-500/30">
              آماده به‌کار
            </span>
          )}
        </div>

        {!isCollapsed && (
          <a
            href="https://irres.ir"
            target="_blank"
            rel="noreferrer"
            className="block p-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-600/10 border border-amber-500/20 hover:border-amber-500/40 text-center transition-all group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            aria-label="وب‌سایت شرکت راهکار الکترونیک سهند"
          >
            <div className="text-[10px] font-bold text-amber-200 group-hover:text-yellow-300 flex items-center justify-center gap-1">
              <span>توسعه: راهکار الکترونیک سهند</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
            </div>
            <div className="text-[9px] font-mono text-stone-400 mt-0.5" dir="ltr">
              https://irres.ir • {APP_VERSION} Royal
            </div>
          </a>
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
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 text-right group relative focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
          isActive
            ? 'bg-gradient-to-l from-amber-500/20 via-yellow-500/10 to-transparent text-amber-100 border border-amber-500/40 shadow-sm shadow-amber-500/10'
            : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/40 border border-transparent'
        }`}
        title={isCollapsed ? item.label : undefined}
        aria-label={item.label}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 rounded-l-full shadow-sm shadow-amber-400" />
        )}

        <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          isActive 
            ? 'bg-amber-500/25 text-yellow-300 shadow-sm shadow-amber-500/20' 
            : 'bg-stone-800/70 text-stone-400 group-hover:text-amber-300 group-hover:bg-stone-700/60'
        }`}>
          <Icon className="w-4 h-4" />
        </div>

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-xs font-bold truncate ${isActive ? 'text-yellow-200 font-extrabold' : 'text-stone-300'}`}>
                {item.label}
              </span>
              {isAndroidExclusive && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-stone-800/80 text-amber-300/80 border border-amber-500/20 shrink-0" dir="ltr">
                  Android
                </span>
              )}
            </div>
            <div className="text-[10px] text-stone-500 truncate group-hover:text-stone-400">
              {item.desc}
            </div>
          </div>
        )}
      </button>
    );
  }
};
