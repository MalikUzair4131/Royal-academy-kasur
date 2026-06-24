import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  code: string;
  course: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  schedule: string; // e.g., "Mon-Wed-Fri 9AM-11AM"
  maxStudents: number;
  instructor: mongoose.Types.ObjectId;
  branch: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    schedule: { type: String },
    maxStudents: { type: Number, default: 30 },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Batch = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);
