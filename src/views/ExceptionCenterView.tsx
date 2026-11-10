import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  X,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { InvoiceException, ExceptionSeverity } from '../types/invoice';
import { ReportExporter } from '../services/reportExporter';
import { logger } from '../services/logger';

interface ExceptionCenterViewProps {
  exceptions: InvoiceException[];
  onResolveException: (exceptionId: string, resolutionNote: string) => void;
}

export const ExceptionCenterView: React.FC<ExceptionCenterViewProps> = ({
  exceptions,
  onResolveException,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedException, setSelectedException] = useState<InvoiceException | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Filtering
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exc) => {
      if (severityFilter !== 'ALL' && exc.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && exc.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          exc.invoiceNumber.toLowerCase().includes(q) ||
          exc.vendorName.toLowerCase().includes(q) ||
          exc.type.toLowerCase().includes(q) ||
          exc.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exceptions, severityFilter, statusFilter, searchTerm]);

  // Counts by severity
  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = exceptions.filter((e) => e.severity === 'MEDIUM').length;
  const lowCount = exceptions.filter((e) => e.severity === 'LOW').length;

  const handleResolve = () => {
    if (!selectedException) return;
    onResolveException(selectedException.id, resolutionNote);
    logger.log(
      'INFO',
      'AUDIT',
      'Exception Resolved',
      `Exception ${selectedException.id} (${selectedException.type}) resolved: ${resolutionNote || 'Auditor confirmed adjustment'}`,
      'SUCCESS',
      'audit.log'
    );
    setSelectedException(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-purple-950/40 border border-rose-500/30 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Financial Exception Management Command Center
          </h2>
          <p className="text-xs text-slate-300">
            Rule-based financial exception triage, severity scoring, root-cause diagnostics, and compliance audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ReportExporter.exportExceptionReportPdf(filteredExceptions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Severity Triage Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            severityFilter === 'CRITICAL'
              ? 'bg-rose-950/60 border-rose-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400 mb-1">
            <span>CRITICAL</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black font-mono text-white">{criticalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires immediate intervention</div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            severityFilter === 'HIGH'
              ? 'bg-amber-950/60 border-amber-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-mono font-bold text-amber-400 mb-1">HIGH</div>
          <div className="text-2xl font-black font-mono text-white">{highCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total math or date mismatch</div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            severityFilter === 'MEDIUM'
              ? 'bg-blue-950/60 border-blue-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-mono font-bold text-blue-400 mb-1">MEDIUM</div>
          <div className="text-2xl font-black font-mono text-white">{mediumCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Currency or terms notice</div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            severityFilter === 'LOW'
              ? 'bg-slate-800 border-purple-500'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-mono font-bold text-slate-400 mb-1">LOW</div>
          <div className="text-2xl font-black font-mono text-white">{lowCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">OCR extraction warning</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exceptions by Invoice #, Vendor, Type, Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          <span className="text-slate-400 ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Exceptions Cards List */}
      <div className="space-y-3">
        {filteredExceptions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
            No exceptions found matching current filter parameters.
          </div>
        ) : (
          filteredExceptions.map((exc) => (
            <div
              key={exc.id}
              className={`p-4 rounded-2xl border transition-all ${
                exc.status === 'RESOLVED'
                  ? 'bg-slate-950/40 border-slate-800 opacity-60'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      exc.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : exc.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : exc.severity === 'MEDIUM'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {exc.severity}
                  </span>
                  <span className="font-mono font-bold text-white text-xs">
                    {exc.invoiceNumber || 'MISSING INVOICE #'}
                  </span>
                  <span className="text-slate-400 text-xs">| {exc.vendorName || 'Unknown Vendor'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      exc.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    STATUS: {exc.status}
                  </span>
                  {exc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setSelectedException(exc)}
                      className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Exception Type</span>
                  <div className="font-mono text-slate-200 font-semibold">{exc.type}</div>
                  <p className="text-slate-300 text-xs leading-relaxed">{exc.description}</p>
                </div>

                <div className="space-y-1 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Detected: </span>
                    <span className="text-rose-400 font-semibold">{exc.detectedValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Expected: </span>
                    <span className="text-cyan-400 font-semibold">{exc.expectedValue}</span>
                  </div>
                </div>

                <div className="space-y-1 p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs">
                  <span className="text-[10px] font-mono text-purple-300 uppercase font-semibold">
                    Recommended Action
                  </span>
                  <p className="text-slate-200">{exc.recommendedAction}</p>
                  {exc.resolutionNote && (
                    <div className="mt-1 text-[11px] text-emerald-400 font-mono">
                      Note: {exc.resolutionNote}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Resolve Exception</h3>
              <button
                onClick={() => setSelectedException(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Target Invoice: </span>
                <span className="font-mono font-bold text-white">
                  {selectedException.invoiceNumber} ({selectedException.vendorName})
                </span>
              </div>
              <div>
                <span className="text-slate-400">Issue: </span>
                <span className="text-rose-300">{selectedException.description}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Auditor Resolution Note & Justification
              </label>
              <textarea
                rows={3}
                placeholder="Explain the audit resolution, vendor confirmation, or balance adjustment..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedException(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
