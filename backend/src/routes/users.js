const express = require('express');
const router = express.Router();
const { User, DEFAULT_ROLE_PERMISSIONS } = require('../models/User');
const { protect, restrictTo, preventOwnerModification } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// All routes require authentication
router.use(protect);

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', restrictTo('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const { role, isActive, branch, page = 1, limit = 20, search } = req.query;
    const query = {};

    // Branch admins only see their branch users
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshTokens -passwordResetToken')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/users ─────────────────────────────────────────────────────────
router.post('/', restrictTo('super_admin', 'branch_admin'), [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['branch_admin', 'teacher', 'student', 'parent']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    // Branch admins cannot create super_admin
    if (req.user.role === 'branch_admin' && req.body.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot create super admin.' });
    }

    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;
    const user = await User.create({ ...req.body, branch });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'create', module: 'users', resourceId: user._id, resourceType: 'User',
      description: `Created user: ${user.name} (${user.role})`, ipAddress: req.clientIp
    });

    res.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', restrictTo('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens')
      .populate('branch', 'name code');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id', restrictTo('super_admin', 'branch_admin'), preventOwnerModification, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'avatar', 'branch', 'isActive', 'role'];
    if (req.user.role === 'super_admin') allowedFields.push('customPermissions', 'useCustomPermissions');

    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const oldUser = await User.findById(req.params.id);
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'update', module: 'users', resourceId: user._id, resourceType: 'User',
      description: `Updated user: ${user.name}`, oldValues: oldUser?.toObject(), newValues: user.toObject(),
      ipAddress: req.clientIp
    });

    res.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/users/:id/toggle-active ──────────────────────────────────────
router.patch('/:id/toggle-active', restrictTo('super_admin', 'branch_admin'), preventOwnerModification, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    // Invalidate all refresh tokens on deactivation
    if (!user.isActive) user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: user.isActive ? 'activate' : 'deactivate', module: 'users',
      resourceId: user._id, resourceType: 'User',
      description: `${user.isActive ? 'Activated' : 'Deactivated'} user: ${user.name}`,
      ipAddress: req.clientIp
    });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/users/:id/reset-password ─────────────────────────────────────
router.patch('/:id/reset-password', restrictTo('super_admin', 'branch_admin'), preventOwnerModification, [
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = req.body.newPassword;
    user.refreshTokens = []; // Force re-login
    await user.save();

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'password_reset', module: 'users', resourceId: user._id, resourceType: 'User',
      description: `Admin reset password for: ${user.name}`, ipAddress: req.clientIp
    });

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/users/:id/permissions ────────────────────────────────────────
router.patch('/:id/permissions', restrictTo('super_admin'), async (req, res) => {
  try {
    const { permissions, useCustomPermissions } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id,
      { customPermissions: permissions, useCustomPermissions },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'permission_change', module: 'users', resourceId: user._id,
      description: `Changed permissions for: ${user.name}`, ipAddress: req.clientIp
    });

    res.json({ success: true, message: 'Permissions updated.', data: user.getEffectivePermissions() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', restrictTo('super_admin'), preventOwnerModification, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'delete', module: 'users', resourceId: req.params.id,
      description: `Deleted user: ${user.name} (${user.role})`, ipAddress: req.clientIp
    });

    res.json({ success: true, message: 'User deleted permanently.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
