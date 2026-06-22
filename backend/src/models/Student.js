const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, enum: ['father', 'mother', 'guardian'], default: 'father' },
  phone: String,
  email: String,
  occupation: String,
  cnic: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const enrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: Date,
  status: { type: String, enum: ['active', 'completed', 'dropped', 'on_hold'], default: 'active' },
  certificateIssued: { type: Boolean, default: false },
  certificateNo: String,
}, { _id: true });

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true }, // Auto-generated
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },

  // Personal Info
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  cnic: String,
  address: String,
  city: String,
  phone: String,
  profilePhoto: String,
  bloodGroup: String,

  // Academic
  admissionDate: { type: Date, default: Date.now },
  admissionNo: { type: String, unique: true, sparse: true },
  class: String, // For school management
  section: String,
  rollNumber: String,
  previousSchool: String,
  academicYear: String,

  // Training Institute
  enrollments: [enrollmentSchema],

  // Scholarship
  scholarshipType: { type: String, enum: ['none', 'partial', 'full'], default: 'none' },
  scholarshipPercentage: { type: Number, default: 0, min: 0, max: 100 },
  scholarshipReason: String,

  // Guardian
  guardians: [guardianSchema],

  // Documents
  documents: [documentSchema],

  // Metadata
  isActive: { type: Boolean, default: true },
  notes: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Auto-generate studentId
studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `RA-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

studentSchema.index({ branch: 1, isActive: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ user: 1 });

module.exports = mongoose.model('Student', studentSchema);
