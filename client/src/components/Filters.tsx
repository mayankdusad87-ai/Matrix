import type { Filters as FiltersType, Task } from '../types';

interface Props {
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  tasks: Task[];
  onCreateClick: () => void;
}

export default function Filters({ filters, setFilters, tasks, onCreateClick }: Props) {
  const owners = [...new Set(tasks.map(t => t.owner))].sort();
  const categories = [...new Set(tasks.map(t => t.category))].sort();
  const statuses = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
  const quadrants = ['Do', 'Schedule', 'Delegate', 'Delete'];

  const update = (key: keyof FiltersType, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectClass =
    'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
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

      {(filters.owner || filters.status || filters.category || filters.quadrant) && (
        <button
          onClick={() => setFilters({ owner: '', status: '', category: '', quadrant: '' })}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Clear filters
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={onCreateClick}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 transition-colors"
      >
        + New Task
      </button>
    </div>
  );
}
