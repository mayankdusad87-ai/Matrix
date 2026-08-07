import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, snakeToCamel, camelToSnake, computeFields, calculateMedian, calculateDaysRemaining, DEFAULT_URGENCY_DAYS, setCors, type TaskLike } from '../_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = requireAuth(req, res);
  if (!supabase) return; // 401 already sent

  try {
    const id = req.query.id as string;

    // Validate UUID format to prevent injection
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }

    if (req.method === 'GET') {
      const { data: row, error } = await supabase.from('tasks').select('*').eq('id', id).single();
      if (error || !row) return res.status(404).json({ error: 'Task not found' });
      const task = snakeToCamel(row);

      const { data: allData, error: allErr } = await supabase.from('tasks').select('*');
      if (allErr) throw allErr;
      const allTasks = (allData || []).map(snakeToCamel);
      const median = calculateMedian(allTasks.map(t => t.importanceScore));
      const today = new Date();
      const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), DEFAULT_URGENCY_DAYS);
      return res.json(computeFields(task, median, maxDays));
    }

    if (req.method === 'PUT') {
      const updateData = camelToSnake(req.body);
      const { data: row, error } = await supabase.from('tasks').update(updateData).eq('id', id).select().single();
      if (error || !row) return res.status(404).json({ error: 'Task not found' });
      const task = snakeToCamel(row);

      const { data: allData, error: allErr } = await supabase.from('tasks').select('*');
      if (allErr) throw allErr;
      const allTasks = (allData || []).map(snakeToCamel);
      const median = calculateMedian(allTasks.map(t => t.importanceScore));
      const today = new Date();
      const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), DEFAULT_URGENCY_DAYS);
      return res.json(computeFields(task, median, maxDays));
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /tasks/[id] error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
