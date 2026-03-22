const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../utils/notifications');
const { parsePagination, isValidObjectId, validateSortParam, validate, createProductSchema, updateProductSchema } = require('../utils/validation');

// Rate limiter for admin write operations (create, update, delete)
const adminWriteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per admin user
  keyGenerator: (req) => req.user?._id?.toString() || req.ip, // Rate limit per user
  message: { error: 'Too many write operations. Please slow down.' },
  skip: (req) => !req.user, // Skip for non-authenticated requests
});

const buildSeo = ({ title, description, category, categoryObj, seoTitle, seoDescription, seoKeywords }) => {
  // If category object provided, use its SEO as fallback
  const categoryName = categoryObj?.name || category;
  const categorySeo = categoryObj?.seo || {};

  return {
    metaTitle: seoTitle || categorySeo.metaTitle || `${title} – ${categoryName} | AceNursing`,
    metaDescription: seoDescription || categorySeo.metaDescription || (description ? description.slice(0, 155) : `Download ${title} — premium nursing study material from AceNursing.`),
    keywords: seoKeywords 
      ? seoKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : categorySeo.keywords?.length > 0 
        ? [...categorySeo.keywords, title, categoryName, 'nursing study material', 'NCLEX prep']
        : [title, categoryName, 'nursing study material', 'NCLEX prep', 'AceNursing'],
  };
};

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
    category, featured, search, minPrice, maxPrice,
    sort = 'featured', page, limit,
  } = req.query;

  // Security: Validate and limit pagination parameters
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });
  
  // Security: Whitelist allowed sort fields to prevent NoSQL injection
  const allowedFields = ['price', 'featured', 'rating.average', 'createdAt'];
  const validatedSort = validateSortParam(sort, allowedFields);

  const filter = { isActive: true };
  if (category && category !== 'All') {
    const cats = category.split(',').map(c => c.trim()).filter(Boolean);
    filter.category = cats.length === 1 ? cats[0] : { $in: cats };
  }
  if (featured === 'true') filter.featured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(validatedSort).skip(skip).limit(limitNum)
      .select('-reviews -fileUrl -__v').lean(),
    Product.countDocuments(filter),
  ]);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({
    products,
    pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
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
  // Security: Properly validate ObjectId format
  const query = {
    $or: [
      isValidObjectId(req.params.id) ? { _id: req.params.id } : null,
      { slug: req.params.id },
    ].filter(Boolean),
    isActive: true,
  };
  
  const product = await Product.findOne(query).select('-fileUrl');
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
}));

// ─── POST /api/products ───────────────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), adminWriteLimiter, validate(createProductSchema), asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, uploadedBy: req.user._id });
  res.status(201).json({ product });
}));

// ─── PATCH /api/products/:id ──────────────────────────────────────────────────
router.patch('/:id', protect, restrictTo('admin'), adminWriteLimiter, asyncHandler(async (req, res) => {
  const forbidden = new Set(['reviews', 'rating', 'totalSales', 'uploadedBy']);
  const safeBody = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !forbidden.has(k))
  );
  if ('badge' in safeBody && safeBody.badge === '') safeBody.badge = null;
  
  // Auto-generate SEO if title/description changed but no seo provided
  if ((safeBody.title || safeBody.description || safeBody.category) && !safeBody.seo) {
    const existing = await Product.findById(req.params.id)
      .select('title description category seo')
      .populate('category', 'name seo');
    
    if (existing) {
      const categoryId = safeBody.category || existing.category;
      let categoryObj = null;
      
      // Fetch category object if we have a valid ID
      if (categoryId && typeof categoryId === 'object') {
        categoryObj = categoryId;
      } else if (categoryId && isValidObjectId(categoryId)) {
        categoryObj = await Category.findById(categoryId).select('name seo');
      }
      
      safeBody.seo = buildSeo({
        title: safeBody.title || existing.title,
        description: safeBody.description || existing.description,
        category: categoryObj?.name || existing.category?.name || 'Nursing Study Material',
        categoryObj,
        seoTitle: existing.seo?.metaTitle,
        seoDescription: existing.seo?.metaDescription,
        seoKeywords: existing.seo?.keywords?.join(', '),
      });
    }
  }

  const product = await Product.findByIdAndUpdate(req.params.id, safeBody, { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
}));

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('admin'), adminWriteLimiter, asyncHandler(async (req, res) => {
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
