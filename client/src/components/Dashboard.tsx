import type { TaskStats } from '../types';

const kpis: { key: keyof TaskStats; label: string; color: string }[] = [
  { key: 'total', label: 'Total', color: 'text-gray-900 dark:text-gray-100' },
  { key: 'completed', label: 'Done', color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'inProgress', label: 'Active', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'overdue', label: 'Overdue', color: 'text-red-600 dark:text-red-400' },
  { key: 'dueThisWeek', label: 'This Week', color: 'text-amber-600 dark:text-amber-400' },
];

export default function Dashboard({ stats }: { stats: TaskStats | null }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 md:gap-6 px-4 md:px-5 py-2 overflow-x-auto scrollbar-hide">
      {kpis.map(({ key, label, color }) => (
        <div key={key} className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className={`text-lg md:text-xl font-semibold tabular-nums leading-none ${color}`}>
            {stats[key]}
          </span>
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
