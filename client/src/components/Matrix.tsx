import { useRef, useMemo, useState, useEffect } from 'react';
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
  { key: 'Do Now', label: 'Do Now', icon: '🔥', accent: 'border-red-400 dark:border-red-500', dot: 'bg-red-500', textColor: 'text-red-700 dark:text-red-300' },
  { key: 'Schedule', label: 'Schedule', icon: '📅', accent: 'border-blue-400 dark:border-blue-500', dot: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-300' },
  { key: 'Delegate', label: 'Delegate', icon: '👋', accent: 'border-amber-400 dark:border-amber-500', dot: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-300' },
  { key: 'Deprioritize', label: 'Deprioritize', icon: '📋', accent: 'border-slate-400 dark:border-slate-500', dot: 'bg-slate-400', textColor: 'text-slate-600 dark:text-slate-400' },
] as const;

/* ── Mobile card for quadrant list ── */
function MobileTaskCard({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const urgencyColor = task.daysRemaining < 0
    ? 'text-red-600 dark:text-red-400'
    : task.daysRemaining <= 3
    ? 'text-orange-600 dark:text-orange-400'
    : task.daysRemaining <= 7
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400';

  const daysLabel = task.daysRemaining < 0
    ? `${Math.abs(task.daysRemaining)}d late`
    : task.daysRemaining === 0
    ? 'Today'
    : `${task.daysRemaining}d left`;

  const pct = task.timelineProgress ?? 0;
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : pct >= 40 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left rounded-xl bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/60 p-3 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
            {task.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {task.owner} · {task.category}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-bold ${urgencyColor}`}>{daysLabel}</span>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            Imp: {task.importanceScore}
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

export default function Matrix({ tasks, onTaskClick, onImportanceChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const tasksByQuadrant = useMemo(() => {
    const grouped: Record<string, Task[]> = { 'Do Now': [], 'Schedule': [], 'Delegate': [], 'Deprioritize': [] };
    tasks.forEach(t => {
      if (grouped[t.quadrant]) grouped[t.quadrant].push(t);
    });
    // Sort each quadrant by urgency
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.daysRemaining - b.daysRemaining));
    return grouped;
  }, [tasks]);

  /* ── Mobile: quadrant-grouped card list ── */
  if (isMobile) {
    return (
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Compact legend */}
        <div className="flex items-center justify-center gap-3 text-[11px] font-medium flex-wrap">
          {QUADRANT_META.map(q => (
            <span key={q.key} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${q.dot}`} />
              <span className="text-gray-500 dark:text-gray-400">{q.label}</span>
              <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts[q.key]})</span>
            </span>
          ))}
        </div>

        {QUADRANT_META.map(q => {
          const items = tasksByQuadrant[q.key] || [];
          if (items.length === 0) return null;
          return (
            <div key={q.key}>
              <div className={`flex items-center gap-2 mb-2 pl-1`}>
                <span className={`w-1.5 h-4 rounded-full ${q.dot}`} />
                <h3 className={`text-sm font-semibold ${q.textColor}`}>
                  {q.icon} {q.label}
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map(task => (
                  <MobileTaskCard key={task.id} task={task} onClick={onTaskClick} />
                ))}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">
            No tasks to display
          </div>
        )}
      </div>
    );
  }

  /* ── Desktop: positioned matrix grid ── */
  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
      {/* Legend bar */}
      <div className="flex items-center justify-center gap-4 text-[11px] font-medium">
        {QUADRANT_META.map(q => (
          <span key={q.key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${q.dot} inline-block`} />
            <span className="text-gray-600 dark:text-gray-400">{q.label}</span>
            <span className="text-gray-400 dark:text-gray-500 font-bold">({quadrantCounts[q.key]})</span>
          </span>
        ))}
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
              className="relative flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden
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

              {/* Median label */}
              <div className="absolute left-2 z-[6] pointer-events-none" style={{ bottom: `${median}%` }}>
                <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 bg-white/90 dark:bg-gray-900/90 px-1.5 py-0.5 rounded -translate-y-1/2 inline-block border border-indigo-200/60 dark:border-indigo-700/60">
                  Median: {median}
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

              {/* 7-day threshold label */}
              <div className="absolute bottom-2 z-[6] pointer-events-none" style={{ left: `${URGENCY_DIVIDER}%` }}>
                <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 bg-white/90 dark:bg-gray-900/90 px-1.5 py-0.5 rounded translate-x-1 inline-block border border-indigo-200/60 dark:border-indigo-700/60">
                  7 days
                </span>
              </div>

              {/* Quadrant watermark labels — very subtle */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: urgW, height: impH }}>
                  <span className="text-2xl font-extrabold tracking-wider text-red-200/30 dark:text-red-800/20 uppercase">Do Now</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: notUrgW, height: impH }}>
                  <span className="text-3xl font-extrabold tracking-wider text-blue-200/30 dark:text-blue-800/20 uppercase">Schedule</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: urgW, height: impL }}>
                  <span className="text-xl font-extrabold tracking-wider text-amber-200/30 dark:text-amber-800/20 uppercase">Delegate</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: notUrgW, height: impL }}>
                  <span className="text-xl font-extrabold tracking-wider text-gray-200/40 dark:text-gray-700/25 uppercase">Deprioritize</span>
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
