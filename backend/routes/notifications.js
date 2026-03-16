const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, restrictTo } = require('../middleware/auth');

// POST /api/notifications/contact — public, creates a contact message notification
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required.' });
    // Server-side length guards
    if (name.length > 100 || email.length > 200 || (phone && phone.length > 30) || message.length > 5000) {
      return res.status(400).json({ error: 'Input exceeds maximum allowed length.' });
    }
    await Notification.create({
      type: 'contact_message',
      title: `${subject || 'Message'} — from ${name}`,
      message: `${email}${phone ? ` · ${phone}` : ''} — ${message.slice(0, 300)}${message.length > 300 ? '…' : ''}`,
      link: '/admin/notifications',
      meta: { name, email, phone: phone || '', subject: subject || '', message },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

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

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
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
