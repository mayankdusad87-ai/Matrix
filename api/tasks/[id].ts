import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB, Task, computeFields, calculateMedian, calculateDaysRemaining, URGENCY_THRESHOLD, setCors, type TaskLike } from '../_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();
  const id = req.query.id as string;

  if (req.method === 'GET') {
    const task = await Task.findById(id).lean() as TaskLike | null;
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const allTasks = await Task.find().lean() as TaskLike[];
    const median = calculateMedian(allTasks.map(t => t.importanceScore));
    const today = new Date();
    const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), URGENCY_THRESHOLD);
    return res.json(computeFields(task, median, maxDays));
  }

  if (req.method === 'PUT') {
    const task = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const allTasks = await Task.find().lean() as TaskLike[];
    const median = calculateMedian(allTasks.map(t => t.importanceScore));
    const today = new Date();
    const maxDays = Math.max(...allTasks.map(t => calculateDaysRemaining(t.dueDate, today)), URGENCY_THRESHOLD);
    return res.json(computeFields(task.toJSON(), median, maxDays));
  }

  if (req.method === 'DELETE') {
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
