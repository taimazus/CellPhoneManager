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
  HelpCircle
} from 'lucide-react';
import { Device } from '../types';

interface AiAssistantTabProps {
  device: Device | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendations?: string[];
  timestamp: string;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({ device }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `سلام! من دستیار هوش مصنوعی و پزشک تخصصی گوشی شما هستم.\nمی‌توانم وضعیت باتری، مصرف حافظه، سلامت پردازنده، سرعت شارژ و امنیت برنامه‌های نصب شده را برایتان تحلیل و بهینه‌سازی کنم.`,
      recommendations: [
        'تحلیل سلامت و دمای باتری',
        'راهنمای آزادسازی حافظه و فایل‌های کش',
        'چرا گوشی کند شده و چگونه سرعتش را بالا ببرم؟',
        'بررسی امنیتی و مجوزهای برنامه‌ها'
      ],
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
      const res = await fetch(`/api/devices/${device.id}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, deviceDetails: device })
      });
      const data = await res.json();
      if (data.success) {
        const aiMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: data.answer,
          recommendations: data.recommendations,
          timestamp: data.timestamp
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errAiMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `⚠️ خطا در پاسخگویی: ${data.error || 'خطای سرور'}`,
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
    <div className="space-y-6 animate-fadeIn font-sans text-right">
      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>دستیار هوش مصنوعی و پزشک تحلیلی گوشی (AI Phone Diagnostic Assistant)</span>
          </h2>
          <p className="text-xs text-slate-400">
            پرسش و پاسخ هوشمند، تحلیل لحظه‌ای علت داغ شدن، افت سرعت، مصرف باتری و ارائه راهکارهای بهینه‌سازی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>مدل فعال و آماده پاسخگویی</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="rounded-3xl glass-panel border border-slate-800 flex flex-col justify-between min-h-[520px] p-6 space-y-4">
        {/* Messages Scroll */}
        <div className="flex-1 space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                <div
                  className={`max-w-[80%] rounded-3xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 font-bold rounded-tl-none shadow-md shadow-cyan-950/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tr-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className={`text-[10px] mt-1.5 font-mono ${isUser ? 'text-slate-950/70' : 'text-slate-500'} text-left`}>
                    {m.timestamp}
                  </div>
                </div>

                {/* Recommendations buttons */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2 max-w-[80%]">
                    {m.recommendations.map((rec, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(rec)}
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
            <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>هوش مصنوعی در حال تحلیل اطلاعات و مشخصات سخت‌افزاری گوشی...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="pt-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="سوال خود را درباره بهینه‌سازی، باتری، داغ شدن یا حافظه گوشی بنویسید..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span>ارسال</span>
          </button>
        </div>
      </div>
    </div>
  );
};
