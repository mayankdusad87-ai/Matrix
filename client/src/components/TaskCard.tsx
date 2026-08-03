import { motion } from 'framer-motion';
import type { Task } from '../types';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
  onDragEnd: (task: Task, newImportance: number) => void;
  containerHeight: number;
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

export default function TaskCard({ task, onClick, onDragEnd, containerHeight }: Props) {
  const colors = getPriorityColor(task.quadrant, task.isOverdue);
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const PADDING = 6;
  const xPct = PADDING + (Math.min(100, Math.max(0, task.x)) / 100) * (100 - PADDING * 2);
  const yPct = PADDING + (Math.min(100, Math.max(0, task.y)) / 100) * (100 - PADDING * 2);

  return (
    <motion.div
      layout
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
      className={`absolute -translate-x-1/2 translate-y-1/2 w-28 rounded-md border ${colors.border} ${colors.bg} px-1.5 py-1 cursor-pointer
        shadow hover:shadow-lg transition-shadow select-none z-10`}
      style={{ willChange: 'left, bottom' }}
      whileHover={{ scale: 1.1, zIndex: 50 }}
      title={`${task.title}\nQuadrant: ${task.quadrant}\nDays left: ${daysLeft}\nPriority: ${task.priorityScore}\n${task.isOverdue ? 'OVERDUE' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[7px] font-bold uppercase px-1 py-px rounded ${colors.badge}`}>
          {task.isOverdue ? 'OVERDUE' : task.quadrant}
        </span>
        <span className="text-[7px] text-gray-400 dark:text-gray-500">
          {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d`}
        </span>
      </div>
      <div className={`text-[10px] font-bold truncate mt-0.5 ${colors.text}`}>{task.title}</div>
      <div className="flex items-center justify-between text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">
        <span>{task.owner}</span>
        <span>P{Math.round(task.priorityScore)}</span>
      </div>
    </motion.div>
  );
}
