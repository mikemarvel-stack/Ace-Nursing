const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, restrictTo } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { validate, contactSchema } = require('../utils/validation');

// POST /api/notifications/contact — public
router.post('/contact', validate(contactSchema), asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  await Notification.create({
    type: 'contact_message',
    title: `${subject || 'Message'} — from ${name}`,
    message: `${email}${phone ? ` · ${phone}` : ''} — ${message.slice(0, 300)}${message.length > 300 ? '…' : ''}`,
    link: '/admin/notifications',
    meta: { name, email, phone: phone || '', subject: subject || '', message },
    userId: null,
  });
  res.json({ success: true });
}));

// ── User-facing notifications ─────────────────────────────────────────────────

router.get('/mine', protect, asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id }).sort('-createdAt').limit(30),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);
  res.json({ notifications, unreadCount });
}));

router.patch('/mine/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true }
  );
  res.json({ success: true });
}));

router.patch('/mine/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.json({ success: true });
}));

// ── Admin-only notifications ──────────────────────────────────────────────────
router.use(protect, restrictTo('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: null }).sort('-createdAt').limit(50),
    Notification.countDocuments({ userId: null, read: false }),
  ]);
  res.json({ notifications, unreadCount });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: null, read: false }, { read: true });
  res.json({ success: true });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

module.exports = router;
