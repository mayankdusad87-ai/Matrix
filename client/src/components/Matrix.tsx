import { useRef } from 'react';
import type { Task } from '../types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onImportanceChange: (task: Task, newImportance: number) => void;
}

const yLabels = [0, 20, 40, 60, 70, 80, 100];
const xLabels = [0, 25, 50, 70, 100];

export default function Matrix({ tasks, onTaskClick, onImportanceChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex justify-center px-3 py-1 min-h-0">
      <div className="flex w-full max-w-6xl gap-0">
      {/* Y-axis labels */}
      <div className="flex flex-col justify-between py-1 pr-2 text-xs text-gray-400 dark:text-gray-500 w-8 shrink-0">
        {[...yLabels].reverse().map(v => (
          <span key={v} className="text-right leading-none">{v}</span>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Matrix area */}
        <div
          ref={containerRef}
          className="relative flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
        >
          {/* Quadrant backgrounds — strongly tinted so buckets are obvious */}
          {/* Top-Right: DO (importance>=70, timeline>=70) */}
          <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-red-100/80 dark:bg-red-900/20 pointer-events-none" />
          {/* Top-Left: SCHEDULE (importance>=70, timeline<70) */}
          <div className="absolute top-0 left-0 w-[70%] h-[30%] bg-blue-100/60 dark:bg-blue-900/15 pointer-events-none" />
          {/* Bottom-Right: DELEGATE (importance<70, timeline>=70) */}
          <div className="absolute bottom-0 right-0 w-[30%] h-[70%] bg-amber-100/60 dark:bg-amber-900/15 pointer-events-none" />
          {/* Bottom-Left: DELETE (importance<70, timeline<70) */}
          <div className="absolute bottom-0 left-0 w-[70%] h-[70%] bg-gray-100/60 dark:bg-gray-800/20 pointer-events-none" />

          {/* Grid lines - horizontal */}
          {yLabels.map(v => (
            <div
              key={`h-${v}`}
              className={`absolute left-0 right-0 border-t ${
                v === 70 ? 'border-2 border-dashed border-indigo-400 dark:border-indigo-500 z-[5]' : 'border-gray-200 dark:border-gray-800'
              }`}
              style={{ bottom: `${v}%` }}
            />
          ))}

          {/* Grid lines - vertical */}
          {xLabels.map(v => (
            <div
              key={`v-${v}`}
              className={`absolute top-0 bottom-0 border-l ${
                v === 70 ? 'border-2 border-dashed border-indigo-400 dark:border-indigo-500 z-[5]' : 'border-gray-200 dark:border-gray-800'
              }`}
              style={{ left: `${v}%` }}
            />
          ))}

          {/* Quadrant labels — large and centered in each quadrant */}
          <div className="absolute inset-0 pointer-events-none select-none z-0">
            {/* Top-Right: DO */}
            <div className="absolute flex items-center justify-center" style={{ top: 0, right: 0, width: '30%', height: '30%' }}>
              <span className="text-6xl font-black text-red-200 dark:text-red-800/50">DO</span>
            </div>
            {/* Top-Left: SCHEDULE */}
            <div className="absolute flex items-center justify-center" style={{ top: 0, left: 0, width: '70%', height: '30%' }}>
              <span className="text-5xl font-black text-blue-200 dark:text-blue-800/50">SCHEDULE</span>
            </div>
            {/* Bottom-Right: DELEGATE */}
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: '30%', height: '70%' }}>
              <span className="text-4xl font-black text-amber-200 dark:text-amber-800/50">DELEGATE</span>
            </div>
            {/* Bottom-Left: DELETE */}
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, left: 0, width: '70%', height: '70%' }}>
              <span className="text-5xl font-black text-gray-200 dark:text-gray-700/50">DELETE</span>
            </div>
          </div>

          {/* Task cards */}
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onDragEnd={onImportanceChange}
              containerHeight={containerRef.current?.clientHeight || 600}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between pt-1 text-xs text-gray-400 dark:text-gray-500 px-1">
          {xLabels.map(v => (
            <span key={v}>{v}%</span>
          ))}
        </div>
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Timeline Progress →
        </div>
      </div>

      {/* Y-axis label */}
      <div className="flex items-center ml-1">
        <span className="text-xs text-gray-400 dark:text-gray-500 [writing-mode:vertical-rl] rotate-180">
          ← Importance Score
        </span>
      </div>
      </div>
    </div>
  );
}
