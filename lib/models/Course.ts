import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  code: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  duration: number; // in weeks
  fee: number;
  branch: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    duration: { type: Number },
    fee: { type: Number, default: 0 },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
