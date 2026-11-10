import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ShieldAlert,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { InvoiceRecord, InvoiceException } from '../types/invoice';

interface AnalyticsViewProps {
  invoices: InvoiceRecord[];
  exceptions: InvoiceException[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ invoices, exceptions }) => {
  const totalAmount = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalTax = invoices.reduce((s, i) => s + (Number(i.taxAmount) || 0), 0);
  const totalDiscount = invoices.reduce((s, i) => s + (Number(i.discount) || 0), 0);
  const totalShipping = invoices.reduce((s, i) => s + (Number(i.shippingCharges) || 0), 0);

  // Group by currency
  const currencyBreakdown: Record<string, { count: number; total: number }> = {};
  invoices.forEach((i) => {
    const c = i.currency || 'USD';
    if (!currencyBreakdown[c]) currencyBreakdown[c] = { count: 0, total: 0 };
    currencyBreakdown[c].count++;
    currencyBreakdown[c].total += i.totalAmount;
  });

  // Group by vendor risk
  const vendorStats: Record<string, { count: number; total: number; exceptions: number; duplicates: number }> = {};
  invoices.forEach((i) => {
    const v = i.vendorName || 'Unassigned';
    if (!vendorStats[v]) vendorStats[v] = { count: 0, total: 0, exceptions: 0, duplicates: 0 };
    vendorStats[v].count++;
    vendorStats[v].total += i.totalAmount;
    vendorStats[v].exceptions += i.exceptions.length;
    if (i.duplicateStatus !== 'UNIQUE') vendorStats[v].duplicates++;
  });

  const vendorList = Object.entries(vendorStats).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-cyan-950/40 border border-purple-500/30 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Advanced Financial Analytics & Treasury Intelligence
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Dynamic multi-dimensional financial exposure analysis, vendor risk modeling, and tax distribution.
        </p>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Gross Portfolio</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">{invoices.length} total invoices</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total Tax Liability</span>
          <div className="text-2xl font-black font-mono text-purple-300 mt-1">
            ${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg: {totalAmount > 0 ? ((totalTax / totalAmount) * 100).toFixed(1) : 0}% effective rate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Negotiated Discounts</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            ${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Treasury savings realized</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Freight & Shipping</span>
          <div className="text-2xl font-black font-mono text-blue-300 mt-1">
            ${totalShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Logistics allocation</div>
        </div>
      </div>

      {/* Grid: Currency Exposure + Vendor Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Currency Exposure */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-400" />
            Treasury Currency Exposure
          </h3>

          <div className="space-y-3">
            {Object.entries(currencyBreakdown).map(([curr, data]) => {
              const pct = totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0;
              return (
                <div key={curr} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono font-bold text-slate-200">{curr}</span>
                    <span className="font-mono text-slate-400">
                      {data.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pct}%)
                    </span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-800">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendor Risk & Exception Heatmap */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Vendor Risk Assessment & Quality Scoring
            </h3>
            <span className="text-xs text-slate-400 font-mono">Ranked by Exposure</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Vendor Name</th>
                  <th className="py-2.5 px-3 text-right">Invoices</th>
                  <th className="py-2.5 px-3 text-right">Gross Spend</th>
                  <th className="py-2.5 px-3 text-center">Exceptions</th>
                  <th className="py-2.5 px-3 text-center">Duplicates</th>
                  <th className="py-2.5 px-3 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {vendorList.slice(0, 8).map(([name, stat]) => {
                  const riskLevel =
                    stat.exceptions > 2 || stat.duplicates > 1
                      ? 'HIGH'
                      : stat.exceptions > 0
                      ? 'MEDIUM'
                      : 'LOW';

                  return (
                    <tr key={name} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{stat.count}</td>
                      <td className="py-2.5 px-3 text-right text-white font-bold">
                        ${stat.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-400 font-bold">{stat.exceptions}</td>
                      <td className="py-2.5 px-3 text-center text-amber-400 font-bold">{stat.duplicates}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            riskLevel === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300'
                              : riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {riskLevel}
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
    </div>
  );
};
