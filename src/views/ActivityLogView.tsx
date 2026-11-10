import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Download,
  RefreshCw,
  Search,
  Filter,
  FileCode,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react';
import { LogEntry } from '../types/invoice';
import { logger } from '../services/logger';

export const ActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeLogFile, setActiveLogFile] = useState<string>('application.log');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const fetched = await logger.fetchServerLogs(activeLogFile, levelFilter, searchTerm);
      setLogs(fetched);
    } catch {
      setLogs(logger.getRecentLogs());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const unsubscribe = logger.subscribe(() => {
      fetchLogs();
    });
    return () => unsubscribe();
  }, [activeLogFile, levelFilter, searchTerm]);

  const handleDownloadLogFile = () => {
    window.location.href = `/api/logs/download/${activeLogFile}`;
  };

  const modules = ['ALL', 'SYSTEM', 'UPLOAD', 'PROCESSING', 'VALIDATION', 'DUPLICATE', 'RECONCILIATION', 'REPORT', 'AUDIT'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/60 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Enterprise Server Audit Logs & Activity Monitor
          </h2>
          <p className="text-xs text-slate-300">
            Real physical server log viewer connected to disk logs (`logs/application.log`, `logs/error.log`, `logs/processing.log`, `logs/audit.log`).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleDownloadLogFile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeLogFile}</span>
          </button>
        </div>
      </div>

      {/* Log File Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['application.log', 'error.log', 'processing.log', 'audit.log'].map((fname) => (
          <button
            key={fname}
            onClick={() => setActiveLogFile(fname)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition border ${
              activeLogFile === fname
                ? 'bg-purple-900/40 text-cyan-300 border-purple-500 shadow-sm font-bold'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{fname}</span>
          </button>
        ))}
      </div>

      {/* Filtering Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search raw log entries, message, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Level:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
          >
            <option value="ALL">ALL LEVELS</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          <span className="text-slate-400 font-mono ml-2">Module:</span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Terminal-Style Log Console */}
      <div className="rounded-2xl border border-slate-800 bg-[#05070d] p-4 shadow-2xl font-mono text-[11px] leading-relaxed max-h-[600px] overflow-y-auto space-y-2 select-text">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[10px] text-slate-500 uppercase tracking-widest">
          <span>REAL DISK LOG STREAM: {activeLogFile}</span>
          <span>{logs.length} ENTRIES LOADED</span>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No entries recorded for the current filter criteria.
          </div>
        ) : (
          logs.map((log) => {
            const isError = ['ERROR', 'CRITICAL'].includes(log.level);
            const isWarn = log.level === 'WARNING';
            const isInfo = log.level === 'INFO';

            return (
              <div
                key={log.id}
                className="py-1 px-2 rounded hover:bg-slate-900/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-2 border-transparent hover:border-cyan-500"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 font-mono">{log.timestamp}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                      isError
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isWarn
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-purple-300 font-semibold">[{log.module}]</span>
                  <span className="text-white font-medium">{log.action}:</span>
                  <span className="text-slate-300">{log.message}</span>
                </div>

                <div className="text-[10px] text-slate-500 flex-shrink-0 font-mono">
                  STATUS: <span className="text-cyan-400">{log.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
