import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  onLoadSyntheticData: () => void;
  onDownloadSampleDataset: () => void;
  recordCount: number;
  openLogViewer: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadSyntheticData,
  onDownloadSampleDataset,
  recordCount,
  openLogViewer,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-900/30 bg-[#090c15]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Official User Photo in Perfect Circular Container Beside App Name */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="relative group">
            {/* Ambient neon halo */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-cyan-500 to-indigo-600 opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>

            {/* Exactly the user's uploaded photo inside clean circular crop */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400/80 bg-slate-900 shadow-lg flex items-center justify-center">
              <img
                src="/assets/aistudio/Screenshot_2026-11-06_210812_ac95ea05.png"
                alt="Invoice Intelligence 360 Official Logo"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-cyan-300 bg-clip-text text-transparent">
                INVOICE INTELLIGENCE 360
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                ENTERPRISE v3.4
              </span>
            </div>
            <span className="text-[11px] text-slate-400 tracking-wide font-medium hidden sm:block">
              Transforming Financial Documents into Intelligent Decisions
            </span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Load Sample Dataset 1-Click Action */}
          <button
            onClick={onLoadSyntheticData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30 active:scale-95"
            title="Load 100 Realistic Synthetic Invoices with Exceptions and Duplicates"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Load 100 Sample Data</span>
            <span className="sm:hidden">Load 100</span>
          </button>

          {/* Download Sample Excel */}
          <button
            onClick={onDownloadSampleDataset}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            title="Download Sample Invoices XLSX & CSV template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Sample .XLSX</span>
          </button>

          {/* Real Server Log Viewer Button */}
          <button
            onClick={openLogViewer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-cyan-200 text-xs font-mono border border-cyan-500/30 transition-all"
            title="View Real Application Log Files"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Server Logs</span>
          </button>

          {/* Ingested Records Counter Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{recordCount} Records</span>
          </div>
        </div>
      </div>
    </header>
  );
};
