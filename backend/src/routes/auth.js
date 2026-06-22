const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Branch } = require('../models/AuditLog');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, createAuditLog, getClientIp } = require('../utils/auth');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  const ip = getClientIp(req);

  try {
    const user = await User.findOne({ email }).select('+password +refreshTokens +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.isLocked) {
      return res.status(423).json({ success: false, message: 'Account locked. Try again in 2 hours or contact admin.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await createAuditLog({ userName: email, userRole: 'unknown', action: 'login', module: 'auth', description: 'Failed login attempt', ipAddress: ip, success: false, errorMessage: 'Invalid credentials' });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Reset login attempts on success
    await User.findByIdAndUpdate(user._id, { loginAttempts: 0, $unset: { lockUntil: 1 }, lastLogin: new Date(), lastLoginIp: ip });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date()).slice(-5);
    user.refreshTokens.push({ token: refreshToken, expiresAt: refreshExpiry });
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      user: user._id, userName: user.name, userRole: user.role,
      action: 'login', module: 'auth', description: 'User logged in successfully',
      ipAddress: ip, userAgent: req.headers['user-agent'], success: true
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          branch: user.branch,
          avatar: user.avatar,
          permissions: user.getEffectivePermissions(),
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token.' });

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

    const stored = user.refreshTokens.find(t => t.token === token && t.expiresAt > new Date());
    if (!stored) return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });

    const accessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== token);
    user.refreshTokens.push({ token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', protect, async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token } }
    });
  }
  res.clearCookie('refreshToken');
  await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'logout', module: 'auth', description: 'User logged out', ipAddress: req.clientIp, success: true });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('branch', 'name code city')
    .populate('studentProfile')
    .populate('teacherProfile');

  res.json({
    success: true,
    data: {
      ...user.toObject(),
      permissions: user.getEffectivePermissions(),
    }
  });
});

// ─── PATCH /api/auth/change-password ──────────────────────────────────────────
router.patch('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

  user.password = newPassword;
  await user.save();

  await createAuditLog({ user: user._id, userName: user.name, userRole: user.role, action: 'password_reset', module: 'auth', description: 'User changed own password', ipAddress: req.clientIp, success: true });

  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = router;
