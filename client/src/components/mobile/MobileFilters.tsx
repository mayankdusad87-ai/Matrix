import { motion, AnimatePresence } from 'framer-motion';
import type { Filters as FiltersType, Task } from '../../types';

interface Props {
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  tasks: Task[];
  onClose: () => void;
}

export default function MobileFilters({ filters, setFilters, tasks, onClose }: Props) {
  const owners = [...new Set(tasks.map(t => t.owner))].sort();
  const categories = [...new Set(tasks.map(t => t.category))].sort();
  const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
  const quadrants = ['Do Now', 'Schedule', 'Delegate', 'Deprioritize'];

  const update = (key: keyof FiltersType, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const activeCount = [filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length;

  const selectClass = 'w-full rounded-xl px-4 py-3.5 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors duration-150';

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
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl"
        style={{
          background: 'var(--bg-page)',
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
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
            Filters
            {activeCount > 0 && (
              <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--accent)' }}>
                {activeCount}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter selects */}
        <div className="px-5 py-4 space-y-4">
          {[
            { key: 'owner' as const, label: 'Owner', placeholder: 'All Owners', options: owners },
            { key: 'status' as const, label: 'Status', placeholder: 'All Statuses', options: statuses },
            { key: 'category' as const, label: 'Category', placeholder: 'All Categories', options: categories },
            { key: 'quadrant' as const, label: 'Quadrant', placeholder: 'All Quadrants', options: quadrants },
          ].map(({ key, label, placeholder, options }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
              <select
                className={selectClass}
                style={{
                  border: `1px solid ${filters[key] ? 'var(--accent)' : 'var(--border)'}`,
                  background: filters[key] ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  color: filters[key] ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                value={filters[key]}
                onChange={e => update(key, e.target.value)}
              >
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          {activeCount > 0 && (
            <button
              onClick={() => { setFilters({ owner: '', status: '', category: '', quadrant: '' }); onClose(); }}
              className="flex-1 rounded-xl py-3.5 text-[14px] font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Clear All
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 rounded-xl py-3.5 text-[14px] font-semibold"
            style={{ background: 'var(--accent)', color: '#ffffff' }}>
            Apply
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
