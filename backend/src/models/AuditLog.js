const mongoose = require('mongoose');

// ─── Audit Log ────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  action: {
    type: String,
    enum: ['login', 'logout', 'create', 'update', 'delete', 'view', 'export',
           'activate', 'deactivate', 'password_reset', 'permission_change',
           'payment', 'salary_process', 'attendance_mark', 'fee_generate'],
    required: true
  },
  module: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceType: String,
  description: String,
  oldValues: mongoose.Schema.Types.Mixed,
  newValues: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  success: { type: Boolean, default: true },
  errorMessage: String,
}, { timestamps: true });

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ branch: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ─── Branch Model ─────────────────────────────────────────────────────────────
const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true },
  address: String,
  city: String,
  phone: String,
  email: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  logoUrl: String,
  establishedDate: Date,
  type: { type: String, enum: ['school', 'training_institute', 'both'], default: 'both' },
}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema);

module.exports = { AuditLog, Branch };
