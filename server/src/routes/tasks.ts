import { Router, Request, Response } from 'express';
import Task from '../models/task';
import { computeTaskFields, calculateMedian, calculateDaysRemaining, URGENCY_THRESHOLD } from '../utils/calculations';

const router = Router();

async function getAllEnriched() {
  const allTasks = await Task.find().lean();
  const plains = allTasks.map(t => ({ ...t, id: t._id }));
  const scores = plains.map(p => p.importanceScore);
  const median = calculateMedian(scores);
  const today = new Date();
  const maxDays = Math.max(
    ...plains.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
    URGENCY_THRESHOLD
  );
  return plains.map(plain => ({
    ...plain,
    ...computeTaskFields(plain.dueDate, plain.importanceScore, median, maxDays),
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
    const allTasks = await Task.find().lean();
    const plains = allTasks.map(t => ({ ...t, id: t._id }));
    const median = calculateMedian(plains.map(p => p.importanceScore));
    const today = new Date();
    const maxDays = Math.max(
      ...plains.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
      URGENCY_THRESHOLD
    );
    const plain = plains.find(p => String(p._id) === req.params.id);
    if (!plain) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ ...plain, ...computeTaskFields(plain.dueDate, plain.importanceScore, median, maxDays) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    const allTasks = await Task.find().lean();
    const plains = allTasks.map(t => ({ ...t, id: t._id }));
    const median = calculateMedian(plains.map(p => p.importanceScore));
    const today = new Date();
    const maxDays = Math.max(
      ...plains.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
      URGENCY_THRESHOLD
    );
    const plain = task.toJSON();
    res.status(201).json({ ...plain, ...computeTaskFields(plain.dueDate, plain.importanceScore, median, maxDays) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    const allTasks = await Task.find().lean();
    const plains = allTasks.map(t => ({ ...t, id: t._id }));
    const median = calculateMedian(plains.map(p => p.importanceScore));
    const today = new Date();
    const maxDays = Math.max(
      ...plains.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
      URGENCY_THRESHOLD
    );
    const plain = task.toJSON();
    res.json({ ...plain, ...computeTaskFields(plain.dueDate, plain.importanceScore, median, maxDays) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
