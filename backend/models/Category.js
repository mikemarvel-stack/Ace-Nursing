const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [120, 'Slug cannot exceed 120 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      trim: true,
    },
    // SEO for category pages
    seo: {
      metaTitle: {
        type: String,
        maxlength: [60, 'SEO title cannot exceed 60 characters'],
      },
      metaDescription: {
        type: String,
        maxlength: [160, 'SEO description cannot exceed 160 characters'],
      },
      keywords: [
        {
          type: String,
          maxlength: [50],
        },
      ],
    },
    // Sub-categories (children)
    subcategories: [
      {
        name: {
          type: String,
          maxlength: [100],
        },
        slug: {
          type: String,
          lowercase: true,
          trim: true,
        },
        description: {
          type: String,
          maxlength: [500],
        },
      },
    ],
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    emoji: {
      type: String,
      default: '📘',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
categorySchema.pre('save', function (next) {
  if (!this.isModified('name')) return next();
  this.slug = this.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  next();
});

// Index for efficient queries
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ parentCategory: 1 });

// Virtual for full slug path (parent/child)
categorySchema.virtual('fullSlug').get(function () {
  return this.parentCategory ? `${this.parentCategory.slug}/${this.slug}` : this.slug;
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function () {
  return this.find({ parentCategory: null, isActive: true })
    .populate({
      path: 'subcategories',
      select: 'name slug description emoji',
    })
    .sort('displayOrder')
    .lean();
};

// Static method to update product count
categorySchema.statics.updateProductCount = async function (categoryId) {
  const Product = require('./Product');
  const count = await Product.countDocuments({ category: categoryId, isActive: true });
  return this.findByIdAndUpdate(categoryId, { productCount: count }, { new: true });
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
