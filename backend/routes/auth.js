const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const { createNotification } = require('../utils/notifications');
const asyncHandler = require('../utils/asyncHandler');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } = require('../utils/validation');

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

  sendWelcomeEmail({ user }).catch(() => {});
  createNotification({
    type: 'new_user',
    title: 'New User Registered',
    message: `${user.firstName} ${user.lastName} (${user.email}) just created an account.`,
    link: '/admin',
    meta: { userId: user._id, email: user.email, country: user.country },
  });

  sendAuthResponse(res, user, 201);
}));

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(res, user);
}));

// ─── POST /api/auth/admin-login ───────────────────────────────────────────────
router.post('/admin-login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: 'admin' }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

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
  if (!user) {
    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendPasswordResetEmail({ user, resetUrl });

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
  await user.save();

  sendAuthResponse(res, user);
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
