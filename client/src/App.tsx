import { useState, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import Dashboard from './components/Dashboard';
import Filters from './components/Filters';
import Matrix from './components/Matrix';
import TaskPanel from './components/TaskPanel';
import CreateTaskModal from './components/CreateTaskModal';
import type { Task } from './types';

export default function App() {
  const { tasks, stats, loading, filters, setFilters, createTask, updateTask, deleteTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
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
        <button
          onClick={() => setDark(!dark)}
          className="rounded-lg p-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Toggle theme"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto">
        <Dashboard stats={stats} />
        <Filters filters={filters} setFilters={setFilters} tasks={tasks} onCreateClick={() => setShowCreate(true)} />
      </div>
      <Matrix tasks={tasks} onTaskClick={handleTaskClick} onImportanceChange={handleImportanceChange} />

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

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreate={async (data) => {
            await createTask({ ...data, owner: data.owner || 'Unassigned' });
          }}
        />
      )}
    </div>
  );
}
