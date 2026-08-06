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

      const qOwner = req.query.owner as string | undefined;
      const qStatus = req.query.status as string | undefined;
      const qCategory = req.query.category as string | undefined;
      const qQuadrant = req.query.quadrant as string | undefined;
      if (qOwner) enriched = enriched.filter(t => t.owner === qOwner);
      if (qStatus) enriched = enriched.filter(t => t.status === qStatus);
      if (qCategory) enriched = enriched.filter(t => t.category === qCategory);
      if (qQuadrant) enriched = enriched.filter(t => t.quadrant === qQuadrant);

      return res.json(enriched);
    }

    if (req.method === 'POST') {
      const task = await Task.create(req.body);
      const allTasks = await Task.find().lean() as TaskLike[];
      const median = calculateMedian(allTasks.map(t => t.importanceScore));
      const today = new Date();
      const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), DEFAULT_URGENCY_DAYS);
      const plain = task.toObject() as unknown as TaskLike;
      return res.status(201).json(computeFields(plain, median, maxDays));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API /tasks error:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
}
