import { useState } from 'react';
import type { Filters as FiltersType, Task } from '../types';

interface Props {
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  tasks: Task[];
  onCreateClick: () => void;
}

export default function Filters({ filters, setFilters, tasks, onCreateClick }: Props) {
  const [open, setOpen] = useState(false);
  const owners = [...new Set(tasks.map(t => t.owner))].sort();
  const categories = [...new Set(tasks.map(t => t.category))].sort();
  const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
  const quadrants = ['Do Now', 'Schedule', 'Delegate', 'Deprioritize'];

  const update = (key: keyof FiltersType, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const activeCount = [filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length;

  const selectClass =
    'w-full rounded-lg text-[13px] px-2.5 py-[7px] font-medium focus:outline-none focus:ring-2 transition-colors duration-150';

  return (
    <div>
      <div className="flex items-center gap-2 px-4 md:px-5 py-2">
        {/* Mobile: filter toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex items-center gap-1.5 rounded-lg px-3 py-[6px] text-[13px] font-medium transition-colors duration-150"
          style={{
            border: `1px solid ${activeCount > 0 ? 'var(--accent)' : 'var(--border)'}`,
            background: activeCount > 0 ? 'var(--accent-subtle)' : 'var(--bg-surface)',
            color: activeCount > 0 ? 'var(--accent)' : 'var(--text-secondary)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none text-white" style={{ background: 'var(--accent)' }}>
              {activeCount}
            </span>
          )}
        </button>

        {/* Desktop: inline selects */}
        <div className="hidden md:flex items-center gap-2 flex-1">
          {[
            { key: 'owner' as const, placeholder: 'All Owners', options: owners },
            { key: 'status' as const, placeholder: 'All Statuses', options: statuses },
            { key: 'category' as const, placeholder: 'All Categories', options: categories },
            { key: 'quadrant' as const, placeholder: 'All Quadrants', options: quadrants },
          ].map(({ key, placeholder, options }) => (
            <select
              key={key}
              className={`${selectClass} !w-auto min-w-[120px]`}
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
          ))}
          {activeCount > 0 && (
            <button
              onClick={() => setFilters({ owner: '', status: '', category: '', quadrant: '' })}
              className="text-[12px] font-medium px-2 py-1 rounded-md transition-colors duration-150"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 md:hidden" />

        <button
          onClick={onCreateClick}
          className="rounded-lg text-white text-[13px] font-medium px-3.5 py-[6px] transition-all duration-150 hover:shadow-md active:scale-[0.97]"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 5v14m-7-7h14" />
            </svg>
            New Task
          </span>
        </button>
      </div>

      {/* Mobile expanded filters */}
      {open && (
        <div className="md:hidden grid grid-cols-2 gap-2 px-4 pb-3 animate-fade-in">
          {[
            { key: 'owner' as const, placeholder: 'All Owners', options: owners },
            { key: 'status' as const, placeholder: 'All Statuses', options: statuses },
            { key: 'category' as const, placeholder: 'All Categories', options: categories },
            { key: 'quadrant' as const, placeholder: 'All Quadrants', options: quadrants },
          ].map(({ key, placeholder, options }) => (
            <select
              key={key}
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
          ))}
          {activeCount > 0 && (
            <button
              onClick={() => { setFilters({ owner: '', status: '', category: '', quadrant: '' }); setOpen(false); }}
              className="col-span-2 text-[13px] font-medium py-1"
              style={{ color: 'var(--accent)' }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
