import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'branch_admin' | 'teacher' | 'student' | 'parent';
  branch?: mongoose.Types.ObjectId;
  isActive: boolean;
  permissions: Array<{
    module: string;
    actions: ('view' | 'create' | 'edit' | 'delete' | 'manage')[];
  }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'branch_admin', 'teacher', 'student', 'parent'],
      default: 'student',
    },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    isActive: { type: Boolean, default: true },
    permissions: [
      {
        module: String,
        actions: [String],
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
