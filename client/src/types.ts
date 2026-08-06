export interface Task {
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
  today: string;
  daysRemaining: number;
  timelineProgress: number;
  x: number;
  y: number;
  quadrant: string;
  isOverdue: boolean;
  median: number;
  autoMedian?: number;
  urgencyDays?: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  dueThisWeek: number;
  median: number;
  autoMedian?: number;
  urgencyDays?: number;
}

export interface Filters {
  owner: string;
  status: string;
  category: string;
  quadrant: string;
}

export interface MatrixSettings {
  medianOverride: number | null; // null = auto-calculated
  urgencyDays: number;           // default 7
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
