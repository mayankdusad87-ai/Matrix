import type { TaskStats } from '../types';

const kpis: { key: keyof TaskStats; label: string; accent: string; icon: string }[] = [
  { key: 'total', label: 'Total', accent: 'border-indigo-400 dark:border-indigo-500', icon: '📋' },
  { key: 'completed', label: 'Done', accent: 'border-emerald-400 dark:border-emerald-500', icon: '✓' },
  { key: 'inProgress', label: 'Active', accent: 'border-sky-400 dark:border-sky-500', icon: '⏳' },
  { key: 'overdue', label: 'Overdue', accent: 'border-red-400 dark:border-red-500', icon: '!' },
  { key: 'dueThisWeek', label: 'This Week', accent: 'border-amber-400 dark:border-amber-500', icon: '📅' },
];

export default function Dashboard({ stats }: { stats: TaskStats | null }) {
  if (!stats) return null;

  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
      {kpis.map(({ key, label, accent, icon }) => (
        <div
          key={key}
          className={`flex items-center gap-2 min-w-[90px] flex-1 rounded-lg border-l-[3px] ${accent}
            bg-white dark:bg-gray-800/60 px-2.5 py-1.5 shadow-sm`}
        >
          <span className="text-xs opacity-50 hidden sm:inline">{icon}</span>
          <div className="min-w-0">
            <div className="text-base font-semibold leading-tight text-gray-900 dark:text-gray-100 tabular-nums">
              {stats[key]}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
