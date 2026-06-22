const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  method: { type: String, enum: ['cash', 'bank_transfer', 'cheque', 'online'], default: 'cash' },
  reference: String,
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiptNo: String,
  notes: String,
}, { _id: true });

const feeSchema = new mongoose.Schema({
  // Identifiers
  receiptNo: { type: String, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },

  // Fee details
  feeType: {
    type: String,
    enum: ['admission', 'monthly', 'exam', 'certificate', 'custom', 'scholarship_adjustment'],
    required: true
  },
  description: String,
  month: String, // e.g. "2024-01" for monthly fees
  dueDate: { type: Date, required: true },

  // Amounts
  originalAmount: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0 },
  scholarshipDiscount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true }, // originalAmount - discounts

  // Payment tracking
  paidAmount: { type: Number, default: 0 },
  payments: [paymentSchema],

  // Status
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'waived', 'cancelled'],
    default: 'pending'
  },
  isOverdue: { type: Boolean, default: false },
  overduedays: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },

  // For revenue sharing teacher calculation
  teacherRevShare: { type: Number, default: 0 }, // amount going to teacher
  academyShare: { type: Number, default: 0 }, // amount kept by academy

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
}, { timestamps: true, toJSON: { virtuals: true } });

feeSchema.virtual('balance').get(function () {
  return Math.max(0, this.netAmount - this.paidAmount);
});

feeSchema.virtual('isFullyPaid').get(function () {
  return this.paidAmount >= this.netAmount;
});

// Auto-generate receiptNo and compute net amount
feeSchema.pre('save', async function (next) {
  if (!this.receiptNo) {
    const count = await mongoose.model('Fee').countDocuments();
    const d = new Date();
    this.receiptNo = `RCP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(5,'0')}`;
  }

  // Compute net amount
  const disc = (this.originalAmount * this.discountPercentage) / 100;
  this.discountAmount = Math.round(disc);
  this.netAmount = Math.max(0, this.originalAmount - this.discountAmount - (this.scholarshipDiscount || 0));

  // Update paid amount from payments array
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);

  // Determine status
  if (this.paidAmount <= 0) {
    this.status = new Date() > this.dueDate ? 'overdue' : 'pending';
  } else if (this.paidAmount >= this.netAmount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }

  // Overdue calculation
  if (new Date() > this.dueDate && this.status !== 'paid') {
    this.isOverdue = true;
    this.overduedays = Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  }

  next();
});

feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ branch: 1, dueDate: 1 });
feeSchema.index({ receiptNo: 1 });
feeSchema.index({ month: 1, feeType: 1 });

module.exports = mongoose.model('Fee', feeSchema);
