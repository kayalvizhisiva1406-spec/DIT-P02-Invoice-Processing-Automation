import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { InvoiceRecord } from '../types/invoice';
import { Invoice3DCanvas } from '../components/ThreeD/Invoice3DCanvas';
import { logger } from '../services/logger';

interface ProcessingMonitorViewProps {
  invoices: InvoiceRecord[];
  onTriggerFullRevalidation: () => void;
}

const STAGES = [
  { id: 0, title: 'UPLOAD', desc: 'Ingestion of .xlsx, .xls, and .csv files' },
  { id: 1, title: 'READ', desc: 'Binary sheet parsing & cell boundary decoding' },
  { id: 2, title: 'EXTRACT', desc: 'Heuristic fuzzy header mapping & OCR confidence' },
  { id: 3, title: 'VALIDATE', desc: 'Formula math, date sequence & mandatory field check' },
  { id: 4, title: 'DUPLICATE CHECK', desc: 'Exact & potential duplicate cluster clustering' },
  { id: 5, title: 'EXCEPTION DETECTION', desc: 'Multi-severity classification & root cause tagging' },
  { id: 6, title: 'RECONCILIATION', desc: '3-way matching against banking ledger' },
  { id: 7, title: 'REPORT GENERATION', desc: 'Audit-ready PDF, XLSX, and CSV publishing' },
];

export const ProcessingMonitorView: React.FC<ProcessingMonitorViewProps> = ({
  invoices,
  onTriggerFullRevalidation,
}) => {
  const [activeStage, setActiveStage] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const startPipelineSimulation = () => {
    setIsSimulating(true);
    setActiveStage(0);
    logger.log('INFO', 'PROCESSING', 'Automated Pipeline Run Started', 'Executing 8-stage verification pipeline', 'SUCCESS');

    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage >= STAGES.length) {
        clearInterval(interval);
        setIsSimulating(false);
        setActiveStage(7);
        onTriggerFullRevalidation();
        logger.log('INFO', 'PROCESSING', 'Pipeline Run Completed', 'All 8 stages executed successfully with updated data registers', 'SUCCESS');
      } else {
        setActiveStage(stage);
      }
    }, 900);
  };

  const validCount = invoices.filter((i) => i.validationStatus === 'VALID').length;
  const invalidCount = invoices.filter((i) => i.validationStatus === 'INVALID').length;
  const duplicateCount = invoices.filter((i) => i.duplicateStatus !== 'UNIQUE').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Real-Time Processing Monitor & 3D Workflow Pipeline
          </h2>
          <p className="text-xs text-slate-300">
            Interactive multi-stage execution chamber with 3D document animation and live node tracking.
          </p>
        </div>

        <button
          onClick={startPipelineSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>Pipeline Stage {activeStage + 1} of 8...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Simulate Live Pipeline Execution</span>
            </>
          )}
        </button>
      </div>

      {/* 3D Visual Scene */}
      <Invoice3DCanvas
        activeStage={activeStage}
        isProcessing={isSimulating}
        totalRecords={invoices.length}
        validRate={invoices.length > 0 ? Math.round((validCount / invoices.length) * 100) : 0}
      />

      {/* 8-Stage Interactive Workflow Track */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            8-Stage Automation Architecture
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            Current Focus: {STAGES[activeStage].title}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
          {STAGES.map((st) => {
            const isCurrent = st.id === activeStage;
            const isPassed = st.id < activeStage;

            return (
              <div
                key={st.id}
                onClick={() => setActiveStage(st.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isCurrent
                    ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400 shadow-lg scale-105'
                    : isPassed
                    ? 'bg-slate-950/60 border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-cyan-400 text-slate-950'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {st.id + 1}
                  </span>
                  {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>

                <div className="text-xs font-bold text-white font-mono truncate">{st.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time Processing Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Validated Invoices</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{validCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Exceptions Identified</div>
            <div className="text-xl font-bold font-mono text-rose-400">{invalidCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Duplicate Clusters</div>
            <div className="text-xl font-bold font-mono text-amber-400">{duplicateCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
