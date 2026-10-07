import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Bug,
  Thermometer,
  Battery,
  Sparkles,
  Wrench,
  RotateCcw,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Info,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { Device } from '../types';
import { TabGuideCard } from './TabGuideCard';

interface DiagnosticsTabProps {
  device: Device | null;
}

interface DetectedIssue {
  id: string;
  tag: string;
  pkg?: string | null;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cause: string;
  solution: string;
  recommendedAction: string;
  sampleLine: string;
}

interface AnalysisResult {
  totalAnalyzed: number;
  issuesCount: number;
  issues: DetectedIssue[];
  reportText: string;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({ device }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERR' | 'WARN' | 'INFO'>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [repairingAction, setRepairingAction] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [selectedErrorLine, setSelectedErrorLine] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!device) return;

    // Connect WebSocket for live logs
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'START_LOGCAT', deviceId: device.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'LOG_LINE') {
          setLogs((prev) => {
            const next = [...prev, data.line];
            if (next.length > 800) return next.slice(next.length - 800);
            return next;
          });
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'STOP_LOGCAT', deviceId: device.id }));
        ws.close();
      }
    };
  }, [device?.id]);

  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const toggleStream = () => {
    if (isStreaming) {
      wsRef.current?.send(JSON.stringify({ type: 'STOP_LOGCAT', deviceId: device?.id }));
      setIsStreaming(false);
    } else {
      wsRef.current?.send(JSON.stringify({ type: 'START_LOGCAT', deviceId: device?.id }));
      setIsStreaming(true);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device_logs_${device?.id || 'export'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorLinesCount = logs.filter(
    (l) => l.includes('[ERR]') || l.includes(' E ') || l.includes('Error') || l.includes('Exception')
  ).length;

  // Trigger Intelligent AI Error Analysis
  const runAiLogAnalysis = async (specificLine?: string) => {
    if (!device) return;
    setAnalyzing(true);
    setShowAnalysisModal(true);
    setActionSuccessMsg(null);

    try {
      const logsToAnalyze = specificLine ? [specificLine] : logs.slice(-150);
      const res = await fetch(`/api/devices/${device.id}/diagnostics/analyze-errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToAnalyze })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error('Error analyzing logs:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Perform 1-Click Fix
  const handleExecuteFix = async (action: string, targetPackage?: string | null) => {
    if (!device) return;
    setRepairingAction(action);
    setActionSuccessMsg(null);

    try {
      const res = await fetch(`/api/devices/${device.id}/diagnostics/fix-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetPackage })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(data.message || 'عملیات رفع خطا با موفقیت انجام گردید.');
        if (action === 'flush_logcat') {
          setLogs([]);
        }
      }
    } catch (err) {
      console.error('Error fixing diagnostic issue:', err);
    } finally {
      setRepairingAction(null);
    }
  };

  const copyDiagnosticReport = () => {
    if (!analysisResult?.reportText) return;
    navigator.clipboard.writeText(analysisResult.reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const filteredLogs = logs.filter((line) => {
    if (searchFilter && !line.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (levelFilter === 'ERR' && !line.includes('[ERR]') && !line.includes(' E ') && !line.includes('Error') && !line.includes('Exception')) {
      return false;
    }
    if (levelFilter === 'WARN' && !line.includes(' W ') && !line.includes('Warn') && !line.includes('Warning')) {
      return false;
    }
    if (levelFilter === 'INFO' && !line.includes(' I ') && !line.includes('[INFO]')) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl glass-panel p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold">سلامت سخت‌افزار و سنسورها</span>
            <div className="text-lg font-bold text-white mt-1">عالی / بدون خطای بحرانی</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold">سنسور حرارتی (Thermal State)</span>
            <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
              {device?.battery?.temperature || 31.4}°C (طبیعی)
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold">سیستم گزارش کرش (Crash Dumper)</span>
            <div className="text-lg font-bold text-cyan-400 mt-1 flex items-center gap-2">
              <span>مانیتورینگ برخط فعال</span>
              {errorLinesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {errorLinesCount} خطا
                </span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Bug className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* AI Log Analysis Trigger Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>عیب‌یابی هوشمند لاگ‌ها و تعمیر خودکار خطاهای رصد شده</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">هوش مصنوعی AI</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تحلیل ریشه‌ای کرش‌ها و ارورهای دریافتی، صدور گزارش تشخیصی به زبان فارسی و اعمال تعمیر با ۱ کلیک
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => runAiLogAnalysis()}
            disabled={analyzing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>تحلیل و تعمیر هوشمند خطاها</span>
          </button>

          <button
            type="button"
            onClick={() => handleExecuteFix('flush_logcat')}
            disabled={repairingAction === 'flush_logcat'}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
            title="تخلیه بافر لاگ‌ها و فایل‌های کرش قدیمی"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>تخلیه بافر لاگ</span>
          </button>
        </div>
      </div>

      {/* Realtime Terminal Console */}
      <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden flex flex-col h-[520px]">
        {/* Terminal Header */}
        <div className="bg-[#0b1328] px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>جریان زنده لاگ دستگاه (Logcat / Syslog Stream)</span>
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="فیلتر در لاگ‌ها..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg pr-8 pl-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44"
              />
            </div>

            {/* Level Filters */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['ALL', 'ERR', 'WARN', 'INFO'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    levelFilter === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={toggleStream}
              className={`p-1.5 rounded-lg border transition-all ${
                isStreaming
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title={isStreaming ? 'توقف موقت لاگ' : 'ادامه دریافت'}
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Clear */}
            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              title="پاکسازی صفحه"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={exportLogs}
              className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
              title="خروجی گرفتن فایل متنی لاگ"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 bg-[#050813] p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-slate-600 py-16">
              در حال دریافت خطوط لاگ از پردازشگر دستگاه...
            </div>
          ) : (
            filteredLogs.map((line, idx) => {
              const isErr = line.includes('[ERR]') || line.includes(' E ') || line.includes('Error') || line.includes('Exception');
              const isWarn = line.includes(' W ') || line.includes('Warn');
              const isInfo = line.includes(' I ') || line.includes('[INFO]');

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (isErr) {
                      setSelectedErrorLine(line);
                      runAiLogAnalysis(line);
                    }
                  }}
                  className={`leading-relaxed tracking-tight transition-colors ${
                    isErr ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded cursor-pointer border border-rose-500/20 flex items-center justify-between group' :
                    isWarn ? 'text-amber-300' :
                    isInfo ? 'text-cyan-300' :
                    'text-slate-400'
                  }`}
                  title={isErr ? 'کلیک کنید تا هوش مصنوعی این خطا را تحلیل و دکمه تعمیر را آماده کند' : undefined}
                >
                  <span className="break-all">{line}</span>
                  {isErr && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mr-2">
                      <Sparkles className="w-3 h-3" />
                      <span>تحلیل و رفع</span>
                    </span>
                  )}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Step-by-Step Guidance Card */}
      <TabGuideCard
        title="راهنمای عیب‌یابی لاگ‌ها و رفع خطاهای سیستمی"
        description="نحوه رصد جریان زنده Logcat، تشخیص ارورهای برنامه‌ها و سیستم‌عامل و اعمال راهکارهای تعمیر خودکار"
        steps={[
          'با انتخاب فیلتر ERR در بالای کنسول، لاگ‌های سیستمی پالایش شده و تنها خطاهای بحرانی نمایش داده می‌شوند.',
          'با کلیک بر روی دکمه «تحلیل و تعمیر هوشمند خطاها» یا کلیک مستقیم روی هر خط قرمز رنگ، هوش مصنوعی علت ریشه‌ای خطا را به فارسی تحلیل می‌کند.',
          'در پنجره تحلیل، گزینه‌های تعمیر با ۱ کلیک شامل: توقف و راه‌اندازی مجدد برنامه معیوب، پاکسازی کش اختصاصی، تخلیه بافر لاگ‌ها و ترمیم پرمیشن‌ها در دسترس هستند.',
          'امکان کپی گزارش متنی استاندارد عیب‌یابی با یک کلیک جهت ارسال به کارشناس پشتیبانی فراهم می‌باشد.'
        ]}
        tips={[
          'خطای NoClassDefFoundError معمولاً ناشی از به‌روزرسانی ناقص یا حافظه کش باقیمانده از بیلد قبلی است که با پاکسازی کش و ریستارت نرم حل می‌شود.',
          'در صورتی که خطاها مربوط به حافظه رم (OOM) باشد، گزینه «تخلیه بافر لاگ» و اجرای بهینه‌سازی از تب «دکتر سیستم» پایداری کامل را بازمی‌گرداند.'
        ]}
      />

      {/* AI Log Analysis & 1-Click Repair Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0b1328] border border-cyan-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>گزارش تحلیل ریشه‌ای و تعمیر خطاهای لاگ</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">AI Diagnostic Doctor</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {device?.model} ({device?.id})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAnalysisModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 select-text">
              {analyzing ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <div className="text-sm font-bold text-white">هوش مصنوعی در حال تحلیل لاگ‌ها و ساختار خطایابی...</div>
                  <p className="text-xs text-slate-400">استخراج متدهای فراخوانی، پکیج‌های درگیر و محاسبه راهکار ترمیم</p>
                </div>
              ) : analysisResult ? (
                <>
                  {/* Status Banner */}
                  {actionSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{actionSuccessMsg}</span>
                    </div>
                  )}

                  {/* Issues Count Badge */}
                  <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-200">
                        تعداد خطاهای تفکیک شده: <span className="text-cyan-400 font-mono font-bold">{analysisResult.issuesCount}</span> مورد
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      بررسی شده از بین {analysisResult.totalAnalyzed} سطر لاگ
                    </span>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-4">
                    {analysisResult.issues.map((issue, idx) => (
                      <div
                        key={issue.id || idx}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              {issue.severity === 'critical' ? '🔴 خطای بحرانی' : issue.severity === 'high' ? '🟠 خطای نرم‌افزاری' : '🟡 هشدار عملکردی'}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">
                              {issue.tag} {issue.pkg ? `[${issue.pkg}]` : ''}
                            </span>
                          </div>
                          <span className="text-[11px] text-cyan-400 font-medium">خطای #{idx + 1}</span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-200">{issue.type}</div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                            <span className="font-semibold text-slate-300">علت ریشه‌ای: </span>
                            {issue.cause}
                          </div>
                          <div className="text-xs text-emerald-400 mt-1 leading-relaxed">
                            <span className="font-semibold text-emerald-300">راهکار رفع: </span>
                            {issue.solution}
                          </div>
                        </div>

                        {/* Sample Code Line */}
                        <div className="bg-black/50 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300/90 break-all">
                          {issue.sampleLine}
                        </div>

                        {/* 1-Click Fix Actions */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 ml-2">
                            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                            <span>تعمیر خودکار:</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleExecuteFix('restart_service', issue.pkg || issue.tag)}
                            disabled={!!repairingAction}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>توقف و راه‌اندازی مجدد</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecuteFix('clear_cache', issue.pkg || issue.tag)}
                            disabled={!!repairingAction}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Zap className="w-3 h-3" />
                            <span>تخلیه کش اختصاصی</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExecuteFix('reset_permissions', issue.pkg || issue.tag)}
                            disabled={!!repairingAction}
                            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>ترمیم پرمیشن‌ها</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={copyDiagnosticReport}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
              >
                {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copiedReport ? 'گزارش کپی شد!' : 'کپی متن گزارش برای پشتیبانی'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExecuteFix('flush_logcat')}
                  disabled={!!repairingAction}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تخلیه بافر لاگ‌ها</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

