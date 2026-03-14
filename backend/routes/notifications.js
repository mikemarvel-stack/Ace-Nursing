const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

// GET /api/notifications — latest 50, unread count
router.get('/', async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find().sort('-createdAt').limit(50),
      Notification.countDocuments({ read: false }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
