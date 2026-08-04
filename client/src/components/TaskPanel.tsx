import { useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => void;
}

export default function TaskPanel({ task, allTasks, onClose, onUpdate, onDelete }: Props) {
  const [importance, setImportance] = useState(task.importanceScore);
  const [status, setStatus] = useState(task.status);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [blockedBy, setBlockedBy] = useState<string[]>(task.blockedBy || []);

  const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const progress = task.timelineProgress ?? 0;

  const handleSave = async () => {
    await onUpdate(task.id, { importanceScore: importance, status, title, description, blockedBy });
    setEditing(false);
  };

  const otherTasks = allTasks.filter(t => t.id !== task.id);

  const toggleDependency = (depId: string) => {
    setBlockedBy(prev => prev.includes(depId) ? prev.filter(id => id !== depId) : [...prev, depId]);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-2">Task Details</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</label>
          {editing ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white" />
          ) : (
            <p className="mt-1 text-gray-900 dark:text-white font-semibold">{task.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</label>
          {editing ? (
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white" />
          ) : (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{task.description || 'No description'}</p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Owner" value={task.owner} />
          <InfoItem label="Category" value={task.category} />
          <InfoItem label="Start Date" value={new Date(task.startDate).toLocaleDateString()} />
          <InfoItem label="Due Date" value={new Date(task.dueDate).toLocaleDateString()} />
          <InfoItem label="Quadrant" value={task.quadrant} />
          <InfoItem
            label="Days Left"
            value={daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
            highlight={daysLeft < 0 ? 'text-red-600 dark:text-red-400' : undefined}
          />
        </div>

        {/* Timeline progress */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            Timeline Progress: <span className={`font-bold ${progress >= 90 ? 'text-red-500' : progress >= 70 ? 'text-orange-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{progress}%</span>
          </label>
          <div className="mt-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress >= 90 ? 'bg-red-500' : progress >= 70 ? 'bg-orange-400' : progress >= 40 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>{task.startDate}</span>
            <span>{task.dueDate}</span>
          </div>
        </div>

        {/* Importance slider */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            Importance Score: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{importance}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={importance}
            onChange={e => setImportance(Number(e.target.value))}
            className="mt-1 w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0</span><span>50</span><span>100</span>
          </div>
        </div>

        {/* Status select */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Task['status'])}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        {/* Dependencies */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1 block">
            Blocked By ({blockedBy.length})
          </label>
          {blockedBy.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {blockedBy.map(depId => {
                const depTask = allTasks.find(t => t.id === depId);
                return (
                  <span key={depId} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    🔒 {depTask?.title || 'Unknown'}
                    <button onClick={() => toggleDependency(depId)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                  </span>
                );
              })}
            </div>
          )}
          {editing && otherTasks.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {otherTasks.map(t => (
                <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={blockedBy.includes(t.id)}
                    onChange={() => toggleDependency(t.id)}
                    className="accent-red-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">{t.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        {!editing ? (
          <>
            <button onClick={() => setEditing(true)}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              Edit
            </button>
            <button onClick={handleSave}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm font-medium text-white">
              Save Changes
            </button>
            <button onClick={() => onDelete(task.id)}
              className="rounded-lg border border-red-300 dark:border-red-600 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              Delete
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(false)}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm font-medium text-white">
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">{label}</span>
      <p className={`text-sm font-medium ${highlight || 'text-gray-800 dark:text-gray-200'}`}>{value}</p>
    </div>
  );
}
