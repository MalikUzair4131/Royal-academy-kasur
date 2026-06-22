const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, trim: true },
  description: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  type: { type: String, enum: ['school', 'training'], default: 'training' },
  duration: String, // e.g. "3 months", "6 months"
  durationMonths: Number,
  category: String, // e.g. "IT', 'Business', 'Language'
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },

  // Fee structure
  admissionFee: { type: Number, default: 0 },
  monthlyFee: { type: Number, default: 0 },
  examFee: { type: Number, default: 0 },
  certificateFee: { type: Number, default: 0 },
  totalFee: { type: Number, default: 0 }, // for lump-sum courses

  isActive: { type: Boolean, default: true },
  maxStudents: { type: Number, default: 30 },
  thumbnail: String,
  syllabus: String,
  outcomes: [String],
}, { timestamps: true });

courseSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Course').countDocuments();
    this.code = `CRS-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

courseSchema.index({ branch: 1, isActive: 1 });
const Course = mongoose.model('Course', courseSchema);

// ─── Batch Model ──────────────────────────────────────────────────────────────
const timetableSlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  startTime: String,
  endTime: String,
  room: String,
}, { _id: false });

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  batchCode: { type: String, unique: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  maxStudents: { type: Number, default: 20 },
  timetable: [timetableSlotSchema],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  notes: String,
}, { timestamps: true });

batchSchema.virtual('studentCount').get(function () { return this.students.length; });

batchSchema.pre('save', async function (next) {
  if (!this.batchCode) {
    const count = await mongoose.model('Batch').countDocuments();
    this.batchCode = `BCH-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

batchSchema.index({ course: 1, branch: 1 });
const Batch = mongoose.model('Batch', batchSchema);

module.exports = { Course, Batch };
