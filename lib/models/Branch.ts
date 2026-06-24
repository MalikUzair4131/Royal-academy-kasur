import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    city: { type: String },
    state: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
