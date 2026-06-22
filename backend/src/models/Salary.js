const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  month: { type: String, required: true }, // "2024-01"
  year: { type: Number, required: true },

  salaryType: { type: String, enum: ['fixed', 'revenue_share'], required: true },

  // Fixed salary
  fixedAmount: { type: Number, default: 0 },

  // Revenue sharing
  totalFeesCollected: { type: Number, default: 0 },   // total student fees in that month for teacher's courses
  revenueSharePercentage: { type: Number, default: 0 },
  teacherEarning: { type: Number, default: 0 },        // fees * share%
  academyEarning: { type: Number, default: 0 },        // fees - teacher earning

  // Deductions & bonuses
  deductions: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductionReason: String,
  bonusReason: String,

  // Totals
  grossSalary: { type: Number, default: 0 }, // fixedAmount OR teacherEarning
  netSalary: { type: Number, default: 0 },   // grossSalary + bonus - deductions

  // Attendance-based deduction for fixed salary
  workingDays: { type: Number, default: 0 },
  presentDays: { type: Number, default: 0 },
  perDaySalary: { type: Number, default: 0 },
  absenceDeduction: { type: Number, default: 0 },

  status: { type: String, enum: ['pending', 'processed', 'paid', 'on_hold'], default: 'pending' },
  paidAt: Date,
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'cheque'], default: 'bank_transfer' },
  paymentReference: String,

  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date,
  notes: String,
}, { timestamps: true });

// Auto-calculate net salary
salarySchema.pre('save', function (next) {
  if (this.salaryType === 'fixed') {
    this.grossSalary = this.fixedAmount - (this.absenceDeduction || 0);
  } else {
    this.grossSalary = this.teacherEarning;
    this.academyEarning = this.totalFeesCollected - this.teacherEarning;
  }
  this.netSalary = Math.max(0, this.grossSalary + (this.bonus || 0) - (this.deductions || 0));
  next();
});

salarySchema.index({ teacher: 1, month: 1 }, { unique: true });
salarySchema.index({ branch: 1, month: 1 });
salarySchema.index({ status: 1 });

module.exports = mongoose.model('Salary', salarySchema);
