import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskFormData } from '../../types';

interface Props {
  onClose: () => void;
  onCreate: (data: TaskFormData) => Promise<void>;
}

export default function MobileCreateTask({ onClose, onCreate }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    startDate: today,
    dueDate: '',
    importanceScore: 50,
    status: 'Not Started',
    owner: '',
    category: '',
  });

  const update = (key: keyof TaskFormData, value: string | number) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    if (!form.title || !form.dueDate) return;
    setSaving(true);
    try {
      await onCreate(form);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl px-4 py-3.5 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors duration-150';

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
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>New Task</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Title *</label>
            <input
              value={form.title} onChange={e => update('title', e.target.value)}
              placeholder="What needs to be done?"
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Description</label>
            <textarea
              value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Add details..."
              rows={2}
              className={`${inputClass} resize-none`}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)}
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => update('dueDate', e.target.value)}
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
              Importance
              <span className="font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{form.importanceScore}</span>
            </label>
            <input type="range" min={0} max={100} value={form.importanceScore}
              onChange={e => update('importanceScore', Number(e.target.value))}
              className="w-full h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Owner</label>
              <input value={form.owner} onChange={e => update('owner', e.target.value)}
                placeholder="Unassigned"
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Category</label>
              <input value={form.category} onChange={e => update('category', e.target.value)}
                placeholder="General"
                className={inputClass}
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Status</label>
            <select
              value={form.status} onChange={e => update('status', e.target.value)}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3 shrink-0" style={{ borderTop: '1px solid var(--border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={onClose}
            className="flex-1 rounded-xl py-3.5 text-[14px] font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.title || !form.dueDate}
            className="flex-1 rounded-xl py-3.5 text-[14px] font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#ffffff' }}>
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
