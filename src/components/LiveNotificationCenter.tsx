import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  MessageSquare, 
  PhoneCall, 
  PhoneIncoming,
  PhoneMissed, 
  X, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Smartphone,
  ArrowLeft,
  Volume2,
  Sliders,
  Check,
  Laptop,
  Monitor
} from 'lucide-react';
import { LivePhoneEvent } from '../types';

interface LiveNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  events: LivePhoneEvent[];
  unreadCount: number;
  activeToast: LivePhoneEvent | null;
  onDismissToast: () => void;
  onOpenEvent: (event: LivePhoneEvent) => void;
  onMarkRead: (eventId: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSimulate?: (category: 'sms' | 'call' | 'notification') => void;
}

export function showBrowserDesktopNotification(event: LivePhoneEvent, onOpen?: (ev: LivePhoneEvent) => void) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const iconChar = event.category === 'sms' ? '📩' : event.category === 'call' ? '📞' : '🔔';
    const n = new Notification(`${iconChar} ${event.title}`, {
      body: event.text || event.appName,
      icon: '/favicon.ico',
      tag: event.id,
      requireInteraction: event.category === 'call'
    });

    n.onclick = () => {
      window.focus();
      if (onOpen) onOpen(event);
      n.close();
    };
  } catch (err) {
    console.warn('[DesktopNotification] Dispatch notice:', err);
  }
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function playNotificationChime(category: 'sms' | 'call' | 'notification') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (category === 'call') {
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      osc2.frequency.setValueAtTime(880, now);
    } else if (category === 'sms') {
      osc1.frequency.setValueAtTime(739.99, now);
      osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);
      osc2.frequency.setValueAtTime(1479.98, now);
    } else if (category === 'system') {
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc2.frequency.setValueAtTime(783.99, now); // G5
    } else {
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      osc2.frequency.setValueAtTime(1174.66, now);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);
  } catch {
    // Web Audio blocked
  }
}

export const LiveNotificationCenter: React.FC<LiveNotificationCenterProps> = ({
  isOpen,
  onClose,
  events,
  unreadCount,
  activeToast,
  onDismissToast,
  onOpenEvent,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onSimulate
}) => {
  const [filter, setFilter] = useState<'all' | 'sms' | 'call' | 'notification' | 'system'>('all');
  const [desktopPermission, setDesktopPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, [isOpen]);

  const handleRequestDesktopPermission = async () => {
    const res = await requestDesktopNotificationPermission();
    setDesktopPermission(res);
  };

  // Filter events based on active pill
  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  const getEventBadge = (category: string, isMissed?: boolean) => {
    if (category === 'sms') {
      return {
        bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        icon: MessageSquare,
        label: 'پیامک دریافتی'
      };
    }
    if (category === 'call') {
      return {
        bg: isMissed 
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: isMissed ? PhoneMissed : PhoneIncoming,
        label: isMissed ? 'تماس بی‌پاسخ (از دست رفته)' : 'تماس ورودی (دریافتی)'
      };
    }
    if (category === 'system') {
      return {
        bg: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
        icon: Sliders,
        label: 'هشدار سیستمی دستگاه'
      };
    }
    return {
      bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: BellRing,
      label: 'اعلان دریافتی برنامه'
    };
  };

  return (
    <>
      {/* 1. FLOATING TOAST BANNER (NEW INCOMING EVENT) */}
      {activeToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-[999] w-full max-w-sm sm:max-w-md animate-slideDown text-right">
          <div 
            onClick={() => {
              onOpenEvent(activeToast);
              onDismissToast();
            }}
            className={`cursor-pointer rounded-2xl p-4 shadow-2xl backdrop-blur-xl border relative overflow-hidden transition-all hover:scale-[1.01] ${
              activeToast.category === 'sms'
                ? 'bg-[#0f1715]/95 border-emerald-500/50 shadow-emerald-950/60'
                : activeToast.category === 'call'
                ? 'bg-[#1a0f12]/95 border-rose-500/50 shadow-rose-950/60'
                : activeToast.category === 'system'
                ? 'bg-[#181308]/95 border-amber-500/50 shadow-amber-950/60'
                : 'bg-[#11121d]/95 border-amber-500/40 shadow-black/80'
            }`}
          >
            {/* Ambient Backlight Glow */}
            <div className={`absolute -inset-1 rounded-2xl blur-lg opacity-35 -z-10 pointer-events-none ${
              activeToast.category === 'sms' ? 'bg-emerald-500' : activeToast.category === 'call' ? 'bg-rose-500' : 'bg-amber-500'
            }`} />

            {/* Top progress bar indicating auto-dismiss */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 animate-toastProgress" />
            </div>

            <div className="flex items-start justify-between gap-3 mt-1">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl border ${getEventBadge(activeToast.category, activeToast.isMissedCall).bg} shadow-md`}>
                  {React.createElement(getEventBadge(activeToast.category, activeToast.isMissedCall).icon, {
                    className: `w-5 h-5 ${activeToast.category === 'call' ? 'animate-bellRing text-rose-300' : 'animate-bounce'}`
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border font-mono tracking-wide bg-stone-900/80 text-yellow-300 border-amber-500/30">
                      {activeToast.appName}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {activeToast.timestamp}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5 leading-snug">
                    {activeToast.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissToast();
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-all"
                title="بستن اعلان"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeToast.text && (
              <p className="text-xs text-stone-300 mt-2 line-clamp-2 leading-relaxed bg-black/30 p-2 rounded-xl border border-white/5">
                {activeToast.text}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-[11px] text-yellow-300/90 font-medium flex items-center gap-1">
                <span>کلیک برای بازگشایی و مدیریت</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-yellow-300 font-bold text-[11px] border border-amber-500/30">
                {activeToast.actionLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION CENTER POPUP DRAWER */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn text-right"
          onClick={onClose}
        >
          <div 
            className="w-full max-w-md sm:max-w-lg h-full bg-[#0d0e13] border-l border-amber-500/30 p-5 flex flex-col shadow-2xl shadow-black relative animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-yellow-400 border border-amber-500/35 relative">
                  <BellRing className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>مرکز اعلان‌ها و ارتباطات زنده</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {unreadCount} جدید
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-stone-400">پیامک‌ها، تماس‌ها و هشدارهای دریافتی از گوشی متصل</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition-all"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills & Quick Actions */}
            <div className="py-3 flex items-center justify-between gap-2 flex-shrink-0 border-b border-amber-500/10">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { id: 'all', label: 'همه' },
                  { id: 'sms', label: 'پیامک‌ها' },
                  { id: 'call', label: 'تماس‌ها' },
                  { id: 'notification', label: 'برنامه‌ها' },
                  { id: 'system', label: 'سیستم' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFilter(p.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                      filter === p.id
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 border-amber-400 font-black'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-emerald-400 text-xs border border-stone-800 transition-all flex items-center gap-1"
                    title="خواندن همه"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">خواندن همه</span>
                  </button>
                )}
                {events.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-rose-400 text-xs border border-stone-800 transition-all"
                    title="پاکسازی لیست"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Windows Desktop Notification Status Card */}
            <div className="my-2 p-3 rounded-2xl bg-[#14151b] border border-amber-500/20 flex items-center justify-between gap-3 text-xs flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-200">اعلان‌های ویندوز (Desktop):</span>
                    {desktopPermission === 'granted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        فعال در ویندوز
                      </span>
                    ) : desktopPermission === 'denied' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        غیرفعال در مرورگر
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-yellow-300 border border-amber-500/30">
                        آماده فعال‌سازی
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    دریافت بنر و صدای نوتیفیکیشن در گوشه دسکتاپ ویندوز حتی هنگام مینیمایز بودن نرم‌افزار
                  </p>
                </div>
              </div>

              {desktopPermission !== 'granted' ? (
                <button
                  onClick={handleRequestDesktopPermission}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
                >
                  فعال‌سازی
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  <span>تأیید شد</span>
                </div>
              )}
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-thin">
              {filteredEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                  <div className="w-14 h-14 rounded-3xl bg-stone-900/80 border border-stone-800 flex items-center justify-center mb-3">
                    <Bell className="w-7 h-7 text-stone-600" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-400">اعلان جدیدی وجود ندارد</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
                    به محض دریافت پیامک، تماس ورودی یا اعلان جدید روی گوشی، بلافاصله در این بخش نمایان خواهد شد.
                  </p>

                  {/* Simulator buttons for quick testing */}
                  {onSimulate && (
                    <div className="mt-6 pt-4 border-t border-stone-800/80 w-full flex flex-col items-center">
                      <span className="text-[11px] text-stone-500 mb-2">تست سریع شبیه‌سازی:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSimulate('sms')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all"
                        >
                          تست پیامک
                        </button>
                        <button
                          onClick={() => onSimulate('call')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all"
                        >
                          تست تماس
                        </button>
                        <button
                          onClick={() => onSimulate('notification')}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 border border-amber-500/30 text-[11px] font-bold transition-all"
                        >
                          تست تلگرام
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                filteredEvents.map(evt => {
                  const badge = getEventBadge(evt.category, evt.isMissedCall);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        onMarkRead(evt.id);
                        onOpenEvent(evt);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                        !evt.read
                          ? 'bg-[#151622] border-amber-500/30 hover:border-amber-400 shadow-md'
                          : 'bg-[#0f1015] border-stone-800/80 hover:border-stone-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {!evt.read && (
                        <div className="absolute top-3.5 left-3.5 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/80 animate-pulse" />
                      )}

                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl border shrink-0 ${badge.bg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-yellow-300 truncate">
                              {evt.appName}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {evt.timestamp}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-white mt-1 leading-snug">
                            {evt.title}
                          </h4>

                          {evt.text && (
                            <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                              {evt.text}
                            </p>
                          )}

                          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-800/60">
                            <span className="text-amber-300 font-bold group-hover:underline flex items-center gap-1">
                              <span>{evt.actionLabel}</span>
                              <ArrowLeft className="w-3 h-3" />
                            </span>
                            {!evt.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkRead(evt.id);
                                }}
                                className="text-[10px] text-stone-400 hover:text-emerald-400 flex items-center gap-0.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>دیده‌شد</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
