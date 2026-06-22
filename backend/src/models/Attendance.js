const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['student', 'teacher'], required: true },

  // For student attendance
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },

  // For teacher attendance
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },

  status: { type: String, enum: ['present', 'absent', 'late', 'leave', 'holiday'], required: true },
  arrivalTime: String,
  leaveTime: String,
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },

  leaveType: { type: String, enum: ['sick', 'casual', 'annual', 'emergency', 'unpaid'] },
  leaveApproved: { type: Boolean, default: false },
  leaveReason: String,

  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String,
}, { timestamps: true });

// One attendance record per student/teacher per date
attendanceSchema.index({ student: 1, date: 1, batch: 1 }, { sparse: true });
attendanceSchema.index({ teacher: 1, date: 1 }, { sparse: true });
attendanceSchema.index({ branch: 1, date: 1, type: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
