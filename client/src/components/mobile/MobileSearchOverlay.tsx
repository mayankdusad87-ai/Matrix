import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types';

interface Props {
  search: string;
  setSearch: (s: string) => void;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onClose: () => void;
}

export default function MobileSearchOverlay({ search, setSearch, tasks, onTaskClick, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = search.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg-page)' }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => { setSearch(''); onClose(); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-[15px] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')}
            className="text-[13px] font-medium shrink-0"
            style={{ color: 'var(--accent)' }}>
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
        {!search.trim() ? (
          <p className="text-center text-[14px] mt-8" style={{ color: 'var(--text-tertiary)' }}>
            Type to search your tasks...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[14px] mt-8" style={{ color: 'var(--text-tertiary)' }}>
            No tasks matching "{search}"
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map(task => (
              <button
                key={task.id}
                onClick={() => { onTaskClick(task); onClose(); }}
                className="w-full text-left p-3 rounded-xl transition-all duration-150 active:scale-[0.98]"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white uppercase"
                    style={{ background: task.isOverdue ? '#ef4444' : ({ 'Do Now': '#ef4444', 'Schedule': '#3b82f6', 'Delegate': '#f59e0b', 'Deprioritize': '#9ca3af' }[task.quadrant] || '#9ca3af') }}>
                    {task.isOverdue ? 'OVERDUE' : task.quadrant}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{task.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
