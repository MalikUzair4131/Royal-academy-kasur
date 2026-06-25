import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  code: string;
  type: string;
  category?: string;
  description?: string;
  instructor?: mongoose.Types.ObjectId;
  durationMonths?: number;
  admissionFee?: number;
  monthlyFee?: number;
  examFee?: number;
  certificateFee?: number;
  maxStudents?: number;
  branch: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, default: () => `CRS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}` },
    type: { type: String, default: 'training' },
    category: { type: String },
    description: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    durationMonths: { type: Number },
    admissionFee: { type: Number, default: 0 },
    monthlyFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    certificateFee: { type: Number, default: 0 },
    maxStudents: { type: Number, default: 30 },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
