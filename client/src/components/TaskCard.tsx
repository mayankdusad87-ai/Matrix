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
    case 'Do': return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-400', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-500 text-white' };
    case 'Schedule': return { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500 text-white' };
    case 'Delegate': return { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-500 text-white' };
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
      className={`absolute -translate-x-1/2 translate-y-1/2 w-40 rounded-lg border-2 ${colors.border} ${colors.bg} p-2 cursor-pointer
        shadow-md hover:shadow-xl transition-shadow select-none z-10`}
      style={{ willChange: 'left, bottom' }}
      whileHover={{ scale: 1.06, zIndex: 50 }}
      title={`${task.title}\nQuadrant: ${task.quadrant}\nDays left: ${daysLeft}\nPriority: ${task.priorityScore}\n${task.isOverdue ? 'OVERDUE' : ''}`}
    >
      {/* Quadrant badge */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.badge}`}>
          {task.isOverdue ? 'OVERDUE' : task.quadrant}
        </span>
        <span className="text-[9px] text-gray-400 dark:text-gray-500">
          {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`}
        </span>
      </div>

      <div className={`text-xs font-bold truncate ${colors.text}`}>{task.title}</div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <span>{task.owner}</span>
        <span>{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>

      <div className="mt-1 flex items-center gap-1 text-[10px]">
        <span className={`font-semibold ${colors.text}`}>P{Math.round(task.priorityScore)}</span>
        <span className="text-gray-400">I{task.importanceScore}</span>
        <span className="flex-1" />
        <span className={`px-1.5 py-0.5 rounded-full ${
          task.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
          task.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
          task.status === 'On Hold' ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {task.status}
        </span>
      </div>
    </motion.div>
  );
}
