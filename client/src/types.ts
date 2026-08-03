export interface Task {
  id: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  importanceScore: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  owner: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  today: string;
  timelineProgress: number;
  x: number;
  y: number;
  priorityScore: number;
  quadrant: string;
  isOverdue: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  avgImportance: number;
  avgPriority: number;
  dueThisWeek: number;
}

export interface Filters {
  owner: string;
  status: string;
  category: string;
  quadrant: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  importanceScore: number;
  status: string;
  owner: string;
  category: string;
}
