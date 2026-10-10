import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Send, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ShieldCheck, 
  Smartphone,
  BatteryCharging,
  Radio,
  HardDrive,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Device } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface NotificationsTabProps {
  device: Device | null;
  onNavigateToSms?: (sender?: string, text?: string) => void;
}

interface NotificationItem {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  timestamp: string;
  icon?: string;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ device, onNavigateToSms }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [replyTextMap, setReplyTextMap] = useState<{ [id: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchNotifications = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/notifications`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err: any) {
      showToast(`خطا در دریافت اعلان‌ها: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [device?.id]);

  const handleSendQuickReply = async (notif: NotificationItem) => {
    const text = replyTextMap[notif.id];
    if (!device || !text || !text.trim()) return;

    try {
      const res = await fetch(`/api/devices/${device.id}/notifications/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: notif.packageName, message: text })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `پاسخ سریع برای ${notif.appName} ثبت گردید.`, 'success');
        setReplyTextMap({ ...replyTextMap, [notif.id]: '' });
        setActiveReplyId(null);
      } else {
        showToast(`خطا: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const handleDismissAll = async () => {
    if (!device) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/notifications/dismiss`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
        showToast(data.message || 'کلیه اعلان‌های موقت گوشی پاکسازی شدند.', 'success');
      } else {
        showToast(`خطا: ${data.error || 'عدم امکان پاکسازی'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  const renderIcon = (icon?: string) => {
    switch (icon) {
      case 'battery':
        return <BatteryCharging className="w-5 h-5 text-emerald-400" />;
      case 'sim':
        return <Radio className="w-5 h-5 text-indigo-400" />;
      case 'storage':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'security':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'telegram':
        return <MessageSquare className="w-5 h-5 text-sky-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-cyan-400" />;
      default:
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getNotifStyle = (icon?: string) => {
    switch (icon) {
      case 'sms':
        return {
          cardBorder: 'border-r-4 border-r-teal-500 border-slate-800 hover:border-teal-500/40 bg-gradient-to-r from-teal-950/20 to-slate-900/80',
          badgeBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          badgeLabel: 'پیامک دریافتی'
        };
      case 'telegram':
      case 'whatsapp':
        return {
          cardBorder: 'border-r-4 border-r-sky-500 border-slate-800 hover:border-sky-500/40 bg-gradient-to-r from-sky-950/20 to-slate-900/80',
          badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          badgeLabel: 'پیام دریافتی پیام‌رسان'
        };
      case 'battery':
      case 'security':
        return {
          cardBorder: 'border-r-4 border-r-emerald-500 border-slate-800 hover:border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 to-slate-900/80',
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          badgeLabel: 'امنیت و سیستم'
        };
      case 'warning':
        return {
          cardBorder: 'border-r-4 border-r-rose-500 border-slate-800 hover:border-rose-500/40 bg-gradient-to-r from-rose-950/20 to-slate-900/80',
          badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          badgeLabel: 'هشدار دستگاه'
        };
      default:
        return {
          cardBorder: 'border-r-4 border-r-indigo-500 border-slate-800 hover:border-indigo-500/40 bg-gradient-to-r from-indigo-950/20 to-slate-900/80',
          badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          badgeLabel: 'اعلان دریافتی'
        };
    }
  };

  const isIos = device?.platform === 'ios' || device?.model?.toLowerCase().includes('iphone');

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>مرکز اعلان‌های زنده و رویدادهای سیستم</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {notifications.length} اعلان فعال
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIos
                  ? 'شنود زنده رخدادهای باتری، سیم‌کارت، لاگ‌های سیستمی و امنیت iOS از طریق Apple Lockdown Service'
                  : 'مشاهده لحظه‌ای پیام‌های تلگرام، واتس‌اپ، پیامک و اعلانات اندروید با قابلیت پاسخ سریع'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی زنده</span>
          </button>

          <button
            onClick={handleDismissAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاکسازی اعلان‌ها</span>
          </button>
        </div>
      </div>

      {/* Info notice for iOS APNs */}
      {isIos && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 flex items-center gap-3 text-xs text-slate-300">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <span>
            در سیستم‌عامل iOS، پروتکل امنیتی اپل (APNs) اعلانات برنامه‌های متفرقه را ایزوله می‌کند؛ اعلانات زنده سیستمی، سلامت باتری، وضعیت شبکه و گزارش‌های تشخیصی به صورت خودکار از بستر رسمی دستگاه واکشی می‌شوند.
          </span>
        </div>
      )}

      {/* Notifications List */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="p-16 text-center">
            <LoadingSpinner
              size="lg"
              variant="cyan"
              text="در حال شنود و استخراج اعلان‌های زنده دستگاه..."
              subtext="ارتباط پایدار با سرویس‌های سیستم‌عامل"
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-bold">هیچ اعلانی در نوار اعلان‌های گوشی ثبت نشده است.</p>
            <p className="text-xs text-slate-600">به محض دریافت رویداد جدید، بلافاصله در این بخش به نمایش درمی‌آید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((notif) => {
              const isReplying = activeReplyId === notif.id;
              const style = getNotifStyle(notif.icon);
              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl transition-all flex flex-col justify-between space-y-3 shadow-lg ${style.cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-700/80 flex items-center justify-center flex-shrink-0 shadow-inner">
                        {renderIcon(notif.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700/80 font-mono">
                            {notif.appName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-sans ${style.badgeBg}`}>
                            {style.badgeLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1">{notif.title}</h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 leading-relaxed font-mono">
                    {notif.text}
                  </p>

                  {/* Quick Reply Box for Android messaging */}
                  {!isIos && (
                    isReplying ? (
                      <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="پاسخ خود را بنویسید..."
                            value={replyTextMap[notif.id] || ''}
                            onChange={(e) => setReplyTextMap({ ...replyTextMap, [notif.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendQuickReply(notif)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={() => handleSendQuickReply(notif)}
                            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-500/20"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>ارسال</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                        {onNavigateToSms && (notif.icon === 'sms' || notif.packageName?.includes('mms') || notif.packageName?.includes('message')) && (
                          <button
                            onClick={() => onNavigateToSms(notif.title, notif.text)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all"
                            title="مشاهده مستقیم در تب پیامک‌ها"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                            <span>مشاهده پیامک</span>
                          </button>
                        )}
                        <button
                          onClick={() => setActiveReplyId(notif.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>پاسخ فوری (Quick Reply)</span>
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
