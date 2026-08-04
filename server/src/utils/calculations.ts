export const URGENCY_THRESHOLD = 7;

export function calculateDaysRemaining(dueDate: Date, today: Date = new Date()): number {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - todayStart.getTime()) / 86400000);
}

export function calculateMedian(scores: number[]): number {
  if (scores.length === 0) return 50;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function determineQuadrant(importanceScore: number, daysRemaining: number, median: number): string {
  const highImportance = importanceScore >= median;
  const urgent = daysRemaining <= URGENCY_THRESHOLD;

  if (highImportance && urgent) return 'Do Now';
  if (highImportance && !urgent) return 'Schedule';
  if (!highImportance && urgent) return 'Delegate';
  return 'Deprioritize';
}

export interface ComputedTaskFields {
  today: string;
  daysRemaining: number;
  x: number;
  y: number;
  quadrant: string;
  isOverdue: boolean;
  median: number;
  timelineProgress: number;
}

export function computeTaskFields(
  dueDate: Date | string,
  importanceScore: number,
  median: number,
  maxDays: number,
  startDate?: Date | string
): ComputedTaskFields {
  const today = new Date();
  const due = new Date(dueDate);
  const daysRemaining = calculateDaysRemaining(due, today);
  const quadrant = determineQuadrant(importanceScore, daysRemaining, median);

  let x: number;
  if (daysRemaining <= 0) {
    x = 100;
  } else if (daysRemaining <= URGENCY_THRESHOLD) {
    x = 70 + (1 - daysRemaining / URGENCY_THRESHOLD) * 30;
  } else {
    const nonUrgentRange = Math.max(maxDays - URGENCY_THRESHOLD, 1);
    x = (1 - (daysRemaining - URGENCY_THRESHOLD) / nonUrgentRange) * 70;
  }
  x = Math.min(100, Math.max(0, Math.round(x * 100) / 100));

  // Timeline progress: how far between startDate → dueDate
  let timelineProgress = 100;
  if (startDate) {
    const start = new Date(startDate);
    const totalDuration = due.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    timelineProgress = totalDuration > 0
      ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
      : 100;
  }

  return {
    today: today.toISOString().split('T')[0],
    daysRemaining,
    x,
    y: importanceScore,
    quadrant,
    isOverdue: daysRemaining < 0,
    median,
    timelineProgress,
  };
}
