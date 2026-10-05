import type { Task } from '../../types';
import Analytics from '../Analytics';

interface Props {
  user: { email?: string } | null;
  dark: boolean;
  setDark: (d: boolean) => void;
  signOut: () => Promise<void>;
  allTasks: Task[];
}

function exportCSV(tasks: Task[]) {
  const headers = ['Title', 'Start Date', 'Due Date', 'Importance', 'Status', 'Days Left', 'Quadrant', 'Owner', 'Category', 'Timeline Progress'];
  const rows = tasks.map(t => [
    `"${t.title.replace(/"/g, '""')}"`, t.startDate, t.dueDate, t.importanceScore, t.status,
    t.daysRemaining, t.quadrant, t.owner, t.category, `${t.timelineProgress ?? 0}%`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MobileMoreMenu({ user, dark, setDark, signOut, allTasks }: Props) {
  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      {/* User info */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
            style={{ background: 'var(--accent)' }}>
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.email || 'User'}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Signed in</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Settings</h3>

        {/* Theme toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-between py-3 px-1"
        >
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--text-secondary)' }}>
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 1v2m0 18v2m-9-11H1m22 0h-2m-2.636-7.364L16.95 5.05M7.05 5.05 5.636 3.636m0 16.728L7.05 18.95m9.9 0 1.414 1.414" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </span>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {dark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <div className="w-10 h-6 rounded-full relative transition-colors duration-200"
            style={{ background: dark ? 'var(--accent)' : 'var(--bg-inset)' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200 shadow-sm"
              style={{
                background: 'var(--bg-surface)',
                transform: dark ? 'translateX(18px)' : 'translateX(2px)',
              }} />
          </div>
        </button>

        {/* Export */}
        <button
          onClick={() => exportCSV(allTasks)}
          className="w-full flex items-center gap-3 py-3 px-1"
        >
          <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>Export Tasks (CSV)</span>
        </button>
      </div>

      {/* Analytics inline */}
      <div className="px-0 py-0">
        <Analytics tasks={allTasks} />
      </div>

      {/* Sign out */}
      <div className="px-5 py-4">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold"
          style={{ border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
