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

type TabFilter = 'all' | 'overdue' | 'due-soon' | 'in-progress' | 'completed';

export default function InputSheet({ tasks, allTasks, search, onSearchChange, onUpdate, onDelete, onCreate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Record<string, string | number>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const today = new Date().toISOString().split('T')[0];
  const [newRow, setNewRow] = useState({ title: '', startDate: today, dueDate: '', importanceScore: 50 });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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

  const handleDelete = (id: string) => { setError(null); onDelete(id); setMenuOpen(null); };

  const inputClass = 'w-full px-2.5 py-1.5 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors';

  const filtered = tasks.filter(t => {
    if (tabFilter === 'overdue') return t.isOverdue && t.status !== 'Completed';
    if (tabFilter === 'due-soon') return t.daysRemaining >= 0 && t.daysRemaining <= 7 && t.status !== 'Completed';
    if (tabFilter === 'in-progress') return t.status === 'In Progress';
    if (tabFilter === 'completed') return t.status === 'Completed';
    return true;
  });
  const sorted = [...filtered].sort((a, b) => a.daysRemaining - b.daysRemaining);

  const tabCounts = {
    all: tasks.length,
    overdue: tasks.filter(t => t.isOverdue && t.status !== 'Completed').length,
    'due-soon': tasks.filter(t => t.daysRemaining >= 0 && t.daysRemaining <= 7 && t.status !== 'Completed').length,
    'in-progress': tasks.filter(t => t.status === 'In Progress').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Page header + toolbar */}
      <div className="px-5 md:px-8 pt-5 pb-2">
        <h1 className="text-[22px] md:text-[26px] font-bold" style={{ color: 'var(--text-primary)' }}>Tasks</h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Stay on top of everything that needs to get done.
        </p>
      </div>

      {/* Tab filters + search/actions on one line */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {([
            { key: 'all' as TabFilter, label: 'All' },
            { key: 'overdue' as TabFilter, label: 'Overdue' },
            { key: 'due-soon' as TabFilter, label: 'Due Soon' },
            { key: 'in-progress' as TabFilter, label: 'In Progress' },
            { key: 'completed' as TabFilter, label: 'Completed' },
          ]).map(({ key, label }) => {
            const colors: Record<string, string> = { overdue: '#ef4444', 'due-soon': '#f59e0b', 'in-progress': '#3b82f6', completed: '#10b981' };
            const c = colors[key] || '';
            return (
              <button
                key={key}
                onClick={() => setTabFilter(key)}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg whitespace-nowrap transition-all duration-150"
                style={tabFilter === key ? {
                  background: c ? `${c}12` : 'var(--accent-subtle)',
                  color: c || 'var(--accent)',
                  border: `1px solid ${c ? `${c}30` : 'var(--accent-muted)'}`,
                } : {
                  color: 'var(--text-tertiary)',
                  border: '1px solid transparent',
                }}
              >
                {label}
                {tabCounts[key] > 0 && (
                  <span className="text-[10px] font-bold tabular-nums px-1.5 py-px rounded-full"
                    style={tabFilter === key ? { background: c ? `${c}20` : 'var(--accent-muted)' } : { background: 'var(--bg-inset)' }}>
                    {tabCounts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text" placeholder="Search tasks..." value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-48 pl-8 pr-3 py-1.5 text-[13px] rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>
          <button onClick={() => exportCSV(allTasks)}
            className="rounded-lg text-[13px] font-medium px-3 py-1.5 transition-all duration-150 flex items-center gap-1.5"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Export
          </button>
          <button onClick={() => { setShowAddRow(!showAddRow); setError(null); }}
            className="rounded-lg text-[13px] font-semibold px-4 py-1.5 transition-all duration-150"
            style={{ background: showAddRow ? 'var(--text-tertiary)' : 'var(--accent)', color: '#ffffff' }}
          >
            {showAddRow ? 'Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-2 mx-4 md:mx-6 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
          {error}
        </div>
      )}

      {sorted.length === 0 && !showAddRow ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" /><path strokeLinecap="round" d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <p className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>No tasks yet</p>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'var(--text-tertiary)' }}>
              Create your first task to get started. Priorix will prioritise it automatically.
            </p>
          </div>
        </div>
      ) : (
      <>
      {/* Mobile card view */}
      <div className="block md:hidden flex-1 overflow-auto space-y-2 scrollbar-thin px-4">
        {/* Mobile add + search */}
        <div className="flex items-center gap-2 mb-1">
          <div className="relative flex-1">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search..." value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
          </div>
          <button onClick={() => { setShowAddRow(!showAddRow); setError(null); }}
            className="rounded-lg text-sm font-semibold px-4 py-2 shrink-0"
            style={{ background: 'var(--accent)', color: '#ffffff' }}>
            {showAddRow ? 'Cancel' : '+ Add'}
          </button>
        </div>
        {showAddRow && (
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}>
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
              <button onClick={handleAdd} className="text-xs font-medium rounded-lg px-4 py-1.5" style={{ background: 'var(--accent)', color: '#ffffff' }}>Save</button>
            </div>
          </div>
        )}
        {sorted.map((task) => (
          <MobileTaskCard key={task.id} task={task} onEdit={startEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Desktop table — dense, hierarchical */}
      <div className="hidden md:flex flex-1 flex-col overflow-auto mx-4 md:mx-6 mb-4 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <table className="w-full">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider w-[45%]" style={{ color: 'var(--text-tertiary)' }}>Task</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Due Date</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Quadrant</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Importance</th>
              <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider w-10" style={{ color: 'var(--text-tertiary)' }}></th>
            </tr>
          </thead>
          <tbody>
            {showAddRow && (
              <tr style={{ background: 'var(--accent-subtle)' }}>
                <td className="px-4 py-3">
                  <input className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title *" autoFocus />
                </td>
                <td className="px-3 py-3"><input type="date" className={`${inputClass} w-32`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={newRow.dueDate} onChange={e => setNewRow({ ...newRow, dueDate: e.target.value })} /></td>
                <td className="px-3 py-3" style={{ color: 'var(--text-tertiary)' }}>—</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-tertiary)' }}>—</td>
                <td className="px-3 py-3"><input type="number" min={0} max={100} className={`${inputClass} w-16`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={newRow.importanceScore} onChange={e => setNewRow({ ...newRow, importanceScore: Number(e.target.value) })} /></td>
                <td className="px-3 py-3 text-right"><button onClick={handleAdd} className="text-xs font-semibold rounded-md px-3 py-1" style={{ background: 'var(--accent)', color: '#ffffff' }}>Save</button></td>
              </tr>
            )}

            {sorted.map((task) => (
              <tr key={task.id} className="group transition-colors duration-100"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: task.isOverdue ? 'rgba(239,68,68,0.03)' : undefined }}
                onMouseEnter={e => { if (!task.isOverdue) e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
                onMouseLeave={e => { if (!task.isOverdue) e.currentTarget.style.background = 'transparent'; }}
              >
                {editingId === task.id ? (
                  <>
                    <td className="px-4 py-2.5"><input className={inputClass} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.title} onChange={e => setEditRow({ ...editRow, title: e.target.value })} /></td>
                    <td className="px-3 py-2.5"><input type="date" className={`${inputClass} w-32`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.dueDate} onChange={e => setEditRow({ ...editRow, dueDate: e.target.value })} /></td>
                    <td className="px-3 py-2.5">
                      <select className={`${inputClass} w-28`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5"><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className="px-3 py-2.5"><input type="number" min={0} max={100} className={`${inputClass} w-16`} style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} value={editRow.importanceScore} onChange={e => setEditRow({ ...editRow, importanceScore: Number(e.target.value) })} /></td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => saveEdit(task.id)} className="text-xs font-semibold rounded-md px-2.5 py-1 mr-1" style={{ background: 'var(--accent)', color: '#ffffff' }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* Task: title + description */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {task.title}
                            {task.blockedBy && task.blockedBy.length > 0 && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-px rounded font-bold align-middle" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>BLOCKED</span>
                            )}
                          </p>
                          {task.description && (
                            <p className="text-[12px] mt-0.5 truncate max-w-[320px]" style={{ color: 'var(--text-tertiary)' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Due Date: relative + absolute */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <DueLabel days={task.daysRemaining} />
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-quaternary)' }}>{task.dueDate}</p>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-3"><StatusBadge status={task.status} /></td>
                    {/* Quadrant */}
                    <td className="px-3 py-3"><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    {/* Importance */}
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-md text-xs font-bold tabular-nums"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                        {task.importanceScore}
                      </span>
                    </td>
                    {/* Actions menu */}
                    <td className="px-3 py-3 text-right relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === task.id ? null : task.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-inset)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      {menuOpen === task.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-2 top-full mt-1 w-32 rounded-lg py-1 z-50"
                            style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                            <button onClick={() => { startEdit(task); setMenuOpen(null); }}
                              className="w-full text-left px-3 py-1.5 text-[13px] font-medium transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(task.id)}
                              className="w-full text-left px-3 py-1.5 text-[13px] font-medium transition-colors"
                              style={{ color: '#ef4444' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="flex items-center justify-end gap-4 px-4 py-2.5 mt-auto shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {sorted.length} of {tasks.length} tasks
          </span>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function MobileTaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const quadrantColors: Record<string, string> = {
    'Do Now': '#ef4444', 'Schedule': '#3b82f6', 'Delegate': '#f59e0b', 'Deprioritize': '#9ca3af',
  };

  return (
    <div className="p-3.5 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderLeftWidth: '3px', borderLeftColor: quadrantColors[task.quadrant] || '#9ca3af' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
          {task.description && (
            <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{task.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} />
            <DaysLeftBadge days={task.daysRemaining} />
            <StatusBadge status={task.status} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{task.importanceScore}</span>
          <div className="flex gap-1.5">
            <button onClick={() => onEdit(task)} className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>Edit</button>
            <button onClick={() => onDelete(task.id)} className="text-[11px] font-medium" style={{ color: '#ef4444' }}>Del</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DueLabel({ days }: { days: number }) {
  const color = days < 0 ? '#ef4444' : days === 0 ? '#f97316' : days <= 7 ? '#f59e0b' : 'var(--text-secondary)';
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days} days`;
  return <span className="text-[13px] font-semibold" style={{ color }}>{label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    'Completed':  { bg: 'rgba(16,185,129,0.08)', color: '#10b981', dot: '#10b981' },
    'In Progress': { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', dot: '#3b82f6' },
    'On Hold':     { bg: 'var(--bg-inset)', color: 'var(--text-tertiary)', dot: '#f59e0b' },
    'Not Started': { bg: 'var(--bg-inset)', color: 'var(--text-tertiary)', dot: '#9ca3af' },
  };
  const s = map[status] || map['Not Started'];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {status}
    </span>
  );
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
