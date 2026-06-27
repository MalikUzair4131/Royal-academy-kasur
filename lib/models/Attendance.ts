import mongoose, { Schema } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    batch:   { type: Schema.Types.ObjectId, ref: 'Batch' },
    class:   { type: Schema.Types.ObjectId, ref: 'Class' },
    date:    { type: Date, default: Date.now },
    status:  { type: String, default: 'present' },
    type:    { type: String, default: 'student' },
    remarks: { type: String },
  },
  { timestamps: true, strict: false }
);

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
