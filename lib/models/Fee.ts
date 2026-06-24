import mongoose, { Schema, Document } from 'mongoose';

export interface IFee extends Document {
  student: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'pending' | 'partial' | 'paid';
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
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
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
