const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');

// ─── Helper ────────────────────────────────────────────────────────────────────
const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ token, user });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, country } = req.body;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({ firstName, lastName, email, password, phone, country });

    // Fire-and-forget welcome email
    sendWelcomeEmail({ user }).catch(console.error);

    sendAuthResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(res, user);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/admin-login ───────────────────────────────────────────────
router.post('/admin-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase(), role: 'admin' }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    sendAuthResponse(res, user);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('purchases.product', 'title coverImage');
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/auth/update-profile ──────────────────────────────────────────
router.patch('/update-profile', protect, async (req, res, next) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'country'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendPasswordResetEmail({ user, resetUrl });

    res.json({ message: 'Password reset email sent.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/reset-password/:token ────────────────────────────────────
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

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
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/setup-admin (one-time use with setup key) ─────────────────
router.post('/setup-admin', async (req, res, next) => {
  try {
    if (req.body.setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key.' });
    }
    const { firstName, lastName, email, password } = req.body;
    const user = await User.create({ firstName, lastName, email, password, role: 'admin' });
    sendAuthResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
