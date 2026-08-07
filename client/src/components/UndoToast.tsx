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
      <div
        className="rounded-xl px-5 py-4 flex items-center gap-3 min-w-[340px] max-w-[90vw]"
        style={{
          background: 'rgba(24,24,24,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 20px rgba(163,230,53,0.08), var(--shadow-xl)',
          color: 'var(--text-primary)',
        }}
      >
        <svg className="w-5 h-5 shrink-0" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            Deleted "{task.title}"
          </p>
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{ width: `${progress}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
        <button
          onClick={onUndo}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-150"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          Undo
        </button>
      </div>
    </div>
  );
}
