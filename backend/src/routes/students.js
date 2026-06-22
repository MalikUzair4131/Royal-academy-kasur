const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { User } = require('../models/User');
const { protect, restrictTo, checkPermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');
const { body, validationResult } = require('express-validator');

router.use(protect);

// ─── GET /api/students ────────────────────────────────────────────────────────
router.get('/', checkPermission('students', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, course, batch, branch } = req.query;
    const query = {};

    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;

    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (course) query['enrollments.course'] = course;
    if (batch) query['enrollments.batch'] = batch;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { 'guardians.phone': new RegExp(search, 'i') }
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('branch', 'name')
      .populate('enrollments.course', 'name code')
      .populate('enrollments.batch', 'name batchCode')
      .populate('user', 'email isActive lastLogin')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/students ───────────────────────────────────────────────────────
router.post('/', checkPermission('students', 'create'), [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { email, password = 'student123', firstName, lastName, ...studentData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists.' });

    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;

    // Create user account
    const userAccount = await User.create({ name: `${firstName} ${lastName}`, email, password, role: 'student', branch });

    // Create student profile
    const student = await Student.create({ ...studentData, firstName, lastName, user: userAccount._id, branch });

    // Link profile to user
    await User.findByIdAndUpdate(userAccount._id, { studentProfile: student._id });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'create', module: 'students', resourceId: student._id,
      description: `Enrolled student: ${firstName} ${lastName} (${student.studentId})`,
      ipAddress: req.clientIp
    });

    res.status(201).json({ success: true, message: 'Student enrolled successfully.', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/students/:id ────────────────────────────────────────────────────
router.get('/:id', checkPermission('students', 'view'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('branch', 'name code')
      .populate('enrollments.course')
      .populate('enrollments.batch')
      .populate('user', 'email isActive lastLogin');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/students/:id ────────────────────────────────────────────────────
router.put('/:id', checkPermission('students', 'edit'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'update', module: 'students', resourceId: student._id,
      description: `Updated student: ${student.fullName}`, ipAddress: req.clientIp
    });

    res.json({ success: true, message: 'Student updated.', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/students/:id/enroll ───────────────────────────────────────────
router.post('/:id/enroll', checkPermission('students', 'edit'), async (req, res) => {
  try {
    const { courseId, batchId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const already = student.enrollments.find(e => e.course.toString() === courseId && e.status === 'active');
    if (already) return res.status(400).json({ success: false, message: 'Already enrolled in this course.' });

    student.enrollments.push({ course: courseId, batch: batchId, status: 'active' });
    await student.save();

    res.json({ success: true, message: 'Student enrolled in course.', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/students/:id ─────────────────────────────────────────────────
router.delete('/:id', checkPermission('students', 'delete'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    await User.findByIdAndUpdate(student.user, { isActive: false });
    student.isActive = false;
    await student.save();

    await createAuditLog({
      user: req.user._id, userName: req.user.name, userRole: req.user.role,
      action: 'delete', module: 'students', resourceId: student._id,
      description: `Deactivated student: ${student.fullName}`, ipAddress: req.clientIp
    });

    res.json({ success: true, message: 'Student record deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
