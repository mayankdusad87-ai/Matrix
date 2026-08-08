import type { Task } from '../types';

interface Props {
  tasks: Task[];
}

const QUADRANT_CONFIG = {
  'Do Now':       { color: '#ef4444', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  )},
  'Schedule':     { color: '#3b82f6', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  )},
  'Delegate':     { color: '#f59e0b', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
  'Deprioritize': { color: '#9ca3af', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
  )},
} as const;

export default function Analytics({ tasks }: Props) {
  const total = tasks.length;
  if (total === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-quaternary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Add tasks to see analytics</p>
        </div>
      </div>
    );
  }

  const quadrantCounts: Record<string, number> = { 'Do Now': 0, 'Schedule': 0, 'Delegate': 0, 'Deprioritize': 0 };
  tasks.forEach(t => { quadrantCounts[t.quadrant] = (quadrantCounts[t.quadrant] || 0) + 1; });

  const statusCounts: Record<string, number> = {};
  tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const approachingUrgency = tasks
    .filter(t => t.quadrant === 'Schedule' && t.daysRemaining <= 14 && t.daysRemaining > 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const recentlyUrgent = tasks
    .filter(t => t.quadrant === 'Do Now' && t.daysRemaining >= 0 && t.daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdueTasks = tasks
    .filter(t => t.isOverdue && t.status !== 'Completed')
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const completed = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = Math.round((completed / total) * 100);

  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const avgProgress = activeTasks.length > 0
    ? Math.round(activeTasks.reduce((sum, t) => sum + (t.timelineProgress || 0), 0) / activeTasks.length) : 0;

  return (
    <div className="flex-1 overflow-auto p-5 md:p-8 scrollbar-thin">
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Analytics</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Completion Rate" value={`${completionRate}%`} sublabel={`${completed} of ${total} tasks`} accent="#10b981" />
          <SummaryCard label="Avg Timeline Used" value={`${avgProgress}%`} sublabel={`${activeTasks.length} active tasks`} accent="#3b82f6" />
          <SummaryCard label="Overdue" value={String(overdueTasks.length)} sublabel={overdueTasks.length > 0 ? 'Need attention' : 'All clear'} accent="#ef4444" />
          <SummaryCard label="Approaching Urgent" value={String(approachingUrgency.length)} sublabel="Will need action soon" accent="#f97316" />
        </div>

        {/* Quadrant distribution */}
        <div className="rounded-xl p-5 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Quadrant Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(QUADRANT_CONFIG).map(([quadrant, cfg]) => {
              const count = quadrantCounts[quadrant] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={quadrant} className="flex items-center gap-3">
                  <span className="w-5 shrink-0" style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span className="text-sm font-medium w-28 shrink-0" style={{ color: 'var(--text-secondary)' }}>{quadrant}</span>
                  <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 3)}%`, background: cfg.color }}
                    >
                      {pct >= 15 && <span className="text-white text-[10px] font-bold">{pct}%</span>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold w-16 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{count} tasks</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Approaching urgency */}
          <div className="rounded-xl p-5 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Approaching Urgency
            </h3>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-quaternary)' }}>Schedule tasks moving to Do Now within 7 days</p>
            {approachingUrgency.length === 0 ? (
              <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No tasks approaching urgency</p>
            ) : (
              <div className="space-y-1.5">
                {approachingUrgency.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: 'rgba(249,115,22,0.05)' }}>
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                    <span className="text-xs font-bold shrink-0 ml-2" style={{ color: '#f97316' }}>
                      {t.daysRemaining - 7}d to urgent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Now urgent */}
          <div className="rounded-xl p-5 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Now Urgent
            </h3>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-quaternary)' }}>Tasks that crossed into Do Now (≤ 7 days left)</p>
            {recentlyUrgent.length === 0 ? (
              <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No urgent tasks right now</p>
            ) : (
              <div className="space-y-1.5">
                {recentlyUrgent.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                    <span className="text-xs font-bold shrink-0 ml-2" style={{ color: '#ef4444' }}>
                      {t.daysRemaining === 0 ? 'Due today!' : `${t.daysRemaining}d left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="rounded-xl p-4 md:p-5" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#ef4444' }}>
              Overdue Tasks
            </h3>
            <div className="space-y-1.5">
              {overdueTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)' }}>
                  <div className="truncate">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>Due: {t.dueDate}</span>
                  </div>
                  <span className="text-xs font-bold shrink-0 ml-2" style={{ color: '#ef4444' }}>
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

function SummaryCard({ label, value, sublabel, accent }: { label: string; value: string; sublabel: string; accent: string }) {
  return (
    <div className="rounded-xl p-4 md:p-5" style={{ background: `${accent}08`, border: `1px solid ${accent}15`, boxShadow: `0 0 20px ${accent}10` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-3xl md:text-4xl font-bold tabular-nums mt-1.5" style={{ color: accent }}>{value}</p>
      <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{sublabel}</p>
    </div>
  );
}
