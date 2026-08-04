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
    bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/80 dark:to-rose-900/60',
    border: 'border-red-400 dark:border-red-500',
    text: 'text-red-800 dark:text-red-200',
    badge: 'bg-red-500',
    ring: 'ring-red-400/30',
    icon: '🔥',
  },
  'Schedule': {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/80 dark:to-indigo-900/60',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
    badge: 'bg-blue-500',
    ring: 'ring-blue-400/30',
    icon: '📅',
  },
  'Delegate': {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/80 dark:to-orange-900/60',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
    badge: 'bg-amber-500',
    ring: 'ring-amber-400/30',
    icon: '👋',
  },
  'Deprioritize': {
    bg: 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/80 dark:to-gray-800/60',
    border: 'border-slate-400 dark:border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500',
    ring: 'ring-slate-400/30',
    icon: '📋',
  },
} as const;

const OVERDUE_STYLE = {
  bg: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-950 dark:to-red-900/80',
  border: 'border-red-500 dark:border-red-400',
  text: 'text-red-800 dark:text-red-200',
  badge: 'bg-red-600',
  ring: 'ring-red-500/40',
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
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-green-600 dark:text-green-400';

  const updateTooltipPos = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // Check if there's room above; if not, show below
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
        className={`absolute -translate-x-1/2 translate-y-1/2 w-[88px] rounded-lg border-[1.5px] ${style.border} ${style.bg}
          px-1.5 py-1 cursor-pointer shadow-md hover:shadow-xl ring-1 ${style.ring}
          transition-shadow select-none z-10`}
        style={{ willChange: 'left, bottom' }}
        whileHover={{ scale: 1.25, zIndex: 50 }}
      >
        {/* Card badge */}
        <div className="flex items-center justify-between gap-0.5 mb-0.5">
          <span className={`text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded-sm text-white leading-none ${style.badge} truncate`}>
            {task.isOverdue ? '⚠ LATE' : task.quadrant}
          </span>
        </div>

        {/* Title */}
        <div className={`text-[9px] font-bold truncate leading-tight ${style.text}`}>
          {task.title}
        </div>

        {/* Days + importance footer */}
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-[7px] font-semibold ${urgencyColor}`}>
            {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d late` : task.daysRemaining === 0 ? 'Today' : `${task.daysRemaining}d`}
          </span>
          <span className="text-[7px] font-semibold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 px-1 rounded-sm">
            {task.importanceScore}
          </span>
        </div>
      </motion.div>

      {/* Tooltip — rendered via Portal so it escapes overflow-hidden */}
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
              <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-2xl px-3 py-2.5 text-left border border-gray-700 dark:border-gray-300"
                style={{ width: TOOLTIP_W }}
              >
                {/* Arrow */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 dark:bg-gray-100 rotate-45 border-gray-700 dark:border-gray-300"
                  style={tooltipPos.above
                    ? { bottom: -6, borderBottom: '1px solid', borderRight: '1px solid', borderColor: 'inherit' }
                    : { top: -6, borderTop: '1px solid', borderLeft: '1px solid', borderColor: 'inherit' }
                  }
                />

                <p className="text-xs font-bold mb-1.5 leading-tight">{task.title}</p>

                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="opacity-60">Quadrant</span>
                    <span className="font-semibold">{style.icon} {task.isOverdue ? 'Overdue' : task.quadrant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Importance</span>
                    <span className="font-semibold">{task.importanceScore} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Due Date</span>
                    <span className="font-semibold">{task.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Time Left</span>
                    <span className={`font-bold ${urgencyColor}`}>{daysLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Status</span>
                    <span className="font-semibold">{task.status}</span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-gray-700/50 dark:border-gray-300/50 text-[9px] opacity-50 text-center">
                  Click to edit  •  Drag to adjust importance
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
