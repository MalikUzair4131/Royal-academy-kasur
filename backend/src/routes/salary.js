const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const { protect, checkPermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');

router.use(protect);

// ─── GET /api/salary ──────────────────────────────────────────────────────────
router.get('/', checkPermission('salary', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, month, status, branch, teacherId } = req.query;
    const query = {};
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;
    if (month) query.month = month;
    if (status) query.status = status;
    if (teacherId) query.teacher = teacherId;

    // Teachers see only their own salary
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher) query.teacher = teacher._id;
    }

    const total = await Salary.countDocuments(query);
    const salaries = await Salary.find(query)
      .populate('teacher', 'firstName lastName teacherId salaryType')
      .populate('branch', 'name')
      .sort({ month: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: salaries, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/salary/calculate ─────────────────────────────────────────────
router.post('/calculate', checkPermission('salary', 'create'), async (req, res) => {
  try {
    const { month, teacherId } = req.body; // month: "2024-01"
    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;

    const teacherQuery = { branch, isActive: true };
    if (teacherId) teacherQuery._id = teacherId;
    const teachers = await Teacher.find(teacherQuery).populate('courses');

    const results = [];
    for (const teacher of teachers) {
      // Skip if already processed
      const existing = await Salary.findOne({ teacher: teacher._id, month });
      if (existing) { results.push({ teacher: teacher.fullName, status: 'already_exists', salary: existing }); continue; }

      let salaryData = {
        teacher: teacher._id, branch, month,
        year: parseInt(month.split('-')[0]),
        salaryType: teacher.salaryType,
        processedBy: req.user._id, processedAt: new Date()
      };

      if (teacher.salaryType === 'fixed') {
        // Get attendance data
        const [y, m] = month.split('-').map(Number);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0);
        const workingDays = getWorkingDays(startDate, endDate);

        const presentCount = await Attendance.countDocuments({
          teacher: teacher._id, status: { $in: ['present', 'late'] },
          date: { $gte: startDate, $lte: endDate }
        });

        const perDay = teacher.fixedSalary / workingDays;
        const absenceDays = workingDays - presentCount;
        const absenceDeduction = Math.round(perDay * absenceDays);

        salaryData = {
          ...salaryData,
          fixedAmount: teacher.fixedSalary,
          workingDays, presentDays: presentCount,
          perDaySalary: Math.round(perDay),
          absenceDeduction
        };
      } else {
        // Revenue sharing - calculate from paid fees for teacher's courses
        const [y, m] = month.split('-').map(Number);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0);

        const feeAgg = await Fee.aggregate([
          { $match: {
            course: { $in: teacher.courses.map(c => c._id) },
            status: { $in: ['paid', 'partial'] },
            'payments.paidAt': { $gte: startDate, $lte: endDate }
          }},
          { $unwind: '$payments' },
          { $match: { 'payments.paidAt': { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$payments.amount' } } }
        ]);

        const totalCollected = feeAgg[0]?.total || 0;
        const teacherEarning = Math.round((totalCollected * teacher.revenueSharePercentage) / 100);

        salaryData = {
          ...salaryData,
          totalFeesCollected: totalCollected,
          revenueSharePercentage: teacher.revenueSharePercentage,
          teacherEarning,
          academyEarning: totalCollected - teacherEarning
        };
      }

      const salary = await Salary.create(salaryData);
      results.push({ teacher: teacher.fullName, status: 'calculated', salary });
    }

    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'salary_process', module: 'salary', description: `Calculated salary for month ${month} - ${results.length} teachers`, ipAddress: req.clientIp });
    res.json({ success: true, message: `Salary calculated for ${results.length} teachers.`, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/salary/:id/pay ───────────────────────────────────────────────
router.patch('/:id/pay', checkPermission('salary', 'edit'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });
    if (salary.status === 'paid') return res.status(400).json({ success: false, message: 'Salary already paid.' });

    salary.status = 'paid';
    salary.paidAt = new Date();
    salary.paidBy = req.user._id;
    salary.paymentMethod = req.body.paymentMethod || 'bank_transfer';
    salary.paymentReference = req.body.paymentReference;
    if (req.body.bonus) { salary.bonus = req.body.bonus; salary.bonusReason = req.body.bonusReason; }
    if (req.body.deductions) { salary.deductions = req.body.deductions; salary.deductionReason = req.body.deductionReason; }
    await salary.save();

    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'payment', module: 'salary', resourceId: salary._id, description: `Paid salary PKR ${salary.netSalary} to teacher`, ipAddress: req.clientIp });
    res.json({ success: true, message: 'Salary marked as paid.', data: salary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/salary/summary ──────────────────────────────────────────────────
router.get('/summary/monthly', checkPermission('salary', 'view'), async (req, res) => {
  try {
    const { month } = req.query;
    const match = {};
    if (req.user.role === 'branch_admin') match.branch = req.user.branch;
    if (month) match.month = month;

    const summary = await Salary.aggregate([
      { $match: match },
      { $group: {
        _id: '$month',
        totalSalary: { $sum: '$netSalary' },
        teacherCount: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netSalary', 0] } },
        pending: { $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$netSalary', 0] } },
        totalRevShare: { $sum: '$teacherEarning' },
        totalFixed: { $sum: { $cond: [{ $eq: ['$salaryType', 'fixed'] }, '$netSalary', 0] } },
      }},
      { $sort: { '_id': -1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: count working days (Mon-Fri or Mon-Sat)
function getWorkingDays(start, end) {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0) count++; // exclude Sunday
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

module.exports = router;
