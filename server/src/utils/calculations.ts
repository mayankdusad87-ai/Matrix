export function calculateTimelineProgress(startDate: Date, dueDate: Date, today: Date = new Date()): number {
  const taskDuration = dueDate.getTime() - startDate.getTime();
  if (taskDuration <= 0) return 100;
  const elapsed = today.getTime() - startDate.getTime();
  const progress = (elapsed / taskDuration) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

export function calculatePriorityScore(importanceScore: number, timelineProgress: number): number {
  return Math.round((importanceScore * 0.6 + timelineProgress * 0.4) * 100) / 100;
}

export function determineQuadrant(importanceScore: number, timelineProgress: number): string {
  const highImportance = importanceScore >= 72;
  const highUrgency = timelineProgress >= 70;

  if (highImportance && highUrgency) return 'Do';
  if (highImportance && !highUrgency) return 'Schedule';
  if (!highImportance && highUrgency) return 'Delegate';
  return 'Delete';
}

export function isOverdue(dueDate: Date, today: Date = new Date()): boolean {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return today > due;
}

export interface ComputedTaskFields {
  today: string;
  timelineProgress: number;
  x: number;
  y: number;
  priorityScore: number;
  quadrant: string;
  isOverdue: boolean;
}

export function computeTaskFields(
  startDate: Date | string,
  dueDate: Date | string,
  importanceScore: number
): ComputedTaskFields {
  const today = new Date();
  const start = new Date(startDate);
  const due = new Date(dueDate);

  const timelineProgress = calculateTimelineProgress(start, due, today);
  const priorityScore = calculatePriorityScore(importanceScore, timelineProgress);
  const quadrant = determineQuadrant(importanceScore, timelineProgress);

  return {
    today: today.toISOString().split('T')[0],
    timelineProgress,
    x: timelineProgress,
    y: importanceScore,
    priorityScore,
    quadrant,
    isOverdue: isOverdue(due, today),
  };
}
