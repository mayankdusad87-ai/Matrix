import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Task, TaskStats, Filters as FiltersType, MatrixSettings } from '../../types';
import BottomNav, { type MobileTab } from './BottomNav';
import MobileHeader from './MobileHeader';
import FocusHome from './FocusHome';
import FAB from './FAB';
import MobileTaskDetail from './MobileTaskDetail';
import MobileCreateTask from './MobileCreateTask';
import MobileSearchOverlay from './MobileSearchOverlay';
import MobileFilters from './MobileFilters';
import MobileMoreMenu from './MobileMoreMenu';
import Matrix from '../Matrix';
import InputSheet from '../InputSheet';
import UndoToast from '../UndoToast';

interface Props {
  tasks: Task[];
  allTasks: Task[];
  stats: TaskStats | null;
  filters: FiltersType;
  setFilters: (f: FiltersType) => void;
  search: string;
  setSearch: (s: string) => void;
  createTask: (data: Record<string, unknown>) => Promise<void>;
  updateTask: (id: string, updates: Record<string, unknown>) => Promise<unknown>;
  deleteTask: (id: string) => void;
  deletedTask: Task | null;
  undoDelete: () => void;
  dismissUndo: () => Promise<void>;
  matrixSettings: MatrixSettings;
  setMatrixSettings: (s: MatrixSettings) => void;
  user: { email?: string } | null;
  signOut: () => Promise<void>;
  dark: boolean;
  setDark: (d: boolean) => void;
}

export default function MobileAppShell({
  tasks, allTasks, stats, filters, setFilters,
  search, setSearch,
  createTask, updateTask, deleteTask,
  deletedTask, undoDelete, dismissUndo,
  matrixSettings, setMatrixSettings,
  user, signOut, dark, setDark,
}: Props) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('focus');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleImportanceChange = async (task: Task, newImportance: number) => {
    await updateTask(task.id, { importanceScore: newImportance });
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <MobileHeader onSearchOpen={() => setShowSearch(true)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {mobileTab === 'focus' && (
          <FocusHome
            allTasks={allTasks}
            stats={stats}
            onTaskClick={setSelectedTask}
          />
        )}

        {mobileTab === 'matrix' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter bar for matrix */}
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-[6px] text-[13px] font-medium transition-colors duration-150"
                style={{
                  border: `1px solid ${[filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length > 0 ? 'var(--accent)' : 'var(--border)'}`,
                  background: [filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length > 0 ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  color: [filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length > 0 ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {[filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length > 0 && (
                  <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
                    {[filters.owner, filters.status, filters.category, filters.quadrant].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
            <Matrix
              tasks={tasks}
              onTaskClick={setSelectedTask}
              onImportanceChange={handleImportanceChange}
              matrixSettings={matrixSettings}
              onSettingsChange={setMatrixSettings}
            />
          </div>
        )}

        {mobileTab === 'tasks' && (
          <InputSheet
            tasks={tasks}
            allTasks={allTasks}
            search={search}
            onSearchChange={setSearch}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onCreate={createTask}
          />
        )}

        {mobileTab === 'more' && (
          <MobileMoreMenu
            user={user}
            dark={dark}
            setDark={setDark}
            signOut={signOut}
            allTasks={allTasks}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* FAB */}
      {mobileTab !== 'more' && (
        <FAB onClick={() => setShowCreate(true)} />
      )}

      {/* Overlays */}
      <AnimatePresence>
        {selectedTask && (
          <MobileTaskDetail
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
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <MobileCreateTask
            onClose={() => setShowCreate(false)}
            onCreate={async (data) => {
              await createTask(data as unknown as Record<string, unknown>);
              setShowCreate(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <MobileSearchOverlay
            search={search}
            setSearch={setSearch}
            tasks={allTasks}
            onTaskClick={setSelectedTask}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilters && (
          <MobileFilters
            filters={filters}
            setFilters={setFilters}
            tasks={allTasks}
            onClose={() => setShowFilters(false)}
          />
        )}
      </AnimatePresence>

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
