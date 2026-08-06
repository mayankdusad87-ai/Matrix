import type { TaskStats } from '../types';

const kpis: { key: keyof TaskStats; label: string; icon: JSX.Element; colorClass: string }[] = [
  {
    key: 'total', label: 'Total Tasks',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    colorClass: 'text-[var(--text-secondary)]',
  },
  {
    key: 'completed', label: 'Completed',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'inProgress', label: 'In Progress',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    colorClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'overdue', label: 'Overdue',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    colorClass: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'dueThisWeek', label: 'Due This Week',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    colorClass: 'text-amber-600 dark:text-amber-400',
  },
];

export default function Dashboard({ stats }: { stats: TaskStats | null }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-1 px-4 md:px-5 py-2.5 overflow-x-auto scrollbar-hide">
      {kpis.map(({ key, label, icon, colorClass }, i) => (
        <div key={key} className="flex items-center">
          {i > 0 && (
            <div className="w-px h-6 mx-2 md:mx-3 shrink-0" style={{ background: 'var(--border)' }} />
          )}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className={`shrink-0 ${colorClass} opacity-60`}>
              {icon}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg md:text-xl font-semibold tabular-nums leading-none ${colorClass}`}>
                {stats[key]}
              </span>
              <span className="text-[11px] font-medium hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
                {label}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
