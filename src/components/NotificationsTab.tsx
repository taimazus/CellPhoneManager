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
  ExternalLink,
  Volume2
} from 'lucide-react';
import { Device } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface NotificationsTabProps {
  device: Device | null;
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

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ device }) => {
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
      if (data.notifications) setNotifications(data.notifications);
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
        showToast(`پاسخ سریع برای ${notif.appName} ارسال گردید.`, 'success');
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
      await fetch(`/api/devices/${device.id}/notifications/dismiss`, { method: 'POST' });
      setNotifications([]);
      showToast('کلیه اعلان‌های گوشی پاکسازی شدند.', 'success');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <BellRing className="w-6 h-6 text-cyan-400" />
            <span>مرکز اعلان‌های زنده و پاسخ فوری (Live Notifications & Quick Reply)</span>
          </h2>
          <p className="text-xs text-slate-400">
            مشاهده لحظه‌ای پیام‌های تلگرام، واتس‌اپ، پیامک و برنامه‌ها روی ویندوز با قابلیت تایپ و پاسخ سریع بدون باز کردن قفل گوشی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>

          <button
            onClick={handleDismissAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاکسازی همه</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="p-16 text-center">
            <LoadingSpinner
              size="lg"
              variant="cyan"
              text="در حال شنود و استخراج اعلان‌های زنده گوشی..."
              subtext="اتصال به سرویس اعلان‌های ویندوز"
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-bold">هیچ اعلانی در نوار نوتیفیکیشن گوشی وجود ندارد.</p>
            <p className="text-xs text-slate-600">به محض دریافت پیام جدید در شبکه‌های اجتماعی یا سیستم، در اینجا نمایش داده خواهد شد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((notif) => {
              const isReplying = activeReplyId === notif.id;
              return (
                <div
                  key={notif.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30 flex-shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                            {notif.appName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                        </div>
                        <h4 className="font-bold text-white text-xs mt-1">{notif.title}</h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                    {notif.text}
                  </p>

                  {/* Quick Reply Box */}
                  {isReplying ? (
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
                      <button
                        onClick={() => setActiveReplyId(notif.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                      >
                        <Send className="w-3 h-3" />
                        <span>پاسخ فوری (Quick Reply)</span>
                      </button>
                    </div>
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
