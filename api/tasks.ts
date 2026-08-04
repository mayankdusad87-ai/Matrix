import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, Task, computeFields, calculateMedian, calculateDaysRemaining, URGENCY_THRESHOLD, setCors, type TaskLike } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  if (req.method === 'GET') {
    const allTasks = await Task.find().lean() as TaskLike[];
    const median = calculateMedian(allTasks.map(t => t.importanceScore));
    const today = new Date();
    const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), URGENCY_THRESHOLD);
    let enriched = allTasks.map(t => computeFields(t, median, maxDays));

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
    const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), URGENCY_THRESHOLD);
    return res.status(201).json(computeFields(task.toJSON(), median, maxDays));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
