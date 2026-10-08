import React from 'react';
import { RefreshCw, Sparkles, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'cyan' | 'purple' | 'emerald';
  text?: string;
  subtext?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'gold',
  text,
  subtext,
  className = ''
}) => {
  const sizeMap = {
    xs: { outer: 'w-4 h-4 border', inner: 'w-2 h-2', icon: 'w-2.5 h-2.5', text: 'text-[10px]' },
    sm: { outer: 'w-6 h-6 border-2', inner: 'w-3 h-3', icon: 'w-3 h-3', text: 'text-xs' },
    md: { outer: 'w-10 h-10 border-2', inner: 'w-5 h-5', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { outer: 'w-14 h-14 border-[3px]', inner: 'w-7 h-7', icon: 'w-6 h-6', text: 'text-base' },
    xl: { outer: 'w-20 h-20 border-4', inner: 'w-10 h-10', icon: 'w-8 h-8', text: 'text-lg' }
  };

  const variantMap = {
    gold: {
      border: 'border-amber-500/20 border-t-yellow-400 border-r-amber-500',
      glow: 'shadow-amber-500/20',
      icon: 'text-yellow-400',
      text: 'text-yellow-200'
    },
    cyan: {
      border: 'border-cyan-500/20 border-t-cyan-400 border-r-blue-500',
      glow: 'shadow-cyan-500/20',
      icon: 'text-cyan-400',
      text: 'text-cyan-200'
    },
    purple: {
      border: 'border-purple-500/20 border-t-purple-400 border-r-pink-500',
      glow: 'shadow-purple-500/20',
      icon: 'text-purple-400',
      text: 'text-purple-200'
    },
    emerald: {
      border: 'border-emerald-500/20 border-t-emerald-400 border-r-teal-500',
      glow: 'shadow-emerald-500/20',
      icon: 'text-emerald-400',
      text: 'text-emerald-200'
    }
  };

  const s = sizeMap[size];
  const v = variantMap[variant];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 animate-fadeIn ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing halo */}
        <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${v.glow} animate-pulse-glow`} />
        
        {/* Main spinning ring */}
        <div className={`${s.outer} ${v.border} rounded-full animate-spin shadow-lg`} />
        
        {/* Inner reverse-spinning counter ring */}
        {size !== 'xs' && (
          <div
            className={`absolute ${s.inner} rounded-full border border-dashed border-stone-500/40 animate-spin-slow`}
            style={{ animationDirection: 'reverse' }}
          />
        )}
      </div>

      {(text || subtext) && (
        <div className="text-center space-y-1">
          {text && (
            <div className={`font-bold ${s.text} ${v.text} flex items-center justify-center gap-1.5`}>
              <span>{text}</span>
              <span className="dot-typing text-amber-400">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
          {subtext && (
            <p className="text-[11px] text-stone-400 leading-relaxed max-w-xs">{subtext}</p>
          )}
        </div>
      )}
    </div>
  );
};

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`rounded-2xl p-4 border border-amber-500/15 bg-stone-950/60 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-lg skeleton-shimmer w-3/5" />
          <div className="h-2.5 rounded-lg skeleton-shimmer w-2/5" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded-lg skeleton-shimmer" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
};

export const ActionOverlay: React.FC<{
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  variant?: 'gold' | 'cyan' | 'purple' | 'emerald';
}> = ({
  isOpen,
  title = 'در حال پردازش عملیات...',
  subtitle = 'لطفاً چند لحظه شکیبا باشید. به منظور جلوگیری از تداخل، دکمه‌ها موقتاً غیرفعال شده‌اند.',
  variant = 'gold'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none" dir="rtl">
      <div className="bg-[#0b1022]/95 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl shadow-amber-500/15 animate-fadeInScale">
        <LoadingSpinner
          size="lg"
          variant={variant}
          text={title}
          subtext={subtitle}
        />
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-cyan-400 w-full animate-pulse-glow" />
        </div>
      </div>
    </div>
  );
};
