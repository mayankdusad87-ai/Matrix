import { useEffect, useState, useRef } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoToast({ task, onUndo, onDismiss }: Props) {
  const [progress, setProgress] = useState(100);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const start = Date.now();
    const duration = 5000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismissRef.current();
      }
    }, 50);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className="bg-[#1a1d26] dark:bg-white text-gray-100 dark:text-gray-900 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[90vw]">
        <span className="text-red-400 dark:text-red-600 text-lg">🗑️</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            Deleted &ldquo;{task.title}&rdquo;
          </p>
          <div className="mt-1 h-1 bg-gray-700 dark:bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 dark:bg-indigo-600 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={onUndo}
          className="shrink-0 px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-colors"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
