/**
 * User model — strict:false so any extra teacher/student fields are stored without errors.
 * Only name + email + password + role required; email unique but duplicate handled gracefully.
 */
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: string;
  branch?: mongoose.Types.ObjectId;
  isActive: boolean;
  teacherId?: string;
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
  permissions: Array<{ module: string; actions: string[] }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name:      { type: String, required: true },
    firstName: { type: String },
    lastName:  { type: String },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    role:      { type: String, default: 'student' },
    branch:    { type: Schema.Types.ObjectId, ref: 'Branch' },
    isActive:  { type: Boolean, default: true },
    teacherId: { type: String },
    phone:     { type: String },
    qualification:         { type: String },
    specialization:        { type: String },
    experience:            { type: Number },
    gender:                { type: String },
    dateOfBirth:           { type: Date },
    cnic:                  { type: String },
    address:               { type: String },
    joiningDate:           { type: Date },
    salaryType:            { type: String, default: 'fixed' },
    fixedSalary:           { type: Number, default: 0 },
    revenueSharePercentage:{ type: Number, default: 0 },
    bankAccount:           { type: String },
    bankName:              { type: String },
    notes:                 { type: String },
    permissions: [{ module: String, actions: [String] }],
  },
  { timestamps: true, strict: false }
);

// Hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (e) { next(e as Error); }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
