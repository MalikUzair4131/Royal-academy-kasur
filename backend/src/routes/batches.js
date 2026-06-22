const express = require('express');
const router = express.Router();
const { Batch } = require('../models/Course');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', checkPermission('courses', 'view'), async (req, res) => {
  try {
    const { course, status, branch, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;
    if (course) query.course = course;
    if (status) query.status = status;

    const total = await Batch.countDocuments(query);
    const batches = await Batch.find(query)
      .populate('course', 'name code')
      .populate('instructor', 'firstName lastName')
      .populate('branch', 'name')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: batches, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', checkPermission('courses', 'create'), async (req, res) => {
  try {
    const branch = req.user.role === 'branch_admin' ? req.user.branch : req.body.branch;
    const batch = await Batch.create({ ...req.body, branch });
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', checkPermission('courses', 'edit'), async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add student to batch
router.patch('/:id/enroll', checkPermission('courses', 'edit'), async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { students: req.body.studentId } },
      { new: true }
    );
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
