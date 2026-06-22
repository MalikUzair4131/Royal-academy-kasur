// ─── dashboard.js ─────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const { Course, Batch } = require('../models/Course');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const branch = req.user.branch;
    const branchQuery = branch ? { branch } : {};

    // Today
    const today = new Date();
    const todayStart = new Date(today.setHours(0,0,0,0));
    const todayEnd = new Date(today.setHours(23,59,59,999));

    // Current month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalStudents, totalTeachers, activeCourses, activeBatches,
      todayCollection, monthlyCollection, pendingFees,
      overdueCount, todayAttendance, unpaidSalaries
    ] = await Promise.all([
      Student.countDocuments({ ...branchQuery, isActive: true }),
      Teacher.countDocuments({ ...branchQuery, isActive: true }),
      Course.countDocuments({ ...branchQuery, isActive: true }),
      Batch.countDocuments({ ...branchQuery, status: 'active' }),
      Fee.aggregate([
        { $match: { ...branchQuery } },
        { $unwind: '$payments' },
        { $match: { 'payments.paidAt': { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ]),
      Fee.aggregate([
        { $match: { ...branchQuery } },
        { $unwind: '$payments' },
        { $match: { 'payments.paidAt': { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ]),
      Fee.aggregate([
        { $match: { ...branchQuery, status: { $in: ['pending', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$netAmount', '$paidAmount'] } } } }
      ]),
      Fee.countDocuments({ ...branchQuery, isOverdue: true, status: { $ne: 'paid' } }),
      Attendance.aggregate([
        { $match: { ...branchQuery, type: 'student', date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: {
          _id: '$status', count: { $sum: 1 }
        }}
      ]),
      Salary.aggregate([
        { $match: { ...branchQuery, status: { $in: ['pending', 'processed'] } } },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } }
      ])
    ]);

    // Monthly collection chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyChart = await Fee.aggregate([
      { $match: { ...branchQuery } },
      { $unwind: '$payments' },
      { $match: { 'payments.paidAt': { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$payments.paidAt' } },
        collected: { $sum: '$payments.amount' }
      }},
      { $sort: { '_id': 1 } }
    ]);

    const attendanceMap = {};
    todayAttendance.forEach(a => { attendanceMap[a._id] = a.count; });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        activeCourses,
        activeBatches,
        todayCollection: todayCollection[0]?.total || 0,
        monthlyCollection: monthlyCollection[0]?.total || 0,
        pendingFees: pendingFees[0]?.total || 0,
        overdueCount,
        unpaidSalaries: { amount: unpaidSalaries[0]?.total || 0, count: unpaidSalaries[0]?.count || 0 },
        todayAttendance: {
          present: attendanceMap['present'] || 0,
          absent: attendanceMap['absent'] || 0,
          late: attendanceMap['late'] || 0,
          leave: attendanceMap['leave'] || 0,
        },
        monthlyChart,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
