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
  } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'matrix' | 'analytics'>('input');
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
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-lg text-gray-500 dark:text-gray-400 animate-pulse">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-lg md:text-xl font-bold tracking-tight">
          <span className="text-indigo-600 dark:text-indigo-400">Priority</span> Matrix
        </h1>

        <div className="flex items-center gap-1">
          {/* Tab buttons */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mr-2 md:mr-3">
            {([
              { key: 'input', label: 'Input Sheet', shortLabel: 'Input' },
              { key: 'matrix', label: 'Matrix View', shortLabel: 'Matrix' },
              { key: 'analytics', label: 'Analytics', shortLabel: '📊' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg p-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle theme"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Dashboard KPIs */}
      <div className="max-w-6xl w-full mx-auto">
        <Dashboard stats={stats} />
      </div>

      {/* Tab content */}
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
          <Matrix tasks={tasks} onTaskClick={(t) => setSelectedTask(t)} onImportanceChange={handleImportanceChange} />
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

      {/* Undo toast */}
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
