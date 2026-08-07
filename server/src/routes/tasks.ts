import { Router, Request, Response } from 'express';
import { supabase } from '../database';
import { snakeToCamel, camelToSnake } from '../models/task';
import { computeTaskFields, calculateMedian, calculateDaysRemaining, DEFAULT_URGENCY_DAYS } from '../utils/calculations';

const router = Router();

/** Parse optional overrides from query params */
function parseOverrides(req: Request) {
  const medianOverride = req.query.median ? Number(req.query.median) : null;
  const urgencyDays = req.query.urgencyDays ? Number(req.query.urgencyDays) : DEFAULT_URGENCY_DAYS;
  return { medianOverride, urgencyDays };
}

async function getAllEnriched(medianOverride: number | null = null, urgencyDays: number = DEFAULT_URGENCY_DAYS) {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) throw error;
  const allTasks = (data || []).map(snakeToCamel);
  const scores = allTasks.map(p => p.importanceScore);
  const autoMedian = calculateMedian(scores);
  const median = medianOverride !== null && !isNaN(medianOverride) ? medianOverride : autoMedian;
  const today = new Date();
  const maxDays = Math.max(
    ...allTasks.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
    urgencyDays
  );
  return allTasks.map(task => ({
    ...task,
    ...computeTaskFields(task.dueDate, task.importanceScore, median, maxDays, task.startDate, urgencyDays),
    autoMedian,
  }));
}

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { medianOverride, urgencyDays } = parseOverrides(req);
    const enriched = await getAllEnriched(medianOverride, urgencyDays);

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
    const autoMedian = enriched.length > 0 ? enriched[0].autoMedian : 50;
    const median = enriched.length > 0 ? enriched[0].median : 50;

    res.json({ total, completed, inProgress, overdue, dueThisWeek, median, autoMedian, urgencyDays });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { medianOverride, urgencyDays } = parseOverrides(req);
    let enriched = await getAllEnriched(medianOverride, urgencyDays);

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
    const { medianOverride, urgencyDays } = parseOverrides(req);
    const enriched = await getAllEnriched(medianOverride, urgencyDays);
    const task = enriched.find(p => p.id === req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const insertData = camelToSnake(req.body);
    const { data: inserted, error } = await supabase.from('tasks').insert(insertData).select().single();
    if (error) throw error;
    const task = snakeToCamel(inserted);

    // Re-fetch all to compute with updated median
    const { data: allData, error: allErr } = await supabase.from('tasks').select('*');
    if (allErr) throw allErr;
    const allTasks = (allData || []).map(snakeToCamel);
    const median = calculateMedian(allTasks.map(p => p.importanceScore));
    const today = new Date();
    const maxDays = Math.max(
      ...allTasks.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
      DEFAULT_URGENCY_DAYS
    );
    res.status(201).json({
      ...task,
      ...computeTaskFields(task.dueDate, task.importanceScore, median, maxDays, task.startDate),
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updateData = camelToSnake(req.body);
    const { data: updated, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !updated) { res.status(404).json({ error: 'Task not found' }); return; }
    const task = snakeToCamel(updated);

    const { data: allData, error: allErr } = await supabase.from('tasks').select('*');
    if (allErr) throw allErr;
    const allTasks = (allData || []).map(snakeToCamel);
    const median = calculateMedian(allTasks.map(p => p.importanceScore));
    const today = new Date();
    const maxDays = Math.max(
      ...allTasks.map(p => calculateDaysRemaining(new Date(p.dueDate), today)),
      DEFAULT_URGENCY_DAYS
    );
    res.json({
      ...task,
      ...computeTaskFields(task.dueDate, task.importanceScore, median, maxDays, task.startDate),
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
