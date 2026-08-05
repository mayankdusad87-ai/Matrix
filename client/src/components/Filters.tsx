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
    'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-2.5 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400';

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Mobile: filter toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Desktop: inline selects */}
        <div className="hidden md:flex items-center gap-2 flex-1">
          <select className={`${selectClass} !w-auto min-w-[120px]`} value={filters.owner} onChange={e => update('owner', e.target.value)}>
            <option value="">All Owners</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className={`${selectClass} !w-auto min-w-[120px]`} value={filters.status} onChange={e => update('status', e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={`${selectClass} !w-auto min-w-[120px]`} value={filters.category} onChange={e => update('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={`${selectClass} !w-auto min-w-[120px]`} value={filters.quadrant} onChange={e => update('quadrant', e.target.value)}>
            <option value="">All Quadrants</option>
            {quadrants.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          {activeCount > 0 && (
            <button
              onClick={() => setFilters({ owner: '', status: '', category: '', quadrant: '' })}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 md:hidden" />

        <button
          onClick={onCreateClick}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 transition-colors shadow-sm"
        >
          + New Task
        </button>
      </div>

      {/* Mobile: expandable filter panel */}
      {open && (
        <div className="md:hidden grid grid-cols-2 gap-2 px-3 pb-3">
          <select className={selectClass} value={filters.owner} onChange={e => update('owner', e.target.value)}>
            <option value="">All Owners</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className={selectClass} value={filters.status} onChange={e => update('status', e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={selectClass} value={filters.category} onChange={e => update('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={selectClass} value={filters.quadrant} onChange={e => update('quadrant', e.target.value)}>
            <option value="">All Quadrants</option>
            {quadrants.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          {activeCount > 0 && (
            <button
              onClick={() => { setFilters({ owner: '', status: '', category: '', quadrant: '' }); setOpen(false); }}
              className="col-span-2 text-sm text-indigo-600 dark:text-indigo-400 py-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
