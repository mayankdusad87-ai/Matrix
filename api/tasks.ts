import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tasks, nextId, computeFields, setCors } from './_shared';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const enriched = tasks.map(computeFields);
    if (req.query.owner) return res.json(enriched.filter(t => t.owner === req.query.owner));
    if (req.query.status) return res.json(enriched.filter(t => t.status === req.query.status));
    if (req.query.category) return res.json(enriched.filter(t => t.category === req.query.category));
    if (req.query.quadrant) return res.json(enriched.filter(t => t.quadrant === req.query.quadrant));
    return res.json(enriched);
  }

  if (req.method === 'POST') {
    const task = {
      id: nextId,
      title: req.body.title || '',
      description: req.body.description || '',
      startDate: req.body.startDate,
      dueDate: req.body.dueDate,
      importanceScore: req.body.importanceScore ?? 50,
      status: req.body.status || 'Not Started',
      owner: req.body.owner || 'Unassigned',
      category: req.body.category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    return res.status(201).json(computeFields(task));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
