import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'leave' | 'late';
  type?: 'student' | 'teacher';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave', 'late'], default: 'absent' },
    type: { type: String, enum: ['student', 'teacher'] },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
