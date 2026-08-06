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
      <div className="h-screen flex items-center justify-center bg-[#fafbfc] dark:bg-[#0a0b0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">Loading tasks…</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'matrix' as const, label: 'Matrix', icon: '◆' },
    { key: 'input' as const, label: 'Tasks', icon: '☰' },
    { key: 'analytics' as const, label: 'Analytics', icon: '◎' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#fafbfc] dark:bg-[#0a0b0f] text-gray-900 dark:text-gray-100 transition-colors">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 md:px-5 h-12 border-b border-gray-200/80 dark:border-white/[0.06] bg-white dark:bg-[#111318] shrink-0">
        <h1 className="text-[15px] font-semibold tracking-[-0.01em]">
          <span className="text-indigo-600 dark:text-indigo-400">Priority</span>
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">Matrix</span>
        </h1>

        <div className="flex items-center gap-0.5">
          {/* Tab pills */}
          <nav className="flex bg-gray-100/80 dark:bg-white/[0.04] rounded-lg p-[3px] mr-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 md:px-3.5 py-[5px] text-[11px] md:text-[12px] font-medium rounded-md transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="md:hidden">{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => setDark(!dark)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            title="Toggle theme"
          >
            <span className="text-sm">{dark ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* ── KPIs ── */}
      <div className="max-w-6xl w-full mx-auto">
        <Dashboard stats={stats} />
      </div>

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
          <div className="max-w-6xl w-full mx-auto">
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
