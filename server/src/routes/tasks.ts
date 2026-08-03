import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import Task from '../models/task';
import { computeTaskFields, calculateMedian } from '../utils/calculations';

const router = Router();

async function getAllEnriched() {
  const allTasks = await Task.findAll();
  const plains = allTasks.map(t => t.toJSON());
  const scores = plains.map(p => p.importanceScore);
  const median = calculateMedian(scores);
  return plains.map(plain => ({
    ...plain,
    ...computeTaskFields(plain.startDate, plain.dueDate, plain.importanceScore, median),
  }));
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const enriched = await getAllEnriched();

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
    const dueThisWeek = enriched.filter(t => {
      const due = new Date(t.dueDate);
      return due >= startOfWeek && due <= endOfWeek;
    }).length;
    const median = enriched.length > 0 ? enriched[0].median : 50;

    res.json({ total, completed, inProgress, overdue, dueThisWeek, median });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    let enriched = await getAllEnriched();

    if (req.query.owner) enriched = enriched.filter(t => t.owner === req.query.owner);
    if (req.query.status) enriched = enriched.filter(t => t.status === req.query.status);
    if (req.query.category) enriched = enriched.filter(t => t.category === req.query.category);
    if (req.query.quadrant) enriched = enriched.filter(t => t.quadrant === req.query.quadrant);

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const allTasks = await Task.findAll();
    const plains = allTasks.map(t => t.toJSON());
    const median = calculateMedian(plains.map(p => p.importanceScore));
    const plain = plains.find(p => p.id === parseInt(req.params.id));
    if (!plain) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ ...plain, ...computeTaskFields(plain.startDate, plain.dueDate, plain.importanceScore, median) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    const allTasks = await Task.findAll();
    const plains = allTasks.map(t => t.toJSON());
    const median = calculateMedian(plains.map(p => p.importanceScore));
    const plain = task.toJSON();
    res.status(201).json({ ...plain, ...computeTaskFields(plain.startDate, plain.dueDate, plain.importanceScore, median) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    await task.update(req.body);
    const allTasks = await Task.findAll();
    const plains = allTasks.map(t => t.toJSON());
    const median = calculateMedian(plains.map(p => p.importanceScore));
    const plain = task.toJSON();
    res.json({ ...plain, ...computeTaskFields(plain.startDate, plain.dueDate, plain.importanceScore, median) });
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
