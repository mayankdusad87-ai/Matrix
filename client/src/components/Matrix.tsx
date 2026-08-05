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

const QUADRANT_META = [
  { key: 'Do Now', dot: 'bg-red-500' },
  { key: 'Schedule', dot: 'bg-blue-500' },
  { key: 'Delegate', dot: 'bg-amber-500' },
  { key: 'Deprioritize', dot: 'bg-slate-400' },
] as const;

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

  const quadrantCounts = useMemo(() => {
    const counts = { 'Do Now': 0, 'Schedule': 0, 'Delegate': 0, 'Deprioritize': 0, overdue: 0 };
    tasks.forEach(t => {
      if (t.isOverdue) counts.overdue++;
      if (t.quadrant in counts) counts[t.quadrant as keyof typeof counts]++;
    });
    return counts;
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-2 md:p-3 gap-1.5 md:gap-2">
      {/* Legend bar — wraps on mobile */}
      <div className="flex items-center justify-center gap-2 md:gap-4 text-[10px] md:text-[11px] font-medium flex-wrap">
        {QUADRANT_META.map(q => (
          <span key={q.key} className="flex items-center gap-1 md:gap-1.5">
            <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm ${q.dot} inline-block`} />
            <span className="text-gray-600 dark:text-gray-400">{q.key}</span>
            <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts[q.key]})</span>
          </span>
        ))}
        {quadrantCounts.overdue > 0 && (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <span className="text-xs">⚠️</span>
            <span className="font-bold">{quadrantCounts.overdue} overdue</span>
          </span>
        )}
      </div>

      <div className="flex-1 flex justify-center min-h-[300px] md:min-h-0">
        <div className="flex w-full max-w-6xl gap-0">
          {/* Y-axis labels — fewer on mobile */}
          <div className="flex flex-col justify-between py-1 pr-1 md:pr-2 text-[9px] md:text-[11px] font-medium text-gray-400 dark:text-gray-500 w-6 md:w-9 shrink-0">
            {[...yLabels].reverse().map(v => (
              <span key={v} className={`text-right leading-none ${v === median ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}`}>{v}</span>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {/* Matrix area */}
            <div
              ref={containerRef}
              className="relative flex-1 border border-gray-200 dark:border-gray-700 rounded-xl md:rounded-2xl overflow-hidden
                bg-white dark:bg-gray-900 shadow-sm"
            >
              {/* Quadrant backgrounds */}
              <div className="absolute top-0 right-0 pointer-events-none"
                style={{ width: urgW, height: impH, background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.10) 100%)' }} />
              <div className="absolute top-0 left-0 pointer-events-none"
                style={{ width: notUrgW, height: impH, background: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(59,130,246,0.08) 100%)' }} />
              <div className="absolute bottom-0 right-0 pointer-events-none"
                style={{ width: urgW, height: impL, background: 'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, rgba(245,158,11,0.08) 100%)' }} />
              <div className="absolute bottom-0 left-0 pointer-events-none"
                style={{ width: notUrgW, height: impL, background: 'linear-gradient(135deg, rgba(148,163,184,0.03) 0%, rgba(148,163,184,0.06) 100%)' }} />

              {/* Grid lines - horizontal */}
              {yLabels.map(v => (
                <div
                  key={`h-${v}`}
                  className={`absolute left-0 right-0 ${
                    v === median
                      ? 'border-t-[1.5px] border-dashed border-indigo-300/60 dark:border-indigo-600/50 z-[5]'
                      : 'border-t border-gray-100 dark:border-gray-800/50'
                  }`}
                  style={{ bottom: `${v}%` }}
                />
              ))}

              {/* Median label — compact on mobile */}
              <div className="absolute left-1 md:left-2 z-[6] pointer-events-none" style={{ bottom: `${median}%` }}>
                <span className="text-[8px] md:text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 bg-white/90 dark:bg-gray-900/90 px-1 md:px-1.5 py-0.5 rounded -translate-y-1/2 inline-block border border-indigo-200/60 dark:border-indigo-700/60">
                  <span className="hidden md:inline">Median: </span>{median}
                </span>
              </div>

              {/* Grid lines - vertical */}
              {xLabels.map(({ pct }) => (
                <div
                  key={`v-${pct}`}
                  className={`absolute top-0 bottom-0 ${
                    pct === URGENCY_DIVIDER
                      ? 'border-l-[1.5px] border-dashed border-indigo-300/60 dark:border-indigo-600/50 z-[5]'
                      : 'border-l border-gray-100 dark:border-gray-800/50'
                  }`}
                  style={{ left: `${pct}%` }}
                />
              ))}

              {/* 7-day threshold label — compact on mobile */}
              <div className="absolute bottom-1 md:bottom-2 z-[6] pointer-events-none" style={{ left: `${URGENCY_DIVIDER}%` }}>
                <span className="text-[8px] md:text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 bg-white/90 dark:bg-gray-900/90 px-1 md:px-1.5 py-0.5 rounded translate-x-0.5 md:translate-x-1 inline-block border border-indigo-200/60 dark:border-indigo-700/60">
                  7d
                </span>
              </div>

              {/* Quadrant watermark labels — smaller on mobile */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: urgW, height: impH }}>
                  <span className="text-sm md:text-2xl font-extrabold tracking-wider text-red-200/30 dark:text-red-800/20 uppercase">Do Now</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: notUrgW, height: impH }}>
                  <span className="text-base md:text-3xl font-extrabold tracking-wider text-blue-200/30 dark:text-blue-800/20 uppercase">Schedule</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: urgW, height: impL }}>
                  <span className="text-xs md:text-xl font-extrabold tracking-wider text-amber-200/30 dark:text-amber-800/20 uppercase">Delegate</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: notUrgW, height: impL }}>
                  <span className="text-xs md:text-xl font-extrabold tracking-wider text-gray-200/40 dark:text-gray-700/25 uppercase">Deprioritize</span>
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
            <div className="flex justify-between pt-1 md:pt-1.5 text-[9px] md:text-[11px] font-medium text-gray-400 dark:text-gray-500 px-0.5 md:px-1">
              {xLabels.map(({ pct, label }) => (
                <span key={pct} className={pct === URGENCY_DIVIDER ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}>
                  {label}
                </span>
              ))}
            </div>
            <div className="text-center text-[9px] md:text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide">
              Urgency →
            </div>
          </div>

          {/* Y-axis label */}
          <div className="flex items-center ml-0.5 md:ml-1.5">
            <span className="text-[9px] md:text-[11px] font-medium text-gray-400 dark:text-gray-500 [writing-mode:vertical-rl] rotate-180 tracking-wide">
              ← Imp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
