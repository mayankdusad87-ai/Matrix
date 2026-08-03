import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tasks, computeFields, setCors } from '../_shared';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = parseInt(req.query.id as string);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  if (req.method === 'GET') {
    return res.json(computeFields(tasks[taskIndex]));
  }

  if (req.method === 'PUT') {
    const task = tasks[taskIndex];
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.startDate !== undefined) task.startDate = req.body.startDate;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.importanceScore !== undefined) task.importanceScore = req.body.importanceScore;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.owner !== undefined) task.owner = req.body.owner;
    if (req.body.category !== undefined) task.category = req.body.category;
    task.updatedAt = new Date().toISOString();
    return res.json(computeFields(task));
  }

  if (req.method === 'DELETE') {
    tasks.splice(taskIndex, 1);
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
