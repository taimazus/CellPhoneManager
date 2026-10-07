import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Terminal, 
  ShieldCheck, 
  Smartphone, 
  HelpCircle,
  Apple,
  Bot,
  Copy,
  Sparkles
} from 'lucide-react';
import { ToolStatus } from '../types';

export const DoctorTab: React.FC = () => {
  const [tools, setTools] = useState<Record<string, ToolStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [installingTool, setInstallingTool] = useState<string | null>(null);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tools/status');
      const data = await res.json();
      if (data.tools) {
        setTools(data.tools);
      }
    } catch (err) {
      console.error('Error fetching tool status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInstall = async (toolId: string) => {
    setInstallingTool(toolId);
    setInstallLogs([`در حال آماده‌سازی برای نصب یا پیکربندی ${toolId}...`]);
    try {
      const res = await fetch('/api/tools/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId })
      });
      const data = await res.json();
      if (data.success) {
        setInstallLogs((prev) => [...prev, data.message || 'عملیات با موفقیت تکمیل شد!']);
        fetchStatus();
      } else {
        setInstallLogs((prev) => [...prev, `پیام: ${data.message || data.error}`]);
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (err: any) {
      setInstallLogs((prev) => [...prev, `خطای شبکه: ${err.message}`]);
    } finally {
      setInstallingTool(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-cyan-400" />
            <span>پزشک درایورها، واسط‌ها و ابزارهای ارتباطی ویندوز</span>
          </h2>
          <p className="text-xs text-slate-400">
            بررسی خودکار درایورهای USB، کتابخانه‌های ADB، Scrcpy و واسط‌های ارتباط با آیفون جهت تضمین عملکرد بی‌نقص
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 font-bold text-xs transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>اسکن مجدد سیستم</span>
        </button>
      </div>

      {/* Tools Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(tools).map(([id, tool]) => (
          <div
            key={id}
            className={`rounded-2xl p-5 glass-panel border transition-all flex flex-col justify-between ${
              tool.installed ? 'border-slate-800/80 hover:border-cyan-500/40' : 'border-rose-500/20 bg-rose-500/5'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {tool.category === 'ios' ? (
                    <Apple className="w-5 h-5 text-slate-200" />
                  ) : tool.category === 'android' ? (
                    <Bot className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                  )}
                  <h3 className="text-sm font-bold text-white">{tool.name}</h3>
                </div>
                {tool.installed ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    آماده
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                    <XCircle className="w-3.5 h-3.5" />
                    نیاز به نصب
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                {tool.version}
              </span>

              {!tool.installed ? (
                <div className="flex items-center gap-2">
                  {id === 'itunesService' && (
                    <a
                      href="https://www.apple.com/itunes/download/win64"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>سایت اپل</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleInstall(id)}
                    disabled={installingTool === id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Download className={`w-3.5 h-3.5 ${installingTool === id ? 'animate-bounce' : ''}`} />
                    <span>{installingTool === id ? 'در حال نصب...' : 'نصب خودکار'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleInstall(id)}
                  disabled={installingTool === id}
                  className="text-[11px] font-semibold text-cyan-400 hover:underline"
                >
                  بروزرسانی
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Quick Fix Commands Card */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>دستورات نصب سریع در خط فرمان ویندوز (PowerShell / CMD):</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* pymobiledevice3 */}
          <div className="p-3 bg-[#050914] rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="font-mono text-cyan-300">
              python -m pip install --upgrade pymobiledevice3
            </div>
            <button
              onClick={() => copyToClipboard('python -m pip install --upgrade pymobiledevice3')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="کپی دستور"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* iTunes */}
          <div className="p-3 bg-[#050914] rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="font-mono text-cyan-300">
              winget install --id Apple.iTunes --exact
            </div>
            <button
              onClick={() => copyToClipboard('winget install --id Apple.iTunes --exact')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="کپی دستور"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Installation Logs Window */}
      {installLogs.length > 0 && (
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>گزارش خط فرمان نصب واسط‌ها:</span>
          </div>
          <div className="bg-[#050914] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
            {installLogs.join('\n')}
          </div>
        </div>
      )}

      {/* Connection & Troubleshooting Guide */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>راهنمای فعال‌سازی اتصال گوشی‌های مختلف:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300">
          {/* Android Guide */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <Bot className="w-4 h-4" />
              <span>گوشی‌های اندروید (سامسونگ، شیائومی، هواوی و...):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
              <li>به تنظیمات (Settings) و سپس «درباره تلفن» (About phone) بروید.</li>
              <li>روی <strong>Build Number</strong> یا <strong>MIUI Version</strong> هفت بار متوالی ضربه بزنید تا Developer options فعال شود.</li>
              <li>در منوی Developer Options، گزینه <strong>USB Debugging</strong> را روشن کنید.</li>
              <li>هنگام اتصال کابل به کامپیوتر، پیام «Allow USB Debugging» روی صفحه گوشی را تایید کنید.</li>
            </ol>
          </div>

          {/* iOS Guide */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Apple className="w-4 h-4" />
              <span>گوشی‌های اپل آیفون و آیپد (iOS / iPadOS):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
              <li>کابل Lightning یا Type-C را به ویندوز متصل کنید.</li>
              <li>در صورت نمایش پنجره <strong>Trust This Computer</strong> روی صفحه آیفون، گزینه Trust را بزنید و رمز عبور را وارد کنید.</li>
              <li>برای دسترسی‌های پیشرفته در iOS 16 و بالاتر: به Settings &gt; Privacy &amp; Security &gt; <strong>Developer Mode</strong> بروید و آن را روشن کنید.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
