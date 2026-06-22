const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { User } = require('../models/User');
const { protect, checkPermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');
const { body, validationResult } = require('express-validator');

router.use(protect);

router.get('/', checkPermission('teachers', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, salaryType, branch } = req.query;
    const query = {};
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (salaryType) query.salaryType = salaryType;
    if (search) query.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { teacherId: new RegExp(search, 'i') }
    ];

    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .populate('branch', 'name')
      .populate('courses', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: teachers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', checkPermission('teachers', 'create'), [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('salaryType').isIn(['fixed', 'revenue_share']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { email, password = 'teacher123', firstName, lastName, ...teacherData } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists.' });

    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;
    const userAccount = await User.create({ name: `${firstName} ${lastName}`, email, password, role: 'teacher', branch });
    const teacher = await Teacher.create({ ...teacherData, firstName, lastName, user: userAccount._id, branch });
    await User.findByIdAndUpdate(userAccount._id, { teacherProfile: teacher._id });

    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'create', module: 'teachers', resourceId: teacher._id, description: `Hired teacher: ${firstName} ${lastName}`, ipAddress: req.clientIp });
    res.status(201).json({ success: true, message: 'Teacher added successfully.', data: teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', checkPermission('teachers', 'view'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('branch', 'name')
      .populate('courses', 'name code monthlyFee')
      .populate('batches', 'name batchCode');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, data: teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', checkPermission('teachers', 'edit'), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'update', module: 'teachers', resourceId: teacher._id, description: `Updated teacher: ${teacher.fullName}`, ipAddress: req.clientIp });
    res.json({ success: true, message: 'Teacher updated.', data: teacher });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
