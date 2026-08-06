import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, Task, computeFields, calculateMedian, calculateDaysRemaining, DEFAULT_URGENCY_DAYS, parseOverrides, setCors, type TaskLike } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      const { medianOverride, urgencyDays } = parseOverrides(req.query as Record<string, string | string[] | undefined>);
      const allTasks = await Task.find().lean() as TaskLike[];
      const autoMedian = calculateMedian(allTasks.map(t => t.importanceScore));
      const median = medianOverride !== null ? medianOverride : autoMedian;
      const today = new Date();
      const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), urgencyDays);
      let enriched = allTasks.map(t => ({ ...computeFields(t, median, maxDays, urgencyDays), autoMedian }));

      if (req.query.owner) enriched = enriched.filter(t => t.owner === req.query.owner);
      if (req.query.status) enriched = enriched.filter(t => t.status === req.query.status);
      if (req.query.category) enriched = enriched.filter(t => t.category === req.query.category);
      if (req.query.quadrant) enriched = enriched.filter(t => t.quadrant === req.query.quadrant);

      return res.json(enriched);
    }

    if (req.method === 'POST') {
      const task = await Task.create(req.body);
      const allTasks = await Task.find().lean() as TaskLike[];
      const median = calculateMedian(allTasks.map(t => t.importanceScore));
      const today = new Date();
      const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), DEFAULT_URGENCY_DAYS);
      return res.status(201).json(computeFields(task.toJSON(), median, maxDays));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /tasks error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
