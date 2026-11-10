import React from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Copy,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { InvoiceRecord, InvoiceException, PaymentRecord } from '../types/invoice';
import { ReconciliationSummary } from '../services/reconciliationEngine';
import { ReportExporter } from '../services/reportExporter';
import { exportInvoicesToExcel, exportInvoicesToCsv } from '../services/syntheticData';
import { logger } from '../services/logger';

interface ReportCenterViewProps {
  invoices: InvoiceRecord[];
  exceptions: InvoiceException[];
  summary: ReconciliationSummary;
  payments: PaymentRecord[];
}

export const ReportCenterView: React.FC<ReportCenterViewProps> = ({
  invoices,
  exceptions,
  summary,
  payments,
}) => {
  const handleDownload = (reportName: string, type: 'PDF' | 'EXCEL' | 'CSV') => {
    logger.log(
      'INFO',
      'REPORT',
      `${reportName} ${type} Report Downloaded`,
      `Generated for ${invoices.length} invoices and ${exceptions.length} exceptions`,
      'SUCCESS',
      'application.log'
    );

    if (reportName === 'Master Multi-Sheet Report') {
      ReportExporter.exportComprehensiveExcel(invoices, exceptions, summary);
    } else if (reportName === 'Invoice Register') {
      if (type === 'PDF') ReportExporter.exportInvoiceRegisterPdf(invoices, 'Invoice Register Master');
      else if (type === 'EXCEL') exportInvoicesToExcel(invoices, 'Invoice_Register_Export.xlsx');
      else exportInvoicesToCsv(invoices, 'Invoice_Register_Export.csv');
    } else if (reportName === 'Exception Audit Report') {
      if (type === 'PDF') ReportExporter.exportExceptionReportPdf(exceptions);
      else exportInvoicesToExcel(invoices, 'Exception_Ledger_Export.xlsx');
    } else if (reportName === 'Reconciliation Summary') {
      ReportExporter.exportReconciliationPdf(invoices, summary, payments);
    }
  };

  const reportsList = [
    {
      id: 'inv-reg',
      title: 'Invoice Register Master',
      desc: 'Complete ledger of all ingested invoices including validation flags, duplicate markers, and amounts.',
      icon: FileSpreadsheet,
      badge: `${invoices.length} Invoices`,
      pdf: true,
      excel: true,
      csv: true,
    },
    {
      id: 'exc-rep',
      title: 'Exception Audit Report',
      desc: 'Comprehensive breakdown of all arithmetic mismatches, missing fields, invalid dates, and severity scores.',
      icon: AlertTriangle,
      badge: `${exceptions.length} Exceptions`,
      pdf: true,
      excel: true,
      csv: false,
    },
    {
      id: 'rec-sum',
      title: 'Reconciliation Summary',
      desc: '3-way matching statement between invoice totals, payment clearances, variances, and outstanding balances.',
      icon: Scale,
      badge: `${summary.reconciliationRate}% Matched`,
      pdf: true,
      excel: true,
      csv: false,
    },
    {
      id: 'dup-rep',
      title: 'Duplicate Prevention Ledger',
      desc: 'Cluster report of exact and potential duplicate submissions, identifying double-payment liability risks.',
      icon: Copy,
      badge: 'Fraud Prevention',
      pdf: true,
      excel: true,
      csv: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Executive Financial Report Generation Center
          </h2>
          <p className="text-xs text-slate-300">
            Export audit-ready Excel workbooks, CSV files, and cryptographic-certified PDF statements.
          </p>
        </div>

        <button
          onClick={() => handleDownload('Master Multi-Sheet Report', 'EXCEL')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition"
        >
          <Sparkles className="w-4 h-4" />
          Export Master Multi-Sheet Workbook (.XLSX)
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 hover:border-purple-500/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{rep.title}</h3>
                    <span className="text-[10px] font-mono text-cyan-400">{rep.badge}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{rep.desc}</p>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                {rep.pdf && (
                  <button
                    onClick={() => handleDownload(rep.title, 'PDF')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
                {rep.excel && (
                  <button
                    onClick={() => handleDownload(rep.title, 'EXCEL')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </button>
                )}
                {rep.csv && (
                  <button
                    onClick={() => handleDownload(rep.title, 'CSV')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
