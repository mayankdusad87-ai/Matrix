import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  importanceScore: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  owner: string;
  category: string;
  blockedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
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
    blockedBy: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
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

export default mongoose.model<ITask>('Task', taskSchema);
