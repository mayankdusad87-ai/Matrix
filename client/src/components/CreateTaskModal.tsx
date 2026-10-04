import { useState } from 'react';
import type { TaskFormData } from '../types';

interface Props {
  onClose: () => void;
  onCreate: (data: TaskFormData) => Promise<void>;
}

export default function CreateTaskModal({ onClose, onCreate }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    startDate: today,
    dueDate: '',
    importanceScore: 50,
    status: 'Not Started',
    owner: '',
    category: 'General',
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof TaskFormData, value: string | number) => setForm(p => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) return;
    setSaving(true);
    try {
      await onCreate(form);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors duration-150';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="rounded-2xl w-full max-w-md p-6 space-y-5 animate-scale-in"
        style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Create New Task</h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-inset)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass}
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            placeholder="What needs to be done?" required autoFocus />
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            className={`${inputClass} resize-none`}
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            placeholder="Add details..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Due Date *</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} required />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
            Importance Score
            <span className="font-bold tabular-nums text-sm" style={{ color: 'var(--accent)' }}>{form.importanceScore}</span>
          </label>
          <input type="range" min={0} max={100} value={form.importanceScore}
            onChange={e => set('importanceScore', Number(e.target.value))} className="w-full" />
          <div className="flex justify-between text-[10px] tabular-nums" style={{ color: 'var(--text-quaternary)' }}>
            <span>Low</span><span>High</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Owner</label>
            <input value={form.owner} onChange={e => set('owner', e.target.value)}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              placeholder="Unassigned" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Category</label>
            <input value={form.category} onChange={e => set('category', e.target.value)}
              className={inputClass}
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className={inputClass}
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-150 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a0a0a', boxShadow: '0 0 12px rgba(239,68,68,0.15)' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}>
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
