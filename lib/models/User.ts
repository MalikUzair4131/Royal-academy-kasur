import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: 'super_admin' | 'branch_admin' | 'teacher' | 'student' | 'parent';
  branch?: mongoose.Types.ObjectId;
  isActive: boolean;
  teacherId?: string;
  // Teacher-specific fields stored on User for simplicity
  phone?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  gender?: string;
  dateOfBirth?: Date;
  cnic?: string;
  address?: string;
  joiningDate?: Date;
  salaryType?: string;
  fixedSalary?: number;
  revenueSharePercentage?: number;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
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
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'branch_admin', 'teacher', 'student', 'parent'],
      default: 'student',
    },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    isActive: { type: Boolean, default: true },
    teacherId: { type: String },
    // Teacher profile fields
    phone: { type: String },
    qualification: { type: String },
    specialization: { type: String },
    experience: { type: Number },
    gender: { type: String },
    dateOfBirth: { type: Date },
    cnic: { type: String },
    address: { type: String },
    joiningDate: { type: Date },
    salaryType: { type: String, default: 'fixed' },
    fixedSalary: { type: Number, default: 0 },
    revenueSharePercentage: { type: Number, default: 0 },
    bankAccount: { type: String },
    bankName: { type: String },
    notes: { type: String },
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

// Auto-generate teacherId for teacher users if missing
UserSchema.pre('save', async function (next) {
  try {
    if (this.role === 'teacher' && !(this as any).teacherId) {
      (this as any).teacherId = `TEA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
