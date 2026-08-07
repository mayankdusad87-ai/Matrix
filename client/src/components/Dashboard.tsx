import type { TaskStats } from '../types';

const kpis: { key: keyof TaskStats; label: string; icon: JSX.Element; color: string }[] = [
  {
    key: 'total', label: 'Total Tasks',
    icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    color: 'var(--text-secondary)',
  },
  {
    key: 'completed', label: 'Completed',
    icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    color: '#22c55e',
  },
  {
    key: 'inProgress', label: 'In Progress',
    icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    color: '#3b82f6',
  },
  {
    key: 'overdue', label: 'Overdue',
    icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    color: '#ef4444',
  },
  {
    key: 'dueThisWeek', label: 'Due This Week',
    icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    color: '#f59e0b',
  },
];

export default function Dashboard({ stats }: { stats: TaskStats | null }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-0 px-5 md:px-6 py-3 overflow-x-auto scrollbar-hide">
      {kpis.map(({ key, label, icon, color }, i) => (
        <div key={key} className="flex items-center">
          {i > 0 && (
            <div className="w-px h-8 mx-4 md:mx-5 shrink-0" style={{ background: 'var(--border)' }} />
          )}
          <div className="flex items-center gap-3 whitespace-nowrap group">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
              style={{ background: `${color}12`, color }}
            >
              {icon}
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold tabular-nums leading-none block" style={{ color }}>
                {stats[key]}
              </span>
              <span className="text-[11px] font-medium mt-0.5 block" style={{ color: 'var(--text-tertiary)' }}>
                {label}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
