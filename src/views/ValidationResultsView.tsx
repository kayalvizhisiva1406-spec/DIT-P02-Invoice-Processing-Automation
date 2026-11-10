import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calculator,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { InvoiceRecord, ValidationSettings } from '../types/invoice';

interface ValidationResultsViewProps {
  invoices: InvoiceRecord[];
  settings: ValidationSettings;
}

export const ValidationResultsView: React.FC<ValidationResultsViewProps> = ({
  invoices,
  settings,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'VALID' | 'MATH_ERROR' | 'MISSING_FIELDS'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = invoices.filter((inv) => {
    if (filter === 'VALID' && inv.validationStatus !== 'VALID') return false;
    if (filter === 'MATH_ERROR' && Math.abs(inv.amountDifference) <= settings.roundingTolerance) return false;
    if (filter === 'MISSING_FIELDS' && inv.invoiceNumber && inv.vendorName) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.vendorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const validCount = invoices.filter((i) => i.validationStatus === 'VALID').length;
  const mathErrorCount = invoices.filter((i) => Math.abs(i.amountDifference) > settings.roundingTolerance).length;
  const missingFieldCount = invoices.filter((i) => !i.invoiceNumber || !i.vendorName).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Intelligent Rule-Based Validation Results & Math Engine
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Detailed comparison between calculated line-item formula (Subtotal + Tax + Shipping - Discount) and uploaded invoice totals.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setFilter('VALID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'VALID'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            100% Valid ({validCount})
          </button>
          <button
            onClick={() => setFilter('MATH_ERROR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'MATH_ERROR'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Math Discrepancies ({mathErrorCount})
          </button>
          <button
            onClick={() => setFilter('MISSING_FIELDS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'MISSING_FIELDS'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Missing Mandatory Fields ({missingFieldCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice # or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-sans font-bold">Invoice #</th>
                <th className="py-3 px-4 font-sans font-bold">Vendor</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (Rate)</th>
                <th className="py-3 px-4 text-right">Ship - Disc</th>
                <th className="py-3 px-4 text-right">Expected Total</th>
                <th className="py-3 px-4 text-right">Uploaded Total</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center font-sans font-bold">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {filtered.slice(0, 50).map((inv) => {
                const hasMathErr = Math.abs(inv.amountDifference) > settings.roundingTolerance;
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">
                      {inv.invoiceNumber || <span className="text-rose-400 italic">EMPTY</span>}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">
                      {inv.vendorName || <span className="text-rose-400 italic">EMPTY</span>}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">${inv.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      +${inv.taxAmount.toFixed(2)} ({(inv.taxRate * 100).toFixed(0)}%)
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      +${inv.shippingCharges.toFixed(2)} / -${inv.discount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300">
                      ${inv.expectedTotalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      ${inv.totalAmount.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        hasMathErr ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {inv.amountDifference > 0 ? '+' : ''}${inv.amountDifference.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.validationStatus === 'VALID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {inv.validationStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
