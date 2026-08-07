import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase Client (cached for Vercel serverless) ---
let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY env vars must be set');
  supabase = createClient(url, key);
  return supabase;
}

// --- Snake ↔ Camel mapping ---
interface SnakeCaseTask {
  id: string;
  title: string;
  description: string;
  start_date: string;
  due_date: string;
  importance_score: number;
  status: string;
  owner: string;
  category: string;
  blocked_by: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskLike {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  importanceScore: number;
  status: string;
  owner: string;
  category: string;
  blockedBy: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export function snakeToCamel(row: SnakeCaseTask): TaskLike {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    dueDate: row.due_date,
    importanceScore: row.importance_score,
    status: row.status,
    owner: row.owner,
    category: row.category,
    blockedBy: row.blocked_by || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function camelToSnake(data: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    startDate: 'start_date',
    dueDate: 'due_date',
    importanceScore: 'importance_score',
    blockedBy: 'blocked_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip computed fields that don't exist in the DB
    if (['_id', '__v', 'today', 'daysRemaining', 'x', 'y', 'quadrant', 'isOverdue', 'median', 'urgencyDays', 'timelineProgress', 'autoMedian'].includes(key)) continue;
    result[map[key] || key] = value;
  }
  return result;
}

// --- Calculations ---
export const DEFAULT_URGENCY_DAYS = 7;

export function calculateDaysRemaining(dueDate: string | Date, today: Date = new Date()): number {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - todayStart.getTime()) / 86400000);
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function determineQuadrant(importanceScore: number, daysRemaining: number, median: number, urgencyDays: number): string {
  const highImportance = importanceScore >= median;
  const urgent = daysRemaining <= urgencyDays;
  if (highImportance && urgent) return 'Do Now';
  if (highImportance && !urgent) return 'Schedule';
  if (!highImportance && urgent) return 'Delegate';
  return 'Deprioritize';
}

export function computeFields(task: TaskLike, median: number, maxDays: number, urgencyDays: number = DEFAULT_URGENCY_DAYS) {
  const today = new Date();
  const daysRemaining = calculateDaysRemaining(task.dueDate, today);
  const quadrant = determineQuadrant(task.importanceScore, daysRemaining, median, urgencyDays);

  let x: number;
  if (daysRemaining <= 0) {
    x = 100;
  } else if (daysRemaining <= urgencyDays) {
    x = 70 + (1 - daysRemaining / urgencyDays) * 30;
  } else {
    const nonUrgentRange = Math.max(maxDays - urgencyDays, 1);
    x = (1 - (daysRemaining - urgencyDays) / nonUrgentRange) * 70;
  }
  x = Math.min(100, Math.max(0, Math.round(x * 100) / 100));

  // Timeline progress: how far between startDate → dueDate
  const startDate = task.startDate ? new Date(task.startDate) : null;
  const dueDate = new Date(task.dueDate);
  let timelineProgress = 100;
  if (startDate) {
    const totalDuration = dueDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    timelineProgress = totalDuration > 0
      ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
      : 100;
  }

  return {
    ...task,
    today: today.toISOString().split('T')[0],
    daysRemaining,
    x,
    y: task.importanceScore,
    quadrant,
    isOverdue: daysRemaining < 0,
    median,
    urgencyDays,
    timelineProgress,
  };
}

/** Parse optional median & urgencyDays overrides from query params */
export function parseOverrides(query: Record<string, string | string[] | undefined>) {
  const medianOverride = query.median ? Number(query.median) : null;
  const urgencyDays = query.urgencyDays ? Number(query.urgencyDays) : DEFAULT_URGENCY_DAYS;
  return { medianOverride: medianOverride !== null && !isNaN(medianOverride) ? medianOverride : null, urgencyDays };
}

export function setCors(res: { setHeader: (key: string, value: string) => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
