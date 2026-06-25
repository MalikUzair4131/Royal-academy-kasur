import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  fatherName: string;
  motherName: string;
  address: string;
  dateOfBirth: Date;
  admissionDate: Date;
  branch: mongoose.Types.ObjectId;
  class?: mongoose.Types.ObjectId;
  section?: string;
  rollNumber?: string;
  scholarshipType?: string;
  scholarshipPercentage?: number;
  cnic?: string;
  gender?: string;
  city?: string;
  guardians?: Array<{ name: string; phone?: string; relationship?: string }>;
  notes?: string;
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
    email: { type: String, lowercase: true },
    phone: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    admissionDate: { type: Date, default: Date.now },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    class: { type: Schema.Types.ObjectId, ref: 'Class' },
    section: { type: String },
    rollNumber: { type: String },
    scholarshipType: { type: String, default: 'none' },
    scholarshipPercentage: { type: Number, default: 0 },
    cnic: { type: String },
    gender: { type: String },
    city: { type: String },
    guardians: [
      {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String },
      },
    ],
    notes: { type: String },
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
