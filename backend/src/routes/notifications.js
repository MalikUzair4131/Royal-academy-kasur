const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const notificationSchema = new (require('mongoose').Schema)({
  recipient: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  message: String,
  type: { type: String, enum: ['fee_reminder', 'attendance', 'salary', 'general', 'system'], default: 'general' },
  isRead: { type: Boolean, default: false },
  link: String,
  branch: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });

const Notification = require('mongoose').model('Notification', notificationSchema);

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Internal helper to create notification
const createNotification = (data) => Notification.create(data).catch(console.error);

module.exports = router;
module.exports.createNotification = createNotification;
