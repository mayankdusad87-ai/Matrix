import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../types';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
  onDragEnd: (task: Task, newImportance: number) => void;
  containerHeight: number;
  offsetX?: number;
  offsetY?: number;
}

const QUADRANT_COLORS = {
  'Do Now':       { accent: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.20)', darkBg: 'rgba(239,68,68,0.10)', darkBorder: 'rgba(239,68,68,0.25)' },
  'Schedule':     { accent: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.20)', darkBg: 'rgba(59,130,246,0.10)', darkBorder: 'rgba(59,130,246,0.25)' },
  'Delegate':     { accent: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.20)', darkBg: 'rgba(245,158,11,0.10)', darkBorder: 'rgba(245,158,11,0.25)' },
  'Deprioritize': { accent: '#9ca3af', bg: 'rgba(156,163,175,0.06)', border: 'rgba(156,163,175,0.15)', darkBg: 'rgba(156,163,175,0.08)', darkBorder: 'rgba(156,163,175,0.15)' },
} as const;

const OVERDUE_COLORS = { accent: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.30)', darkBg: 'rgba(239,68,68,0.15)', darkBorder: 'rgba(239,68,68,0.35)' };

const TOOLTIP_W = 240;
const TOOLTIP_H = 180;
const TOOLTIP_GAP = 8;

export default function TaskCard({ task, onClick, onDragEnd, containerHeight, offsetX = 0, offsetY = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; above: boolean } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDark = document.documentElement.classList.contains('dark');
  const colors = task.isOverdue ? OVERDUE_COLORS : (QUADRANT_COLORS[task.quadrant as keyof typeof QUADRANT_COLORS] ?? QUADRANT_COLORS['Deprioritize']);

  const PADDING = 5;
  const xPct = Math.min(95, Math.max(2, PADDING + (Math.min(100, Math.max(0, task.x)) / 100) * (100 - PADDING * 2) + offsetX));
  const yPct = Math.min(95, Math.max(2, PADDING + (Math.min(100, Math.max(0, task.y)) / 100) * (100 - PADDING * 2) + offsetY));

  const daysLabel = task.daysRemaining < 0
    ? `${Math.abs(task.daysRemaining)}d overdue`
    : task.daysRemaining === 0
    ? 'Due today'
    : `${task.daysRemaining}d left`;

  const urgencyColor = task.daysRemaining < 0
    ? '#ef4444'
    : task.daysRemaining <= 3
    ? '#f97316'
    : task.daysRemaining <= 7
    ? '#f59e0b'
    : '#10b981';

  const updateTooltipPos = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const above = rect.top > TOOLTIP_H + TOOLTIP_GAP + 10;
    const x = Math.max(TOOLTIP_W / 2 + 8, Math.min(window.innerWidth - TOOLTIP_W / 2 - 8, centerX));
    const y = above ? rect.top - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP;
    setTooltipPos({ x, y, above });
  }, []);

  useEffect(() => {
    if (hovered) updateTooltipPos();
    else setTooltipPos(null);
  }, [hovered, updateTooltipPos]);

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={false}
        animate={{ left: `${xPct}%`, bottom: `${yPct}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        drag="y"
        dragConstraints={{ top: -containerHeight, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(_e, info) => {
          const deltaY = info.offset.y;
          const deltaImportance = -(deltaY / containerHeight) * 100;
          const newImportance = Math.min(100, Math.max(0, Math.round(task.importanceScore + deltaImportance)));
          if (newImportance !== task.importanceScore) onDragEnd(task, newImportance);
        }}
        onClick={() => onClick(task)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="absolute -translate-x-1/2 translate-y-1/2 w-[68px] md:w-[96px] rounded-lg md:rounded-xl
          px-1.5 md:px-2 py-1 md:py-1.5 cursor-pointer select-none z-10"
        style={{
          willChange: 'left, bottom',
          background: isDark ? colors.darkBg : colors.bg,
          border: `1px solid ${isDark ? colors.darkBorder : colors.border}`,
          backdropFilter: 'blur(8px)',
        }}
        whileHover={{ scale: 1.15, zIndex: 50 }}
      >
        {/* Badge */}
        <div className="flex items-center gap-0.5 mb-px md:mb-0.5">
          <span
            className="text-[5px] md:text-[7px] font-bold uppercase tracking-wider px-0.5 md:px-1 py-px rounded-sm leading-none text-white truncate"
            style={{ background: colors.accent }}
          >
            {task.isOverdue ? '⚠ LATE' : task.quadrant}
          </span>
        </div>

        {/* Title */}
        <div className="text-[7px] md:text-[9px] font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-px md:mt-0.5">
          <span className="text-[6px] md:text-[7px] font-semibold" style={{ color: urgencyColor }}>
            {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d late` : task.daysRemaining === 0 ? 'Today' : `${task.daysRemaining}d`}
          </span>
          <span className="text-[6px] md:text-[7px] font-medium px-0.5 md:px-1 rounded-sm tabular-nums" style={{ color: 'var(--text-secondary)', background: 'var(--bg-inset)' }}>
            {task.importanceScore}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-0.5 h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${task.timelineProgress ?? 0}%`,
              background: (task.timelineProgress ?? 0) >= 90 ? '#ef4444'
                : (task.timelineProgress ?? 0) >= 70 ? '#f97316'
                : (task.timelineProgress ?? 0) >= 40 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
      </motion.div>

      {/* Tooltip via Portal */}
      {createPortal(
        <AnimatePresence>
          {hovered && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: tooltipPos.above ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: tooltipPos.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                zIndex: 9999,
              }}
            >
              <div
                className="rounded-xl px-4 py-3.5 text-left"
                style={{
                  width: TOOLTIP_W,
                  background: isDark ? '#181818' : '#1a1d26',
                  color: isDark ? '#e5e7eb' : '#f3f4f6',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 1px rgba(163,230,53,0.1)',
                }}
              >
                {/* Arrow */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                  style={{
                    ...(tooltipPos.above ? { bottom: -5 } : { top: -5 }),
                    background: isDark ? '#181818' : '#1a1d26',
                  }}
                />

                <p className="text-[13px] font-bold mb-2 leading-tight">{task.title}</p>

                <div className="space-y-1.5 text-[11px]">
                  {[
                    { label: 'Quadrant', value: task.isOverdue ? 'Overdue' : task.quadrant },
                    { label: 'Importance', value: `${task.importanceScore} / 100` },
                    { label: 'Due Date', value: task.dueDate },
                    { label: 'Time Left', value: daysLabel, color: urgencyColor },
                    { label: 'Status', value: task.status },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between">
                      <span className="opacity-40">{label}</span>
                      <span className="font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</span>
                    </div>
                  ))}

                  {/* Progress */}
                  <div className="flex justify-between items-center">
                    <span className="opacity-40">Progress</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${task.timelineProgress ?? 0}%`,
                            background: (task.timelineProgress ?? 0) >= 90 ? '#ef4444' : (task.timelineProgress ?? 0) >= 70 ? '#f97316' : (task.timelineProgress ?? 0) >= 40 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                      <span className="font-semibold tabular-nums">{task.timelineProgress ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 text-[9px] opacity-30 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  Click to edit · Drag ↕ importance
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
