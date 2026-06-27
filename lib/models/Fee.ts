import mongoose, { Schema, Document } from 'mongoose';

const FeeSchema = new Schema(
  {
    receiptNo:      { type: String, unique: true, default: () => `FEE-${Date.now()}-${Math.floor(100+Math.random()*900)}` },
    student:        { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    batch:          { type: Schema.Types.ObjectId, ref: 'Batch' },
    course:         { type: Schema.Types.ObjectId, ref: 'Course' },
    feeType:        { type: String, default: 'monthly' },
    month:          { type: String },
    originalAmount: { type: Number, default: 0 },
    netAmount:      { type: Number, default: 0 },
    amount:         { type: Number, default: 0 },
    dueDate:        { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) },
    description:    { type: String },
    notes:          { type: String },
    status:         { type: String, default: 'pending' },
    paidAmount:     { type: Number, default: 0 },
    payments: [{
      amount:    { type: Number },
      date:      { type: Date, default: Date.now },
      method:    { type: String, default: 'cash' },
      reference: { type: String },
    }],
  },
  { timestamps: true, strict: false }
);

export const Fee = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
