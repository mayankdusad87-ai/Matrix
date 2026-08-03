import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  onUpdate: (id: number, updates: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: number) => Promise<void>;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}

const statusOptions = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

export default function InputSheet({ tasks, onUpdate, onDelete, onCreate }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Record<string, string | number>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [newRow, setNewRow] = useState({
    title: '', description: '', startDate: today, dueDate: '',
    importanceScore: 50, status: 'Not Started', owner: '', category: 'General',
  });

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditRow({
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      dueDate: task.dueDate,
      importanceScore: task.importanceScore,
      status: task.status,
      owner: task.owner,
      category: task.category,
    });
  };

  const saveEdit = async (id: number) => {
    await onUpdate(id, editRow);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newRow.title || !newRow.dueDate) return;
    await onCreate({ ...newRow, owner: newRow.owner || 'Unassigned' });
    setNewRow({ title: '', description: '', startDate: today, dueDate: '', importanceScore: 50, status: 'Not Started', owner: '', category: 'General' });
    setShowAddRow(false);
  };

  const inputClass = 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const cellClass = 'px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
  const thClass = 'px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider';

  const sorted = [...tasks].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Task Input Sheet</h2>
        <button
          onClick={() => setShowAddRow(!showAddRow)}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          {showAddRow ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className={thClass}>#</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>Description</th>
              <th className={thClass}>Start Date</th>
              <th className={thClass}>Due Date</th>
              <th className={thClass}>Importance</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Owner</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Priority</th>
              <th className={thClass}>Quadrant</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Add new row */}
            {showAddRow && (
              <tr className="bg-indigo-50/50 dark:bg-indigo-900/20">
                <td className={cellClass}>
                  <span className="text-gray-400">new</span>
                </td>
                <td className={cellClass}>
                  <input className={inputClass} value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title *" />
                </td>
                <td className={cellClass}>
                  <input className={inputClass} value={newRow.description} onChange={e => setNewRow({ ...newRow, description: e.target.value })} placeholder="Description" />
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
                <td className={cellClass}>
                  <select className={inputClass} value={newRow.status} onChange={e => setNewRow({ ...newRow, status: e.target.value })}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className={cellClass}>
                  <input className={inputClass} value={newRow.owner} onChange={e => setNewRow({ ...newRow, owner: e.target.value })} placeholder="Owner" />
                </td>
                <td className={cellClass}>
                  <input className={inputClass} value={newRow.category} onChange={e => setNewRow({ ...newRow, category: e.target.value })} placeholder="Category" />
                </td>
                <td className={cellClass}>—</td>
                <td className={cellClass}>—</td>
                <td className={cellClass}>
                  <button onClick={handleAdd} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-2 py-1 mr-1">Save</button>
                </td>
              </tr>
            )}

            {sorted.map((task, i) => (
              <tr key={task.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${task.isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                <td className={cellClass}>{i + 1}</td>

                {editingId === task.id ? (
                  <>
                    <td className={cellClass}><input className={inputClass} value={editRow.title} onChange={e => setEditRow({ ...editRow, title: e.target.value })} /></td>
                    <td className={cellClass}><input className={inputClass} value={editRow.description} onChange={e => setEditRow({ ...editRow, description: e.target.value })} /></td>
                    <td className={cellClass}><input type="date" className={inputClass} value={editRow.startDate} onChange={e => setEditRow({ ...editRow, startDate: e.target.value })} /></td>
                    <td className={cellClass}><input type="date" className={inputClass} value={editRow.dueDate} onChange={e => setEditRow({ ...editRow, dueDate: e.target.value })} /></td>
                    <td className={cellClass}><input type="number" min={0} max={100} className={inputClass + ' w-16'} value={editRow.importanceScore} onChange={e => setEditRow({ ...editRow, importanceScore: Number(e.target.value) })} /></td>
                    <td className={cellClass}>
                      <select className={inputClass} value={editRow.status} onChange={e => setEditRow({ ...editRow, status: e.target.value })}>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={cellClass}><input className={inputClass} value={editRow.owner} onChange={e => setEditRow({ ...editRow, owner: e.target.value })} /></td>
                    <td className={cellClass}><input className={inputClass} value={editRow.category} onChange={e => setEditRow({ ...editRow, category: e.target.value })} /></td>
                    <td className={cellClass}><span className="font-medium">{task.priorityScore}</span></td>
                    <td className={cellClass}><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className={cellClass}>
                      <button onClick={() => saveEdit(task.id)} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded px-2 py-1 mr-1">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 rounded px-2 py-1">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={cellClass + ' font-medium text-gray-900 dark:text-white max-w-[200px] truncate'}>{task.title}</td>
                    <td className={cellClass + ' max-w-[200px] truncate text-gray-500 dark:text-gray-400'}>{task.description || '—'}</td>
                    <td className={cellClass}>{task.startDate}</td>
                    <td className={cellClass}>{task.dueDate}</td>
                    <td className={cellClass}>
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                        {task.importanceScore}
                      </span>
                    </td>
                    <td className={cellClass}><StatusBadge status={task.status} /></td>
                    <td className={cellClass}>{task.owner}</td>
                    <td className={cellClass}>{task.category}</td>
                    <td className={cellClass}><span className="font-semibold">{task.priorityScore}</span></td>
                    <td className={cellClass}><QuadrantBadge quadrant={task.quadrant} isOverdue={task.isOverdue} /></td>
                    <td className={cellClass}>
                      <button onClick={() => startEdit(task)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-2">Edit</button>
                      <button onClick={() => onDelete(task.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">Delete</button>
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

function StatusBadge({ status }: { status: string }) {
  const colors = {
    'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'On Hold': 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'Not Started': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  }[status] || 'bg-gray-100 text-gray-500';

  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors}`}>{status}</span>;
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
