import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../types';

interface Props {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => void;
}

const quadrantColors: Record<string, string> = {
  'Do Now': '#ef4444', 'Schedule': '#3b82f6', 'Delegate': '#f59e0b', 'Deprioritize': '#9ca3af',
};

export default function MobileTaskDetail({ task, allTasks, onClose, onUpdate, onDelete }: Props) {
  const [importance, setImportance] = useState(task.importanceScore);
  const [status, setStatus] = useState(task.status);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [blockedBy, setBlockedBy] = useState<string[]>(task.blockedBy || []);

  const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const progress = task.timelineProgress ?? 0;
  const progressColor = progress >= 90 ? '#ef4444' : progress >= 70 ? '#f97316' : progress >= 40 ? '#f59e0b' : '#10b981';

  const handleSave = async () => {
    await onUpdate(task.id, { importanceScore: importance, status, title, description, blockedBy });
    setEditing(false);
  };

  const otherTasks = allTasks.filter(t => t.id !== task.id);
  const toggleDependency = (depId: string) => {
    setBlockedBy(prev => prev.includes(depId) ? prev.filter(id => id !== depId) : [...prev, depId]);
  };

  const inputClass = 'w-full rounded-lg px-3 py-3 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors duration-150';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl"
        style={{
          background: 'var(--bg-page)',
          maxHeight: '92vh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) onClose();
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-quaternary)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md text-white"
              style={{ background: task.isOverdue ? '#ef4444' : (quadrantColors[task.quadrant] || '#9ca3af') }}>
              {task.isOverdue ? 'OVERDUE' : task.quadrant}
            </span>
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Task Details</h2>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">
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
              <p className="text-[14px]" style={{ color: task.description ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                {task.description || 'No description'}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Owner" value={task.owner} />
            <InfoCard label="Category" value={task.category} />
            <InfoCard label="Start Date" value={new Date(task.startDate).toLocaleDateString()} />
            <InfoCard label="Due Date" value={new Date(task.dueDate).toLocaleDateString()} />
            <InfoCard label="Quadrant" value={task.quadrant} />
            <InfoCard
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
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progressColor }} />
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
              className="w-full h-2"
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
                    <span key={depId} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                      {depTask?.title || 'Unknown'}
                      <button onClick={() => toggleDependency(depId)} className="font-bold opacity-60 active:opacity-100 ml-0.5">×</button>
                    </span>
                  );
                })}
              </div>
            )}
            {editing && otherTasks.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg scrollbar-thin" style={{ border: '1px solid var(--border)' }}>
                {otherTasks.map(t => (
                  <label key={t.id} className="flex items-center gap-2.5 px-3 py-3 cursor-pointer text-[14px]"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <input type="checkbox" checked={blockedBy.includes(t.id)} onChange={() => toggleDependency(t.id)}
                      className="accent-[var(--accent)] w-4 h-4 rounded" />
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{t.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-2 shrink-0" style={{ borderTop: '1px solid var(--border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)}
                className="flex-1 rounded-xl px-3 py-3.5 text-[14px] font-medium"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Edit
              </button>
              <button onClick={handleSave}
                className="flex-1 rounded-xl px-3 py-3.5 text-[14px] font-semibold"
                style={{ background: 'var(--accent)', color: '#ffffff' }}>
                Save
              </button>
              <button onClick={() => { onDelete(task.id); onClose(); }}
                className="rounded-xl px-3 py-3.5 text-[14px] font-medium"
                style={{ border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(false)}
                className="flex-1 rounded-xl px-3 py-3.5 text-[14px] font-medium"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 rounded-xl px-3 py-3.5 text-[14px] font-semibold"
                style={{ background: 'var(--accent)', color: '#ffffff' }}>
                Save
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-inset)' }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <p className="text-[14px] font-medium" style={{ color: highlight || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
