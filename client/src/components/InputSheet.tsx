import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  allTasks: Task[];
  search: string;
  onSearchChange: (s: string) => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => void;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}

const statusOptions = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

function exportCSV(tasks: Task[]) {
  const headers = ['Title', 'Start Date', 'Due Date', 'Importance', 'Status', 'Days Left', 'Quadrant', 'Owner', 'Category', 'Timeline Progress'];
  const rows = tasks.map(t => [
    `"${t.title.replace(/"/g, '""')}"`, t.startDate, t.dueDate, t.importanceScore, t.status,
    t.daysRemaining, t.quadrant, t.owner, t.category, `${t.timelineProgress ?? 0}%`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InputSheet({ tasks, allTasks, search, onSearchChange, onUpdate, onDelete, onCreate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Record<string, string | number>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const [newRow, setNewRow] = useState({ title: '', startDate: today, dueDate: '', importanceScore: 50 });

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditRow({ title: task.title, startDate: task.startDate, dueDate: task.dueDate, importanceScore: task.importanceScore, status: task.status });
  };

  const saveEdit = async (id: string) => {
    try { setError(null); await onUpdate(id, editRow); setEditingId(null); }
    catch (err) { setError(`Failed to save: ${(err as Error).message}`); }
  };

  const handleAdd = async () => {
    if (!newRow.title || !newRow.startDate || !newRow.dueDate) return;
    try {
      setError(null);
      await onCreate({ ...newRow, description: '', status: 'Not Started', owner: 'Unassigned', category: 'General' });
      setNewRow({ title: '', startDate: today, dueDate: '', importanceScore: 50 });
      setShowAddRow(false);
    } catch (err) { setError(`Failed to add task: ${(err as Error).message}`); }
  };

  const handleDelete = (id: string) => { setError(null); onDelete(id); };

  const inputClass = 'w-full px-2.5 py-1.5 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors';
  const cellClass = 'px-3 py-2.5 text-sm whitespace-nowrap';
  const thClass = 'px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider';

  const sorted = [...tasks].sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 md:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Task Manager</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text" placeholder="Search tasks..." value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>
          <button onClick={() => exportCSV(allTasks)}
            className="rounded-lg text-sm font-medium px-3 py-1.5 shrink-0 transition-all duration-150 flex items-center gap-1.5"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Export all tasks as CSV"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <button onClick={() => { setShowAddRow(!showAddRow); setError(null); }}
            className="rounded-lg text-sm font-semibold px-4 py-1.5 transition-all duration-150 shrink-0"
            style={{ background: showAddRow ? 'var(--text-tertiary)' : 'var(--accent)', color: '#0a0a0a', boxShadow: showAddRow ? 'none' : '0 0 12px rgba(163,230,53,0.15)' }}
          >
            {showAddRow ? 'Cancel' : '+ Add Task'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
          {error}
        </div>
      )}

      {/* Mobile card view */}
      <div className="block md:hidden flex-1 overflow-auto space-y-2 scrollbar-thin">
        {showAddRow && (
          <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}>
            <input className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title *" autoFocus />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Start</label>
                <input type="date" className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  value={newRow.startDate} onChange={e => setNewRow({ ...newRow, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Due</label>
                <input type="date" className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  value={newRow.dueDate} onChange={e => setNewRow({ ...newRow, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Importance</label>
              <input type="number" min={0} max={100} className={`${inputClass} w-16`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                value={newRow.importanceScore} onChange={e => setNewRow({ ...newRow, importanceScore: Number(e.target.value) })} />
              <div className="flex-1" />
              <button onClick={handleAdd} className="text-xs font-medium text-white rounded-lg px-4 py-1.5" style={{ background: '#10b981' }}>Save</button>
            </div>
          </div>
        )}
        {sorted.map((task, i) => (
          <MobileTaskCard key={task.id} task={task} index={i} onEdit={startEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:flex flex-1 overflow-auto rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <table className="w-full">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>#</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Title</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Start Date</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Due Date</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Importance</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Status</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Timeline</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Quadrant</th>
              <th className={thClass} style={{ color: 'var(--text-tertiary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAddRow && (
              <tr style={{ background: 'var(--accent-subtle)' }}>
                <td className={cellClass} style={{ color: 'var(--text-tertiary)' }}>new</td>
                <td className={cellClass}>
                  <input className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title *" autoFocus />
                </td>
                <td className={cellClass}><input type="date" className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={newRow.startDate} onChange={e => setNewRow({ ...newRow, startDate: e.target.value })} /></td>
                <td className={cellClass}><input type="date" className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={newRow.dueDate} onChange={e => setNewRow({ ...newRow, dueDate: e.target.value })} /></td>
                <td className={cellClass}><input type="number" min={0} max={100} className={`${inputClass} w-16`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={newRow.importanceScore} onChange={e => setNewRow({ ...newRow, importanceScore: Number(e.target.value) })} /></td>
                <td className={cellClass} style={{ color: 'var(--text-tertiary)' }}>—</td>
                <td className={cellClass} style={{ color: 'var(--text-tertiary)' }}>—</td>
                <td className={cellClass} style={{ color: 'var(--text-tertiary)' }}>—</td>
                <td className={cellClass}><button onClick={handleAdd} className="text-xs font-medium text-white rounded-md px-3 py-1" style={{ background: '#10b981' }}>Save</button></td>
              </tr>
            )}

            {sorted.map((task, i) => (
              <tr key={task.id} className="transition-colors duration-100"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: task.isOverdue ? 'rgba(239,68,68,0.03)' : undefined }}
                onMouseEnter={e => { if (!task.isOverdue) e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
                onMouseLeave={e => { if (!task.isOverdue) e.currentTarget.style.background = 'transparent'; }}
              >
                <td className={cellClass} style={{ color: 'var(--text-tertiary)' }}>{i + 1}</td>

                {editingId === task.id ? (
                  <>
                    <td className={cellClass}><input className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.title} onChange={e => setEditRow({ ...editRow, title: e.target.value })} /></td>
                    <td className={cellClass}><input type="date" className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.startDate} onChange={e => setEditRow({ ...editRow, startDate: e.target.value })} /></td>
                    <td className={cellClass}><input type="date" className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.dueDate} onChange={e => setEditRow({ ...editRow, dueDate: e.target.value })} /></td>
                    <td className={cellClass}><input type="number" min={0} max={100} className={`${inputClass} w-16`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.importanceScore} onChange={e => setEditRow({ ...editRow, importanceScore: Number(e.target.value) })} /></td>
                    <td className={cellClass}>
                      <select className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={cellClass}><TimelineBadge task={task} /></td>
                    <td className={cellClass}><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className={cellClass}>
                      <button onClick={() => saveEdit(task.id)} className="text-xs font-medium text-white rounded-md px-2.5 py-1 mr-1" style={{ background: '#10b981' }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-medium rounded-md px-2.5 py-1" style={{ color: 'var(--text-tertiary)' }}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${cellClass} font-medium max-w-[200px] truncate`} style={{ color: 'var(--text-primary)' }}>
                      {task.title}
                      {task.blockedBy && task.blockedBy.length > 0 && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-px rounded font-bold" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>BLOCKED</span>
                      )}
                    </td>
                    <td className={cellClass} style={{ color: 'var(--text-secondary)' }}>{task.startDate}</td>
                    <td className={cellClass} style={{ color: 'var(--text-secondary)' }}>{task.dueDate}</td>
                    <td className={cellClass}>
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md text-xs font-semibold tabular-nums"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        {task.importanceScore}
                      </span>
                    </td>
                    <td className={cellClass}><StatusBadge status={task.status} /></td>
                    <td className={cellClass}><TimelineBadge task={task} /></td>
                    <td className={cellClass}><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className={cellClass}>
                      <button onClick={() => startEdit(task)} className="text-xs font-medium mr-2 transition-colors" style={{ color: 'var(--accent)' }}>Edit</button>
                      <button onClick={() => handleDelete(task.id)} className="text-xs font-medium transition-colors" style={{ color: '#ef4444' }}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function MobileTaskCard({ task, index, onEdit, onDelete }: { task: Task; index: number; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const quadrantColors: Record<string, string> = {
    'Do Now': '#ef4444', 'Schedule': '#3b82f6', 'Delegate': '#f59e0b', 'Deprioritize': '#9ca3af',
  };

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderLeftWidth: '3px', borderLeftColor: quadrantColors[task.quadrant] || '#9ca3af' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-quaternary)' }}>#{index + 1}</span>
            <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} />
            <DaysLeftBadge days={task.daysRemaining} />
            <StatusBadge status={task.status} />
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              I:{task.importanceScore}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 ml-2 shrink-0">
          <button onClick={() => onEdit(task)} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Edit</button>
          <button onClick={() => onDelete(task.id)} className="text-xs font-medium" style={{ color: '#ef4444' }}>Del</button>
        </div>
      </div>
    </div>
  );
}

function TimelineBadge({ task }: { task: Task }) {
  const pct = task.timelineProgress ?? 0;
  const days = task.daysRemaining;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : pct >= 40 ? '#f59e0b' : '#10b981';

  return (
    <div className="min-w-[80px]">
      <DaysLeftBadge days={days} />
      <div className="mt-1 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[9px] mt-0.5" style={{ color: 'var(--text-quaternary)' }}>
        <span>{task.startDate?.slice(5)}</span>
        <span>{task.dueDate?.slice(5)}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Completed':  { bg: 'rgba(16,185,129,0.08)', color: '#10b981' },
    'In Progress': { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6' },
    'On Hold':     { bg: 'var(--bg-inset)', color: 'var(--text-tertiary)' },
    'Not Started': { bg: 'var(--bg-inset)', color: 'var(--text-tertiary)' },
  };
  const s = map[status] || map['Not Started'];

  return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.color }}>{status}</span>;
}

function DaysLeftBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{Math.abs(days)}d late</span>;
  if (days === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316' }}>Today</span>;
  if (days <= 7) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>{days}d</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>{days}d</span>;
}

function QuadrantBadge({ quadrant, isOverdue }: { quadrant: string; isOverdue: boolean }) {
  if (isOverdue) return <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white" style={{ background: '#ef4444' }}>OVERDUE</span>;
  const colors: Record<string, string> = { 'Do Now': '#ef4444', 'Schedule': '#3b82f6', 'Delegate': '#f59e0b', 'Deprioritize': '#9ca3af' };
  return <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white uppercase" style={{ background: colors[quadrant] || '#9ca3af' }}>{quadrant}</span>;
}
