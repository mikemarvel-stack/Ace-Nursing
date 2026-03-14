const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Study Guides', 'Flashcards', 'Reference Cards', 'Checklists', 'Bundles'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    badge: {
      type: String,
      enum: ['Best Seller', 'Popular', 'New', 'Top Rated', 'Best Value', 'Fan Fave', 'Advanced', 'Must Have', null],
      default: null,
    },
    emoji: {
      type: String,
      default: '📘',
    },
    coverImage: {
      url: String,
      key: String,
    },
    fileUrl: {
      key: String,
      originalName: String,
      size: Number,
    },
    pages: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      default: 'PDF',
    },
    tags: [String],
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    totalSales: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ──────────────────────────────────────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// ─── Indexing ─────────────────────────────────────────────────────────────────
// `slug` is already marked `unique: true` in the schema, so an additional index is redundant.
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

// ─── Middleware ────────────────────────────────────────────────────────────────
productSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    let slug = slugify(this.title, { lower: true, strict: true });
    const exists = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
    if (exists) slug = `${slug}-${Date.now()}`;
    this.slug = slug;
  }
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = { average: 0, count: 0 };
    return;
  }
  const avg = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  this.rating = { average: Math.round(avg * 10) / 10, count: this.reviews.length };
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
