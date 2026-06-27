import mongoose, { Schema } from 'mongoose';

const CourseSchema = new Schema(
  {
    name:        { type: String, required: true },
    code:        { type: String, unique: true, default: () => `CO-${Date.now()}` },
    type:        { type: String, default: 'school' },
    description: { type: String },
    instructor:  { type: Schema.Types.ObjectId, ref: 'User' },
    branch:      { type: Schema.Types.ObjectId, ref: 'Branch' },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
