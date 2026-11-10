import React from 'react';
import {
  FileCheck2,
  AlertOctagon,
  Copy,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  PieChart as PieChartIcon,
  CheckCircle,
} from 'lucide-react';
import { InvoiceRecord, InvoiceException } from '../types/invoice';
import { Invoice3DCanvas } from '../components/ThreeD/Invoice3DCanvas';

interface DashboardViewProps {
  invoices: InvoiceRecord[];
  exceptions: InvoiceException[];
  onNavigate: (tab: string) => void;
  fileCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  exceptions,
  onNavigate,
  fileCount,
}) => {
  // Dynamically calculate all metrics from actual uploaded data
  const totalInvoices = invoices.length;
  const validInvoices = invoices.filter((i) => i.validationStatus === 'VALID').length;
  const invalidInvoices = invoices.filter((i) => i.validationStatus === 'INVALID').length;
  const duplicateInvoices = invoices.filter((i) => i.duplicateStatus !== 'UNIQUE').length;
  const pendingReview = invoices.filter((i) => i.reviewStatus === 'PENDING').length;

  const totalAmount = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const validatedAmount = invoices
    .filter((i) => i.validationStatus === 'VALID')
    .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const exceptionAmount = invoices
    .filter((i) => i.validationStatus === 'INVALID')
    .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

  const successRate = totalInvoices > 0 ? Math.round((validInvoices / totalInvoices) * 1000) / 10 : 0;

  // Data Quality Score formula based on accuracy, duplicates, completeness
  const qualityScore = totalInvoices > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (invalidInvoices * 2.5 + duplicateInvoices * 3) / (totalInvoices / 15))))
    : 100;

  // Vendor distribution
  const vendorMap: Record<string, { count: number; total: number }> = {};
  invoices.forEach((i) => {
    const v = i.vendorName || 'Unassigned';
    if (!vendorMap[v]) vendorMap[v] = { count: 0, total: 0 };
    vendorMap[v].count++;
    vendorMap[v].total += i.totalAmount;
  });

  const topVendors = Object.entries(vendorMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  // Exception category breakdown
  const exceptionCategoryMap: Record<string, number> = {};
  exceptions.forEach((e) => {
    exceptionCategoryMap[e.type] = (exceptionCategoryMap[e.type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* 3D Visual Hero Command Center */}
      <div className="relative">
        <Invoice3DCanvas
          activeStage={3}
          isProcessing={false}
          totalRecords={totalInvoices}
          validRate={successRate}
        />
      </div>

      {/* Primary KPI Command Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Total Invoices */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Invoices</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {totalInvoices.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Files: {fileCount}</span>
            <span className="text-cyan-400 font-semibold">{successRate}% Valid</span>
          </div>
        </div>

        {/* Valid Invoices */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-emerald-900/40 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Valid Invoices</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {validInvoices.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ready for automated clearing
          </div>
        </div>

        {/* Invalid / Flagged Invoices */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-rose-900/40 shadow-lg cursor-pointer" onClick={() => onNavigate('exceptions')}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Invalid Invoices</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
            {invalidInvoices.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
            <span>{exceptions.length} Exceptions</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Duplicate Invoices */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-amber-900/40 shadow-lg cursor-pointer" onClick={() => onNavigate('duplicates')}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Duplicate Alerts</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Copy className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {duplicateInvoices.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            Risk Mitigation Active
          </div>
        </div>

        {/* Gross Amount */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/90 border border-purple-500/30 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Gross Value</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight truncate">
            ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-300 mt-1 font-mono">
            Valid: ${validatedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row: Quality Score + Vendor Breakdown + Exception Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quality Score & Financial Exposure Gauge */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Data Quality & Health Index
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">{qualityScore} / 100</span>
          </div>

          <div className="relative pt-2">
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-800">
              <div
                style={{ width: `${qualityScore}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-cyan-500 to-emerald-400"
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Exception Exposure</div>
              <div className="text-base font-bold font-mono text-rose-400">
                ${exceptionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Success Rate</div>
              <div className="text-base font-bold font-mono text-emerald-400">{successRate}%</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
            <span className="font-semibold text-white">Automated Engine Verdict: </span>
            {qualityScore >= 80
              ? 'Dataset adheres to enterprise audit standards. Minor exceptions flagged for review.'
              : 'Action required: Missing fields and arithmetic variances exceed baseline tolerance.'}
          </div>
        </div>

        {/* Vendor-Wise Financial Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Top Vendors by Gross Spend
            </h3>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {topVendors.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No invoice data loaded yet.</div>
            ) : (
              topVendors.map(([vendor, data]) => {
                const pct = totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0;
                return (
                  <div key={vendor} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200 truncate max-w-[180px]">{vendor}</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        ${data.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pct}%)
                      </span>
                    </div>
                    <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Exception Categories Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-400" />
              Exception Category Breakdown
            </h3>
            <span className="text-xs font-mono text-rose-400 font-semibold">{exceptions.length} total</span>
          </div>

          <div className="space-y-2 pt-1">
            {Object.keys(exceptionCategoryMap).length === 0 ? (
              <div className="text-xs text-emerald-400 py-6 text-center flex flex-col items-center gap-1">
                <CheckCircle className="w-6 h-6" />
                <span>Zero exceptions detected across dataset.</span>
              </div>
            ) : (
              Object.entries(exceptionCategoryMap).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
                >
                  <span className="text-slate-300 truncate max-w-[210px] font-mono text-[11px]">
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    {count} records
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
