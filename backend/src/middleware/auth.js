const { User } = require('../models/User');
const { verifyAccessToken, getClientIp } = require('../utils/auth');

// ─── Protect: verify JWT ──────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('+customPermissions +useCustomPermissions');

    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' });
    if (user.isLocked) return res.status(403).json({ success: false, message: 'Account locked due to too many failed attempts.' });
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ success: false, message: 'Password recently changed. Please log in again.' });
    }

    req.user = user;
    req.clientIp = getClientIp(req);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please refresh.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── Restrict to roles ────────────────────────────────────────────────────────
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission for this action.' });
  }
  next();
};

// ─── Check module permission ──────────────────────────────────────────────────
const checkPermission = (module, action) => (req, res, next) => {
  if (!req.user.hasPermission(module, action)) {
    return res.status(403).json({
      success: false,
      message: `You don't have ${action} permission for ${module}.`
    });
  }
  next();
};

// ─── Super admin guard – cannot touch owner account ───────────────────────────
const preventOwnerModification = async (req, res, next) => {
  const { User } = require('../models/User');
  const targetUser = await User.findById(req.params.id || req.params.userId);
  if (targetUser?.isOwner && req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Owner account cannot be modified.' });
  }
  if (targetUser?.isOwner && req.user.role === 'super_admin' && !req.user.isOwner) {
    return res.status(403).json({ success: false, message: 'Only the owner can modify the owner account.' });
  }
  req.targetUser = targetUser;
  next();
};

module.exports = { protect, restrictTo, checkPermission, preventOwnerModification };
