const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notifications');

// ─── GET /api/products/admin/all ──────────────────────────────────────────────
router.get('/admin/all', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const products = await Product.find()
    .sort('-createdAt')
    .populate('uploadedBy', 'firstName lastName email')
    .select('-reviews');
  res.json({ products });
}));

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, category, featured,
    sort = '-featured -rating.average', search, minPrice, maxPrice,
  } = req.query;

  const filter = { isActive: true };
  if (category && category !== 'All') filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search };

  const sortMap = {
    'price-asc': 'price', 'price-desc': '-price',
    rating: '-rating.average', reviews: '-rating.count',
    newest: '-createdAt', featured: '-featured -rating.average',
  };
  const sortStr = sortMap[sort] || sort;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortStr).skip(skip).limit(Number(limit))
      .select('-reviews -fileUrl -__v').lean(),
    Product.countDocuments(filter),
  ]);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({
    products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
  });
}));

// ─── GET /api/products/featured ───────────────────────────────────────────────
router.get('/featured', asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, featured: true })
    .sort('-rating.average').limit(6).select('-reviews -fileUrl -__v').lean();
  res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
  res.json({ products });
}));

// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    $or: [
      { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      { slug: req.params.id },
    ],
    isActive: true,
  }).select('-fileUrl');
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
}));

// ─── POST /api/products ───────────────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, uploadedBy: req.user._id });
  res.status(201).json({ product });
}));

// ─── PATCH /api/products/:id ──────────────────────────────────────────────────
router.patch('/:id', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const forbidden = new Set(['reviews', 'rating', 'totalSales', 'uploadedBy']);
  const safeBody = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !forbidden.has(k))
  );
  if ('badge' in safeBody && safeBody.badge === '') safeBody.badge = null;

  const product = await Product.findByIdAndUpdate(req.params.id, safeBody, { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
}));

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ message: 'Product removed successfully.' });
}));

// ─── POST /api/products/:id/reviews ──────────────────────────────────────────
router.post('/:id/reviews', protect, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const alreadyReviewed = product.reviews.find(
    r => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ error: 'You have already reviewed this product.' });
  }

  product.reviews.push({ user: req.user._id, name: req.user.fullName, rating: Number(rating), comment });
  product.updateRating();
  await product.save();

  createNotification({
    type: 'new_review',
    title: 'New Review Submitted',
    message: `${req.user.fullName} rated "${product.title}" ${rating}★${comment ? ` — "${comment.slice(0, 80)}${comment.length > 80 ? '…' : ''}"` : ''}`,
    link: '/admin/products',
    meta: { productId: product._id, productTitle: product.title, rating: Number(rating), comment, userId: req.user._id },
    userId: null,
  });

  res.status(201).json({ message: 'Review added successfully.', rating: product.rating });
}));

module.exports = router;
