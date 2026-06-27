import mongoose, { Schema } from 'mongoose';

const BatchSchema = new Schema(
  {
    name:        { type: String, required: true },
    code:        { type: String, unique: true, default: () => `B-${Date.now()}-${Math.floor(100+Math.random()*900)}` },
    class:       { type: Schema.Types.ObjectId, ref: 'Class' },
    course:      { type: Schema.Types.ObjectId, ref: 'Course' },
    instructor:  { type: Schema.Types.ObjectId, ref: 'User' },
    branch:      { type: Schema.Types.ObjectId, ref: 'Branch' },
    startDate:   { type: Date },
    endDate:     { type: Date },
    schedule:    { type: String },
    maxStudents: { type: Number, default: 60 },
    status:      { type: String, default: 'active' },
    notes:       { type: String },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
