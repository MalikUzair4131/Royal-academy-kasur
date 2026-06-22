const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { protect, checkPermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auth');

router.use(protect);

// ─── GET /api/attendance ──────────────────────────────────────────────────────
router.get('/', checkPermission('attendance', 'view'), async (req, res) => {
  try {
    const { date, type, student, teacher, batch, course, branch, from, to, page = 1, limit = 50 } = req.query;
    const query = {};

    if (req.user.role === 'branch_admin') query.branch = req.user.branch;
    else if (branch) query.branch = branch;

    if (type) query.type = type;
    if (student) query.student = student;
    if (teacher) query.teacher = teacher;
    if (batch) query.batch = batch;
    if (course) query.course = course;

    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    } else if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(new Date(to).setHours(23,59,59,999));
    }

    // Students/parents see own attendance
    if (req.user.role === 'student') {
      const s = await Student.findOne({ user: req.user._id });
      if (s) query.student = s._id;
    }
    if (req.user.role === 'teacher') {
      const t = await Teacher.findOne({ user: req.user._id });
      if (t) query.teacher = t._id;
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('teacher', 'firstName lastName teacherId')
      .populate('batch', 'name')
      .populate('course', 'name')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: records, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/attendance/bulk ────────────────────────────────────────────────
router.post('/bulk', checkPermission('attendance', 'create'), async (req, res) => {
  try {
    const { records, date, type, batch, course, branch } = req.body;
    // records: [{studentId or teacherId, status, arrivalTime, remarks}]
    if (!records || !Array.isArray(records)) return res.status(400).json({ success: false, message: 'Records array required.' });

    const resolvedBranch = req.user.role === 'branch_admin' ? req.user.branch : branch;
    const attendanceDate = new Date(date);

    const ops = records.map(r => ({
      updateOne: {
        filter: r.student
          ? { student: r.student, date: { $gte: new Date(attendanceDate.setHours(0,0,0,0)), $lte: new Date(attendanceDate.setHours(23,59,59,999)) }, batch: batch || null }
          : { teacher: r.teacher, date: { $gte: new Date(attendanceDate.setHours(0,0,0,0)), $lte: new Date(attendanceDate.setHours(23,59,59,999)) } },
        update: {
          $set: {
            ...r,
            type, batch, course, date: new Date(date),
            branch: resolvedBranch, markedBy: req.user._id,
            isLate: r.status === 'late',
          }
        },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(ops);
    await createAuditLog({ user: req.user._id, userName: req.user.name, userRole: req.user.role, action: 'attendance_mark', module: 'attendance', description: `Marked attendance for ${records.length} ${type}s on ${date}`, ipAddress: req.clientIp });
    res.json({ success: true, message: `Attendance marked for ${records.length} records.`, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/attendance/analytics ───────────────────────────────────────────
router.get('/analytics/monthly', checkPermission('attendance', 'view'), async (req, res) => {
  try {
    const { month, type = 'student', branch } = req.query;
    const [y, m] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const matchQuery = { date: { $gte: startDate, $lte: endDate }, type };
    if (req.user.role === 'branch_admin') matchQuery.branch = req.user.branch;
    else if (branch) matchQuery.branch = branch;

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const daily = await Attendance.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
      }},
      { $sort: { '_id': 1 } }
    ]);

    res.json({ success: true, data: { stats, daily } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/attendance/student/:studentId/report ────────────────────────────
router.get('/student/:studentId/report', checkPermission('attendance', 'view'), async (req, res) => {
  try {
    const { month } = req.query;
    const [y, m] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const records = await Attendance.find({
      student: req.params.studentId,
      date: { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) }
    }).sort({ date: 1 });

    const total = records.length;
    const present = records.filter(r => ['present', 'late'].includes(r.status)).length;
    const absent = records.filter(r => r.status === 'absent').length;
    const onLeave = records.filter(r => r.status === 'leave').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ success: true, data: { records, summary: { total, present, absent, onLeave, percentage } } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
