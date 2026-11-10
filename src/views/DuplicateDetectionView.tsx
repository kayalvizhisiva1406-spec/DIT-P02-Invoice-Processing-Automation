import React, { useState } from 'react';
import {
  Copy,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Split,
  Eye,
} from 'lucide-react';
import { InvoiceRecord } from '../types/invoice';
import { DuplicateGroup } from '../services/duplicateEngine';
import { logger } from '../services/logger';

interface DuplicateDetectionViewProps {
  invoices: InvoiceRecord[];
  duplicateGroups: DuplicateGroup[];
  onResolveDuplicate: (invoiceId: string, action: 'MARK_UNIQUE' | 'CONFIRM_DUPLICATE') => void;
}

export const DuplicateDetectionView: React.FC<DuplicateDetectionViewProps> = ({
  invoices,
  duplicateGroups,
  onResolveDuplicate,
}) => {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [filterType, setFilterType] = useState<'ALL' | 'EXACT' | 'POTENTIAL'>('ALL');

  const filteredGroups = duplicateGroups.filter((g) => {
    if (filterType === 'EXACT') return g.type === 'EXACT';
    if (filterType === 'POTENTIAL') return g.type === 'POTENTIAL';
    return true;
  });

  const selectedGroup = filteredGroups[activeGroupIndex] || filteredGroups[0];

  const handleAction = (invId: string, action: 'MARK_UNIQUE' | 'CONFIRM_DUPLICATE') => {
    onResolveDuplicate(invId, action);
    logger.log(
      'INFO',
      'DUPLICATE',
      `Duplicate Alert ${action === 'MARK_UNIQUE' ? 'Overridden to Unique' : 'Confirmed Duplicate'}`,
      `Record ${invId} resolved by auditor`,
      'SUCCESS',
      'audit.log'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-400" />
              Intelligent Duplicate Detection & Prevention Engine
            </h2>
            <p className="text-xs text-slate-300">
              Cross-validates Invoice Number, Vendor ID, Amount, and proximity timestamps to eliminate double-payment liability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filterType === 'ALL'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              All Clusters ({duplicateGroups.length})
            </button>
            <button
              onClick={() => setFilterType('EXACT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filterType === 'EXACT'
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Exact Matches ({duplicateGroups.filter((g) => g.type === 'EXACT').length})
            </button>
            <button
              onClick={() => setFilterType('POTENTIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filterType === 'POTENTIAL'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Potential Matches ({duplicateGroups.filter((g) => g.type === 'POTENTIAL').length})
            </button>
          </div>
        </div>
      </div>

      {duplicateGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Duplicate Records Detected</h3>
          <p className="text-xs text-slate-400 max-w-md">
            All loaded invoices have unique identification numbers and distinct billing events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Cluster List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">
              Duplicate Clusters ({filteredGroups.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredGroups.map((group, idx) => (
                <div
                  key={group.groupId}
                  onClick={() => setActiveGroupIndex(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedGroup?.groupId === group.groupId
                      ? 'bg-gradient-to-r from-purple-900/40 to-slate-900 border-purple-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white">{group.groupId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        group.type === 'EXACT'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {group.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{group.reason}</p>
                  <div className="mt-2 text-[10px] font-mono text-cyan-400">
                    {group.records.length} records in cluster
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Side-by-Side Comparison Inspector */}
          <div className="lg:col-span-8 space-y-4">
            {selectedGroup ? (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-purple-900/40 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-purple-400 font-bold">{selectedGroup.groupId}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">Cluster Analysis & Resolution</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      selectedGroup.type === 'EXACT'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedGroup.type} MATCH
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Detection Rationale: </span>
                    {selectedGroup.reason}
                  </div>
                </div>

                {/* Side by side comparison cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedGroup.records.map((rec, rIdx) => (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-xl border space-y-3 ${
                        rIdx === 0
                          ? 'bg-slate-950/80 border-cyan-500/30'
                          : 'bg-rose-950/10 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white font-mono">
                          {rIdx === 0 ? 'Original Primary Submission' : `Duplicate Instance #${rIdx}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {rec.id}</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Invoice Number:</span>
                          <span className="font-mono font-bold text-white">{rec.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Vendor:</span>
                          <span className="font-medium text-slate-200">{rec.vendorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Invoice Date:</span>
                          <span className="font-mono text-slate-300">{rec.invoiceDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Amount:</span>
                          <span className="font-mono font-bold text-cyan-300">
                            {rec.currency} {rec.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">PO Number:</span>
                          <span className="font-mono text-slate-300">{rec.purchaseOrderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Status:</span>
                          <span className="font-mono text-slate-200">{rec.duplicateStatus}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                        <button
                          onClick={() => handleAction(rec.id, 'MARK_UNIQUE')}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                        >
                          Mark as Unique
                        </button>
                        <button
                          onClick={() => handleAction(rec.id, 'CONFIRM_DUPLICATE')}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition"
                        >
                          Confirm Duplicate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
