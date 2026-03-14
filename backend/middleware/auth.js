const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT and attach user to request
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ error: 'You are not logged in. Please log in to continue.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'The user associated with this token no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restrict route to specific roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

/**
 * Optional auth — attaches user if token present, continues otherwise
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {
    // Silent — optional auth doesn't block
  }
  next();
};

/**
 * Generate signed JWT
 */
exports.signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};
