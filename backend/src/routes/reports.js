// reports.js
const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Salary = require('../models/Salary');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

// Profit & Loss report
router.get('/profit-loss', checkPermission('reports', 'view'), async (req, res) => {
  try {
    const { month } = req.query;
    const branchQuery = req.user.branch ? { branch: req.user.branch } : {};
    const monthQuery = month ? { month } : {};

    const [collections, salaries] = await Promise.all([
      Fee.aggregate([
        { $match: { ...branchQuery, ...(month ? { month } : {}) } },
        { $group: { _id: null, revenue: { $sum: '$paidAmount' }, academyShare: { $sum: '$academyShare' } } }
      ]),
      Salary.aggregate([
        { $match: { ...branchQuery, ...(month ? { month } : {}), status: 'paid' } },
        { $group: { _id: null, totalSalary: { $sum: '$netSalary' } } }
      ])
    ]);

    const revenue = collections[0]?.revenue || 0;
    const salaryExpense = salaries[0]?.totalSalary || 0;
    const profit = revenue - salaryExpense;

    res.json({ success: true, data: { revenue, salaryExpense, profit, profitMargin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fee collection report
router.get('/fee-collection', checkPermission('reports', 'view'), async (req, res) => {
  try {
    const { from, to, branch } = req.query;
    const match = {};
    if (req.user.role === 'branch_admin') match.branch = req.user.branch;
    else if (branch) match.branch = branch;
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(new Date(to).setHours(23,59,59,999));
    }

    const data = await Fee.aggregate([
      { $match: match },
      { $group: {
        _id: '$feeType',
        due: { $sum: '$netAmount' },
        collected: { $sum: '$paidAmount' },
        pending: { $sum: { $subtract: ['$netAmount', '$paidAmount'] } },
        count: { $sum: 1 }
      }}
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Attendance report
router.get('/attendance', checkPermission('reports', 'view'), async (req, res) => {
  try {
    const { month, type = 'student', branch } = req.query;
    const [y, m] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const match = { type, date: { $gte: new Date(y, m-1, 1), $lte: new Date(y, m, 0, 23, 59, 59) } };
    if (req.user.role === 'branch_admin') match.branch = req.user.branch;
    else if (branch) match.branch = branch;

    const groupField = type === 'student' ? '$student' : '$teacher';
    const data = await Attendance.aggregate([
      { $match: match },
      { $group: {
        _id: groupField,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
      }},
      { $project: { total: 1, present: 1, absent: 1, percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
      { $sort: { percentage: 1 } }
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
