import { motion } from 'framer-motion';
import type { Task } from '../types';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
  onDragEnd: (task: Task, newImportance: number) => void;
  containerHeight: number;
  offsetX?: number;
  offsetY?: number;
}

function getPriorityColor(quadrant: string, isOverdue: boolean) {
  if (isOverdue) return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-500', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-500 text-white' };
  switch (quadrant) {
    case 'Do Now': return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-400', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-500 text-white' };
    case 'Schedule': return { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500 text-white' };
    case 'Delegate': return { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-500 text-white' };
    case 'Deprioritize': return { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-400', text: 'text-gray-600 dark:text-gray-300', badge: 'bg-gray-500 text-white' };
    default: return { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-400', text: 'text-gray-600 dark:text-gray-300', badge: 'bg-gray-500 text-white' };
  }
}

export default function TaskCard({ task, onClick, onDragEnd, containerHeight, offsetX = 0, offsetY = 0 }: Props) {
  const colors = getPriorityColor(task.quadrant, task.isOverdue);

  const PADDING = 5;
  const xPct = Math.min(95, Math.max(2, PADDING + (Math.min(100, Math.max(0, task.x)) / 100) * (100 - PADDING * 2) + offsetX));
  const yPct = Math.min(95, Math.max(2, PADDING + (Math.min(100, Math.max(0, task.y)) / 100) * (100 - PADDING * 2) + offsetY));

  const daysLabel = task.daysRemaining < 0
    ? `${Math.abs(task.daysRemaining)}d late`
    : task.daysRemaining === 0
    ? 'Today'
    : `${task.daysRemaining}d`;

  return (
    <motion.div
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
      className={`absolute -translate-x-1/2 translate-y-1/2 w-20 rounded border ${colors.border} ${colors.bg} px-1 py-0.5 cursor-pointer
        shadow hover:shadow-lg transition-shadow select-none z-10`}
      style={{ willChange: 'left, bottom' }}
      whileHover={{ scale: 1.3, zIndex: 50 }}
      title={`${task.title}\nQuadrant: ${task.quadrant}\nImportance: ${task.importanceScore}\nDays left: ${task.daysRemaining}\n${task.isOverdue ? 'OVERDUE' : ''}`}
    >
      <div className="flex items-center justify-between gap-0.5">
        <span className={`text-[6px] font-bold uppercase px-0.5 py-px rounded leading-none ${colors.badge} truncate`}>
          {task.isOverdue ? 'LATE' : task.quadrant}
        </span>
        <span className="text-[6px] text-gray-400 dark:text-gray-500 shrink-0">
          {daysLabel}
        </span>
      </div>
      <div className={`text-[8px] font-bold truncate leading-tight ${colors.text}`}>{task.title}</div>
      <div className="flex items-center justify-between text-[7px] text-gray-400 dark:text-gray-500">
        <span className="truncate">{task.owner}</span>
        <span className="shrink-0">I{task.importanceScore}</span>
      </div>
    </motion.div>
  );
}
