import React from 'react';
import { 
  Smartphone, 
  MessageCircle, 
  Send, 
  Camera, 
  Music, 
  Play, 
  Globe, 
  Mail, 
  MapPin, 
  Settings, 
  Video, 
  Phone, 
  Image, 
  Folder, 
  Clock, 
  Calculator, 
  Calendar, 
  ShoppingBag, 
  Bot, 
  Shield, 
  Layers,
  FileCode,
  Radio,
  Tv,
  Car,
  ShoppingCart,
  Film,
  Navigation,
  Share2,
  Lock,
  Headphones,
  CheckSquare,
  Compass,
  Cpu,
  Feather
} from 'lucide-react';

interface AppIconProps {
  packageName: string;
  appName?: string;
  isSystem?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  packageName, 
  appName = '', 
  isSystem = false,
  size = 'md' 
}) => {
  const pkg = packageName.toLowerCase();
  const name = appName.toLowerCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-11 h-11 text-sm rounded-xl',
    lg: 'w-14 h-14 text-base rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  // 1. Telegram
  if (pkg.includes('telegram') || name.includes('telegram') || pkg.includes('org.telegram')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30 flex-shrink-0`}>
        <Send className={`${iconSizes[size]} fill-current -ml-0.5`} />
      </div>
    );
  }

  // 2. WhatsApp
  if (pkg.includes('whatsapp') || name.includes('whatsapp')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <MessageCircle className={`${iconSizes[size]} fill-current`} />
      </div>
    );
  }

  // 3. Instagram
  if (pkg.includes('instagram') || name.includes('instagram')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 flex-shrink-0`}>
        <Camera className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 4. YouTube
  if (pkg.includes('youtube') || name.includes('youtube')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-600/30 flex-shrink-0`}>
        <Play className={`${iconSizes[size]} fill-current ml-0.5`} />
      </div>
    );
  }

  // 5. Snapp / Tapsi (Taxi / Ride)
  if (pkg.includes('snapp') || pkg.includes('tapsi') || pkg.includes('tap33') || name.includes('اسنپ') || name.includes('تپسی')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <Car className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 6. Digikala / Torob / Divar / Sheypoor (Shopping & Marketplace)
  if (pkg.includes('digikala') || pkg.includes('torob') || pkg.includes('divar') || pkg.includes('sheypoor') || name.includes('دیجی‌کالا') || name.includes('دیوار') || name.includes('ترب')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 flex-shrink-0`}>
        <ShoppingCart className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 7. Neshan / Balad / Google Maps (Navigation)
  if (pkg.includes('neshan') || pkg.includes('balad') || pkg.includes('maps') || name.includes('نشان') || name.includes('بلد') || name.includes('maps')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 flex-shrink-0`}>
        <Navigation className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 8. Aparat / Filimo / Namava (Video streaming)
  if (pkg.includes('aparat') || pkg.includes('filimo') || pkg.includes('namava') || name.includes('آپارات') || name.includes('فیلیمو')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30 flex-shrink-0`}>
        <Film className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 9. Rubika / Eitaa / Bale / Soroush / Shad (Iranian Messengers)
  if (pkg.includes('rubika') || pkg.includes('eitaa') || pkg.includes('bale') || pkg.includes('soroush') || pkg.includes('shad') || name.includes('روبیکا') || name.includes('ایتا') || name.includes('بله')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30 flex-shrink-0`}>
        <MessageCircle className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 10. Twitter / X
  if (pkg.includes('twitter') || name.includes('twitter') || name.includes('x') || pkg.includes('com.twitter.android')) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-950 border border-slate-700 flex items-center justify-center text-white shadow-md flex-shrink-0`}>
        <Feather className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 11. Discord
  if (pkg.includes('discord') || name.includes('discord')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0`}>
        <Bot className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 12. Chrome / Browser / Firefox
  if (pkg.includes('chrome') || pkg.includes('browser') || pkg.includes('firefox') || name.includes('chrome') || name.includes('مرورگر')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-yellow-500 via-emerald-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0`}>
        <Globe className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 13. Spotify / Music / Soundcloud
  if (pkg.includes('spotify') || pkg.includes('music') || pkg.includes('soundcloud') || name.includes('music') || name.includes('موسیقی') || name.includes('آهنگ')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-emerald-400 to-green-700 flex items-center justify-center text-black shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <Music className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 14. Camera
  if (pkg.includes('camera') || name.includes('camera') || name.includes('دوربین')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-md flex-shrink-0`}>
        <Camera className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 15. Gallery / Photos
  if (pkg.includes('gallery') || pkg.includes('photos') || name.includes('gallery') || name.includes('گالری') || name.includes('عکس')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30 flex-shrink-0`}>
        <Image className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 16. Gmail / Mail / Email
  if (pkg.includes('gmail') || pkg.includes('email') || pkg.includes('mail') || name.includes('ایمیل') || name.includes('جیمیل')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/30 flex-shrink-0`}>
        <Mail className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 17. Settings
  if (pkg.includes('settings') || name.includes('settings') || name.includes('تنظیمات')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-slate-200 shadow-md flex-shrink-0`}>
        <Settings className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 18. Phone / Dialer
  if (pkg.includes('dialer') || pkg.includes('phone') || pkg.includes('telecom') || name.includes('تماس') || name.includes('تلفن')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <Phone className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 19. Google Play Store / Cafe Bazaar / Myket
  if (pkg.includes('vending') || pkg.includes('playstore') || pkg.includes('bazaar') || pkg.includes('myket') || name.includes('بازار') || name.includes('مایکت') || name.includes('فروشگاه')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-teal-400 via-blue-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 flex-shrink-0`}>
        <ShoppingBag className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 20. System Bloatware / Brand Utilities
  if (pkg.includes('bixby') || pkg.includes('samsung') || pkg.includes('xiaomi') || pkg.includes('huawei') || pkg.includes('miui')) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-600 to-purple-800 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-md flex-shrink-0`}>
        <Bot className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 21. Dynamic Gradient Letter Avatar for custom third-party / system apps
  const initial = (appName || packageName.split('.').pop() || 'A').charAt(0).toUpperCase();
  
  // Deterministic color palette based on package name hash
  const palettes = [
    'from-cyan-500 to-blue-600 text-slate-950',
    'from-purple-500 to-pink-600 text-white',
    'from-amber-400 to-orange-600 text-slate-950',
    'from-emerald-400 to-teal-600 text-slate-950',
    'from-rose-500 to-red-600 text-white',
    'from-indigo-500 to-blue-600 text-white'
  ];

  let hash = 0;
  for (let i = 0; i < pkg.length; i++) {
    hash = pkg.charCodeAt(i) + ((hash << 5) - hash);
  }
  const selectedPalette = palettes[Math.abs(hash) % palettes.length];

  if (isSystem) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md flex-shrink-0`}>
        <Shield className={`${iconSizes[size]} text-amber-400/80`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-tr ${selectedPalette} font-black font-sans flex items-center justify-center shadow-md flex-shrink-0`}>
      {initial}
    </div>
  );
};
