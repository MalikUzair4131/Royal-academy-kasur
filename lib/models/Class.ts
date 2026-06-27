import mongoose, { Schema } from 'mongoose';

const ClassSchema = new Schema(
  {
    name:        { type: String, required: true },
    code:        { type: String, unique: true, default: () => `CL-${Date.now()}-${Math.floor(100+Math.random()*900)}` },
    description: { type: String },
    branch:      { type: Schema.Types.ObjectId, ref: 'Branch' },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
