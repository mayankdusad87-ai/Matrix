import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tasks, computeFields, calculateMedian, setCors } from '../_shared';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const median = calculateMedian(tasks.map(t => t.importanceScore));
  const enriched = tasks.map(t => computeFields(t, median));

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
  const dueThisWeek = tasks.filter(t => {
    const due = new Date(t.dueDate);
    return due >= startOfWeek && due <= endOfWeek;
  }).length;

  res.json({ total, completed, inProgress, overdue, dueThisWeek, median });
}
