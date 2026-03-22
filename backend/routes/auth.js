const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail, sendChangePasswordEmail, sendEmailVerificationEmail } = require('../utils/email');
const { createNotification } = require('../utils/notifications');
const { logger } = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema } = require('../utils/validation');

const setupAdminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many setup attempts.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset requests. Try again in 1 hour.' },
});

// ─── Helper ────────────────────────────────────────────────────────────────────
const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ token, user });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, country } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const user = await User.create({ firstName, lastName, email, password, phone, country });
  
  // Create email verification token and send verification email
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  sendWelcomeEmail({ user }).catch(err => {
    logger.error('Failed to send welcome email: %s', err.message, { email: user.email });
  });
  sendEmailVerificationEmail({ user, verificationUrl }).catch(err => {
    logger.error('Failed to send email verification: %s', err.message, { email: user.email });
  });

  createNotification({
    type: 'new_user',
    title: 'New User Registered',
    message: `${user.firstName} ${user.lastName} (${user.email}) just created an account.`,
    link: '/admin',
    meta: { userId: user._id, email: user.email, country: user.country },
  });

  // Return token but indicate email verification is pending
  sendAuthResponse(res, user, 201);
}));

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  
  // Check if account is locked
  if (user && user.isLocked()) {
    const lockoutRemaining = Math.ceil((user.lockoutUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({ 
      error: `Account locked due to multiple failed login attempts. Try again in ${lockoutRemaining} minutes.` 
    });
  }

  if (!user || !(await user.comparePassword(password))) {
    // Increment failed attempts on failed login
    if (user) {
      user.incrementFailedAttempts();
      await user.save({ validateBeforeSave: false });
      
      if (user.isLocked()) {
        return res.status(429).json({ 
          error: 'Too many failed login attempts. Account locked for 15 minutes.' 
        });
      }
    }
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      requiresEmailVerification: true 
    });
  }

  // Reset failed attempts on successful login
  user.resetFailedAttempts();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, user);
}));

// ─── POST /api/auth/admin-login ───────────────────────────────────────────────
router.post('/admin-login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: 'admin' }).select('+password');

  // Check if account is locked
  if (user && user.isLocked()) {
    const lockoutRemaining = Math.ceil((user.lockoutUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({ 
      error: `Account locked due to multiple failed login attempts. Try again in ${lockoutRemaining} minutes.` 
    });
  }

  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      user.incrementFailedAttempts();
      await user.save({ validateBeforeSave: false });
      if (user.isLocked()) {
        return res.status(429).json({ 
          error: 'Too many failed login attempts. Account locked for 15 minutes.' 
        });
      }
    }
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ 
      error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      requiresEmailVerification: true 
    });
  }

  // Reset failed attempts on successful login
  user.resetFailedAttempts();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, user);
}));

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('purchases.product', 'title coverImage');
  res.json({ user });
}));

// ─── PATCH /api/auth/update-profile ──────────────────────────────────────────
router.patch('/update-profile', protect, validate(updateProfileSchema), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json({ user });
}));

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  
  // Always perform crypto operation to prevent timing attacks
  const fakeToken = crypto.randomBytes(32).toString('hex');
  const fakeHashedToken = crypto.createHash('sha256').update(fakeToken).digest('hex');
  
  if (user) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail({ user, resetUrl }).catch(err => {
      logger.error('Failed to send password reset email: %s', err.message, { email: user.email });
    });
  }

  // Always return the same response to prevent email enumeration
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
}));

// ─── POST /api/auth/reset-password/:token ────────────────────────────────────
router.post('/reset-password/:token', validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: 'Token is invalid or has expired.' });
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.resetFailedAttempts();
  await user.save();

  // Send confirmation email
  await sendChangePasswordEmail({ user, isReset: true }).catch(err => {
    logger.error('Failed to send password reset confirmation: %s', err.message, { email: user.email });
  });

  sendAuthResponse(res, user);
}));

// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', protect, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send confirmation email
  await sendChangePasswordEmail({ user, isReset: false }).catch(err => {
    logger.error('Failed to send password change confirmation: %s', err.message, { email: user.email });
  });

  res.json({ message: 'Password changed successfully. A confirmation email has been sent.' });
}));

// ─── POST /api/auth/verify-email/:token ──────────────────────────────────────
router.post('/verify-email/:token', asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: 'Email verification token is invalid or has expired.' });
  }

  if (user.verifyEmail(req.params.token)) {
    await user.save({ validateBeforeSave: false });
    res.json({ message: 'Email verified successfully! You can now log in.' });
  } else {
    return res.status(400).json({ error: 'Email verification failed. Token is invalid or expired.' });
  }
}));

// ─── POST /api/auth/setup-admin ───────────────────────────────────────────────
router.post('/setup-admin', setupAdminLimiter, asyncHandler(async (req, res) => {
  if (req.body.setupKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ error: 'Invalid setup key.' });
  }
  const { firstName, lastName, email, password } = req.body;
  const user = await User.create({ firstName, lastName, email, password, role: 'admin' });
  sendAuthResponse(res, user, 201);
}));

module.exports = router;
