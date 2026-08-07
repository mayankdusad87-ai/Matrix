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

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors duration-150';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 w-[420px] max-w-full z-50 flex flex-col animate-slide-in-right"
        style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[52px] shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Task Details</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-inset)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Title</label>
            {editing ? (
              <input value={title} onChange={e => setTitle(e.target.value)}
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            ) : (
              <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Description</label>
            {editing ? (
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className={`${inputClass} resize-none`}
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            ) : (
              <p className="text-sm" style={{ color: task.description ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                {task.description || 'No description'}
              </p>
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
              highlight={daysLeft < 0 ? '#ef4444' : undefined}
            />
          </div>

          {/* Timeline progress */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
              Timeline Progress
              <span className="font-bold tabular-nums" style={{ color: progress >= 90 ? '#ef4444' : progress >= 70 ? '#f97316' : 'var(--accent)' }}>{progress}%</span>
            </label>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: progress >= 90 ? '#ef4444' : progress >= 70 ? '#f97316' : progress >= 40 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              <span>{task.startDate}</span>
              <span>{task.dueDate}</span>
            </div>
          </div>

          {/* Importance slider */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
              Importance Score
              <span className="font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{importance}</span>
            </label>
            <input type="range" min={0} max={100} value={importance}
              onChange={e => setImportance(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] tabular-nums" style={{ color: 'var(--text-quaternary)' }}>
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* Status select */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Task['status'])}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Dependencies */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>
              Blocked By ({blockedBy.length})
            </label>
            {blockedBy.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {blockedBy.map(depId => {
                  const depTask = allTasks.find(t => t.id === depId);
                  return (
                    <span key={depId} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      {depTask?.title || 'Unknown'}
                      <button onClick={() => toggleDependency(depId)} className="font-bold opacity-60 hover:opacity-100">×</button>
                    </span>
                  );
                })}
              </div>
            )}
            {editing && otherTasks.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg scrollbar-thin" style={{ border: '1px solid var(--border)' }}>
                {otherTasks.map(t => (
                  <label key={t.id} className="flex items-center gap-2 px-2.5 py-2 cursor-pointer text-sm transition-colors duration-100"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <input type="checkbox" checked={blockedBy.includes(t.id)} onChange={() => toggleDependency(t.id)}
                      className="accent-[var(--accent)] rounded" />
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{t.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 flex gap-2 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)}
                className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Edit
              </button>
              <button onClick={handleSave}
                className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-150"
                style={{ background: 'var(--accent)', color: '#0a0a0a', boxShadow: '0 0 12px rgba(163,230,53,0.15)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}>
                Save Changes
              </button>
              <button onClick={() => onDelete(task.id)}
                className="rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
                style={{ border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(false)}
                className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-150"
                style={{ background: 'var(--accent)', color: '#0a0a0a', boxShadow: '0 0 12px rgba(163,230,53,0.15)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}>
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-inset)' }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <p className="text-sm font-medium" style={{ color: highlight || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
