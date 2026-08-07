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
  { key: 'Do Now', color: '#ef4444', darkColor: '#f87171' },
  { key: 'Schedule', color: '#3b82f6', darkColor: '#60a5fa' },
  { key: 'Delegate', color: '#f59e0b', darkColor: '#fbbf24' },
  { key: 'Deprioritize', color: '#6b7280', darkColor: '#525252' },
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
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
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
        style={{
          background: open || hasCustom ? 'var(--accent-subtle)' : 'transparent',
          color: open || hasCustom ? 'var(--accent)' : 'var(--text-tertiary)',
        }}
        onMouseEnter={e => { if (!open && !hasCustom) e.currentTarget.style.background = 'var(--bg-inset)'; }}
        onMouseLeave={e => { if (!open && !hasCustom) e.currentTarget.style.background = 'transparent'; }}
        title="Matrix settings"
      >
        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[280px] rounded-xl z-50 overflow-hidden animate-fade-in"
          style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
        >
          <div className="px-4 pt-3 pb-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Business Rules
            </h4>
          </div>

          {/* Importance Median */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                Importance threshold
              </label>
              <button
                onClick={() => onChange({ ...settings, medianOverride: isCustomMedian ? null : autoMedian })}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-150"
                style={{
                  background: isCustomMedian ? 'var(--accent-subtle)' : 'var(--bg-inset)',
                  color: isCustomMedian ? 'var(--accent)' : 'var(--text-tertiary)',
                }}
              >
                {isCustomMedian ? 'Custom' : 'Auto'}
              </button>
            </div>
            {isCustomMedian ? (
              <div className="flex items-center gap-3">
                <input type="range" min={10} max={90}
                  value={settings.medianOverride ?? autoMedian}
                  onChange={e => onChange({ ...settings, medianOverride: Number(e.target.value) })}
                  className="flex-1 h-1.5" />
                <span className="text-sm font-semibold tabular-nums w-8 text-right" style={{ color: 'var(--accent)' }}>
                  {settings.medianOverride}
                </span>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                Auto-calculated median: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{autoMedian}</span>
              </p>
            )}
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Drag the horizontal line on the matrix to adjust
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

          {/* Urgency Days */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                Urgency threshold
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums" style={{ background: 'var(--bg-inset)', color: 'var(--text-tertiary)' }}>
                {settings.urgencyDays}d
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={30}
                value={settings.urgencyDays}
                onChange={e => onChange({ ...settings, urgencyDays: Number(e.target.value) })}
                className="flex-1 h-1.5" />
              <span className="text-sm font-semibold tabular-nums w-8 text-right" style={{ color: 'var(--accent)' }}>
                {settings.urgencyDays}d
              </span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Drag the vertical line on the matrix to adjust
            </p>
          </div>

          {hasCustom && (
            <>
              <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
              <div className="px-4 py-2.5">
                <button
                  onClick={() => { onChange({ medianOverride: null, urgencyDays: 7 }); setOpen(false); }}
                  className="text-[12px] font-medium transition-colors duration-150"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
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
  const URGENCY_DIVIDER = 70;

  const autoMedian = useMemo(() => {
    if (tasks.length > 0 && tasks[0].autoMedian !== undefined) return tasks[0].autoMedian;
    return tasks.length > 0 ? tasks[0].median : 50;
  }, [tasks]);

  const median = matrixSettings.medianOverride ?? (tasks.length > 0 ? tasks[0].median : 50);

  const yLabels = useMemo(() => {
    const base = [0, 25, 50, 75, 100];
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

  const [containerH, setContainerH] = useState(600);
  const measureContainer = useCallback(() => {
    if (containerRef.current) setContainerH(containerRef.current.clientHeight);
  }, []);
  useEffect(() => {
    measureContainer();
    window.addEventListener('resize', measureContainer);
    return () => window.removeEventListener('resize', measureContainer);
  }, [measureContainer]);

  /* ── Draggable median line (Y-axis) ── */
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

  /* ── Draggable urgency line (X-axis) ── */
  const [draggingUrgency, setDraggingUrgency] = useState(false);
  const [hoveringUrgency, setHoveringUrgency] = useState(false);

  const handleUrgencyDrag = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Map pixel position to urgency days (1-30)
    // The urgency line is at 70% of the grid width visually
    // So we map the entire width to days: left = maxDays, right = 0
    const xPct = (clientX - rect.left) / rect.width;
    // Convert x position to days: further right = fewer days (more urgent)
    const days = Math.round(Math.max(1, Math.min(30, maxDaysLeft * (1 - xPct))));
    onSettingsChange({ ...matrixSettings, urgencyDays: days });
  }, [matrixSettings, onSettingsChange, maxDaysLeft]);

  useEffect(() => {
    if (!draggingUrgency) return;
    const onMove = (e: MouseEvent) => { e.preventDefault(); handleUrgencyDrag(e.clientX); };
    const onTouchMove = (e: TouchEvent) => { handleUrgencyDrag(e.touches[0].clientX); };
    const onUp = () => { setDraggingUrgency(false); setHoveringUrgency(false); };
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
  }, [draggingUrgency, handleUrgencyDrag]);

  const isDark = document.documentElement.classList.contains('dark');
  const medianActive = draggingMedian || hoveringMedian;
  const urgencyActive = draggingUrgency || hoveringUrgency;

  return (
    <div className="flex-1 flex flex-col min-h-0 px-3 md:px-5 pb-3 md:pb-5 gap-2 md:gap-3">
      {/* ── Legend + settings ── */}
      <div className="flex items-center justify-between gap-2 pt-3">
        <div className="flex items-center gap-3 md:gap-5 text-[10px] md:text-[11px] font-medium flex-wrap flex-1 min-w-0">
          {Q.map(q => (
            <span key={q.key} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-sm inline-block shrink-0" style={{ background: isDark ? q.darkColor : q.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{q.key}</span>
              <span className="font-bold tabular-nums" style={{ color: 'var(--text-quaternary)' }}>{quadrantCounts[q.key]}</span>
            </span>
          ))}
          {quadrantCounts.overdue > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {quadrantCounts.overdue} overdue
            </span>
          )}
        </div>
        <SettingsDropdown settings={matrixSettings} autoMedian={autoMedian} onChange={onSettingsChange} />
      </div>

      {/* ── Matrix grid ── */}
      <div className="flex-1 flex justify-center min-h-[280px] md:min-h-0">
        <div className="flex w-full max-w-7xl gap-0">

          {/* Y-axis: label + tick marks */}
          <div className="flex flex-col shrink-0 pr-1 md:pr-2">
            {/* Axis title — prominent */}
            <div className="flex items-center justify-center mb-1">
              <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-secondary)' }}>
                Importance
              </span>
            </div>
            {/* Tick marks */}
            <div className="flex-1 flex flex-col justify-between py-1 text-[9px] md:text-[11px] font-medium w-7 md:w-10 tabular-nums" style={{ color: 'var(--text-quaternary)' }}>
              {[...yLabels].reverse().map(v => (
                <span key={v} className={`text-right leading-none ${v === median ? 'font-bold' : ''}`} style={v === median ? { color: 'var(--accent)' } : undefined}>{v}</span>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div
              ref={containerRef}
              className="relative flex-1 rounded-xl md:rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), var(--shadow-sm)' }}
            >
              {/* Quadrant fills */}
              <div className="absolute top-0 right-0 pointer-events-none" style={{ width: urgW, height: impH, background: 'linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(239,68,68,0.07) 100%)' }} />
              <div className="absolute top-0 left-0 pointer-events-none" style={{ width: notUrgW, height: impH, background: 'linear-gradient(135deg, rgba(59,130,246,0.02) 0%, rgba(59,130,246,0.05) 100%)' }} />
              <div className="absolute bottom-0 right-0 pointer-events-none" style={{ width: urgW, height: impL, background: 'linear-gradient(135deg, rgba(245,158,11,0.02) 0%, rgba(245,158,11,0.05) 100%)' }} />
              <div className="absolute bottom-0 left-0 pointer-events-none" style={{ width: notUrgW, height: impL, background: 'linear-gradient(135deg, rgba(148,163,184,0.01) 0%, rgba(148,163,184,0.03) 100%)' }} />

              {/* Horizontal grid lines */}
              {yLabels.map(v => (
                v !== median ? (
                  <div key={`h-${v}`} className="absolute left-0 right-0" style={{ bottom: `${v}%`, borderTop: '1px solid var(--border-subtle)' }} />
                ) : null
              ))}

              {/* ═══ Draggable MEDIAN line (horizontal) ═══ */}
              <div
                className={`absolute left-0 right-0 z-[8] select-none ${draggingMedian ? 'cursor-grabbing' : 'cursor-ns-resize'}`}
                style={{ bottom: `${median}%` }}
                onMouseDown={e => { e.preventDefault(); setDraggingMedian(true); }}
                onTouchStart={() => setDraggingMedian(true)}
                onMouseEnter={() => setHoveringMedian(true)}
                onMouseLeave={() => { if (!draggingMedian) setHoveringMedian(false); }}
              >
                {/* Wide hit area */}
                <div className="absolute left-0 right-0 -top-4 h-8 md:-top-5 md:h-10" />
                {/* Visible line */}
                <div className="absolute left-0 right-0 top-0 border-t-2 border-dashed transition-colors duration-150"
                  style={{ borderColor: medianActive ? 'var(--accent)' : isDark ? 'rgba(163,230,53,0.30)' : 'rgba(163,230,53,0.35)' }} />
              </div>

              {/* Median drag handle label */}
              <div
                className={`absolute left-2 md:left-3 z-[9] select-none ${draggingMedian ? 'cursor-grabbing pointer-events-none' : 'cursor-ns-resize'}`}
                style={{ bottom: `${median}%` }}
                onMouseDown={e => { e.preventDefault(); setDraggingMedian(true); }}
                onTouchStart={() => setDraggingMedian(true)}
              >
                <span className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md -translate-y-1/2 inline-flex items-center gap-1 transition-all duration-150"
                  style={{
                    color: medianActive ? '#0a0a0a' : 'var(--accent)',
                    background: medianActive ? 'var(--accent)' : 'var(--bg-surface)',
                    border: `1.5px solid ${medianActive ? 'var(--accent)' : isDark ? 'rgba(163,230,53,0.3)' : 'rgba(101,163,13,0.35)'}`,
                    boxShadow: medianActive ? '0 0 12px rgba(163,230,53,0.3)' : 'var(--shadow-sm)',
                  }}
                >
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M7 8l5-4 5 4M7 16l5 4 5-4" />
                  </svg>
                  <span className="hidden md:inline">Importance:</span> {median}
                </span>
              </div>

              {/* Vertical grid lines */}
              {xLabels.map(({ pct }) => (
                pct !== URGENCY_DIVIDER ? (
                  <div key={`v-${pct}`} className="absolute top-0 bottom-0" style={{ left: `${pct}%`, borderLeft: '1px solid var(--border-subtle)' }} />
                ) : null
              ))}

              {/* ═══ Draggable URGENCY line (vertical) ═══ */}
              <div
                className={`absolute top-0 bottom-0 z-[8] select-none ${draggingUrgency ? 'cursor-grabbing' : 'cursor-ew-resize'}`}
                style={{ left: `${URGENCY_DIVIDER}%` }}
                onMouseDown={e => { e.preventDefault(); setDraggingUrgency(true); }}
                onTouchStart={() => setDraggingUrgency(true)}
                onMouseEnter={() => setHoveringUrgency(true)}
                onMouseLeave={() => { if (!draggingUrgency) setHoveringUrgency(false); }}
              >
                {/* Wide hit area */}
                <div className="absolute top-0 bottom-0 -left-4 w-8 md:-left-5 md:w-10" />
                {/* Visible line */}
                <div className="absolute top-0 bottom-0 left-0 border-l-2 border-dashed transition-colors duration-150"
                  style={{ borderColor: urgencyActive ? 'var(--accent)' : isDark ? 'rgba(163,230,53,0.30)' : 'rgba(163,230,53,0.35)' }} />
              </div>

              {/* Urgency drag handle label */}
              <div
                className={`absolute bottom-2 md:bottom-3 z-[9] select-none ${draggingUrgency ? 'cursor-grabbing pointer-events-none' : 'cursor-ew-resize'}`}
                style={{ left: `${URGENCY_DIVIDER}%` }}
                onMouseDown={e => { e.preventDefault(); setDraggingUrgency(true); }}
                onTouchStart={() => setDraggingUrgency(true)}
              >
                <span className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md translate-x-1 inline-flex items-center gap-1 transition-all duration-150"
                  style={{
                    color: urgencyActive ? '#0a0a0a' : 'var(--accent)',
                    background: urgencyActive ? 'var(--accent)' : 'var(--bg-surface)',
                    border: `1.5px solid ${urgencyActive ? 'var(--accent)' : isDark ? 'rgba(163,230,53,0.3)' : 'rgba(101,163,13,0.35)'}`,
                    boxShadow: urgencyActive ? '0 0 12px rgba(163,230,53,0.3)' : 'var(--shadow-sm)',
                  }}
                >
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
                  </svg>
                  <span className="hidden md:inline">Urgency:</span> {urgencyDays}d
                </span>
              </div>

              {/* Quadrant watermarks */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: urgW, height: impH }}>
                  <span className="text-sm md:text-2xl font-black tracking-wider uppercase" style={{ color: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.08)' }}>Do Now</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: notUrgW, height: impH }}>
                  <span className="text-base md:text-3xl font-black tracking-wider uppercase" style={{ color: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.08)' }}>Schedule</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: urgW, height: impL }}>
                  <span className="text-xs md:text-xl font-black tracking-wider uppercase" style={{ color: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.08)' }}>Delegate</span>
                </div>
                <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: notUrgW, height: impL }}>
                  <span className="text-xs md:text-xl font-black tracking-wider uppercase" style={{ color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.1)' }}>Deprioritize</span>
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

            {/* X-axis: tick marks + prominent title */}
            <div className="flex justify-between pt-2 md:pt-3 text-[9px] md:text-[11px] font-medium px-0.5 md:px-1 tabular-nums" style={{ color: 'var(--text-quaternary)' }}>
              {xLabels.map(({ pct, label }) => (
                <span key={pct} style={pct === URGENCY_DIVIDER ? { color: 'var(--accent)', fontWeight: 700 } : undefined}>{label}</span>
              ))}
            </div>
            <div className="text-center mt-0.5 md:mt-1">
              <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-secondary)' }}>
                Urgency →
              </span>
            </div>
          </div>

          {/* Y-axis rotated label — large, prominent */}
          <div className="flex items-center ml-1 md:ml-2">
            <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-[0.08em] [writing-mode:vertical-rl] rotate-180" style={{ color: 'var(--text-secondary)' }}>
              ← Importance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
