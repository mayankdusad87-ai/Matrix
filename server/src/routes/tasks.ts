import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import Task from '../models/task';
import { computeTaskFields } from '../utils/calculations';

const router = Router();

function enrichTask(task: Task) {
  const plain = task.toJSON();
  const computed = computeTaskFields(plain.startDate, plain.dueDate, plain.importanceScore);
  return { ...plain, ...computed };
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.findAll();
    const enriched = tasks.map(enrichTask);

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
    const avgImportance = total ? Math.round(enriched.reduce((s, t) => s + t.importanceScore, 0) / total) : 0;
    const avgPriority = total ? Math.round(enriched.reduce((s, t) => s + t.priorityScore, 0) / total) : 0;
    const dueThisWeek = tasks.filter(t => {
      const due = new Date(t.dueDate);
      return due >= startOfWeek && due <= endOfWeek;
    }).length;

    res.json({ total, completed, inProgress, overdue, avgImportance, avgPriority, dueThisWeek });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const where: Record<string, unknown> = {};

    if (req.query.owner) where.owner = req.query.owner;
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;

    if (req.query.startAfter || req.query.startBefore) {
      where.startDate = {};
      if (req.query.startAfter) (where.startDate as Record<string, unknown>)[Op.gte as unknown as string] = req.query.startAfter;
      if (req.query.startBefore) (where.startDate as Record<string, unknown>)[Op.lte as unknown as string] = req.query.startBefore;
    }
    if (req.query.dueAfter || req.query.dueBefore) {
      where.dueDate = {};
      if (req.query.dueAfter) (where.dueDate as Record<string, unknown>)[Op.gte as unknown as string] = req.query.dueAfter;
      if (req.query.dueBefore) (where.dueDate as Record<string, unknown>)[Op.lte as unknown as string] = req.query.dueBefore;
    }

    const tasks = await Task.findAll({ where, order: [['createdAt', 'DESC']] });
    const enriched = tasks.map(enrichTask);

    if (req.query.quadrant) {
      const filtered = enriched.filter(t => t.quadrant === req.query.quadrant);
      res.json(filtered);
      return;
    }

    if (req.query.minPriority || req.query.maxPriority) {
      const min = parseFloat(req.query.minPriority as string) || 0;
      const max = parseFloat(req.query.maxPriority as string) || 100;
      const filtered = enriched.filter(t => t.priorityScore >= min && t.priorityScore <= max);
      res.json(filtered);
      return;
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(enrichTask(task));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(enrichTask(task));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    await task.update(req.body);
    res.json(enrichTask(task));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    await task.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
