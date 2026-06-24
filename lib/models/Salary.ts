import mongoose, { Schema, Document } from 'mongoose';

export interface ISalary extends Document {
  employee: mongoose.Types.ObjectId;
  month: Date;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  totalSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paidDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalarySchema = new Schema<ISalary>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Date, required: true },
    baseSalary: { type: Number, required: true },
    deductions: { type: Number, default: 0 },
    bonuses: { type: Number, default: 0 },
    totalSalary: { type: Number },
    status: { type: String, enum: ['pending', 'processed', 'paid'], default: 'pending' },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

SalarySchema.pre('save', function (next) {
  this.totalSalary = this.baseSalary + this.bonuses - this.deductions;
  next();
});

export const Salary = mongoose.models.Salary || mongoose.model<ISalary>('Salary', SalarySchema);
