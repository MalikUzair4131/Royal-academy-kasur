import mongoose, { Schema } from 'mongoose';

const SalarySchema = new Schema(
  {
    employee:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month:        { type: Date },
    baseSalary:   { type: Number, default: 0 },
    deductions:   { type: Number, default: 0 },
    bonuses:      { type: Number, default: 0 },
    totalSalary:  { type: Number, default: 0 },
    status:       { type: String, default: 'processed' },
    paidDate:     { type: Date },
  },
  { timestamps: true, strict: false }
);

export const Salary = mongoose.models.Salary || mongoose.model('Salary', SalarySchema);
