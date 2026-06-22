const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AuditLog } = require('../models/AuditLog');

// ─── Token Generation ─────────────────────────────────────────────────────────
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// ─── Audit Logging Helper ─────────────────────────────────────────────────────
const createAuditLog = async (data) => {
  try {
    await AuditLog.create(data);
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
};

// ─── Get IP from request ──────────────────────────────────────────────────────
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection?.remoteAddress ||
         req.ip || 'unknown';
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createAuditLog,
  getClientIp,
};
