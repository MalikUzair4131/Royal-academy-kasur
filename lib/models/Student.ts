import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  fatherName: string;
  motherName: string;
  address: string;
  dateOfBirth: Date;
  admissionDate: Date;
  branch: mongoose.Types.ObjectId;
  enrollments: Array<{
    course: mongoose.Types.ObjectId;
    batch: mongoose.Types.ObjectId;
    status: 'enrolled' | 'completed' | 'dropped';
    enrollDate: Date;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    phone: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    admissionDate: { type: Date, default: Date.now },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    enrollments: [
      {
        course: { type: Schema.Types.ObjectId, ref: 'Course' },
        batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
        status: { type: String, enum: ['enrolled', 'completed', 'dropped'], default: 'enrolled' },
        enrollDate: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Student = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
