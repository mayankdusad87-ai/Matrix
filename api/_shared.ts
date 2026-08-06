import mongoose from 'mongoose';

// --- MongoDB Connection (cached for Vercel serverless) ---
let cached: typeof mongoose | null = null;

export async function connectDB() {
  if (cached) return cached;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI env var is not set in Vercel');
  cached = await mongoose.connect(uri, {
    bufferCommands: false,
  });
  return cached;
}

// --- Mongoose Task Model ---
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    importanceScore: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
      default: 'Not Started',
    },
    owner: { type: String, default: 'Unassigned' },
    category: { type: String, default: 'General' },
    blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret.__v;
      },
    },
  }
);

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

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

export interface TaskLike {
  dueDate: string;
  importanceScore: number;
  startDate?: string;
  _id?: unknown;
  id?: unknown;
  [key: string]: unknown;
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
    id: task._id || task.id,
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
