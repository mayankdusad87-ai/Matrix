import { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import Dashboard from './components/Dashboard';
import Filters from './components/Filters';
import Matrix from './components/Matrix';
import TaskPanel from './components/TaskPanel';
import InputSheet from './components/InputSheet';
import Analytics from './components/Analytics';
import UndoToast from './components/UndoToast';
import type { Task } from './types';

const tabs = [
  { key: 'matrix' as const, label: 'Matrix', shortLabel: 'Matrix', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  )},
  { key: 'input' as const, label: 'Tasks', shortLabel: 'Tasks', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" /><path strokeLinecap="round" d="M9 14l2 2 4-4" />
    </svg>
  )},
  { key: 'analytics' as const, label: 'Analytics', shortLabel: 'Stats', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
];

export default function App() {
  const {
    tasks, allTasks, stats, loading, filters, setFilters,
    search, setSearch,
    createTask, updateTask, deleteTask,
    deletedTask, undoDelete, dismissUndo,
    matrixSettings, setMatrixSettings,
  } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'matrix' | 'analytics'>('matrix');
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleImportanceChange = async (task: Task, newImportance: number) => {
    await updateTask(task.id, { importanceScore: newImportance });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--accent)' }}>
              <div className="w-full h-full animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: 'var(--accent)' }} />
            </div>
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Loading workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 md:px-5 h-[52px] shrink-0 z-20"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--text-primary)' }}>
            Priority Matrix
          </span>
        </div>

        {/* Navigation + theme */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center rounded-lg p-0.5 mr-1" style={{ background: 'var(--bg-inset)' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200"
                style={activeTab === tab.key ? {
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-sm)',
                } : {
                  color: 'var(--text-tertiary)',
                }}
              >
                <span className="md:hidden">{tab.icon}</span>
                <span className="hidden md:flex items-center gap-1.5">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => setDark(!dark)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-inset)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Toggle theme"
          >
            {dark ? (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 1v2m0 18v2m-9-11H1m22 0h-2m-2.636-7.364L16.95 5.05M7.05 5.05 5.636 3.636m0 16.728L7.05 18.95m9.9 0 1.414 1.414" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── KPIs ── */}
      {activeTab === 'matrix' && (
        <div className="w-full" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-7xl w-full mx-auto">
            <Dashboard stats={stats} />
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      {activeTab === 'input' ? (
        <InputSheet
          tasks={tasks}
          allTasks={allTasks}
          search={search}
          onSearchChange={setSearch}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onCreate={createTask}
        />
      ) : activeTab === 'analytics' ? (
        <Analytics tasks={allTasks} />
      ) : (
        <>
          <div className="max-w-7xl w-full mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
            <Filters filters={filters} setFilters={setFilters} tasks={allTasks} onCreateClick={() => setActiveTab('input')} />
          </div>
          <Matrix
            tasks={tasks}
            onTaskClick={(t) => setSelectedTask(t)}
            onImportanceChange={handleImportanceChange}
            matrixSettings={matrixSettings}
            onSettingsChange={setMatrixSettings}
          />
        </>
      )}

      {/* ── Side panel ── */}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          allTasks={allTasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id, updates) => {
            const updated = await updateTask(id, updates);
            setSelectedTask(updated as Task);
          }}
          onDelete={(id) => {
            deleteTask(id);
            setSelectedTask(null);
          }}
        />
      )}

      {deletedTask && (
        <UndoToast
          key={deletedTask.id}
          task={deletedTask}
          onUndo={undoDelete}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  );
}
