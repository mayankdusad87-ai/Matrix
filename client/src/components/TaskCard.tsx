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

const QUADRANT_ACCENT: Record<string, string> = {
  'Do Now': '#ef4444',
  'Schedule': '#3b82f6',
  'Delegate': '#f59e0b',
  'Deprioritize': '#9ca3af',
};

const TOOLTIP_W = 240;
const TOOLTIP_H = 180;
const TOOLTIP_GAP = 8;

export default function TaskCard({ task, onClick, onDragEnd, containerHeight, offsetX = 0, offsetY = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; above: boolean } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDark = document.documentElement.classList.contains('dark');
  const accent = task.isOverdue ? '#ef4444' : (QUADRANT_ACCENT[task.quadrant] ?? '#9ca3af');

  const PAD_L = 8;
  const PAD_R = 14;
  const PAD_Y = 5;
  const xPct = Math.min(100 - PAD_R, Math.max(PAD_L, PAD_L + (Math.min(100, Math.max(0, task.x)) / 100) * (100 - PAD_L - PAD_R) + offsetX));
  const yPct = Math.min(95, Math.max(PAD_Y, PAD_Y + (Math.min(100, Math.max(0, task.y)) / 100) * (100 - PAD_Y * 2) + offsetY));

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
        transition={{ type: 'spring', stiffness: 100, damping: 20, scale: { type: 'tween', duration: 0.15 } }}
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
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="absolute -translate-x-1/2 translate-y-1/2 w-[100px] md:w-[150px] rounded-lg md:rounded-xl
          p-2 md:p-3 cursor-pointer select-none z-10"
        style={{
          willChange: 'left, bottom',
          background: 'var(--bg-surface)',
          border: `1px solid var(--border)`,
          borderLeft: `3px solid ${accent}`,
          boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        }}
        whileHover={{ scale: 1.04, zIndex: 50 }}
      >
        {/* Quadrant badge + arrow */}
        <div className="flex items-center justify-between mb-1 md:mb-1.5">
          <span
            className="text-[6px] md:text-[8px] font-bold uppercase tracking-wider px-1 md:px-1.5 py-0.5 rounded text-white leading-none"
            style={{ background: accent }}
          >
            {task.isOverdue ? 'OVERDUE' : task.quadrant}
          </span>
          <svg className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-[9px] md:text-[12px] font-semibold leading-tight mb-1 md:mb-1.5 line-clamp-2"
          style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </div>

        {/* Due + importance */}
        <div className="flex items-center justify-between">
          <span className="text-[7px] md:text-[10px] font-semibold" style={{ color: urgencyColor }}>
            {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d late` : task.daysRemaining === 0 ? 'Due today' : `Due in ${task.daysRemaining}d`}
          </span>
          <span className="text-[8px] md:text-[11px] font-bold tabular-nums"
            style={{ color: 'var(--text-secondary)' }}>
            {task.importanceScore}
          </span>
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
                  boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 1px rgba(139,26,26,0.1)',
                }}
              >
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
