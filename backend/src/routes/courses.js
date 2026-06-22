const express = require('express');
const router = express.Router();
const { Course, Batch } = require('../models/Course');
const { protect, checkPermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');

router.use(protect);

router.get('/', checkPermission('courses', 'view'), async (req, res) => {
  try {
    const { branch, type, isActive, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.name = new RegExp(search, 'i');

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName teacherId')
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: courses, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', checkPermission('courses', 'create'), async (req, res) => {
  try {
    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;
    const course = await Course.create({ ...req.body, branch });
    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'create', module: 'courses', resourceId: course._id, description: `Created course: ${course.name}`, ipAddress: req.clientIp });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', checkPermission('courses', 'edit'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', checkPermission('courses', 'delete'), async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Course deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
