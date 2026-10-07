import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  HardDrive, 
  BatteryCharging, 
  ShieldCheck,
  Zap,
  HelpCircle,
  Trash2,
  Camera,
  Volume2,
  VolumeX,
  Lock,
  Archive,
  Gauge
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';
import { safeFetchJson } from '../utils/api';

interface AiAssistantTabProps {
  device: Device | null;
}

interface ActionExecuted {
  type: string;
  title: string;
  status: 'success' | 'failed';
  summary: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actionExecuted?: ActionExecuted;
  recommendations?: string[];
  timestamp: string;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({ device }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `سلام! من **دستیار هوشمند و مجری عملیاتی گوشی شما** هستم.\n\nمن می‌توانم علاوه بر پاسخگویی و تحلیل، **درخواست‌های شما را مستقیماً روی گوشی متصل اجرا کنم**؛ مانند پاکسازی فایل‌های اضافی، تنظیم صدا، تست ویبره، گرفتن اسکرین‌شات، پشتیبان‌گیری و افزایش سرعت.`,
      recommendations: [
        '🧹 پاکسازی فایل‌های اضافی روی گوشی رو انجام بده',
        '📸 یه اسکرین‌شات از صفحه گوشی بگیر',
        '🔋 وضعیت سلامت و دمای باتری چطوره؟',
        '🚀 سرعت گوشی رو افزایش بده و لگ رو رفع کن',
        '📳 تست ویبره گوشی رو بزن',
        '🔇 گوشی رو سایلنت و بی‌صدا کن',
        '📦 از مخاطبین و پیامک‌ها بکاپ بگیر'
      ],
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const quickActionPrompts = [
    { label: '🧹 پاکسازی فایل‌های اضافی', query: 'پاکسازی فایل‌های اضافی روی گوشی رو انجام بده' },
    { label: '📸 اسکرین‌شات', query: 'یه اسکرین‌شات از صفحه گوشی بگیر' },
    { label: '🔋 دمای باتری', query: 'دمای باتری چنده و وضعیتش چطوره؟' },
    { label: '🚀 افزایش سرعت و رفع لگ', query: 'سرعت گوشی رو بهینه و لگ رو برطرف کن' },
    { label: '📳 تست ویبره', query: 'تست ویبره گوشی رو بزن' },
    { label: '🔇 سایلنت کردن', query: 'گوشی رو بی‌صدا و سایلنت کن' },
    { label: '📦 بکاپ‌گیری', query: 'از مخاطبین و پیامک‌های گوشی بکاپ بگیر' },
    { label: '🔒 قفل صفحه', query: 'صفحه نمایش گوشی رو قفل کن' }
  ];

  const handleSendMessage = async (queryText = inputText) => {
    if (!device || !queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const data = await safeFetchJson(`/api/devices/${device.id}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, deviceDetails: device })
      });
      
      if (data && data.success) {
        const aiMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: data.answer,
          actionExecuted: data.actionExecuted,
          recommendations: data.recommendations,
          timestamp: data.timestamp || new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errAiMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `⚠️ خطا در پاسخگویی و اجرای عملیات: ${data?.error || 'خطای سرور'}`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errAiMsg]);
      }
    } catch (err: any) {
      const errAiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: `⚠️ خطا در برقراری ارتباط با دستیار هوشمند: ${err.message}`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>دستیار هوشمند و مجری عملیات گوشی (Action-Oriented AI Agent)</span>
          </h2>
          <p className="text-xs text-slate-400">
            اجرای مستقیم دستورات روی گوشی ({device?.name || 'دستگاه متصل'}) شامل پاکسازی حافظه، تنظیم صدا، تست سخت‌افزار، بکاپ‌گیری و کنترل صفحه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>قابلیت اجرای مستقیم دستورات روی سخت‌افزار</span>
          </div>
        </div>
      </div>

      {/* In-Tab User Guide */}
      <TabGuideCard
        title="راهنمای کار با دستیار هوشمند مجری دستورات"
        description="چگونه با تایپ متن فارسی یا لمس دکمه‌های آماده، عملیات مختلف را روی گوشی متصل اجرا کنیم؟"
        steps={[
          "برای اجرای عملیات پاکسازی، کافیست بنویسید: «پاکسازی فایلهای اضافی رو انجام بده» تا هوش مصنوعی کش و فایل‌های موقت را پاک کند.",
          "برای ثبت عکس از صفحه بگویید: «یه اسکرین‌شات بگیر» یا برای بی‌صدا کردن گوشی بنویسید: «گوشی رو سایلنت کن».",
          "برای استخراج بکاپ بگویید: «از مخاطبین بکاپ بگیر» یا برای اطلاع از وضعیت حرارت بپرسید: «دمای باتری چنده؟».",
          "همچنین می‌توانید از دکمه‌های اقدام سریع بالای کادر پیام استفاده کنید."
        ]}
        tips={[
          "هوش مصنوعی زبان محاوره‌ای و رسمی فارسی را متوجه می‌شود و نیاز به دستورات انگلیسی پیچیده نیست.",
          "کلیه عملیات با بالاترین ضریب ایمنی و بدون آسیب به داده‌های شخصی انجام می‌پذیرد."
        ]}
      />

      {/* Chat Area */}
      <div className="rounded-3xl glass-panel border border-slate-800 flex flex-col justify-between min-h-[520px] p-6 space-y-4">
        
        {/* Quick Action Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>دستورات سریع:</span>
          </span>
          {quickActionPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              disabled={loading || !device}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 text-xs font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Messages Scroll */}
        <div className="flex-1 space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 font-bold rounded-tl-none shadow-md shadow-cyan-950/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tr-none shadow-md space-y-3'
                  }`}
                >
                  {/* Action Executed Badge */}
                  {m.actionExecuted && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <span>⚡ {m.actionExecuted.title}: </span>
                        <span className="text-white font-mono">{m.actionExecuted.summary}</span>
                      </div>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{m.text}</p>

                  <div className={`text-[10px] pt-1 font-mono ${isUser ? 'text-slate-950/70' : 'text-slate-500'} text-left`}>
                    {m.timestamp}
                  </div>
                </div>

                {/* Recommendations buttons */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2 max-w-[85%]">
                    {m.recommendations.map((rec, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(rec)}
                        disabled={loading || !device}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-all active:scale-95 shadow-sm"
                      >
                        💡 {rec}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/20 max-w-md animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>هوش مصنوعی در حال بررسی و اجرای دستور روی گوشی...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="pt-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="دستور خود را بنویسید (مثلاً: پاکسازی فایلهای اضافی رو انجام بده یا صدا رو زیاد کن)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading || !device}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span>ارسال و اجرا</span>
          </button>
        </div>
      </div>
    </div>
  );
};
