import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStats, Filters } from '../types';

const API = '/api/tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ owner: '', status: '', category: '', quadrant: '' });

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.owner) params.set('owner', filters.owner);
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.quadrant) params.set('quadrant', filters.quadrant);

      const qs = params.toString();
      const res = await fetch(`${API}${qs ? `?${qs}` : ''}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

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

  const updateTask = async (id: number, updates: Record<string, unknown>) => {
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

  const deleteTask = async (id: number) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetchStats();
  };

  return { tasks, stats, loading, filters, setFilters, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
