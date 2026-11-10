import React, { useState } from 'react';
import {
  Kanban as KanbanIcon,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { AgileTask } from '../types/invoice';

export const INITIAL_TEAM_MEMBERS = [
  { id: 'M1', name: 'Member 1 (Kayalvizhi S.)', role: 'Project Coordinator & Requirements Analyst', focus: 'Sprint Planning & Scope Governance' },
  { id: 'M2', name: 'Member 2', role: 'Data Extraction & Schema Engineer', focus: 'Multi-Sheet Excel/CSV Ingestion & Heuristic Column Mapper' },
  { id: 'M3', name: 'Member 3', role: 'Financial Rules & Validation Architect', focus: 'Mandatory Field Checks, Math Tolerance & ISO Currencies' },
  { id: 'M4', name: 'Member 4', role: 'Duplicate Detection & Risk Engineer', focus: 'Exact & Potential Duplicate Matching Algorithms' },
  { id: 'M5', name: 'Member 5', role: 'Reconciliation & Financial Analyst', focus: '3-Way Ledger Matching, Variance & Over/Underpayment' },
  { id: 'M6', name: 'Member 6', role: 'QA Lead, 3D UI & Documentation Specialist', focus: 'Three.js 3D Engine, Test Suite Runner & DIT Task 07 Deliverables' },
];

export const INITIAL_TASKS: AgileTask[] = [
  {
    id: 'TSK-101',
    taskName: 'Define DIT Task 07 Functional & System Requirements',
    assignedMember: 'Member 1 (Kayalvizhi S.)',
    role: 'Project Coordinator',
    priority: 'CRITICAL',
    status: 'DONE',
    dueDate: '2026-11-04',
    acceptanceCriteria: 'Complete requirements specification signed off and verified.',
    userStory: 'As a financial systems lead, I need clear acceptance criteria for automated invoice auditing.',
  },
  {
    id: 'TSK-102',
    taskName: 'Develop Excel (.xlsx/.xls) and CSV Smart File Ingestion Engine',
    assignedMember: 'Member 2',
    role: 'Data Extraction',
    priority: 'HIGH',
    status: 'DONE',
    dueDate: '2026-11-05',
    acceptanceCriteria: 'Handle multiple sheets, preview rows, and detect corrupted datasets.',
    userStory: 'As an accounts payable clerk, I want to drag and drop vendor spreadsheets without format conversion.',
  },
  {
    id: 'TSK-103',
    taskName: 'Implement Heuristic Column Mapping with Manual Override UI',
    assignedMember: 'Member 2',
    role: 'Data Extraction',
    priority: 'HIGH',
    status: 'DONE',
    dueDate: '2026-11-05',
    acceptanceCriteria: 'Fuzzy match 15+ column naming conventions with dropdown remapping.',
    userStory: 'As an AP auditor, I want the system to auto-map columns regardless of vendor headers.',
  },
  {
    id: 'TSK-104',
    taskName: 'Build Rule-Based Validation Engine & Expected Total Formula',
    assignedMember: 'Member 3',
    role: 'Validation Architect',
    priority: 'CRITICAL',
    status: 'DONE',
    dueDate: '2026-11-06',
    acceptanceCriteria: 'Verify Subtotal + Tax + Shipping - Discount = Total within $0.05 tolerance.',
    userStory: 'As an accountant, I want math errors flagged immediately before processing payment.',
  },
  {
    id: 'TSK-105',
    taskName: 'Develop Exact & Potential Duplicate Detection with Cluster Grouping',
    assignedMember: 'Member 4',
    role: 'Risk Engineer',
    priority: 'CRITICAL',
    status: 'DONE',
    dueDate: '2026-11-06',
    acceptanceCriteria: 'Group duplicate records by invoice #, vendor, and amount with side-by-side view.',
    userStory: 'As a treasury manager, I must prevent duplicate vendor disbursements.',
  },
  {
    id: 'TSK-106',
    taskName: 'Implement 3-Way Bank Ledger Financial Reconciliation Engine',
    assignedMember: 'Member 5',
    role: 'Reconciliation Analyst',
    priority: 'HIGH',
    status: 'DONE',
    dueDate: '2026-11-07',
    acceptanceCriteria: 'Identify fully matched, partially matched, and overpayment records.',
    userStory: 'As a financial controller, I need instant settlement matching against bank statements.',
  },
  {
    id: 'TSK-107',
    taskName: 'Construct Interactive Three.js 3D Visual Document Pipeline',
    assignedMember: 'Member 6',
    role: '3D UI Specialist',
    priority: 'HIGH',
    status: 'DONE',
    dueDate: '2026-11-08',
    acceptanceCriteria: 'Realistic floating invoice paper with scanner laser, 8-stage workflow nodes.',
    userStory: 'As an enterprise executive, I want a futuristic visual command center for our AP operations.',
  },
  {
    id: 'TSK-108',
    taskName: 'Build Real Server-Side File Logging System & Log Viewer',
    assignedMember: 'Member 6',
    role: 'QA Lead',
    priority: 'CRITICAL',
    status: 'DONE',
    dueDate: '2026-11-08',
    acceptanceCriteria: 'Generate application.log, error.log, processing.log, audit.log on disk.',
    userStory: 'As a security auditor, I require permanent immutable disk logs of all application events.',
  },
  {
    id: 'TSK-109',
    taskName: 'Execute Comprehensive QA Automated Test Cases & Verify Deliverables',
    assignedMember: 'Member 6',
    role: 'QA Lead',
    priority: 'HIGH',
    status: 'IN PROGRESS',
    dueDate: '2026-11-09',
    acceptanceCriteria: 'Run all 15 test scenarios and verify DIT Task 07 deliverables A to Y.',
    userStory: 'As a project lead, I want 100% test pass rate before final submission.',
  },
];

const COLUMNS: ('BACKLOG' | 'TO DO' | 'IN PROGRESS' | 'TESTING' | 'DONE')[] = [
  'BACKLOG',
  'TO DO',
  'IN PROGRESS',
  'TESTING',
  'DONE',
];

export const AgileWorkspaceView: React.FC = () => {
  const [tasks, setTasks] = useState<AgileTask[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<AgileTask | null>(null);

  const moveTask = (taskId: string, newStatus: AgileTask['status']) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const sprintProgress = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KanbanIcon className="w-5 h-5 text-purple-400" />
            Agile Team Workspace & Contribution Governance
          </h2>
          <p className="text-xs text-slate-300">
            Sprint management, user stories, acceptance criteria, and 6-member task distribution matrix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Sprint Velocity: {sprintProgress}% Complete</span>
          </div>
        </div>
      </div>

      {/* 6-Member Team Contribution Grid */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          6-Member Cross-Functional Enterprise Team
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {INITIAL_TEAM_MEMBERS.map((m) => {
            const memberTasks = tasks.filter((t) => t.assignedMember.includes(m.name.split(' ')[0]));
            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{m.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{m.id}</span>
                </div>
                <div className="text-[11px] font-medium text-purple-300">{m.role}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{m.focus}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Kanban Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KanbanIcon className="w-4 h-4 text-purple-400" />
            Sprint Task Board (Move Tasks Across Columns)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {doneCount} / {tasks.length} User Stories Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 space-y-2.5 flex flex-col min-h-[420px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-slate-300">{col}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 shadow transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-400">{task.id}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                        {task.taskName}
                      </h4>

                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        👤 {task.assignedMember}
                      </div>

                      {/* Quick Move button */}
                      <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-mono">Due: {task.dueDate}</span>
                        {col !== 'DONE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextCol =
                                col === 'BACKLOG'
                                  ? 'TO DO'
                                  : col === 'TO DO'
                                  ? 'IN PROGRESS'
                                  : col === 'IN PROGRESS'
                                  ? 'TESTING'
                                  : 'DONE';
                              moveTask(task.id, nextCol);
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-bold"
                          >
                            <span>Move</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal Details */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedTask.id}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  {selectedTask.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-bold text-white">{selectedTask.taskName}</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">User Story</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedTask.userStory}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold">Acceptance Criteria</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedTask.acceptanceCriteria}</p>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Assignee: <strong className="text-white">{selectedTask.assignedMember}</strong></span>
                <span>Role: <strong className="text-purple-300">{selectedTask.role}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">Change Status:</span>
              <div className="flex items-center gap-1.5">
                {COLUMNS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      moveTask(selectedTask.id, c);
                      setSelectedTask({ ...selectedTask, status: c });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                      selectedTask.status === c
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
