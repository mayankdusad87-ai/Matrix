import { useRef, useMemo } from 'react';
import type { Task } from '../types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onImportanceChange: (task: Task, newImportance: number) => void;
}

const URGENCY_DIVIDER = 70;

function computeOffsets(tasks: Task[]): Map<number, { dx: number; dy: number }> {
  const CELL = 10;
  const offsets = new Map<number, { dx: number; dy: number }>();
  const grid = new Map<string, number[]>();

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

  return (
    <div className="flex-1 flex justify-center px-3 py-1 min-h-0">
      <div className="flex w-full max-w-6xl gap-0">
      {/* Y-axis labels */}
      <div className="flex flex-col justify-between py-1 pr-2 text-xs text-gray-400 dark:text-gray-500 w-8 shrink-0">
        {[...yLabels].reverse().map(v => (
          <span key={v} className={`text-right leading-none ${v === median ? 'font-bold text-indigo-500' : ''}`}>{v}</span>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Matrix area */}
        <div
          ref={containerRef}
          className="relative flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
        >
          {/* Quadrant backgrounds */}
          <div className="absolute top-0 right-0 bg-red-100/80 dark:bg-red-900/20 pointer-events-none" style={{ width: urgW, height: impH }} />
          <div className="absolute top-0 left-0 bg-blue-100/60 dark:bg-blue-900/15 pointer-events-none" style={{ width: notUrgW, height: impH }} />
          <div className="absolute bottom-0 right-0 bg-amber-100/60 dark:bg-amber-900/15 pointer-events-none" style={{ width: urgW, height: impL }} />
          <div className="absolute bottom-0 left-0 bg-gray-100/60 dark:bg-gray-800/20 pointer-events-none" style={{ width: notUrgW, height: impL }} />

          {/* Grid lines - horizontal */}
          {yLabels.map(v => (
            <div
              key={`h-${v}`}
              className={`absolute left-0 right-0 border-t ${
                v === median ? 'border-2 border-dashed border-indigo-400 dark:border-indigo-500 z-[5]' : 'border-gray-200 dark:border-gray-800'
              }`}
              style={{ bottom: `${v}%` }}
            />
          ))}

          {/* Median label on divider */}
          <div className="absolute left-1 z-[6] pointer-events-none" style={{ bottom: `${median}%` }}>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 px-1 rounded -translate-y-1/2 inline-block">
              Median: {median}
            </span>
          </div>

          {/* Grid lines - vertical */}
          {xLabels.map(({ pct }) => (
            <div
              key={`v-${pct}`}
              className={`absolute top-0 bottom-0 border-l ${
                pct === URGENCY_DIVIDER ? 'border-2 border-dashed border-indigo-400 dark:border-indigo-500 z-[5]' : 'border-gray-200 dark:border-gray-800'
              }`}
              style={{ left: `${pct}%` }}
            />
          ))}

          {/* 7-day threshold label */}
          <div className="absolute bottom-1 z-[6] pointer-events-none" style={{ left: `${URGENCY_DIVIDER}%` }}>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 px-1 rounded translate-x-1 inline-block">
              7 days
            </span>
          </div>

          {/* Quadrant labels */}
          <div className="absolute inset-0 pointer-events-none select-none z-0">
            <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: urgW, height: impH }}>
              <span className="text-4xl font-black text-red-200 dark:text-red-800/50">DO NOW</span>
            </div>
            <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: notUrgW, height: impH }}>
              <span className="text-5xl font-black text-blue-200 dark:text-blue-800/50">SCHEDULE</span>
            </div>
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: urgW, height: impL }}>
              <span className="text-3xl font-black text-amber-200 dark:text-amber-800/50">DELEGATE</span>
            </div>
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: notUrgW, height: impL }}>
              <span className="text-3xl font-black text-gray-200 dark:text-gray-700/50">DEPRIORITIZE</span>
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
        <div className="flex justify-between pt-1 text-xs text-gray-400 dark:text-gray-500 px-1">
          {xLabels.map(({ pct, label }) => (
            <span key={pct} className={pct === URGENCY_DIVIDER ? 'font-bold text-indigo-500' : ''}>
              {label}
            </span>
          ))}
        </div>
        <div className="text-center text-[10px] text-gray-400 dark:text-gray-500">
          Urgency (days until due) →
        </div>
      </div>

      {/* Y-axis label */}
      <div className="flex items-center ml-1">
        <span className="text-xs text-gray-400 dark:text-gray-500 [writing-mode:vertical-rl] rotate-180">
          ← Importance
        </span>
      </div>
      </div>
    </div>
  );
}
