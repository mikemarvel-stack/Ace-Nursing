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
    // Account lockout for brute force protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: Date,
    // Email verification
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerified: { type: Boolean, default: false },
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

// ─── Account Lockout Methods ─────────────────────────────────────────────────
userSchema.methods.isLocked = function () {
  return this.lockoutUntil && this.lockoutUntil > Date.now();
};

userSchema.methods.incrementFailedAttempts = function () {
  // If lockout has expired, reset attempts
  if (this.lockoutUntil && this.lockoutUntil < Date.now()) {
    return this.resetFailedAttempts();
  }
  
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (this.failedLoginAttempts >= 5 && !this.isLocked()) {
    this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
};

userSchema.methods.resetFailedAttempts = function () {
  this.failedLoginAttempts = 0;
  this.lockoutUntil = undefined;
};

// ─── Email Verification Methods ──────────────────────────────────────────────
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

userSchema.methods.verifyEmail = function (token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  if (this.emailVerificationToken !== hashedToken) {
    return false;
  }
  
  if (this.emailVerificationExpires < Date.now()) {
    return false;
  }
  
  this.emailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  return true;
};

// ─── Indexes ───────────────────────────────────────────────────────────────────
// TTL index: automatically delete password reset tokens 10 minutes after creation
userSchema.index(
  { passwordResetExpires: 1 },
  {
    expireAfterSeconds: 0,
    sparse: true,
    partialFilterExpression: { passwordResetToken: { $exists: true } }
  }
);

// TTL index: automatically clear email verification tokens 24 hours after creation
userSchema.index(
  { emailVerificationExpires: 1 },
  {
    expireAfterSeconds: 0,
    sparse: true,
    partialFilterExpression: { emailVerificationToken: { $exists: true } }
  }
);

// Sparse index for lockout expiry checking
userSchema.index({ lockoutUntil: 1 }, { sparse: true });

// ─── Static Methods ────────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
