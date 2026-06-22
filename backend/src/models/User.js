const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  actions: [{ type: String, enum: ['view', 'create', 'edit', 'delete', 'manage'] }]
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: {
    type: String,
    enum: ['super_admin', 'branch_admin', 'teacher', 'student', 'parent'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  isOwner: { type: Boolean, default: false }, // Owner account cannot be touched by super_admin
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  phone: { type: String, trim: true },
  avatar: { type: String, default: null },

  // Custom permissions override (for super_admin to assign to specific users)
  customPermissions: [permissionSchema],
  useCustomPermissions: { type: Boolean, default: false },

  // Profile references
  studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  teacherProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },

  // Security
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now }, expiresAt: Date }],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastLogin: Date,
  lastLoginIp: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Note: email index is already created by unique: true in schema
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ branch: 1 });

// ─── Virtual: account locked ──────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $unset: { lockUntil: 1 }, $set: { loginAttempts: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// ─── Default permissions per role ─────────────────────────────────────────────
const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: [
    { module: '*', actions: ['view', 'create', 'edit', 'delete', 'manage'] }
  ],
  branch_admin: [
    { module: 'dashboard', actions: ['view', 'manage'] },
    { module: 'students', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'teachers', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'courses', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'fees', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'salary', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'attendance', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'reports', actions: ['view', 'create', 'manage'] },
    { module: 'batches', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
  ],
  teacher: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'students', actions: ['view'] },
    { module: 'attendance', actions: ['view', 'create', 'edit'] },
    { module: 'courses', actions: ['view'] },
    { module: 'salary', actions: ['view'] },
    { module: 'reports', actions: ['view', 'create'] },
  ],
  student: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'fees', actions: ['view'] },
    { module: 'attendance', actions: ['view'] },
    { module: 'courses', actions: ['view'] },
    { module: 'reports', actions: ['view'] },
  ],
  parent: [
    { module: 'dashboard', actions: ['view'] },
    { module: 'fees', actions: ['view'] },
    { module: 'attendance', actions: ['view'] },
    { module: 'reports', actions: ['view'] },
  ]
};

userSchema.methods.getEffectivePermissions = function () {
  if (this.useCustomPermissions && this.customPermissions.length > 0) {
    return this.customPermissions;
  }
  return DEFAULT_ROLE_PERMISSIONS[this.role] || [];
};

userSchema.methods.hasPermission = function (module, action) {
  const perms = this.getEffectivePermissions();
  const superPerm = perms.find(p => p.module === '*');
  if (superPerm) return superPerm.actions.includes(action) || superPerm.actions.includes('manage');
  const modPerm = perms.find(p => p.module === module);
  if (!modPerm) return false;
  return modPerm.actions.includes(action) || modPerm.actions.includes('manage');
};

const User = mongoose.model('User', userSchema);
module.exports = { User, DEFAULT_ROLE_PERMISSIONS };
