const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },

  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  cnic: String,
  address: String,
  phone: String,
  profilePhoto: String,
  qualification: String,
  specialization: String,
  experience: Number,
  joiningDate: { type: Date, default: Date.now },

  // Salary configuration
  salaryType: { type: String, enum: ['fixed', 'revenue_share'], required: true, default: 'fixed' },
  fixedSalary: { type: Number, default: 0 },
  revenueSharePercentage: { type: Number, default: 0, min: 0, max: 100 },

  // Courses this teacher handles
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  subjects: [String],

  isActive: { type: Boolean, default: true },
  bankAccount: String,
  bankName: String,
  notes: String,
}, { timestamps: true, toJSON: { virtuals: true } });

teacherSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

teacherSchema.pre('save', async function (next) {
  if (!this.teacherId) {
    const count = await mongoose.model('Teacher').countDocuments();
    this.teacherId = `TCH-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

teacherSchema.index({ branch: 1, isActive: 1 });
module.exports = mongoose.model('Teacher', teacherSchema);
