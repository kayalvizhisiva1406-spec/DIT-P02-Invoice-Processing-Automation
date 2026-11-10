import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Copy,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { InvoiceRecord, InvoiceException } from '../types/invoice';
import { ReconciliationSummary } from '../services/reconciliationEngine';

interface AiAssistantViewProps {
  invoices: InvoiceRecord[];
  exceptions: InvoiceException[];
  summary: ReconciliationSummary;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  dataSnippet?: any;
  timestamp: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  invoices,
  exceptions,
  summary,
}) => {
  const [queryInput, setQueryInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello! I am your Invoice Intelligence 360 AI Assistant. I have analyzed your ${invoices.length} uploaded records, ${exceptions.length} exceptions, and reconciliation ledger. You can ask me natural language queries about invoices, vendor risk, arithmetic anomalies, or duplicate groups.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const handleAsk = (userQuery: string) => {
    if (!userQuery.trim()) return;

    const q = userQuery.toLowerCase();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString(),
    };

    let replyText = '';
    let snippet: any = null;

    if (q.includes('invalid') || q.includes('invalid invoices')) {
      const invalidList = invoices.filter((i) => i.validationStatus === 'INVALID');
      replyText = `Found ${invalidList.length} invalid invoices in the current ledger. The most common issues are missing mandatory invoice numbers/vendor names and mathematical total mismatches.`;
      snippet = invalidList.slice(0, 5).map((i) => ({
        invoice: i.invoiceNumber || 'MISSING #',
        vendor: i.vendorName || 'MISSING VENDOR',
        amount: `$${i.totalAmount.toFixed(2)}`,
        exceptions: i.exceptions.map((e) => e.type).join(', '),
      }));
    } else if (q.includes('duplicate') || q.includes('duplicates')) {
      const dupes = invoices.filter((i) => i.duplicateStatus !== 'UNIQUE');
      const exact = dupes.filter((i) => i.duplicateStatus === 'EXACT_DUPLICATE');
      const potential = dupes.filter((i) => i.duplicateStatus === 'POTENTIAL_DUPLICATE');
      replyText = `Identified ${dupes.length} duplicate invoice alerts (${exact.length} exact matches with identical invoice #, vendor & total amount; ${potential.length} potential matches with similar amounts/dates).`;
      snippet = dupes.slice(0, 4).map((d) => ({
        invoice: d.invoiceNumber,
        vendor: d.vendorName,
        type: d.duplicateStatus,
        reason: d.duplicateReason,
      }));
    } else if (q.includes('vendor') || q.includes('most exceptions')) {
      const vMap: Record<string, number> = {};
      exceptions.forEach((e) => {
        vMap[e.vendorName] = (vMap[e.vendorName] || 0) + 1;
      });
      const top = Object.entries(vMap).sort((a, b) => b[1] - a[1]);
      replyText = `Vendors with the highest exception frequency: ${top.slice(0, 3).map(([v, c]) => `${v} (${c} alerts)`).join(', ')}.`;
      snippet = top.slice(0, 5).map(([vendor, count]) => ({ vendor, exceptionsCount: count }));
    } else if (q.includes('incorrect totals') || q.includes('math')) {
      const mathErrors = invoices.filter((i) => Math.abs(i.amountDifference) > 0.05);
      replyText = `Found ${mathErrors.length} invoices where uploaded total deviates from the formula (Subtotal + Tax + Shipping - Discount).`;
      snippet = mathErrors.slice(0, 5).map((m) => ({
        invoice: m.invoiceNumber,
        vendor: m.vendorName,
        uploaded: `$${m.totalAmount.toFixed(2)}`,
        expected: `$${m.expectedTotalAmount.toFixed(2)}`,
        difference: `${m.amountDifference > 0 ? '+' : ''}$${m.amountDifference.toFixed(2)}`,
      }));
    } else if (q.includes('reconciliation') || q.includes('reconcile') || q.includes('payment')) {
      replyText = `Reconciliation match rate is ${summary.reconciliationRate}%. Out of ${summary.totalInvoices} invoices, ${summary.fullyMatchedCount} are fully matched with bank payments, ${summary.partiallyMatchedCount} are partially paid, and ${summary.unmatchedCount} remain unsettled.`;
    } else {
      replyText = `Based on your processed dataset of ${invoices.length} invoices totaling $${invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}: ${invoices.filter((i) => i.validationStatus === 'VALID').length} are fully valid, and ${exceptions.length} exceptions were diagnosed across all rules.`;
    }

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text: replyText,
      dataSnippet: snippet,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setQueryInput('');
  };

  const samplePrompts = [
    'Show all invalid invoices',
    'Which vendors have the most exceptions?',
    'Find invoices with incorrect totals',
    'Show duplicate invoice records',
    'Summarise the reconciliation results',
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            AI-Powered Natural Language Financial Intelligence
          </h2>
          <p className="text-xs text-slate-300">
            Query actual ingested invoice data, inspect arithmetic discrepancies, and synthesize executive insights.
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
          Context: {invoices.length} Live Records
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-mono">Suggested Inquiries:</span>
        {samplePrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleAsk(p)}
            className="px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white text-xs transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[11px] text-cyan-300">
                  {msg.sender === 'user' ? 'Auditor' : 'Invoice Intelligence AI'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
              </div>
              <p>{msg.text}</p>

              {msg.dataSnippet && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300 overflow-x-auto">
                  <div className="text-[10px] uppercase text-cyan-400 font-bold mb-1">
                    Live Extracted Data Records:
                  </div>
                  {msg.dataSnippet.map((item: any, idx: number) => (
                    <div key={idx} className="pb-1 border-b border-slate-800/60 last:border-0">
                      {JSON.stringify(item)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl">
        <input
          type="text"
          placeholder="Ask anything about invoices, duplicate alerts, math errors, or vendor performance..."
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk(queryInput)}
          className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleAsk(queryInput)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
