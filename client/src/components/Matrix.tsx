import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import type { Task, MatrixSettings } from '../types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onImportanceChange: (task: Task, newImportance: number) => void;
  matrixSettings: MatrixSettings;
  onSettingsChange: (s: MatrixSettings) => void;
}

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

const Q = [
  { key: 'Do Now', dot: 'bg-red-500' },
  { key: 'Schedule', dot: 'bg-blue-500' },
  { key: 'Delegate', dot: 'bg-amber-500' },
  { key: 'Deprioritize', dot: 'bg-gray-400' },
] as const;

/* ── Settings gear dropdown ── */
function SettingsDropdown({
  settings,
  autoMedian,
  onChange,
}: {
  settings: MatrixSettings;
  autoMedian: number;
  onChange: (s: MatrixSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (deferred to avoid catching the opening click)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Defer so the current click event doesn't immediately close
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [open]);

  const isCustomMedian = settings.medianOverride !== null;
  const isCustomUrgency = settings.urgencyDays !== 7;
  const hasCustom = isCustomMedian || isCustomUrgency;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          open || hasCustom
            ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="Matrix settings"
      >
        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-[#1a1d26] rounded-xl shadow-xl border border-gray-200 dark:border-white/[0.08] z-50 overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Business Rules
            </h4>
          </div>

          {/* Importance Median */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-200">
                Importance threshold
              </label>
              <button
                onClick={() => onChange({ ...settings, medianOverride: isCustomMedian ? null : autoMedian })}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                  isCustomMedian
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
                }`}
              >
                {isCustomMedian ? 'Custom' : 'Auto'}
              </button>
            </div>
            {isCustomMedian ? (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={settings.medianOverride ?? autoMedian}
                  onChange={e => onChange({ ...settings, medianOverride: Number(e.target.value) })}
                  className="flex-1 accent-indigo-500 h-1.5"
                />
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums w-8 text-right">
                  {settings.medianOverride}
                </span>
              </div>
            ) : (
              <p className="text-[12px] text-gray-400 dark:text-gray-500">
                Auto-calculated median: <span className="font-semibold text-gray-600 dark:text-gray-300">{autoMedian}</span>
              </p>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Tasks above this line are &ldquo;high importance&rdquo;
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-white/[0.05]" />

          {/* Urgency Days */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-200">
                Urgency threshold
              </label>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 tabular-nums">
                {settings.urgencyDays}d
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={30}
                value={settings.urgencyDays}
                onChange={e => onChange({ ...settings, urgencyDays: Number(e.target.value) })}
                className="flex-1 accent-indigo-500 h-1.5"
              />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums w-8 text-right">
                {settings.urgencyDays}d
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Tasks due within {settings.urgencyDays} day{settings.urgencyDays !== 1 ? 's' : ''} move to the urgent zone
            </p>
          </div>

          {hasCustom && (
            <>
              <div className="border-t border-gray-100 dark:border-white/[0.05]" />
              <div className="px-4 py-2.5">
                <button
                  onClick={() => { onChange({ medianOverride: null, urgencyDays: 7 }); setOpen(false); }}
                  className="text-[12px] text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Reset to defaults
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Matrix({ tasks, onTaskClick, onImportanceChange, matrixSettings, onSettingsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const urgencyDays = matrixSettings.urgencyDays;
  const URGENCY_DIVIDER = 70; // visual position of the urgency line (always at 70% of the x-axis)

  const autoMedian = useMemo(() => {
    if (tasks.length > 0 && tasks[0].autoMedian !== undefined) return tasks[0].autoMedian;
    return tasks.length > 0 ? tasks[0].median : 50;
  }, [tasks]);

  const median = matrixSettings.medianOverride ?? (tasks.length > 0 ? tasks[0].median : 50);

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
    return Math.max(...tasks.map(t => t.daysRemaining), urgencyDays);
  }, [tasks, urgencyDays]);

  const xLabels = useMemo(() => {
    const midDays = Math.round((maxDaysLeft + urgencyDays) / 2);
    return [
      { pct: 0, label: `${maxDaysLeft}d` },
      { pct: Math.round((1 - (midDays - urgencyDays) / Math.max(maxDaysLeft - urgencyDays, 1)) * 70), label: `${midDays}d` },
      { pct: URGENCY_DIVIDER, label: `${urgencyDays}d` },
      { pct: 85, label: `${Math.max(1, Math.round(urgencyDays * 0.4))}d` },
      { pct: 100, label: 'Due' },
    ];
  }, [maxDaysLeft, urgencyDays, URGENCY_DIVIDER]);

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

  // On mobile, collapse overflow on touch
  const [containerH, setContainerH] = useState(600);
  const measureContainer = useCallback(() => {
    if (containerRef.current) setContainerH(containerRef.current.clientHeight);
  }, []);
  useEffect(() => {
    measureContainer();
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);
  }, [measureContainer]);

  /* ── Draggable median line ── */
  const [draggingMedian, setDraggingMedian] = useState(false);
  const [hoveringMedian, setHoveringMedian] = useState(false);

  const handleMedianDrag = useCallback((clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.round(Math.max(5, Math.min(95, (1 - (clientY - rect.top) / rect.height) * 100)));
    onSettingsChange({ ...matrixSettings, medianOverride: pct });
  }, [matrixSettings, onSettingsChange]);

  useEffect(() => {
    if (!draggingMedian) return;
    const onMove = (e: MouseEvent) => { e.preventDefault(); handleMedianDrag(e.clientY); };
    const onTouchMove = (e: TouchEvent) => { handleMedianDrag(e.touches[0].clientY); };
    const onUp = () => { setDraggingMedian(false); setHoveringMedian(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [draggingMedian, handleMedianDrag]);

  return (
    <div className="flex-1 flex flex-col min-h-0 px-2 md:px-3 pb-2 md:pb-3 gap-1 md:gap-2">
      {/* ── Legend + settings ── */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 md:gap-3.5 text-[10px] md:text-[11px] font-medium flex-wrap flex-1 min-w-0">
          {Q.map(q => (
            <span key={q.key} className="flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
              <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-[3px] ${q.dot} inline-block shrink-0`} />
              <span className="text-gray-500 dark:text-gray-400">{q.key}</span>
              <span className="text-gray-300 dark:text-gray-600 font-bold tabular-nums">{quadrantCounts[q.key]}</span>
            </span>
          ))}
          {quadrantCounts.overdue > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="text-xs">⚠</span>
              <span className="font-semibold">{quadrantCounts.overdue} overdue</span>
            </span>
          )}
        </div>
        <SettingsDropdown settings={matrixSettings} autoMedian={autoMedian} onChange={onSettingsChange} />
      </div>

      {/* ── Matrix grid ── */}
      <div className="flex-1 flex justify-center min-h-[280px] md:min-h-0">
        <div className="flex w-full max-w-6xl gap-0">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between py-1 pr-1 md:pr-2 text-[9px] md:text-[11px] font-medium text-gray-300 dark:text-gray-600 w-6 md:w-9 shrink-0 tabular-nums">
            {[...yLabels].reverse().map(v => (
              <span key={v} className={`text-right leading-none ${v === median ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}`}>{v}</span>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div
              ref={containerRef}
              className="relative flex-1 border border-gray-200/80 dark:border-white/[0.06] rounded-xl md:rounded-2xl overflow-hidden
                bg-white dark:bg-[#111318] shadow-sm"
            >
              {/* Quadrant fills */}
              <div className="absolute top-0 right-0 pointer-events-none"
                style={{ width: urgW, height: impH, background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(239,68,68,0.08) 100%)' }} />
              <div className="absolute top-0 left-0 pointer-events-none"
                style={{ width: notUrgW, height: impH, background: 'linear-gradient(135deg, rgba(59,130,246,0.03) 0%, rgba(59,130,246,0.06) 100%)' }} />
              <div className="absolute bottom-0 right-0 pointer-events-none"
                style={{ width: urgW, height: impL, background: 'linear-gradient(135deg, rgba(245,158,11,0.03) 0%, rgba(245,158,11,0.06) 100%)' }} />
              <div className="absolute bottom-0 left-0 pointer-events-none"
                style={{ width: notUrgW, height: impL, background: 'linear-gradient(135deg, rgba(148,163,184,0.02) 0%, rgba(148,163,184,0.04) 100%)' }} />

              {/* Horizontal grid */}
              {yLabels.map(v => (
                v !== median ? (
                  <div
                    key={`h-${v}`}
                    className="absolute left-0 right-0 border-t border-gray-100 dark:border-white/[0.03]"
                    style={{ bottom: `${v}%` }}
                  />
                ) : null
              ))}

              {/* Draggable median line */}
              <div
                className={`absolute left-0 right-0 z-[8] group select-none ${draggingMedian ? 'cursor-grabbing' : 'cursor-ns-resize'}`}
                style={{ bottom: `${median}%` }}
                onMouseDown={e => { e.preventDefault(); setDraggingMedian(true); }}
                onTouchStart={() => setDraggingMedian(true)}
                onMouseEnter={() => setHoveringMedian(true)}
                onMouseLeave={() => { if (!draggingMedian) setHoveringMedian(false); }}
              >
                {/* Hit area — tall invisible strip for easy grabbing */}
                <div className="absolute left-0 right-0 -top-3 h-6 md:-top-4 md:h-8" />
                {/* Visible line */}
                <div className={`absolute left-0 right-0 top-0 border-t-[1.5px] border-dashed transition-colors ${
                  draggingMedian || hoveringMedian
                    ? 'border-indigo-500 dark:border-indigo-400'
                    : 'border-indigo-400/40 dark:border-indigo-500/30'
                }`} />
              </div>

              {/* Median label */}
              <div
                className={`absolute left-1 md:left-2.5 z-[9] select-none ${draggingMedian ? 'cursor-grabbing pointer-events-none' : 'cursor-ns-resize'}`}
                style={{ bottom: `${median}%` }}
                onMouseDown={e => { e.preventDefault(); setDraggingMedian(true); }}
                onTouchStart={() => setDraggingMedian(true)}
              >
                <span className={`text-[8px] md:text-[10px] font-semibold px-1 md:px-1.5 py-0.5 rounded-[4px] -translate-y-1/2 inline-flex items-center gap-0.5 border transition-colors ${
                  draggingMedian || hoveringMedian
                    ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 shadow-sm'
                    : 'text-indigo-500 dark:text-indigo-400 bg-white/95 dark:bg-[#111318]/95 border-indigo-200/50 dark:border-indigo-700/40'
                }`}>
                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M7 8l5-4 5 4M7 16l5 4 5-4" />
                  </svg>
                  <span className="hidden md:inline">Median: </span>{median}
                </span>
              </div>

              {/* Vertical grid */}
              {xLabels.map(({ pct }) => (
                <div
                  key={`v-${pct}`}
                  className={`absolute top-0 bottom-0 ${
                    pct === URGENCY_DIVIDER
                      ? 'border-l-[1.5px] border-dashed border-indigo-400/40 dark:border-indigo-500/30 z-[5]'
                      : 'border-l border-gray-100 dark:border-white/[0.03]'
                  }`}
                  style={{ left: `${pct}%` }}
                />
              ))}

              {/* Urgency label */}
              <div className="absolute bottom-1 md:bottom-2.5 z-[6] pointer-events-none" style={{ left: `${URGENCY_DIVIDER}%` }}>
                <span className="text-[8px] md:text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 bg-white/95 dark:bg-[#111318]/95 px-1 md:px-1.5 py-0.5 rounded-[4px] translate-x-0.5 md:translate-x-1 inline-block border border-indigo-200/50 dark:border-indigo-700/40">
                  {urgencyDays}d
                </span>
              </div>

              {/* Quadrant watermarks */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: urgW, height: impH }}>
                  <span className="text-sm md:text-2xl font-black tracking-wider text-red-200/25 dark:text-red-800/15 uppercase">Do Now</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: notUrgW, height: impH }}>
                  <span className="text-base md:text-3xl font-black tracking-wider text-blue-200/25 dark:text-blue-800/15 uppercase">Schedule</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: urgW, height: impL }}>
                  <span className="text-xs md:text-xl font-black tracking-wider text-amber-200/25 dark:text-amber-800/15 uppercase">Delegate</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: notUrgW, height: impL }}>
                  <span className="text-xs md:text-xl font-black tracking-wider text-gray-200/30 dark:text-gray-700/20 uppercase">Deprioritize</span>
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
                    containerHeight={containerH}
                    offsetX={offset.dx}
                    offsetY={offset.dy}
                  />
                );
              })}
            </div>

            {/* X-axis */}
            <div className="flex justify-between pt-1 md:pt-1.5 text-[9px] md:text-[11px] font-medium text-gray-300 dark:text-gray-600 px-0.5 md:px-1 tabular-nums">
              {xLabels.map(({ pct, label }) => (
                <span key={pct} className={pct === URGENCY_DIVIDER ? 'font-bold text-indigo-500 dark:text-indigo-400' : ''}>
                  {label}
                </span>
              ))}
            </div>
            <div className="text-center text-[9px] md:text-[11px] font-medium text-gray-300 dark:text-gray-600 tracking-wide">
              Urgency →
            </div>
          </div>

          {/* Y-axis label */}
          <div className="flex items-center ml-0.5 md:ml-1.5">
            <span className="text-[9px] md:text-[11px] font-medium text-gray-300 dark:text-gray-600 [writing-mode:vertical-rl] rotate-180 tracking-wide">
              ← Importance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
