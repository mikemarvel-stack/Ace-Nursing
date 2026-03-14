const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, restrictTo } = require('../middleware/auth');

// All order routes require admin
router.use(protect, restrictTo('admin'));

// ─── GET /api/orders ── All orders ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } },
        { 'customerInfo.firstName': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'firstName lastName email')
        .select('-items.downloadToken'),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/orders/stats ────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const User = require('../models/User');
    const [totalOrders, revenue, pending, thisMonth, activeProducts, totalUsers] = await Promise.all([
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: new Date(new Date().setDate(1)) } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
    ]);

    res.json({
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      pendingOrders: pending,
      activeProducts,
      totalUsers,
      thisMonth: {
        revenue: thisMonth[0]?.total || 0,
        orders: thisMonth[0]?.count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'title coverImage');
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/orders/:id ────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['status', 'notes'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
