import type { Task } from '../types';

interface Props {
  tasks: Task[];
}

function DonutChart({ segments, size = 140, stroke = 16 }: { segments: { label: string; value: number; color: string }[]; size?: number; stroke?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={(size - stroke) / 2} fill="none" stroke="var(--bg-inset)" strokeWidth={stroke} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize="24" fontWeight="700" fill="var(--text-quaternary)">—</text>
      </svg>
    );
  }
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-inset)" strokeWidth={stroke} />
      {segments.filter(s => s.value > 0).map((seg) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={seg.label}
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function DonutCard({ title, segments, centerLabel, centerValue }: {
  title: string;
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="rounded-xl p-5 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--text-tertiary)' }}>{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <DonutChart segments={segments} size={140} stroke={16} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>{centerValue}</span>
            <span className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>{centerLabel}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5 min-w-0">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
              <span className="ml-auto text-[13px] font-bold tabular-nums shrink-0" style={{ color: 'var(--text-primary)' }}>{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Analytics({ tasks }: Props) {
  const total = tasks.length;

  if (total === 0) {
    return (
      <div className="flex-1 overflow-auto p-5 md:p-8 scrollbar-thin">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-[22px] md:text-[26px] font-bold" style={{ color: 'var(--text-primary)' }}>Execution Overview</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Understand where your time and attention are going.
            </p>
          </div>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>No data yet</p>
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>Add tasks to see your execution overview.</p>
          </div>
        </div>
      </div>
    );
  }

  const quadrantCounts: Record<string, number> = { 'Do Now': 0, 'Schedule': 0, 'Delegate': 0, 'Deprioritize': 0 };
  tasks.forEach(t => { quadrantCounts[t.quadrant] = (quadrantCounts[t.quadrant] || 0) + 1; });

  const statusCounts: Record<string, number> = {};
  tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const completed = statusCounts['Completed'] || 0;
  const inProgress = statusCounts['In Progress'] || 0;
  const completionRate = Math.round((completed / total) * 100);

  const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'Completed').sort((a, b) => a.daysRemaining - b.daysRemaining);
  const approachingUrgency = tasks.filter(t => t.quadrant === 'Schedule' && t.daysRemaining <= 14 && t.daysRemaining > 7).sort((a, b) => a.daysRemaining - b.daysRemaining);
  const recentlyUrgent = tasks.filter(t => t.quadrant === 'Do Now' && t.daysRemaining >= 0 && t.daysRemaining <= 7).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const avgProgress = activeTasks.length > 0
    ? Math.round(activeTasks.reduce((sum, t) => sum + (t.timelineProgress || 0), 0) / activeTasks.length) : 0;

  const quadrantSegments = [
    { label: 'Do Now', value: quadrantCounts['Do Now'], color: '#ef4444' },
    { label: 'Schedule', value: quadrantCounts['Schedule'], color: '#3b82f6' },
    { label: 'Delegate', value: quadrantCounts['Delegate'], color: '#f59e0b' },
    { label: 'Deprioritize', value: quadrantCounts['Deprioritize'], color: '#9ca3af' },
  ];

  const statusSegments = [
    { label: 'Completed', value: completed, color: '#10b981' },
    { label: 'In Progress', value: inProgress, color: '#3b82f6' },
    { label: 'Not Started', value: statusCounts['Not Started'] || 0, color: '#9ca3af' },
    { label: 'On Hold', value: statusCounts['On Hold'] || 0, color: '#f59e0b' },
  ];

  return (
    <div className="flex-1 overflow-auto p-5 md:p-8 scrollbar-thin">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-[22px] md:text-[26px] font-bold" style={{ color: 'var(--text-primary)' }}>Execution Overview</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Understand where your time and attention are going.
          </p>
        </div>

        {/* Compact inline stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Completion', value: `${completionRate}%`, sub: `${completed} of ${total}`, color: '#10b981' },
            { label: 'Active', value: String(inProgress), sub: `${activeTasks.length} remaining`, color: '#3b82f6' },
            { label: 'Overdue', value: String(overdueTasks.length), sub: overdueTasks.length > 0 ? 'Need attention' : 'All clear', color: '#ef4444' },
            { label: 'Avg Progress', value: `${avgProgress}%`, sub: 'Timeline used', color: '#f59e0b' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}10` }}>
                <span className="text-[16px] font-bold tabular-nums" style={{ color }}>{value}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-quaternary)' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Donut charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DonutCard
            title="Priority Distribution"
            segments={quadrantSegments}
            centerValue={String(total)}
            centerLabel="total"
          />
          <DonutCard
            title="Status Breakdown"
            segments={statusSegments}
            centerValue={`${completionRate}%`}
            centerLabel="done"
          />
        </div>

        {/* Attention lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AttentionList
            title="Approaching Urgency"
            subtitle="Schedule tasks nearing Do Now"
            items={approachingUrgency}
            color="#f97316"
            renderRight={t => `${t.daysRemaining - 7}d to urgent`}
            empty="No tasks approaching urgency"
          />
          <AttentionList
            title="Now Urgent"
            subtitle="Do Now tasks with ≤ 7 days left"
            items={recentlyUrgent}
            color="#ef4444"
            renderRight={t => t.daysRemaining === 0 ? 'Due today!' : `${t.daysRemaining}d left`}
            empty="No urgent tasks right now"
          />
        </div>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#ef4444' }}>
              Overdue Tasks
            </h3>
            <div className="space-y-1.5">
              {overdueTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)' }}>
                  <div className="truncate">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                    <span className="text-[11px] ml-2" style={{ color: 'var(--text-tertiary)' }}>Due: {t.dueDate}</span>
                  </div>
                  <span className="text-[11px] font-bold shrink-0 ml-2" style={{ color: '#ef4444' }}>
                    {Math.abs(t.daysRemaining)}d late
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AttentionList({ title, subtitle, items, color, renderRight, empty }: {
  title: string; subtitle: string; items: Task[]; color: string;
  renderRight: (t: Task) => string; empty: string;
}) {
  return (
    <div className="rounded-xl p-5 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{title}</h3>
      <p className="text-[11px] mb-3" style={{ color: 'var(--text-quaternary)' }}>{subtitle}</p>
      {items.length === 0 ? (
        <p className="text-[13px] italic" style={{ color: 'var(--text-tertiary)' }}>{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: `${color}08` }}>
              <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
              <span className="text-[11px] font-bold shrink-0 ml-2" style={{ color }}>{renderRight(t)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
