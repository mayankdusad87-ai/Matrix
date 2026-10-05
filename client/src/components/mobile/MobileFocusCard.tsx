import type { Task } from '../../types';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
}

const quadrantColors: Record<string, string> = {
  'Do Now': '#ef4444',
  'Schedule': '#3b82f6',
  'Delegate': '#f59e0b',
  'Deprioritize': '#9ca3af',
};

export default function MobileFocusCard({ task, onClick }: Props) {
  const color = quadrantColors[task.quadrant] || '#9ca3af';
  const progress = task.timelineProgress ?? 0;
  const progressColor = progress >= 90 ? '#ef4444' : progress >= 70 ? '#f97316' : progress >= 40 ? '#f59e0b' : '#10b981';

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left p-4 rounded-xl transition-all duration-150 active:scale-[0.98]"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: task.isOverdue ? '#ef4444' : color,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Quadrant badge */}
            {task.isOverdue ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white" style={{ background: '#ef4444' }}>
                OVERDUE
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold text-white uppercase" style={{ background: color }}>
                {task.quadrant}
              </span>
            )}

            {/* Days left */}
            {task.daysRemaining < 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                {Math.abs(task.daysRemaining)}d late
              </span>
            ) : task.daysRemaining === 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316' }}>
                Due today
              </span>
            ) : task.daysRemaining <= 7 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                {task.daysRemaining}d left
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                {task.daysRemaining}d left
              </span>
            )}

            {/* Status */}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: task.status === 'In Progress' ? 'rgba(59,130,246,0.08)' : 'var(--bg-inset)',
                color: task.status === 'In Progress' ? '#3b82f6' : 'var(--text-tertiary)',
              }}
            >
              {task.status}
            </span>
          </div>
        </div>

        {/* Right side: importance + progress */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            {task.importanceScore}
          </span>
          <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progressColor }} />
          </div>
        </div>
      </div>
    </button>
  );
}
