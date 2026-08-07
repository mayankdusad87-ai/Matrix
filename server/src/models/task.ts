// TypeScript interfaces for the Supabase tasks table (snake_case DB ↔ camelCase API)

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  start_date: string;
  due_date: string;
  importance_score: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  owner: string;
  category: string;
  blocked_by: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskCamel {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  importanceScore: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  owner: string;
  category: string;
  blockedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export function snakeToCamel(row: TaskRow): TaskCamel {
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
    if (['_id', '__v', 'today', 'daysRemaining', 'x', 'y', 'quadrant', 'isOverdue', 'median', 'urgencyDays', 'timelineProgress', 'autoMedian'].includes(key)) continue;
    result[map[key] || key] = value;
  }
  return result;
}
