import React from 'react';
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
  DownloadCloud
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  deviceType?: 'android' | 'ios';
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, deviceType }) => {
  const navItems = [
    { id: 'overview', label: 'داشبورد و وضعیت', icon: LayoutDashboard, desc: 'مشخصات، باتری و سخت‌افزار' },
    { id: 'ai', label: 'دستیار هوش مصنوعی', icon: Bot, desc: 'پزشک هوشمند و عیب‌یابی گوشی' },
    { id: 'mirror', label: 'نمایش و کنترل زنده', icon: Smartphone, desc: 'استریم زنده داخل وب و Scrcpy' },
    { id: 'gamepad', label: 'دسته بازی و ماوس PC', icon: Gamepad2, desc: 'تبدیل به گیم‌پد و تاچ‌پد' },
    { id: 'notifications', label: 'اعلان‌ها و پاسخ فوری', icon: BellRing, desc: 'نوتیفیکیشن‌های زنده روی ویندوز' },
    { id: 'network', label: 'اشتراک اینترنت و VPN', icon: Globe, desc: 'انتقال فیلترشکن و USB Tethering' },
    { id: 'automation', label: 'اتوماسیون و ماکرو', icon: Zap, desc: 'اتوکلیکر و ضبط لمس‌های خودکار' },
    { id: 'gps', label: 'جعل موقعیت و حرکت GPS', icon: Navigation, desc: 'شبیه‌ساز حرکت خودرو و پیاده‌روی' },
    { id: 'recorder', label: 'ضبط صفحه و صدا 60fps', icon: Film, desc: 'فیلم‌برداری با صدای داخلی' },
    { id: 'ocr', label: 'استخراج متن و OCR', icon: ScanText, desc: 'کپی متون عکس‌ها و استوری‌ها' },
    { id: 'camera', label: 'استودیو و وب‌کم دوربین', icon: Camera, desc: 'تبدیل به وب‌کم 4K و سلفی' },
    { id: 'microphone', label: 'استودیو و میکروفون گوشی', icon: Mic, desc: 'تبدیل به میکروفون کامپیوتر' },
    { id: 'audiofx', label: 'تقویت صدا و اکولایزر', icon: Volume2, desc: 'افزایش بلندی تا ۲۰۰٪ و بیس' },
    { id: 'messages', label: 'تماس، مخاطبین و پیامک', icon: PhoneCall, desc: 'شماره‌گیر، دفترچه تلفن و SMS' },
    { id: 'battery', label: 'سلامت باتری و آلارم', icon: BatteryCharging, desc: 'هشدار ۸۰٪ شارژ و مانیتور دما' },
    { id: 'migration', label: 'انتقال مستقیم دو گوشی', icon: ArrowLeftRight, desc: 'مهاجرت سریع اطلاعات با کابل' },
    { id: 'cloner', label: 'ساخت نسخه دوم برنامه‌ها', icon: Copy, desc: 'داشتن ۲ اکانت همزمان در فضای دوم' },
    { id: 'debloater', label: 'حذف تبلیغات سیستمی', icon: Trash2, desc: 'پاکسازی Bloatware شیائومی/سامسونگ' },
    { id: 'rescue', label: 'امداد قفل صفحه و ریکاوری', icon: Key, desc: 'بازگشایی اضطراری و Safe Mode' },
    { id: 'passwords', label: 'صندوق رمز و وای‌فای', icon: KeyRound, desc: 'مشاهده رمز Wi-Fi و پشتیبان پسوردها' },
    { id: 'multidevice', label: 'کنترل همزمان چند دستگاه', icon: Layers, desc: 'مدیریت و سینک گروهی گوشی‌ها' },
    { id: 'inspector', label: 'آنالایزر امنیتی APK', icon: ShieldCheck, desc: 'اسکن دسترسی‌ها و ریسک برنامه‌ها' },
    { id: 'apps', label: 'مدیریت برنامه‌ها', icon: Layers, desc: 'نصب، حذف و فریز Bloatware' },
    { id: 'files', label: 'مدیریت و انتقال فایل‌ها', icon: HardDrive, desc: 'مرور حافظه، ارسال و دریافت' },
    { id: 'backup', label: 'استخراج APK و تایپ', icon: Archive, desc: 'دانلود فایل نصبی و تایپ از PC' },
    { id: 'root', label: 'روت و آن‌روت کامل', icon: Flame, desc: 'روت Magisk، تست فست‌بوت و Unroot' },
    { id: 'rom', label: 'فلش رام و آپدیت OS', icon: DownloadCloud, desc: 'آپدیت رسمی، LineageOS، GSI و Sideload' },
    { id: 'fastboot', label: 'ابزارهای فست‌بوت و فلش', icon: Flame, desc: 'بوت‌لودر، اسلات‌ها و ریکاوری' },
    { id: 'hardware', label: 'آزمایشگاه تست سخت‌افزار', icon: Gauge, desc: 'تست ویبره، صدا، سنسور و شبکه' },
    { id: 'tweaks', label: 'تنظیمات مخفی و سیستمی', icon: Sliders, desc: 'تغییر DPI، انیمیشن، GPS' },
    { id: 'diagnostics', label: 'عیب‌یابی و لاگ زنده', icon: Activity, desc: 'مشاهده Logcat و Syslog' },
    { id: 'doctor', label: 'پزشک درایورها و واسط‌ها', icon: Stethoscope, desc: 'نصب خودکار ADB و درایورها' },
  ];

  return (
    <aside className="w-72 bg-[#0b1329]/95 border-l border-cyan-500/20 flex flex-col justify-between p-3.5 glass-panel select-none overflow-y-auto">
      <div>
        {/* App Branding */}
        <div className="flex items-center gap-3 px-2.5 py-3 mb-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-black shrink-0">
            <Smartphone className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-wide font-sans truncate">
                CellPhone<span className="text-cyan-400">Manager</span>
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                v3.0
              </span>
            </div>
            <a 
              href="https://irres.ir" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors truncate block"
            >
              راهکار الکترونیک سهند
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-right group ${
                  isActive
                    ? 'bg-gradient-to-l from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-300'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Target Status Footer */}
      <div className="mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {deviceType === 'ios' ? (
            <Apple className="w-3.5 h-3.5 text-slate-200" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-mono text-slate-300 text-[10px]">
            {deviceType === 'ios' ? 'Apple iOS' : 'Android ADB'}
          </span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          فعال
        </span>
      </div>
    </aside>
  );
};
