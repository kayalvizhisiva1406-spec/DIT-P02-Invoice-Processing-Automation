import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Clock,
  X,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { InvoiceRecord } from '../types/invoice';
import { exportInvoicesToExcel, exportInvoicesToCsv } from '../services/syntheticData';
import { ReportExporter } from '../services/reportExporter';

interface InvoiceRegisterViewProps {
  invoices: InvoiceRecord[];
  onUpdateInvoiceReview: (invoiceId: string, status: 'APPROVED' | 'RESOLVED' | 'REJECTED', notes: string) => void;
}

export const InvoiceRegisterView: React.FC<InvoiceRegisterViewProps> = ({
  invoices,
  onUpdateInvoiceReview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [duplicateFilter, setDuplicateFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof InvoiceRecord>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Selected invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');

  // Extract unique vendors and currencies for filter dropdowns
  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(invoices.map((i) => i.vendorName).filter(Boolean))).sort();
  }, [invoices]);

  const uniqueCurrencies = useMemo(() => {
    return Array.from(new Set(invoices.map((i) => i.currency).filter(Boolean))).sort();
  }, [invoices]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.validationStatus !== statusFilter) return false;
      if (duplicateFilter === 'DUPLICATES_ONLY' && inv.duplicateStatus === 'UNIQUE') return false;
      if (duplicateFilter === 'EXACT_ONLY' && inv.duplicateStatus !== 'EXACT_DUPLICATE') return false;
      if (duplicateFilter === 'POTENTIAL_ONLY' && inv.duplicateStatus !== 'POTENTIAL_DUPLICATE') return false;
      if (vendorFilter !== 'ALL' && inv.vendorName !== vendorFilter) return false;
      if (currencyFilter !== 'ALL' && inv.currency !== currencyFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.vendorName.toLowerCase().includes(q) ||
          inv.purchaseOrderNumber.toLowerCase().includes(q) ||
          String(inv.totalAmount).includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, duplicateFilter, vendorFilter, currencyFilter, searchTerm]);

  // Sorting
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const aRaw = a[sortField];
      const bRaw = b[sortField];

      if (typeof aRaw === 'number' && typeof bRaw === 'number') {
        return sortAsc ? aRaw - bRaw : bRaw - aRaw;
      }

      const aStr = String(aRaw ?? '').toLowerCase();
      const bStr = String(bRaw ?? '').toLowerCase();
      if (aStr < bStr) return sortAsc ? -1 : 1;
      if (aStr > bStr) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredInvoices, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedInvoices.slice(start, start + pageSize);
  }, [sortedInvoices, currentPage, pageSize]);

  const handleSort = (field: keyof InvoiceRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenModal = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setReviewNoteInput(inv.reviewNotes || '');
  };

  const handleReviewAction = (action: 'APPROVED' | 'RESOLVED' | 'REJECTED') => {
    if (!selectedInvoice) return;
    onUpdateInvoiceReview(selectedInvoice.id, action, reviewNoteInput);
    setSelectedInvoice({
      ...selectedInvoice,
      reviewStatus: action,
      reviewNotes: reviewNoteInput,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar & Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-purple-900/40 shadow-xl">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-400" />
            Master Invoice Register & Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Showing {sortedInvoices.length} of {invoices.length} records. Search, multi-criteria filter, and export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoicesToExcel(invoices)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export Excel
          </button>
          <button
            onClick={() => exportInvoicesToCsv(invoices)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={() => ReportExporter.exportInvoiceRegisterPdf(invoices)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Invoice #, Vendor, PO, Amount..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VALID">Valid Only</option>
            <option value="INVALID">Invalid Only</option>
            <option value="WARNING">Warning Only</option>
          </select>
        </div>

        {/* Duplicate Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Duplicates:</span>
          <select
            value={duplicateFilter}
            onChange={(e) => {
              setDuplicateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500"
          >
            <option value="ALL">All Records</option>
            <option value="DUPLICATES_ONLY">All Duplicates</option>
            <option value="EXACT_ONLY">Exact Duplicates</option>
            <option value="POTENTIAL_ONLY">Potential Duplicates</option>
          </select>
        </div>

        {/* Vendor Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Vendor:</span>
          <select
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs max-w-[150px] truncate"
          >
            <option value="ALL">All Vendors</option>
            {uniqueVendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Page Size */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th
                  onClick={() => handleSort('invoiceNumber')}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vendorName')}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Vendor</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('invoiceDate')}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalAmount')}
                  className="py-3 px-4 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Validation</th>
                <th className="py-3 px-4">Duplicates</th>
                <th className="py-3 px-4">Exceptions</th>
                <th className="py-3 px-4">Review</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching invoices found in register.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => handleOpenModal(inv)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {inv.invoiceNumber || (
                        <span className="text-rose-400 italic font-mono text-[11px]">(Missing #)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {inv.vendorName || (
                        <span className="text-rose-400 italic text-[11px]">(Missing Vendor)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{inv.invoiceDate || '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-slate-100">
                      {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      {inv.validationStatus === 'VALID' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          VALID
                        </span>
                      )}
                      {inv.validationStatus === 'INVALID' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          INVALID
                        </span>
                      )}
                      {inv.validationStatus === 'WARNING' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          WARNING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {inv.duplicateStatus === 'UNIQUE' && (
                        <span className="text-[10px] font-mono text-slate-500">Unique</span>
                      )}
                      {inv.duplicateStatus === 'EXACT_DUPLICATE' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          EXACT DUP
                        </span>
                      )}
                      {inv.duplicateStatus === 'POTENTIAL_DUPLICATE' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          POTENTIAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {inv.exceptions.length > 0 ? (
                        <span className="text-rose-400 font-semibold">{inv.exceptions.length} alert(s)</span>
                      ) : (
                        <span className="text-emerald-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          inv.reviewStatus === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : inv.reviewStatus === 'RESOLVED'
                            ? 'bg-blue-500/20 text-blue-300'
                            : inv.reviewStatus === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {inv.reviewStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(inv);
                        }}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-purple-600/40 text-slate-300 hover:text-white transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Page {currentPage} of {totalPages} ({filteredInvoices.length} total)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-slate-900 text-slate-200">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Detail Inspector Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-purple-500/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-mono">
                    {selectedInvoice.invoiceNumber || 'MISSING INVOICE NUMBER'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      selectedInvoice.validationStatus === 'VALID'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {selectedInvoice.validationStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedInvoice.vendorName || 'No Vendor Name'}</p>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Financial Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Subtotal</span>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {selectedInvoice.currency} {selectedInvoice.subtotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Tax ({(selectedInvoice.taxRate * 100).toFixed(0)}%)</span>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    +{selectedInvoice.currency} {selectedInvoice.taxAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Shipping / Disc</span>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    +${selectedInvoice.shippingCharges.toFixed(2)} / -${selectedInvoice.discount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Uploaded Total</span>
                  <div className="text-sm font-bold font-mono text-cyan-400">
                    {selectedInvoice.currency} {selectedInvoice.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Math Verification Box */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Formula Check: Subtotal + Tax + Shipping - Discount</span>
                  <span
                    className={
                      Math.abs(selectedInvoice.amountDifference) > 0.05
                        ? 'text-rose-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    Expected: {selectedInvoice.currency} {selectedInvoice.expectedTotalAmount.toFixed(2)} | Diff: {selectedInvoice.amountDifference > 0 ? '+' : ''}
                    {selectedInvoice.amountDifference.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Duplicate Details (if duplicate) */}
              {selectedInvoice.duplicateStatus !== 'UNIQUE' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <Copy className="w-4 h-4" />
                    <span>Duplicate Alert: {selectedInvoice.duplicateStatus}</span>
                  </div>
                  <p className="text-xs text-amber-200/90">{selectedInvoice.duplicateReason}</p>
                </div>
              )}

              {/* Exceptions List */}
              {selectedInvoice.exceptions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                    Detected Exceptions ({selectedInvoice.exceptions.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedInvoice.exceptions.map((exc) => (
                      <div
                        key={exc.id}
                        className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-300 font-mono text-[11px]">{exc.type}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-rose-900/60 text-rose-200">
                            {exc.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{exc.description}</p>
                        <div className="text-[11px] font-mono text-slate-400">
                          Detected: <span className="text-white">{exc.detectedValue}</span> | Expected:{' '}
                          <span className="text-cyan-300">{exc.expectedValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Review Actions */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase">
                  Auditor Resolution & Notes
                </h4>
                <textarea
                  rows={2}
                  placeholder="Enter auditor review reasoning, resolution notes, or approval authorization..."
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReviewAction('REJECTED')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30"
                  >
                    Reject Invoice
                  </button>
                  <button
                    onClick={() => handleReviewAction('RESOLVED')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 text-xs font-bold border border-blue-500/40"
                  >
                    Resolve Exceptions
                  </button>
                  <button
                    onClick={() => handleReviewAction('APPROVED')}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                  >
                    Approve for Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
