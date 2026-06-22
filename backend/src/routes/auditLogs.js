// ─── auditLogs.js ─────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models/AuditLog');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.use(restrictTo('super_admin', 'branch_admin'));

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, module, userId, from, to, branch } = req.query;
    const query = {};
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;
    if (action) query.action = action;
    if (module) query.module = module;
    if (userId) query.user = userId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(new Date(to).setHours(23,59,59,999));
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
