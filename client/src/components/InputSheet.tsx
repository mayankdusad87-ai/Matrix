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
    `"${t.title.replace(/"/g, '""')}"`,
    t.startDate,
    t.dueDate,
    t.importanceScore,
    t.status,
    t.daysRemaining,
    t.quadrant,
    t.owner,
    t.category,
    `${t.timelineProgress ?? 0}%`,
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
    setEditRow({
      title: task.title,
      startDate: task.startDate,
      dueDate: task.dueDate,
      importanceScore: task.importanceScore,
      status: task.status,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      setError(null);
      await onUpdate(id, editRow);
      setEditingId(null);
    } catch (err) {
      setError(`Failed to save: ${(err as Error).message}`);
    }
  };

  const handleAdd = async () => {
    if (!newRow.title || !newRow.startDate || !newRow.dueDate) return;
    try {
      setError(null);
      await onCreate({
        ...newRow,
        description: '',
        status: 'Not Started',
        owner: 'Unassigned',
        category: 'General',
      });
      setNewRow({ title: '', startDate: today, dueDate: '', importanceScore: 50 });
      setShowAddRow(false);
    } catch (err) {
      setError(`Failed to add task: ${(err as Error).message}`);
    }
  };

  const handleDelete = (id: string) => {
    setError(null);
    onDelete(id);
  };

  const inputClass = 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const cellClass = 'px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
  const thClass = 'px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';

  const sorted = [...tasks].sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-2 md:p-4">
      {/* Header with search + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Task Input Sheet</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {/* Export CSV */}
          <button
            onClick={() => exportCSV(allTasks)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
            title="Export all tasks as CSV"
          >
            📥 Export
          </button>
          {/* Add Task */}
          <button
            onClick={() => { setShowAddRow(!showAddRow); setError(null); }}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 transition-colors shrink-0"
          >
            {showAddRow ? 'Cancel' : '+ Add Task'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Mobile card view */}
      <div className="block md:hidden flex-1 overflow-auto space-y-2">
        {showAddRow && (
          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <input className={inputClass} value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title *" autoFocus />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Start</label>
                <input type="date" className={inputClass} value={newRow.startDate} onChange={e => setNewRow({ ...newRow, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Due</label>
                <input type="date" className={inputClass} value={newRow.dueDate} onChange={e => setNewRow({ ...newRow, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Importance</label>
              <input type="number" min={0} max={100} className={inputClass + ' w-16'} value={newRow.importanceScore} onChange={e => setNewRow({ ...newRow, importanceScore: Number(e.target.value) })} />
              <div className="flex-1" />
              <button onClick={handleAdd} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-3 py-1.5">Save</button>
            </div>
          </div>
        )}
        {sorted.map((task, i) => (
          <MobileTaskCard key={task.id} task={task} index={i} onEdit={startEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:flex flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className={thClass}>#</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>Start Date</th>
              <th className={thClass}>Due Date</th>
              <th className={thClass}>Importance</th>
              <th className={thClass}>Progress</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Days Left</th>
              <th className={thClass}>Quadrant</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {showAddRow && (
              <tr className="bg-indigo-50/50 dark:bg-indigo-900/20">
                <td className={cellClass}><span className="text-gray-400">new</span></td>
                <td className={cellClass}>
                  <input className={inputClass} value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title *" autoFocus />
                </td>
                <td className={cellClass}>
                  <input type="date" className={inputClass} value={newRow.startDate} onChange={e => setNewRow({ ...newRow, startDate: e.target.value })} />
                </td>
                <td className={cellClass}>
                  <input type="date" className={inputClass} value={newRow.dueDate} onChange={e => setNewRow({ ...newRow, dueDate: e.target.value })} />
                </td>
                <td className={cellClass}>
                  <input type="number" min={0} max={100} className={inputClass + ' w-16'} value={newRow.importanceScore} onChange={e => setNewRow({ ...newRow, importanceScore: Number(e.target.value) })} />
                </td>
                <td className={cellClass}>—</td>
                <td className={cellClass}>—</td>
                <td className={cellClass}>—</td>
                <td className={cellClass}>—</td>
                <td className={cellClass}>
                  <button onClick={handleAdd} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-2 py-1">Save</button>
                </td>
              </tr>
            )}

            {sorted.map((task, i) => (
              <tr key={task.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${task.isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                <td className={cellClass}>{i + 1}</td>

                {editingId === task.id ? (
                  <>
                    <td className={cellClass}><input className={inputClass} value={editRow.title} onChange={e => setEditRow({ ...editRow, title: e.target.value })} /></td>
                    <td className={cellClass}><input type="date" className={inputClass} value={editRow.startDate} onChange={e => setEditRow({ ...editRow, startDate: e.target.value })} /></td>
                    <td className={cellClass}><input type="date" className={inputClass} value={editRow.dueDate} onChange={e => setEditRow({ ...editRow, dueDate: e.target.value })} /></td>
                    <td className={cellClass}><input type="number" min={0} max={100} className={inputClass + ' w-16'} value={editRow.importanceScore} onChange={e => setEditRow({ ...editRow, importanceScore: Number(e.target.value) })} /></td>
                    <td className={cellClass}><ProgressBar value={task.timelineProgress} /></td>
                    <td className={cellClass}>
                      <select className={inputClass} value={editRow.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={cellClass}><DaysLeftBadge days={task.daysRemaining} /></td>
                    <td className={cellClass}><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className={cellClass}>
                      <button onClick={() => saveEdit(task.id)} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-2 py-1 mr-1">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 rounded px-2 py-1">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={cellClass + ' font-medium text-gray-900 dark:text-white max-w-[200px] truncate'}>
                      {task.title}
                      {task.blockedBy && task.blockedBy.length > 0 && (
                        <span className="ml-1 text-[9px] px-1 py-px rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold" title="Blocked by another task">
                          🔒 BLOCKED
                        </span>
                      )}
                    </td>
                    <td className={cellClass}>{task.startDate}</td>
                    <td className={cellClass}>{task.dueDate}</td>
                    <td className={cellClass}>
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                        {task.importanceScore}
                      </span>
                    </td>
                    <td className={cellClass}><ProgressBar value={task.timelineProgress} /></td>
                    <td className={cellClass}><StatusBadge status={task.status} /></td>
                    <td className={cellClass}><DaysLeftBadge days={task.daysRemaining} /></td>
                    <td className={cellClass}><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className={cellClass}>
                      <button onClick={() => startEdit(task)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(task.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">Delete</button>
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
    'Do Now': 'border-l-red-500',
    'Schedule': 'border-l-blue-500',
    'Delegate': 'border-l-amber-500',
    'Deprioritize': 'border-l-gray-400',
  };

  return (
    <div className={`p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-4 ${quadrantColors[task.quadrant] || 'border-l-gray-400'} ${task.isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">#{index + 1}</span>
            <p className="font-semibold text-gray-900 dark:text-white truncate">{task.title}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} />
            <DaysLeftBadge days={task.daysRemaining} />
            <StatusBadge status={task.status} />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold">
              I:{task.importanceScore}
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar value={task.timelineProgress} />
          </div>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button onClick={() => onEdit(task)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Edit</button>
          <button onClick={() => onDelete(task.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">Del</button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value?: number }) {
  const pct = value ?? 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : pct >= 40 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 w-7">{pct}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'On Hold': 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'Not Started': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  }[status] || 'bg-gray-100 text-gray-500';

  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors}`}>{status}</span>;
}

function DaysLeftBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">{Math.abs(days)}d late</span>;
  if (days === 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">Today</span>;
  if (days <= 7) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">{days}d</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{days}d</span>;
}

function QuadrantBadge({ quadrant, isOverdue }: { quadrant: string; isOverdue: boolean }) {
  if (isOverdue) return <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-500 text-white">OVERDUE</span>;
  const colors = {
    'Do Now': 'bg-red-500 text-white',
    'Schedule': 'bg-blue-500 text-white',
    'Delegate': 'bg-amber-500 text-white',
    'Deprioritize': 'bg-gray-500 text-white',
  }[quadrant] || 'bg-gray-500 text-white';

  return <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${colors}`}>{quadrant}</span>;
}
