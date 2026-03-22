const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination } = require('../utils/validation');

// Rate limiter for admin write operations
const adminWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { error: 'Too many write operations. Please slow down.' },
  skip: (req) => !req.user,
});

router.use(protect, restrictTo('admin'));

// ─── GET /api/orders ──────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, status, search } = req.query;
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });
  const filter = {};

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customerInfo.email': { $regex: search, $options: 'i' } },
      { 'customerInfo.firstName': { $regex: search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'firstName lastName email')
      .select('-items.downloadToken'),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}));

// ─── GET /api/orders/stats ────────────────────────────────────────────────────
router.get('/stats', asyncHandler(async (req, res) => {
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
}));

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'title coverImage');
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
}));

// ─── PATCH /api/orders/:id ────────────────────────────────────────────────────
router.patch('/:id', adminWriteLimiter, asyncHandler(async (req, res) => {
  const allowed = ['status', 'notes'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order });
}));

module.exports = router;
