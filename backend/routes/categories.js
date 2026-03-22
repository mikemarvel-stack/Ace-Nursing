const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Category = require('../models/Category');
const { protect, restrictTo } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { validate } = require('../utils/validation');
const { z } = require('zod');

// Rate limiter for admin write operations
const adminWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { error: 'Too many write operations. Please slow down.' },
  skip: (req) => !req.user,
});

// ─── Validation Schemas ────────────────────────────────────────────────────────
const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional(),
  emoji: z.string().max(10).optional(),
  displayOrder: z.number().int().min(0).optional(),
  parentCategory: z.string().length(24).optional().nullable(),
  seo: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.array(z.string().max(50)).max(10).optional(),
  }).optional(),
});

const updateCategorySchema = createCategorySchema.partial();

const createSubcategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
});

// ─── GET /api/admin/categories – List all categories with optional filtering ──
router.get('/', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const { isActive, parentOnly } = req.query;
  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  if (parentOnly === 'true') {
    filter.parentCategory = null;
  }

  const categories = await Category.find(filter)
    .populate('parentCategory', 'name slug')
    .sort('displayOrder')
    .lean();

  res.json({ categories });
}));

// ─── GET /api/admin/categories/tree – Get category tree for frontend ────────
router.get('/tree', asyncHandler(async (req, res) => {
  const tree = await Category.getCategoryTree();
  res.json({ categories: tree });
}));

// ─── GET /api/admin/categories/:id – Get single category ───────────────────
router.get('/:id', protect, restrictTo('admin'), asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parentCategory', 'name slug');

  if (!category) {
    return res.status(404).json({ error: 'Category not found.' });
  }

  res.json({ category });
}));

// ─── POST /api/admin/categories – Create new category ──────────────────────
router.post(
  '/',
  protect,
  restrictTo('admin'),
  adminWriteLimiter,
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const { name, description, emoji, displayOrder, parentCategory, seo } = req.body;

    // Check if category name already exists
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }

    // Validate parent category exists if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({ error: 'Parent category not found.' });
      }
    }

    const category = await Category.create({
      name,
      description,
      emoji: emoji || '📘',
      displayOrder: displayOrder || 0,
      parentCategory: parentCategory || null,
      seo: seo || {},
    });

    res.status(201).json({ category });
  })
);

// ─── PATCH /api/admin/categories/:id – Update category ────────────────────
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  adminWriteLimiter,
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'description', 'emoji', 'displayOrder', 'seo', 'isActive', 'isHighlighted'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Check for name collision if updating name
    if (updates.name) {
      const existing = await Category.findOne({ name: updates.name, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ error: 'A category with this name already exists.' });
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ category });
  })
);

// ─── DELETE /api/admin/categories/:id – Soft delete category ───────────────
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  adminWriteLimiter,
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Category deactivated successfully.' });
  })
);

// ─── POST /api/admin/categories/:id/subcategories – Add subcategory ────────
router.post(
  '/:id/subcategories',
  protect,
  restrictTo('admin'),
  adminWriteLimiter,
  validate(createSubcategorySchema),
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Generate slug for subcategory
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const subcategory = {
      name,
      slug,
      description: description || '',
    };

    category.subcategories.push(subcategory);
    await category.save();

    res.status(201).json({
      message: 'Subcategory added successfully.',
      subcategory: category.subcategories[category.subcategories.length - 1],
    });
  })
);

// ─── DELETE /api/admin/categories/:id/subcategories/:subId – Remove subcategory
router.delete(
  '/:id/subcategories/:subId',
  protect,
  restrictTo('admin'),
  adminWriteLimiter,
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { subcategories: { _id: req.params.subId } },
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Subcategory removed successfully.', category });
  })
);

// ─── POST /api/admin/categories/recalculate-counts – Recalculate product counts
router.post(
  '/admin/recalculate-counts',
  protect,
  restrictTo('admin'),
  adminWriteLimiter,
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true });

    for (const cat of categories) {
      await Category.updateProductCount(cat._id);
    }

    res.json({ message: 'Product counts updated successfully.' });
  })
);

module.exports = router;
