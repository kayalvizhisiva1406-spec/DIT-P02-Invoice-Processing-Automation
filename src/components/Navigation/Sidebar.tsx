import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Scale,
  BarChart3,
  FileText,
  Bot,
  Terminal,
  Kanban,
  FlaskConical,
  BookOpen,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exceptionCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export const navSections = [
  {
    title: 'FINANCIAL CORE',
    items: [
      { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
      { id: 'upload', label: 'Upload Center', icon: UploadCloud },
      { id: 'monitor', label: 'Processing Monitor', icon: Cpu },
      { id: 'register', label: 'Invoice Register', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'AUDIT & COMPLIANCE',
    items: [
      { id: 'validation', label: 'Validation Results', icon: CheckCircle2, badgeKey: 'invalid' },
      { id: 'duplicates', label: 'Duplicate Detection', icon: Copy, badgeKey: 'duplicates' },
      { id: 'exceptions', label: 'Exception Center', icon: AlertTriangle, badgeKey: 'exceptions' },
      { id: 'reconciliation', label: 'Reconciliation', icon: Scale },
    ],
  },
  {
    title: 'INTELLIGENCE & REPORTS',
    items: [
      { id: 'analytics', label: 'Financial Analytics', icon: BarChart3 },
      { id: 'reports', label: 'Report Generator', icon: FileText },
      { id: 'ai-assistant', label: 'AI Intelligence Assistant', icon: Bot },
      { id: 'logs', label: 'System Audit Logs', icon: Terminal },
    ],
  },
  {
    title: 'PROJECT & QUALITY',
    items: [
      { id: 'agile', label: 'Agile Team Workspace', icon: Kanban },
      { id: 'testing', label: 'Testing & QA Engine', icon: FlaskConical },
      { id: 'deliverables', label: 'DIT Deliverables (A-Y)', icon: BookOpen },
      { id: 'settings', label: 'System Configuration', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  exceptionCount,
  duplicateCount,
  invalidCount,
}) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-purple-900/30 bg-[#090b14]/90 p-3 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {navSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-mono font-bold tracking-wider text-purple-400/70 uppercase">
              {sec.title}
            </h3>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                let badge = 0;
                let badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                if (item.badgeKey === 'exceptions') badge = exceptionCount;
                if (item.badgeKey === 'duplicates') badge = duplicateCount;
                if (item.badgeKey === 'invalid') badge = invalidCount;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/40 text-cyan-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-purple-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono border ${badgeColor}`}
                        >
                          {badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Node Health Status */}
      <div className="pt-4 border-t border-slate-800/80 mt-4 px-2">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[11px] font-mono text-slate-300">CORE ENGINE</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
