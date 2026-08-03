import { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import Dashboard from './components/Dashboard';
import Filters from './components/Filters';
import Matrix from './components/Matrix';
import TaskPanel from './components/TaskPanel';
import InputSheet from './components/InputSheet';
import type { Task } from './types';

export default function App() {
  const { tasks, stats, loading, filters, setFilters, createTask, updateTask, deleteTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'matrix'>('input');
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-indigo-600 dark:text-indigo-400">Priority</span> Matrix
        </h1>

        <div className="flex items-center gap-1">
          {/* Tab buttons */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mr-3">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'input'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Input Sheet
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Matrix View
            </button>
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
          onUpdate={updateTask}
          onDelete={deleteTask}
          onCreate={createTask}
        />
      ) : (
        <>
          <div className="max-w-6xl w-full mx-auto">
            <Filters filters={filters} setFilters={setFilters} tasks={tasks} onCreateClick={() => setActiveTab('input')} />
          </div>
          <Matrix tasks={tasks} onTaskClick={(t) => setSelectedTask(t)} onImportanceChange={handleImportanceChange} />
        </>
      )}

      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id, updates) => {
            const updated = await updateTask(id, updates);
            setSelectedTask(updated as Task);
          }}
          onDelete={async (id) => {
            await deleteTask(id);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
