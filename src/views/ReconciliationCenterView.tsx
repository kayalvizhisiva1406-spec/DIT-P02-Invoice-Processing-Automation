import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Scale,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { InvoiceRecord, PaymentRecord } from '../types/invoice';
import { ReconciliationSummary, reconcileInvoicesWithPayments } from '../services/reconciliationEngine';
import { generateSyntheticPayments } from '../services/syntheticData';
import { ReportExporter } from '../services/reportExporter';
import { logger } from '../services/logger';

interface ReconciliationCenterViewProps {
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  summary: ReconciliationSummary;
  onUpdatePayments: (payments: PaymentRecord[]) => void;
}

export const ReconciliationCenterView: React.FC<ReconciliationCenterViewProps> = ({
  invoices,
  payments,
  summary,
  onUpdatePayments,
}) => {
  const [tolerance, setTolerance] = useState<number>(0.05);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Load sample payment ledger
  const handleLoadSampleLedger = () => {
    const samplePmt = generateSyntheticPayments(invoices);
    onUpdatePayments(samplePmt);
    logger.log(
      'INFO',
      'RECONCILIATION',
      'Payment Ledger Ingested',
      `Loaded ${samplePmt.length} banking payment transactions for 3-way reconciliation`,
      'SUCCESS'
    );
  };

  // Upload custom payment ledger
  const handleUploadPaymentLedger = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);

      const parsedPayments: PaymentRecord[] = rawData.map((row, idx) => ({
        id: `upl-pmt-${idx + 1}`,
        paymentReference: row['Payment_Reference'] || row['Reference'] || row['Ref#'] || `PMT-UPL-${idx + 1}`,
        invoiceNumber: row['Invoice_Number'] || row['Invoice#'] || row['Inv#'] || '',
        vendorName: row['Vendor_Name'] || row['Vendor'] || '',
        paymentDate: row['Payment_Date'] || row['Date'] || new Date().toISOString().slice(0, 10),
        paymentAmount: parseFloat(String(row['Payment_Amount'] || row['Amount'] || 0)) || 0,
        currency: (row['Currency'] || 'USD').toUpperCase(),
        bankReference: row['Bank_Reference'] || `WIRE-${880000 + idx}`,
        notes: row['Notes'] || 'Uploaded statement',
      }));

      onUpdatePayments(parsedPayments);
      logger.log(
        'INFO',
        'RECONCILIATION',
        `${file.name} Ledger Ingested`,
        `Ingested ${parsedPayments.length} transaction records`,
        'SUCCESS'
      );
    } catch (err: any) {
      alert(`Failed to parse payment ledger: ${err.message}`);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus !== 'ALL' && inv.reconciliationStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/30 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-400" />
            Financial Reconciliation & Banking Settlement Engine
          </h2>
          <p className="text-xs text-slate-300">
            Performs 3-way mathematical matching between Invoices, Purchase Orders, and Bank Clearing Statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSampleLedger}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Load Bank Payment Ledger
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition">
            <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
            <span>Upload Ledger File</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUploadPaymentLedger}
              className="hidden"
            />
          </label>

          <button
            onClick={() => ReportExporter.exportReconciliationPdf(invoices, summary, payments)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Match Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-teal-500/30">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
            <span>Match Rate</span>
            <span className="p-1 rounded bg-teal-500/10 text-teal-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-teal-300">
            {summary.reconciliationRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.fullyMatchedCount} of {summary.totalInvoices} fully settled
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
            <span>Total Payments</span>
            <span className="p-1 rounded bg-blue-500/10 text-blue-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ${summary.totalPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.totalPayments} transactions ingested
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/40">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
            <span>Partially Matched</span>
            <span className="p-1 rounded bg-amber-500/10 text-amber-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {summary.partiallyMatchedCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Variance: ${summary.underpaymentVariance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-900/40">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
            <span>Unmatched Invoices</span>
            <span className="p-1 rounded bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {summary.unmatchedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pending treasury clearing
          </div>
        </div>
      </div>

      {/* Filter and Tolerance Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Reconciliation Filter:</span>
          <div className="flex items-center gap-1">
            {['ALL', 'MATCHED', 'PARTIALLY_MATCHED', 'UNMATCHED', 'OVERPAYMENT'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] transition ${
                  filterStatus === st
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400">Tolerance:</span>
          <span className="text-cyan-300 font-bold">±${tolerance.toFixed(2)}</span>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4">Bank Ref</th>
                <th className="py-3 px-4 text-right">Payment Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-center">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.slice(0, 50).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-100">
                    {inv.invoiceNumber || 'MISSING #'}
                  </td>
                  <td className="py-3 px-4 text-slate-200">{inv.vendorName || 'Unknown'}</td>
                  <td className="py-3 px-4 font-mono text-right text-slate-200">
                    {inv.currency} {inv.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {inv.matchedPayment ? inv.matchedPayment.paymentReference : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-emerald-400 font-bold">
                    {inv.reconciledAmount ? `$${inv.reconciledAmount.toFixed(2)}` : '$0.00'}
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-rose-400 font-bold">
                    ${(inv.outstandingBalance || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        inv.reconciliationStatus === 'MATCHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : inv.reconciliationStatus === 'PARTIALLY_MATCHED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : inv.reconciliationStatus === 'OVERPAYMENT'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {inv.reconciliationStatus || 'UNMATCHED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
