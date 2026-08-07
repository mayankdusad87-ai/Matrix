import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, snakeToCamel, computeFields, calculateMedian, calculateDaysRemaining, parseOverrides, setCors } from '../_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = requireAuth(req, res);
  if (!supabase) return; // 401 already sent

  try {
    const { medianOverride, urgencyDays } = parseOverrides(req.query as Record<string, string | string[] | undefined>);

    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    const allTasks = (data || []).map(snakeToCamel);
    const autoMedian = calculateMedian(allTasks.map(t => t.importanceScore));
    const median = medianOverride !== null ? medianOverride : autoMedian;
    const today = new Date();
    const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), urgencyDays);
    const enriched = allTasks.map(t => computeFields(t, median, maxDays, urgencyDays));

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const total = enriched.length;
    const completed = enriched.filter(t => t.status === 'Completed').length;
    const inProgress = enriched.filter(t => t.status === 'In Progress').length;
    const overdue = enriched.filter(t => t.isOverdue && t.status !== 'Completed').length;
    const dueThisWeek = allTasks.filter(t => {
      const due = new Date(t.dueDate);
      return due >= startOfWeek && due <= endOfWeek;
    }).length;

    res.json({ total, completed, inProgress, overdue, dueThisWeek, median, autoMedian, urgencyDays });
  } catch (err) {
    console.error('API /tasks/stats error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
