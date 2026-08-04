import { useRef, useMemo } from 'react';
import type { Task } from '../types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onImportanceChange: (task: Task, newImportance: number) => void;
}

const URGENCY_DIVIDER = 70;

function computeOffsets(tasks: Task[]): Map<string, { dx: number; dy: number }> {
  const CELL = 10;
  const offsets = new Map<string, { dx: number; dy: number }>();
  const grid = new Map<string, string[]>();

  for (const t of tasks) {
    const cx = Math.round(t.x / CELL);
    const cy = Math.round(t.y / CELL);
    const key = `${cx},${cy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(t.id);
  }

  for (const ids of grid.values()) {
    if (ids.length <= 1) {
      offsets.set(ids[0], { dx: 0, dy: 0 });
      continue;
    }
    ids.forEach((id, i) => {
      const angle = (i / ids.length) * 2 * Math.PI;
      const radius = 3 + ids.length * 1.5;
      offsets.set(id, {
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius,
      });
    });
  }

  return offsets;
}

export default function Matrix({ tasks, onTaskClick, onImportanceChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const median = tasks.length > 0 ? tasks[0].median : 50;

  const yLabels = useMemo(() => {
    const base = [0, 20, 40, 60, 80, 100];
    if (!base.includes(median)) {
      base.push(median);
      base.sort((a, b) => a - b);
    }
    return base;
  }, [median]);

  const offsets = useMemo(() => computeOffsets(tasks), [tasks]);

  const maxDaysLeft = useMemo(() => {
    if (tasks.length === 0) return 30;
    return Math.max(...tasks.map(t => t.daysRemaining), 7);
  }, [tasks]);

  const xLabels = useMemo(() => {
    const midDays = Math.round((maxDaysLeft + 7) / 2);
    return [
      { pct: 0, label: `${maxDaysLeft}d` },
      { pct: Math.round((1 - (midDays - 7) / Math.max(maxDaysLeft - 7, 1)) * 70), label: `${midDays}d` },
      { pct: URGENCY_DIVIDER, label: '7d' },
      { pct: 85, label: '3d' },
      { pct: 100, label: 'Due' },
    ];
  }, [maxDaysLeft]);

  const impH = `${100 - median}%`;
  const impL = `${median}%`;
  const urgW = `${100 - URGENCY_DIVIDER}%`;
  const notUrgW = `${URGENCY_DIVIDER}%`;

  // Quadrant task counts
  const quadrantCounts = useMemo(() => {
    const counts = { 'Do Now': 0, 'Schedule': 0, 'Delegate': 0, 'Deprioritize': 0, overdue: 0 };
    tasks.forEach(t => {
      if (t.isOverdue) counts.overdue++;
      if (t.quadrant in counts) counts[t.quadrant as keyof typeof counts]++;
    });
    return counts;
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
      {/* Legend bar */}
      <div className="flex items-center justify-center gap-4 text-[11px] font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">Do Now</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts['Do Now']})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">Schedule</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts['Schedule']})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">Delegate</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts['Delegate']})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
          <span className="text-gray-600 dark:text-gray-400">Deprioritize</span>
          <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts['Deprioritize']})</span>
        </span>
        {quadrantCounts.overdue > 0 && (
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="text-sm">⚠️</span>
            <span className="font-bold">{quadrantCounts.overdue} overdue</span>
          </span>
        )}
      </div>

      <div className="flex-1 flex justify-center min-h-0">
        <div className="flex w-full max-w-6xl gap-0">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between py-1 pr-2 text-[11px] font-medium text-gray-400 dark:text-gray-500 w-9 shrink-0">
            {[...yLabels].reverse().map(v => (
              <span key={v} className={`text-right leading-none ${v === median ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}`}>{v}</span>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {/* Matrix area */}
            <div
              ref={containerRef}
              className="relative flex-1 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden
                bg-white dark:bg-gray-900 shadow-inner"
            >
              {/* Quadrant backgrounds — refined gradients */}
              <div className="absolute top-0 right-0 pointer-events-none"
                style={{ width: urgW, height: impH, background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.15) 100%)' }} />
              <div className="absolute top-0 left-0 pointer-events-none"
                style={{ width: notUrgW, height: impH, background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.12) 100%)' }} />
              <div className="absolute bottom-0 right-0 pointer-events-none"
                style={{ width: urgW, height: impL, background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.12) 100%)' }} />
              <div className="absolute bottom-0 left-0 pointer-events-none"
                style={{ width: notUrgW, height: impL, background: 'linear-gradient(135deg, rgba(148,163,184,0.04) 0%, rgba(148,163,184,0.08) 100%)' }} />

              {/* Grid lines - horizontal */}
              {yLabels.map(v => (
                <div
                  key={`h-${v}`}
                  className={`absolute left-0 right-0 ${
                    v === median
                      ? 'border-t-2 border-dashed border-indigo-400/70 dark:border-indigo-500/70 z-[5]'
                      : 'border-t border-gray-100 dark:border-gray-800/60'
                  }`}
                  style={{ bottom: `${v}%` }}
                />
              ))}

              {/* Median label on divider */}
              <div className="absolute left-2 z-[6] pointer-events-none" style={{ bottom: `${median}%` }}>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded-md -translate-y-1/2 inline-block border border-indigo-200 dark:border-indigo-800">
                  Median: {median}
                </span>
              </div>

              {/* Grid lines - vertical */}
              {xLabels.map(({ pct }) => (
                <div
                  key={`v-${pct}`}
                  className={`absolute top-0 bottom-0 ${
                    pct === URGENCY_DIVIDER
                      ? 'border-l-2 border-dashed border-indigo-400/70 dark:border-indigo-500/70 z-[5]'
                      : 'border-l border-gray-100 dark:border-gray-800/60'
                  }`}
                  style={{ left: `${pct}%` }}
                />
              ))}

              {/* 7-day threshold label */}
              <div className="absolute bottom-2 z-[6] pointer-events-none" style={{ left: `${URGENCY_DIVIDER}%` }}>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded-md translate-x-1 inline-block border border-indigo-200 dark:border-indigo-800">
                  7 days
                </span>
              </div>

              {/* Quadrant watermark labels */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: urgW, height: impH }}>
                  <span className="text-3xl font-black tracking-wider text-red-300/40 dark:text-red-700/30">DO NOW</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: notUrgW, height: impH }}>
                  <span className="text-4xl font-black tracking-wider text-blue-200/50 dark:text-blue-800/30">SCHEDULE</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: urgW, height: impL }}>
                  <span className="text-2xl font-black tracking-wider text-amber-200/50 dark:text-amber-800/30">DELEGATE</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: notUrgW, height: impL }}>
                  <span className="text-2xl font-black tracking-wider text-gray-200/60 dark:text-gray-700/30">DEPRIORITIZE</span>
                </div>
              </div>

              {/* Task cards */}
              {tasks.map(task => {
                const offset = offsets.get(task.id) || { dx: 0, dy: 0 };
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    onDragEnd={onImportanceChange}
                    containerHeight={containerRef.current?.clientHeight || 600}
                    offsetX={offset.dx}
                    offsetY={offset.dy}
                  />
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between pt-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 px-1">
              {xLabels.map(({ pct, label }) => (
                <span key={pct} className={pct === URGENCY_DIVIDER ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}>
                  {label}
                </span>
              ))}
            </div>
            <div className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
              Urgency (days until due) →
            </div>
          </div>

          {/* Y-axis label */}
          <div className="flex items-center ml-1.5">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 [writing-mode:vertical-rl] rotate-180 tracking-wide">
              ← Importance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
