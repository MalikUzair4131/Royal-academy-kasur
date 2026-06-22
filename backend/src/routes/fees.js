const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const { Course } = require('../models/Course');
const Teacher = require('../models/Teacher');
const { protect, checkPermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');
const { body, validationResult } = require('express-validator');

router.use(protect);

// ─── GET /api/fees ────────────────────────────────────────────────────────────
router.get('/', checkPermission('fees', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, feeType, student, branch, month, search } = req.query;
    const query = {};

    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;

    // Students can only see their own fees
    if (req.user.role === 'student') {
      const studentDoc = await Student.findOne({ user: req.user._id });
      if (studentDoc) query.student = studentDoc._id;
    } else if (req.user.role === 'parent') {
      const parentStudents = await Student.find({ 'guardians.userId': req.user._id });
      query.student = { $in: parentStudents.map(s => s._id) };
    } else if (student) {
      query.student = student;
    }

    if (status) query.status = status;
    if (feeType) query.feeType = feeType;
    if (month) query.month = month;

    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'name code')
      .populate('batch', 'name')
      .populate('createdBy', 'name')
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Summary stats
    const stats = await Fee.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalDue: { $sum: '$netAmount' },
        totalCollected: { $sum: '$paidAmount' },
        totalPending: { $sum: { $cond: [{ $lt: ['$paidAmount', '$netAmount'] }, { $subtract: ['$netAmount', '$paidAmount'] }, 0] } },
        overdueCount: { $sum: { $cond: ['$isOverdue', 1, 0] } }
      }}
    ]);

    res.json({ success: true, data: fees, total, page: Number(page), pages: Math.ceil(total / limit), stats: stats[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/fees ───────────────────────────────────────────────────────────
router.post('/', checkPermission('fees', 'create'), [
  body('student').notEmpty(),
  body('feeType').isIn(['admission', 'monthly', 'exam', 'certificate', 'custom']),
  body('originalAmount').isNumeric().isFloat({ min: 0 }),
  body('dueDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;
    const fee = await Fee.create({ ...req.body, branch, createdBy: req.user._id });

    // Calculate revenue share if course has rev-share teacher
    if (fee.course) {
      const course = await Course.findById(fee.course).populate('instructor');
      if (course?.instructor?.salaryType === 'revenue_share') {
        const share = (fee.netAmount * course.instructor.revenueSharePercentage) / 100;
        fee.teacherRevShare = share;
        fee.academyShare = fee.netAmount - share;
        await fee.save();
      }
    }

    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'fee_generate', module: 'fees', resourceId: fee._id, description: `Generated ${fee.feeType} fee: ${fee.receiptNo} - PKR ${fee.netAmount}`, ipAddress: req.clientIp });
    res.status(201).json({ success: true, message: 'Fee created.', data: fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/fees/:id/payment ───────────────────────────────────────────────
router.post('/:id/payment', checkPermission('fees', 'edit'), [
  body('amount').isNumeric().isFloat({ min: 1 }),
  body('method').isIn(['cash', 'bank_transfer', 'cheque', 'online']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });
    if (fee.status === 'paid') return res.status(400).json({ success: false, message: 'Fee already fully paid.' });

    const balance = fee.netAmount - fee.paidAmount;
    if (req.body.amount > balance) return res.status(400).json({ success: false, message: `Payment exceeds balance. Maximum: PKR ${balance}` });

    fee.payments.push({ ...req.body, receivedBy: req.user._id });
    await fee.save();

    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'payment', module: 'fees', resourceId: fee._id, description: `Payment of PKR ${req.body.amount} for ${fee.receiptNo}`, ipAddress: req.clientIp });

    res.json({ success: true, message: 'Payment recorded.', data: fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/fees/overdue ────────────────────────────────────────────────────
router.get('/overdue/list', checkPermission('fees', 'view'), async (req, res) => {
  try {
    const query = { isOverdue: true, status: { $in: ['overdue', 'partial', 'pending'] } };
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;

    const fees = await Fee.find(query)
      .populate('student', 'firstName lastName studentId guardians')
      .populate('course', 'name')
      .sort({ overduedays: -1 });

    res.json({ success: true, data: fees, total: fees.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/fees/bulk-generate ────────────────────────────────────────────
router.post('/bulk-generate', checkPermission('fees', 'create'), async (req, res) => {
  try {
    const { courseId, batchId, feeType, month, originalAmount, dueDate, discountPercentage } = req.body;
    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;

    // Get all active students in the course/batch
    const query = { isActive: true };
    if (batchId) query['enrollments.batch'] = batchId;
    else if (courseId) query['enrollments.course'] = courseId;

    const students = await Student.find(query);

    const fees = await Promise.all(students.map(student => {
      const schDiscount = student.scholarshipPercentage > 0
        ? (originalAmount * student.scholarshipPercentage) / 100 : 0;
      return Fee.create({
        student: student._id, branch, course: courseId, batch: batchId,
        feeType, month, originalAmount, dueDate,
        discountPercentage: discountPercentage || 0,
        scholarshipDiscount: schDiscount,
        netAmount: originalAmount, // will be recalculated in pre-save
        createdBy: req.user._id
      });
    }));

    res.json({ success: true, message: `Generated ${fees.length} fee records.`, data: { count: fees.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/fees/collection-summary ────────────────────────────────────────
router.get('/collection/summary', checkPermission('fees', 'view'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const matchQuery = {};
    if (req.user.role === 'branch_admin') matchQuery.branch = req.user.branch;
    if (month) matchQuery.month = month;

    const summary = await Fee.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$feeType',
        totalDue: { $sum: '$netAmount' },
        totalCollected: { $sum: '$paidAmount' },
        count: { $sum: 1 }
      }},
      { $project: {
        feeType: '$_id',
        totalDue: 1,
        totalCollected: 1,
        pending: { $subtract: ['$totalDue', '$totalCollected'] },
        count: 1
      }}
    ]);

    const monthly = await Fee.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: { $substr: ['$month', 0, 7] },
        collected: { $sum: '$paidAmount' },
        due: { $sum: '$netAmount' }
      }},
      { $sort: { '_id': 1 } }
    ]);

    res.json({ success: true, data: { byType: summary, monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
