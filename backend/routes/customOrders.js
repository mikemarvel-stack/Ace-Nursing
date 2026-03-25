const express = require('express');
const router = express.Router();
const CustomOrder = require('../models/CustomOrder');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');
const {
  sendCustomOrderConfirmation,
  sendCustomOrderAdminAlert,
  sendCustomOrderQuote,
  sendCustomOrderAccepted,
  sendCustomOrderDelivered,
} = require('../utils/email');
const asyncHandler = require('../utils/asyncHandler');
const { getSignedDownloadUrl } = require('../utils/s3');

// ── POST /api/custom-orders — submit a new request ───────────────────────────
router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    firstName, lastName, email, phone,
    subject, assignmentType, pages, deadline, requirements,
    attachmentNotes, academicLevel, citationStyle,
    attachments,
  } = req.body;

  if (!firstName || !lastName || !email || !subject || !assignmentType || !deadline || !requirements) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }
  if (new Date(deadline) <= new Date()) {
    return res.status(400).json({ error: 'Deadline must be in the future.' });
  }

  const order = await CustomOrder.create({
    user: req.user?._id,
    customerInfo: { firstName, lastName, email, phone },
    subject, assignmentType, pages, deadline, requirements,
    attachmentNotes, academicLevel, citationStyle,
    attachments: Array.isArray(attachments) ? attachments : [],
    ipAddress: req.ip,
  });

  // Notify admin
  createNotification({
    type: 'custom_order',
    title: 'New Custom Assignment Request',
    message: `${firstName} ${lastName} requested a ${assignmentType} on "${subject}" — due ${new Date(deadline).toLocaleDateString()}.`,
    link: '/admin/custom-orders',
    meta: { orderId: order._id, orderNumber: order.orderNumber, email, subject, assignmentType },
    userId: null,
  });

  // Emails — fire and forget
  sendCustomOrderConfirmation({ order }).catch(console.error);
  sendCustomOrderAdminAlert({ order }).catch(console.error);

  res.status(201).json({ success: true, orderNumber: order.orderNumber, orderId: order._id });
}));

// ── GET /api/custom-orders/mine — user's own orders ──────────────────────────
router.get('/mine', protect, asyncHandler(async (req, res) => {
  const orders = await CustomOrder.find({
    $or: [{ user: req.user._id }, { 'customerInfo.email': req.user.email }],
  }).sort('-createdAt');
  res.json({ orders });
}));

// ── POST /api/custom-orders/:id/respond — user accepts or declines quote ─────
router.post('/:id/respond', protect, asyncHandler(async (req, res) => {
  const { action, declineReason } = req.body;
  if (!['accepted', 'declined'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accepted or declined.' });
  }

  const order = await CustomOrder.findOne({
    _id: req.params.id,
    $or: [{ user: req.user._id }, { 'customerInfo.email': req.user.email }],
  });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'quoted') return res.status(400).json({ error: 'No active quote to respond to.' });
  if (order.isQuoteExpired) return res.status(410).json({ error: 'Quote has expired. Please contact support.' });

  order.userResponse = { action, respondedAt: new Date(), declineReason };

  if (action === 'accepted') {
    order.status = 'accepted';
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + order.quote.daysToComplete);
    order.delivery = { ...order.delivery, dueAt };
    sendCustomOrderAccepted({ order }).catch(console.error);
    createNotification({
      type: 'custom_order',
      title: `Quote Accepted — #${order.orderNumber}`,
      message: `${order.customerInfo.firstName} accepted the quote of $${order.quote.price}. Work starts now.`,
      link: '/admin/custom-orders',
      meta: { orderId: order._id, orderNumber: order.orderNumber },
      userId: null,
    });
    // Notify user
    createNotification({
      type: 'custom_order',
      title: 'Assignment Accepted ✅',
      message: `Your assignment #${order.orderNumber} has been accepted. Expected delivery: ${order.delivery.dueAt.toLocaleDateString()}.`,
      link: '/account',
      meta: { orderId: order._id },
      userId: req.user._id,
    });
  } else {
    order.status = 'declined';
    createNotification({
      type: 'custom_order',
      title: `Quote Declined — #${order.orderNumber}`,
      message: `${order.customerInfo.firstName} declined the quote.${declineReason ? ` Reason: ${declineReason}` : ''}`,
      link: '/admin/custom-orders',
      meta: { orderId: order._id },
      userId: null,
    });
  }

  await order.save();
  res.json({ success: true, order });
}));

// ── POST /api/custom-orders/:id/confirm-receipt ──────────────────────────────
router.post('/:id/confirm-receipt', protect, asyncHandler(async (req, res) => {
  const order = await CustomOrder.findOne({
    _id: req.params.id,
    $or: [{ user: req.user._id }, { 'customerInfo.email': req.user.email }],
  });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'completed') return res.status(400).json({ error: 'Order must be completed and paid before confirming receipt.' });
  if (order.payment.status !== 'paid') return res.status(402).json({ error: 'Payment required before confirming receipt.' });
  if (order.delivery.confirmedAt) return res.json({ success: true, order }); // idempotent

  order.delivery.confirmedAt = new Date();
  await order.save();

  createNotification({
    type: 'custom_order',
    title: `Receipt Confirmed — #${order.orderNumber}`,
    message: `${order.customerInfo.firstName} confirmed receipt of "${order.subject}". Up to 3 revisions are now available.`,
    link: '/admin/custom-orders',
    meta: { orderId: order._id },
    userId: null,
  });

  res.json({ success: true, order });
}));

// ── POST /api/custom-orders/:id/revision ─────────────────────────────────────
router.post('/:id/revision', protect, asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const order = await CustomOrder.findOne({
    _id: req.params.id,
    $or: [{ user: req.user._id }, { 'customerInfo.email': req.user.email }],
  });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'completed') return res.status(400).json({ error: 'Pay and confirm receipt before requesting a revision.' });
  if (order.payment.status !== 'paid') return res.status(402).json({ error: 'Payment required before requesting a revision.' });
  if (!order.delivery.confirmedAt) return res.status(400).json({ error: 'Please confirm you have received and reviewed the work before requesting a revision.' });
  if (order.revisionsUsed >= 3) return res.status(400).json({ error: 'Maximum of 3 revisions reached. Please contact support for further changes.' });

  order.revisionRequests.push({ notes });
  order.revisionsUsed += 1;
  order.status = 'revision_requested';
  await order.save();

  createNotification({
    type: 'custom_order',
    title: `Revision ${order.revisionsUsed}/3 — #${order.orderNumber}`,
    message: `${order.customerInfo.firstName} requested revision ${order.revisionsUsed} of 3.${notes ? ` Notes: ${notes.slice(0, 100)}` : ''}`,
    link: '/admin/custom-orders',
    meta: { orderId: order._id },
    userId: null,
  });

  res.json({ success: true, revisionsUsed: order.revisionsUsed, revisionsRemaining: 3 - order.revisionsUsed });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
router.use(protect, restrictTo('admin'));

// ── GET /api/custom-orders/stats ─────────────────────────────────────────────
router.get('/stats', asyncHandler(async (req, res) => {
  const [total, pending, active, delivered] = await Promise.all([
    CustomOrder.countDocuments(),
    CustomOrder.countDocuments({ status: { $in: ['submitted', 'reviewing', 'quoted'] } }),
    CustomOrder.countDocuments({ status: { $in: ['accepted', 'in_progress', 'revision_requested'] } }),
    CustomOrder.countDocuments({ status: { $in: ['delivered', 'completed'] } }),
  ]);
  res.json({ total, pending, active, delivered });
}));

// ── GET /api/custom-orders — list all ────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};
  const [orders, total] = await Promise.all([
    CustomOrder.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
    CustomOrder.countDocuments(filter),
  ]);
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
}));

// ── GET /api/custom-orders/:id ────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await CustomOrder.findById(req.params.id).populate('user', 'firstName lastName email');
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
}));

// ── POST /api/custom-orders/:id/quote — admin sends quote ────────────────────
router.post('/:id/quote', asyncHandler(async (req, res) => {
  const { price, daysToComplete, adminNotes } = req.body;
  if (!price || !daysToComplete) return res.status(400).json({ error: 'Price and delivery days are required.' });

  const order = await CustomOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
  order.quote = { price: Number(price), daysToComplete: Number(daysToComplete), adminNotes, quotedAt: new Date(), expiresAt };
  order.status = 'quoted';
  await order.save();

  // Notify user
  sendCustomOrderQuote({ order }).catch(console.error);
  if (order.user) {
    createNotification({
      type: 'custom_order',
      title: `Quote Ready — #${order.orderNumber}`,
      message: `Your assignment quote is ready: $${price} · ${daysToComplete} day(s). Please accept or decline within 48 hours.`,
      link: '/account',
      meta: { orderId: order._id, price, daysToComplete },
      userId: order.user,
    });
  }

  res.json({ success: true, order });
}));

// ── PATCH /api/custom-orders/:id — update status / notes / delivery ───────────
router.patch('/:id', asyncHandler(async (req, res) => {
  const { status, adminNotes, deliveryDownloadUrl, deliveryNotes, deliveryFileKey, deliveryOriginalName } = req.body;
  const update = {};
  if (status !== undefined)     update.status = status;
  if (adminNotes !== undefined) update.adminNotes = adminNotes;

  if (status === 'delivered') {
    update['delivery.deliveredAt'] = new Date();
    if (deliveryFileKey)     update['delivery.fileKey'] = deliveryFileKey;
    if (deliveryOriginalName) update['delivery.originalName'] = deliveryOriginalName;
    if (deliveryDownloadUrl) update['delivery.downloadUrl'] = deliveryDownloadUrl;
    if (deliveryNotes)       update['delivery.notes'] = deliveryNotes;

    const existing = await CustomOrder.findById(req.params.id);
    if (existing) {
      // Generate a fresh signed URL for the delivery email
      let emailDownloadUrl = deliveryFileKey
        ? await getSignedDownloadUrl(deliveryFileKey, 7 * 24 * 60 * 60).catch(() => deliveryDownloadUrl)
        : deliveryDownloadUrl;
      sendCustomOrderDelivered({ order: existing }).catch(console.error);
      if (existing.user) {
        createNotification({
          type: 'custom_order',
          title: `Assignment Delivered 🎉 — #${existing.orderNumber}`,
          message: `Your assignment "${existing.subject}" has been delivered. Pay to download it now.`,
          link: `/custom-order?pay=${existing._id}`,
          meta: { orderId: existing._id },
          userId: existing.user,
        });
      }
    }
  }

  if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update.' });
  const order = await CustomOrder.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
}));

module.exports = router;
