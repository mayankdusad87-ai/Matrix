import { useRef, useMemo } from 'react';
import type { Task } from '../types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onImportanceChange: (task: Task, newImportance: number) => void;
}

const TIMELINE_THRESHOLD = 70;

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

  const timelineDates = useMemo(() => {
    if (tasks.length === 0) return [];
    const allDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.dueDate)]);
    const min = new Date(Math.min(...allDates.map(d => d.getTime())));
    const max = new Date(Math.max(...allDates.map(d => d.getTime())));
    const range = max.getTime() - min.getTime();

    const pcts = [0, 25, 50, TIMELINE_THRESHOLD, 100];
    return pcts.map(pct => {
      const date = new Date(min.getTime() + (pct / 100) * range);
      const isToday = Math.abs(date.getTime() - Date.now()) < 86400000;
      return { pct, label: formatDate(date), isToday };
    });
  }, [tasks]);

  const impH = `${100 - median}%`;
  const impL = `${median}%`;
  const tlW = `${100 - TIMELINE_THRESHOLD}%`;
  const tlL = `${TIMELINE_THRESHOLD}%`;

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
          <div className="absolute top-0 right-0 bg-red-100/80 dark:bg-red-900/20 pointer-events-none" style={{ width: tlW, height: impH }} />
          <div className="absolute top-0 left-0 bg-blue-100/60 dark:bg-blue-900/15 pointer-events-none" style={{ width: tlL, height: impH }} />
          <div className="absolute bottom-0 right-0 bg-amber-100/60 dark:bg-amber-900/15 pointer-events-none" style={{ width: tlW, height: impL }} />
          <div className="absolute bottom-0 left-0 bg-gray-100/60 dark:bg-gray-800/20 pointer-events-none" style={{ width: tlL, height: impL }} />

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
          {timelineDates.map(({ pct }) => (
            <div
              key={`v-${pct}`}
              className={`absolute top-0 bottom-0 border-l ${
                pct === TIMELINE_THRESHOLD ? 'border-2 border-dashed border-indigo-400 dark:border-indigo-500 z-[5]' : 'border-gray-200 dark:border-gray-800'
              }`}
              style={{ left: `${pct}%` }}
            />
          ))}

          {/* Today marker */}
          {tasks.length > 0 && (() => {
            const allDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.dueDate)]);
            const min = Math.min(...allDates.map(d => d.getTime()));
            const max = Math.max(...allDates.map(d => d.getTime()));
            const range = max - min;
            if (range <= 0) return null;
            const todayPct = ((Date.now() - min) / range) * 100;
            if (todayPct < 0 || todayPct > 100) return null;
            return (
              <div
                className="absolute top-0 bottom-0 border-l-2 border-emerald-500 z-[6] pointer-events-none"
                style={{ left: `${todayPct}%` }}
              >
                <span className="absolute -top-0 left-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 px-1 rounded">
                  TODAY
                </span>
              </div>
            );
          })()}

          {/* Quadrant labels */}
          <div className="absolute inset-0 pointer-events-none select-none z-0">
            <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: tlW, height: impH }}>
              <span className="text-5xl font-black text-red-200 dark:text-red-800/50">DO NOW</span>
            </div>
            <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: tlL, height: impH }}>
              <span className="text-5xl font-black text-blue-200 dark:text-blue-800/50">SCHEDULE</span>
            </div>
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: tlW, height: impL }}>
              <span className="text-4xl font-black text-amber-200 dark:text-amber-800/50">DELEGATE</span>
            </div>
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: tlL, height: impL }}>
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

        {/* X-axis labels — actual dates */}
        <div className="flex justify-between pt-1 text-xs text-gray-400 dark:text-gray-500 px-1">
          {timelineDates.map(({ pct, label, isToday }) => (
            <span key={pct} className={isToday ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
              {label}
            </span>
          ))}
        </div>
        <div className="text-center text-[10px] text-gray-400 dark:text-gray-500">
          Timeline →
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
