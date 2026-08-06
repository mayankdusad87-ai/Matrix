import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStats, Filters, MatrixSettings } from '../types';

const API = '/api/tasks';

const DEFAULT_SETTINGS: MatrixSettings = { medianOverride: null, urgencyDays: 7 };

function loadSettings(): MatrixSettings {
  try {
    const raw = localStorage.getItem('matrixSettings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ owner: '', status: '', category: '', quadrant: '' });
  const [search, setSearch] = useState('');
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);
  const [matrixSettings, setMatrixSettingsState] = useState<MatrixSettings>(loadSettings);

  const setMatrixSettings = useCallback((s: MatrixSettings) => {
    setMatrixSettingsState(s);
    localStorage.setItem('matrixSettings', JSON.stringify(s));
  }, []);

  /** Build query string with filters + matrix settings */
  const buildParams = useCallback((extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters.owner) params.set('owner', filters.owner);
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.quadrant) params.set('quadrant', filters.quadrant);
    if (matrixSettings.medianOverride !== null) params.set('median', String(matrixSettings.medianOverride));
    if (matrixSettings.urgencyDays !== 7) params.set('urgencyDays', String(matrixSettings.urgencyDays));
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    return params;
  }, [filters, matrixSettings]);

  const fetchTasks = useCallback(async () => {
    try {
      const qs = buildParams().toString();
      const res = await fetch(`${API}${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (matrixSettings.medianOverride !== null) params.set('median', String(matrixSettings.medianOverride));
      if (matrixSettings.urgencyDays !== 7) params.set('urgencyDays', String(matrixSettings.urgencyDays));
      const qs = params.toString();
      const res = await fetch(`${API}/stats${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [matrixSettings]);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const createTask = async (task: Record<string, unknown>) => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error('Failed to create task');
    await fetchTasks();
    await fetchStats();
  };

  const updateTask = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update task');
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    await fetchStats();
    return updated;
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (deletedTask) {
      fetch(`${API}/${deletedTask.id}`, { method: 'DELETE' }).catch(() => {});
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    setDeletedTask(taskToDelete);
  };

  const undoDelete = useCallback(() => {
    if (deletedTask) {
      setTasks(prev => [...prev, deletedTask]);
      setDeletedTask(null);
    }
  }, [deletedTask]);

  const dismissUndo = useCallback(async () => {
    if (deletedTask) {
      await fetch(`${API}/${deletedTask.id}`, { method: 'DELETE' }).catch(() => {});
      setDeletedTask(null);
      await fetchStats();
    }
  }, [deletedTask, fetchStats]);

  const filteredTasks = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    stats,
    loading,
    filters,
    setFilters,
    search,
    setSearch,
    createTask,
    updateTask,
    deleteTask,
    deletedTask,
    undoDelete,
    dismissUndo,
    matrixSettings,
    setMatrixSettings,
    refetch: fetchTasks,
  };
}
