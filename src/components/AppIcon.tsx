import React, { useState } from 'react';
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
import { resolveAppDisplayName } from '../utils/appNameResolver';

export interface AppIconProps {
  packageName?: string;
  pkg?: string;
  appName?: string;
  name?: string;
  icon?: string;
  isSystem?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  deviceId?: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  packageName = '', 
  pkg = '',
  appName = '', 
  name = '',
  icon = '',
  isSystem = false,
  size = 'md',
  deviceId = '',
  className = ''
}) => {
  const [imgError, setImgError] = useState<boolean>(false);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const effectivePkg = packageName || pkg || icon || '';
  const effectiveName = resolveAppDisplayName(effectivePkg, appName || name);
  const pkgLower = effectivePkg.toLowerCase();
  const nameLower = effectiveName.toLowerCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-11 h-11 text-sm rounded-xl',
    lg: 'w-14 h-14 text-base rounded-2xl',
    xl: 'w-16 h-16 text-lg rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8'
  };

  // If a package name exists and the image hasn't errored out, attempt to load the real extracted APK icon
  if (effectivePkg && !imgError) {
    const iconUrl = `/api/devices/${encodeURIComponent(deviceId || 'default')}/apps/${encodeURIComponent(effectivePkg)}/icon`;

    return (
      <div className={`relative ${sizeClasses[size]} ${className} flex-shrink-0 flex items-center justify-center overflow-hidden bg-slate-900/80 border border-slate-800/80 shadow-md transition-all hover:scale-105 group`}>
        <img
          src={iconUrl}
          alt={effectiveName || effectivePkg}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton-shimmer bg-slate-800/50" />
        )}
      </div>
    );
  }

  // --- FALLBACK PRESET & CATEGORY ICONS ---

  // 1. Telegram
  if (pkgLower.includes('telegram') || nameLower.includes('telegram') || pkgLower.includes('org.telegram')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30 flex-shrink-0`}>
        <Send className={`${iconSizes[size]} fill-current -ml-0.5`} />
      </div>
    );
  }

  // 2. WhatsApp
  if (pkgLower.includes('whatsapp') || nameLower.includes('whatsapp')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <MessageCircle className={`${iconSizes[size]} fill-current`} />
      </div>
    );
  }

  // 3. Instagram
  if (pkgLower.includes('instagram') || nameLower.includes('instagram')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 flex-shrink-0`}>
        <Camera className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 4. YouTube
  if (pkgLower.includes('youtube') || nameLower.includes('youtube')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-600/30 flex-shrink-0`}>
        <Play className={`${iconSizes[size]} fill-current ml-0.5`} />
      </div>
    );
  }

  // 5. Snapp / Tapsi (Taxi / Ride)
  if (pkgLower.includes('snapp') || pkgLower.includes('tapsi') || pkgLower.includes('tap33') || nameLower.includes('اسنپ') || nameLower.includes('تپسی')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <Car className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 6. Digikala / Torob / Divar / Sheypoor (Shopping & Marketplace)
  if (pkgLower.includes('digikala') || pkgLower.includes('torob') || pkgLower.includes('divar') || pkgLower.includes('sheypoor') || nameLower.includes('دیجی‌کالا') || nameLower.includes('دیوار') || nameLower.includes('ترب')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 flex-shrink-0`}>
        <ShoppingCart className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 7. Neshan / Balad / Google Maps (Navigation)
  if (pkgLower.includes('neshan') || pkgLower.includes('balad') || pkgLower.includes('maps') || nameLower.includes('نشان') || nameLower.includes('بلد') || nameLower.includes('maps')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 flex-shrink-0`}>
        <Navigation className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 8. Aparat / Filimo / Namava (Video streaming)
  if (pkgLower.includes('aparat') || pkgLower.includes('filimo') || pkgLower.includes('namava') || nameLower.includes('آپارات') || nameLower.includes('فیلیمو')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30 flex-shrink-0`}>
        <Film className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 9. Rubika / Eitaa / Bale / Soroush / Shad (Iranian Messengers)
  if (pkgLower.includes('rubika') || pkgLower.includes('eitaa') || pkgLower.includes('bale') || pkgLower.includes('soroush') || pkgLower.includes('shad') || nameLower.includes('روبیکا') || nameLower.includes('ایتا') || nameLower.includes('بله')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30 flex-shrink-0`}>
        <MessageCircle className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 10. Twitter / X
  if (pkgLower.includes('twitter') || nameLower.includes('twitter') || nameLower.includes('x') || pkgLower.includes('com.twitter.android')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-slate-950 border border-slate-700 flex items-center justify-center text-white shadow-md flex-shrink-0`}>
        <Feather className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 11. Discord
  if (pkgLower.includes('discord') || nameLower.includes('discord')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0`}>
        <Bot className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 12. Chrome / Browser / Firefox
  if (pkgLower.includes('chrome') || pkgLower.includes('browser') || pkgLower.includes('firefox') || nameLower.includes('chrome') || nameLower.includes('مرورگر')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-yellow-500 via-emerald-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0`}>
        <Globe className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 13. Spotify / Music / Soundcloud
  if (pkgLower.includes('spotify') || pkgLower.includes('music') || pkgLower.includes('soundcloud') || nameLower.includes('music') || nameLower.includes('موسیقی') || nameLower.includes('آهنگ')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-emerald-400 to-green-700 flex items-center justify-center text-black shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <Music className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 14. Camera
  if (pkgLower.includes('camera') || nameLower.includes('camera') || nameLower.includes('دوربین')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-md flex-shrink-0`}>
        <Camera className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 15. Gallery / Photos
  if (pkgLower.includes('gallery') || pkgLower.includes('photos') || nameLower.includes('gallery') || nameLower.includes('گالری') || nameLower.includes('عکس')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30 flex-shrink-0`}>
        <Image className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 16. Gmail / Mail / Email
  if (pkgLower.includes('gmail') || pkgLower.includes('email') || pkgLower.includes('mail') || nameLower.includes('ایمیل') || nameLower.includes('جیمیل')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/30 flex-shrink-0`}>
        <Mail className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 17. Settings
  if (pkgLower.includes('settings') || nameLower.includes('settings') || nameLower.includes('تنظیمات')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-slate-200 shadow-md flex-shrink-0`}>
        <Settings className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 18. Phone / Dialer
  if (pkgLower.includes('dialer') || pkgLower.includes('phone') || pkgLower.includes('telecom') || nameLower.includes('تماس') || nameLower.includes('تلفن')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0`}>
        <Phone className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 19. Google Play Store / Cafe Bazaar / Myket
  if (pkgLower.includes('vending') || pkgLower.includes('playstore') || pkgLower.includes('bazaar') || pkgLower.includes('myket') || nameLower.includes('بازار') || nameLower.includes('مایکت') || nameLower.includes('فروشگاه')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-teal-400 via-blue-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/30 flex-shrink-0`}>
        <ShoppingBag className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 20. System Bloatware / Brand Utilities
  if (pkgLower.includes('bixby') || pkgLower.includes('samsung') || pkgLower.includes('xiaomi') || pkgLower.includes('huawei') || pkgLower.includes('miui')) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr from-indigo-600 to-purple-800 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-md flex-shrink-0`}>
        <Bot className={`${iconSizes[size]}`} />
      </div>
    );
  }

  // 21. System App Generic Shield
  if (isSystem) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md flex-shrink-0`}>
        <Shield className={`${iconSizes[size]} text-amber-400/80`} />
      </div>
    );
  }

  // 22. Dynamic Gradient Letter Avatar for custom third-party apps
  const initial = (effectiveName || effectivePkg.split('.').pop() || 'A').charAt(0).toUpperCase();
  
  const palettes = [
    'from-cyan-500 to-blue-600 text-slate-950',
    'from-purple-500 to-pink-600 text-white',
    'from-amber-400 to-orange-600 text-slate-950',
    'from-emerald-400 to-teal-600 text-slate-950',
    'from-rose-500 to-red-600 text-white',
    'from-indigo-500 to-blue-600 text-white'
  ];

  let hash = 0;
  for (let i = 0; i < effectivePkg.length; i++) {
    hash = effectivePkg.charCodeAt(i) + ((hash << 5) - hash);
  }
  const selectedPalette = palettes[Math.abs(hash) % palettes.length];

  return (
    <div className={`${sizeClasses[size]} ${className} bg-gradient-to-tr ${selectedPalette} font-black font-sans flex items-center justify-center shadow-md flex-shrink-0`}>
      {initial}
    </div>
  );
};
