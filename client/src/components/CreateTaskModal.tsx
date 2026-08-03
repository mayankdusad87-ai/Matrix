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

  const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Task</h2>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date *</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={inputClass} required />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            Importance Score: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{form.importanceScore}</span>
          </label>
          <input type="range" min={0} max={100} value={form.importanceScore}
            onChange={e => set('importanceScore', Number(e.target.value))} className="w-full accent-indigo-600" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</label>
            <input value={form.owner} onChange={e => set('owner', e.target.value)} className={inputClass} placeholder="Unassigned" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</label>
            <input value={form.category} onChange={e => set('category', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-2 text-sm font-medium text-white">
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
