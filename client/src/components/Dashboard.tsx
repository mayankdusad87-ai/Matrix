import type { TaskStats } from '../types';

const kpis: { key: keyof TaskStats; label: string; color: string; darkColor: string }[] = [
  { key: 'total', label: 'Total Tasks', color: 'bg-indigo-100 text-indigo-800', darkColor: 'dark:bg-indigo-900/40 dark:text-indigo-300' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', darkColor: 'dark:bg-green-900/40 dark:text-green-300' },
  { key: 'inProgress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', darkColor: 'dark:bg-yellow-900/40 dark:text-yellow-300' },
  { key: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800', darkColor: 'dark:bg-red-900/40 dark:text-red-300' },
  { key: 'dueThisWeek', label: 'Due This Week', color: 'bg-orange-100 text-orange-800', darkColor: 'dark:bg-orange-900/40 dark:text-orange-300' },
];

export default function Dashboard({ stats }: { stats: TaskStats | null }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-5 gap-2 px-3 py-2">
      {kpis.map(({ key, label, color, darkColor }) => (
        <div key={key} className={`rounded-lg px-2 py-1.5 text-center ${color} ${darkColor}`}>
          <div className="text-lg font-bold leading-tight">{stats[key]}</div>
          <div className="text-[10px] font-medium opacity-80">{label}</div>
        </div>
      ))}
    </div>
  );
}
