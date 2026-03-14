const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'Kenya',
    },
    purchases: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        purchasedAt: { type: Date, default: Date.now },
        downloadUrl: String,
        downloadExpiry: Date,
      },
    ],
    downloadTokens: [
      {
        token: String,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        expiresAt: Date,
        used: { type: Boolean, default: false },
      },
    ],
    passwordResetToken: String,
    passwordResetExpires: Date,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Middleware ────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.createDownloadToken = function (productId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  this.downloadTokens.push({ token, productId, expiresAt });
  return token;
};

// ─── Static Methods ────────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
