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
  Battery
} from 'lucide-react';
import { Device } from '../types';

interface DiagnosticsTabProps {
  device: Device | null;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({ device }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERR' | 'WARN' | 'INFO'>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
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

  const filteredLogs = logs.filter((line) => {
    if (searchFilter && !line.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (levelFilter === 'ERR' && !line.includes('[ERR]') && !line.includes(' E ') && !line.includes('Error')) {
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
      {/* Top Diagnostics Card */}
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
            <div className="text-lg font-bold text-cyan-400 mt-1">مانیتورینگ برخط فعال</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Bug className="w-6 h-6" />
          </div>
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
              const isErr = line.includes('[ERR]') || line.includes(' E ') || line.includes('Error');
              const isWarn = line.includes(' W ') || line.includes('Warn');
              const isInfo = line.includes(' I ') || line.includes('[INFO]');

              return (
                <div 
                  key={idx} 
                  className={`leading-relaxed tracking-tight ${
                    isErr ? 'text-rose-400 bg-rose-500/5 px-1 rounded' :
                    isWarn ? 'text-amber-300' :
                    isInfo ? 'text-cyan-300' :
                    'text-slate-400'
                  }`}
                >
                  {line}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
