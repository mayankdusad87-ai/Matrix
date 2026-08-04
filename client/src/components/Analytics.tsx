import type { Task } from '../types';

interface Props {
  tasks: Task[];
}

const QUADRANT_CONFIG = {
  'Do Now':       { color: 'bg-red-500',    light: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-300',    icon: '🔥' },
  'Schedule':     { color: 'bg-blue-500',   light: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-300',   icon: '📅' },
  'Delegate':     { color: 'bg-amber-500',  light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: '👋' },
  'Deprioritize': { color: 'bg-gray-400',   light: 'bg-gray-100 dark:bg-gray-800/50',   text: 'text-gray-600 dark:text-gray-400',   icon: '📋' },
} as const;

export default function Analytics({ tasks }: Props) {
  const total = tasks.length;
  if (total === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-gray-400 dark:text-gray-500 text-lg">Add tasks to see analytics</p>
      </div>
    );
  }

  // Quadrant distribution
  const quadrantCounts: Record<string, number> = { 'Do Now': 0, 'Schedule': 0, 'Delegate': 0, 'Deprioritize': 0 };
  tasks.forEach(t => { quadrantCounts[t.quadrant] = (quadrantCounts[t.quadrant] || 0) + 1; });

  // Status distribution
  const statusCounts: Record<string, number> = {};
  tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  // Tasks approaching urgency (Schedule tasks that will become Do Now within 7 days)
  const approachingUrgency = tasks
    .filter(t => t.quadrant === 'Schedule' && t.daysRemaining <= 14 && t.daysRemaining > 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Tasks that recently became urgent (Do Now tasks with 0-7 days left, i.e. just crossed the threshold)
  const recentlyUrgent = tasks
    .filter(t => t.quadrant === 'Do Now' && t.daysRemaining >= 0 && t.daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Overdue tasks
  const overdueTasks = tasks
    .filter(t => t.isOverdue && t.status !== 'Completed')
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Average importance by quadrant
  const avgImportance: Record<string, number> = {};
  for (const q of Object.keys(quadrantCounts)) {
    const qTasks = tasks.filter(t => t.quadrant === q);
    avgImportance[q] = qTasks.length > 0
      ? Math.round(qTasks.reduce((sum, t) => sum + t.importanceScore, 0) / qTasks.length)
      : 0;
  }

  // Completion rate
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = Math.round((completed / total) * 100);

  // Timeline health: avg timeline progress for non-completed tasks
  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const avgProgress = activeTasks.length > 0
    ? Math.round(activeTasks.reduce((sum, t) => sum + (t.timelineProgress || 0), 0) / activeTasks.length)
    : 0;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">📊 Analytics Dashboard</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Completion Rate" value={`${completionRate}%`} sublabel={`${completed} of ${total} tasks`}
            color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" />
          <SummaryCard label="Avg Timeline Used" value={`${avgProgress}%`} sublabel={`${activeTasks.length} active tasks`}
            color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" />
          <SummaryCard label="Overdue" value={String(overdueTasks.length)} sublabel={overdueTasks.length > 0 ? 'Need attention!' : 'All clear'}
            color={overdueTasks.length > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'} />
          <SummaryCard label="Approaching Urgent" value={String(approachingUrgency.length)} sublabel="Will need action soon"
            color="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" />
        </div>

        {/* Quadrant distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Quadrant Distribution</h3>
          <div className="space-y-3">
            {Object.entries(QUADRANT_CONFIG).map(([quadrant, cfg]) => {
              const count = quadrantCounts[quadrant] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={quadrant} className="flex items-center gap-3">
                  <span className="text-lg w-6">{cfg.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-28">{quadrant}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${cfg.color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(pct, 2)}%` }}>
                      {pct >= 15 && <span className="text-white text-[10px] font-bold">{pct}%</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400 w-12 text-right">{count} tasks</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule → Do Now transitions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
              📅 → 🔥 Approaching Urgency
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Schedule tasks that will move to Do Now within 7 days</p>
            {approachingUrgency.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No tasks approaching urgency threshold</p>
            ) : (
              <div className="space-y-2">
                {approachingUrgency.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.title}</span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0 ml-2">
                      {t.daysRemaining - 7}d to urgent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently urgent */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
              🔥 Now Urgent
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Tasks that crossed into Do Now (≤ 7 days left)</p>
            {recentlyUrgent.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No urgent tasks right now</p>
            ) : (
              <div className="space-y-2">
                {recentlyUrgent.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.title}</span>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0 ml-2">
                      {t.daysRemaining === 0 ? 'Due today!' : `${t.daysRemaining}d left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-4 md:p-5">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3">
              ⚠️ Overdue Tasks
            </h3>
            <div className="space-y-2">
              {overdueTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="truncate">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.title}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">Due: {t.dueDate}</span>
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0 ml-2">
                    {Math.abs(t.daysRemaining)}d late
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Average importance per quadrant */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Average Importance by Quadrant</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(QUADRANT_CONFIG).map(([quadrant, cfg]) => (
              <div key={quadrant} className={`rounded-lg p-3 text-center ${cfg.light}`}>
                <span className="text-lg">{cfg.icon}</span>
                <p className={`text-2xl font-bold ${cfg.text}`}>{avgImportance[quadrant]}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">{quadrant}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sublabel, color }: { label: string; value: string; sublabel: string; color: string }) {
  return (
    <div className={`rounded-xl border p-3 md:p-4 ${color}`}>
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sublabel}</p>
    </div>
  );
}
