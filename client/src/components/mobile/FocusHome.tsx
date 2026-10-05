import { useMemo } from 'react';
import type { Task, TaskStats } from '../../types';
import MobileFocusCard from './MobileFocusCard';

interface Props {
  allTasks: Task[];
  stats: TaskStats | null;
  onTaskClick: (task: Task) => void;
}

export default function FocusHome({ allTasks, stats, onTaskClick }: Props) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const focusTasks = useMemo(() => {
    return [...allTasks]
      .filter(t => t.status !== 'Completed')
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        const aDoNow = a.quadrant === 'Do Now' ? 1 : 0;
        const bDoNow = b.quadrant === 'Do Now' ? 1 : 0;
        if (aDoNow !== bDoNow) return bDoNow - aDoNow;
        return a.daysRemaining - b.daysRemaining;
      });
  }, [allTasks]);

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      {/* Greeting */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {greeting}
        </h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Here's what deserves your attention today.
        </p>
      </div>

      {/* Attention badges */}
      {stats && (stats.overdue > 0 || stats.dueThisWeek > 0 || stats.inProgress > 0) && (
        <div className="flex items-center gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
          {stats.overdue > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              {stats.overdue} overdue
            </span>
          )}
          {stats.dueThisWeek > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
              style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
              {stats.dueThisWeek} due this week
            </span>
          )}
          {stats.inProgress > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
              style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>
              {stats.inProgress} in progress
            </span>
          )}
          {stats.completed > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
              {stats.completed} completed
            </span>
          )}
        </div>
      )}

      {/* KPI mini cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 px-5 pb-4">
          <MiniKPI label="Overdue" value={stats.overdue} color="#ef4444" />
          <MiniKPI label="Due This Week" value={stats.dueThisWeek} color="#f59e0b" />
          <MiniKPI label="In Progress" value={stats.inProgress} color="#3b82f6" />
          <MiniKPI label="Total" value={stats.total} color="var(--text-secondary)" />
        </div>
      )}

      {/* Priority tasks */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Priority Tasks
          </h2>
          <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-inset)', color: 'var(--text-tertiary)' }}>
            {focusTasks.length}
          </span>
        </div>

        {focusTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.08)' }}>
              <svg className="w-7 h-7" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>All clear!</p>
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No urgent tasks right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {focusTasks.map(task => (
              <MobileFocusCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl px-3 py-3" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
