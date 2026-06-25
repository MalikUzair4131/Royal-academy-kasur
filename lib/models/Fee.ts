import mongoose, { Schema, Document } from 'mongoose';

export interface IFee extends Document {
  receiptNo: string;
  student: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  feeType: string;
  month?: string;
  originalAmount: number;
  netAmount: number;
  amount: number;
  dueDate: Date;
  description?: string;
  notes?: string;
  status: 'pending' | 'partial' | 'paid' | 'waived' | 'cancelled';
  paidAmount: number;
  payments: Array<{
    amount: number;
    date: Date;
    method: string;
    reference: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>(
  {
    receiptNo: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    feeType: { type: String, default: 'monthly' },
    month: { type: String },
    originalAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    description: { type: String },
    notes: { type: String },
    status: { type: String, enum: ['pending', 'partial', 'paid', 'waived', 'cancelled'], default: 'pending' },
    paidAmount: { type: Number, default: 0 },
    payments: [
      {
        amount: { type: Number },
        date: { type: Date, default: Date.now },
        method: { type: String }, // cash, check, online
        reference: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const Fee = mongoose.models.Fee || mongoose.model<IFee>('Fee', FeeSchema);
