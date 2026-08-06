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

const QUADRANT_STYLES = {
  'Do Now': {
    bg: 'bg-white dark:bg-[#1a1d26]',
    border: 'border-red-300/70 dark:border-red-500/30',
    text: 'text-gray-800 dark:text-gray-100',
    badge: 'bg-red-500',
    badgeText: 'text-white',
    ring: 'ring-red-100/50 dark:ring-red-900/20',
    icon: '🔥',
  },
  'Schedule': {
    bg: 'bg-white dark:bg-[#1a1d26]',
    border: 'border-blue-300/70 dark:border-blue-500/30',
    text: 'text-gray-800 dark:text-gray-100',
    badge: 'bg-blue-500',
    badgeText: 'text-white',
    ring: 'ring-blue-100/50 dark:ring-blue-900/20',
    icon: '📅',
  },
  'Delegate': {
    bg: 'bg-white dark:bg-[#1a1d26]',
    border: 'border-amber-300/70 dark:border-amber-500/30',
    text: 'text-gray-800 dark:text-gray-100',
    badge: 'bg-amber-500',
    badgeText: 'text-white',
    ring: 'ring-amber-100/50 dark:ring-amber-900/20',
    icon: '👋',
  },
  'Deprioritize': {
    bg: 'bg-white dark:bg-[#1a1d26]',
    border: 'border-gray-200 dark:border-white/[0.06]',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-400 dark:bg-gray-600',
    badgeText: 'text-white',
    ring: 'ring-gray-100/50 dark:ring-white/[0.03]',
    icon: '📋',
  },
} as const;

const OVERDUE_STYLE = {
  bg: 'bg-red-50 dark:bg-red-950/30',
  border: 'border-red-400/70 dark:border-red-500/40',
  text: 'text-red-800 dark:text-red-200',
  badge: 'bg-red-600',
  badgeText: 'text-white',
  ring: 'ring-red-200/40 dark:ring-red-900/30',
  icon: '⚠️',
};

const TOOLTIP_W = 200;
const TOOLTIP_H = 170;
const TOOLTIP_GAP = 8;

export default function TaskCard({ task, onClick, onDragEnd, containerHeight, offsetX = 0, offsetY = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; above: boolean } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const style = task.isOverdue ? OVERDUE_STYLE : (QUADRANT_STYLES[task.quadrant as keyof typeof QUADRANT_STYLES] ?? QUADRANT_STYLES['Deprioritize']);

  const PADDING = 5;
  const xPct = Math.min(95, Math.max(2, PADDING + (Math.min(100, Math.max(0, task.x)) / 100) * (100 - PADDING * 2) + offsetX));
  const yPct = Math.min(95, Math.max(2, PADDING + (Math.min(100, Math.max(0, task.y)) / 100) * (100 - PADDING * 2) + offsetY));

  const daysLabel = task.daysRemaining < 0
    ? `${Math.abs(task.daysRemaining)}d overdue`
    : task.daysRemaining === 0
    ? 'Due today'
    : `${task.daysRemaining}d left`;

  const urgencyColor = task.daysRemaining < 0
    ? 'text-red-600 dark:text-red-400'
    : task.daysRemaining <= 3
    ? 'text-orange-600 dark:text-orange-400'
    : task.daysRemaining <= 7
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400';

  const updateTooltipPos = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const above = rect.top > TOOLTIP_H + TOOLTIP_GAP + 10;
    const x = Math.max(TOOLTIP_W / 2 + 8, Math.min(window.innerWidth - TOOLTIP_W / 2 - 8, centerX));
    const y = above
      ? rect.top - TOOLTIP_GAP
      : rect.bottom + TOOLTIP_GAP;
    setTooltipPos({ x, y, above });
  }, []);

  useEffect(() => {
    if (hovered) {
      updateTooltipPos();
    } else {
      setTooltipPos(null);
    }
  }, [hovered, updateTooltipPos]);

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={false}
        animate={{
          left: `${xPct}%`,
          bottom: `${yPct}%`,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        drag="y"
        dragConstraints={{ top: -containerHeight, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(_e, info) => {
          const deltaY = info.offset.y;
          const deltaImportance = -(deltaY / containerHeight) * 100;
          const newImportance = Math.min(100, Math.max(0, Math.round(task.importanceScore + deltaImportance)));
          if (newImportance !== task.importanceScore) {
            onDragEnd(task, newImportance);
          }
        }}
        onClick={() => onClick(task)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`absolute -translate-x-1/2 translate-y-1/2 w-[64px] md:w-[88px] rounded-md md:rounded-lg border ${style.border} ${style.bg}
          px-1 md:px-1.5 py-0.5 md:py-1 cursor-pointer shadow-sm hover:shadow-md ring-1 ${style.ring}
          transition-shadow select-none z-10`}
        style={{ willChange: 'left, bottom' }}
        whileHover={{ scale: 1.2, zIndex: 50 }}
      >
        {/* Card badge */}
        <div className="flex items-center justify-between gap-0.5 mb-px md:mb-0.5">
          <span className={`text-[5px] md:text-[7px] font-bold uppercase tracking-wider px-0.5 md:px-1 py-px rounded-sm ${style.badgeText} leading-none ${style.badge} truncate`}>
            {task.isOverdue ? '⚠ LATE' : task.quadrant}
          </span>
        </div>

        {/* Title */}
        <div className={`text-[7px] md:text-[9px] font-semibold truncate leading-tight ${style.text}`}>
          {task.title}
        </div>

        {/* Days + importance footer */}
        <div className="flex items-center justify-between mt-px md:mt-0.5">
          <span className={`text-[6px] md:text-[7px] font-semibold ${urgencyColor}`}>
            {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d late` : task.daysRemaining === 0 ? 'Today' : `${task.daysRemaining}d`}
          </span>
          <span className="text-[6px] md:text-[7px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-0.5 md:px-1 rounded-sm tabular-nums">
            {task.importanceScore}
          </span>
        </div>

        {/* Timeline progress bar */}
        <div className="mt-0.5 h-[2px] bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              (task.timelineProgress ?? 0) >= 90 ? 'bg-red-500' :
              (task.timelineProgress ?? 0) >= 70 ? 'bg-orange-400' :
              (task.timelineProgress ?? 0) >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${task.timelineProgress ?? 0}%` }}
          />
        </div>
      </motion.div>

      {/* Tooltip via Portal */}
      {createPortal(
        <AnimatePresence>
          {hovered && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.above ? tooltipPos.y : tooltipPos.y,
                transform: tooltipPos.above
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
                zIndex: 9999,
              }}
            >
              <div className="bg-[#1a1d26] dark:bg-white text-gray-100 dark:text-gray-900 rounded-xl shadow-2xl px-3 py-2.5 text-left"
                style={{ width: TOOLTIP_W }}
              >
                {/* Arrow */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d26] dark:bg-white rotate-45"
                  style={tooltipPos.above
                    ? { bottom: -5 }
                    : { top: -5 }
                  }
                />

                <p className="text-xs font-bold mb-1.5 leading-tight">{task.title}</p>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="opacity-50">Quadrant</span>
                    <span className="font-semibold">{style.icon} {task.isOverdue ? 'Overdue' : task.quadrant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Importance</span>
                    <span className="font-semibold tabular-nums">{task.importanceScore} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Due Date</span>
                    <span className="font-semibold">{task.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Time Left</span>
                    <span className={`font-bold ${urgencyColor}`}>{daysLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Status</span>
                    <span className="font-semibold">{task.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-50">Progress</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-gray-700 dark:bg-gray-300 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          (task.timelineProgress ?? 0) >= 90 ? 'bg-red-400' :
                          (task.timelineProgress ?? 0) >= 70 ? 'bg-orange-400' :
                          (task.timelineProgress ?? 0) >= 40 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} style={{ width: `${task.timelineProgress ?? 0}%` }} />
                      </div>
                      <span className="font-semibold tabular-nums">{task.timelineProgress ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-gray-700/40 dark:border-gray-300/40 text-[9px] opacity-40 text-center">
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
