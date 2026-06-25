import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  code: string;
  description?: string;
  branch: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Class = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
