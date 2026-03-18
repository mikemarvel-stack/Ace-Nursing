const { z } = require('zod');

// ─── Auth ──────────────────────────────────────────────────────────────────────
exports.registerSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName:  z.string().min(1).max(50).trim(),
  email:     z.string().email().max(200).toLowerCase(),
  password:  z.string().min(8).max(128),
  phone:     z.string().max(30).optional(),
  country:   z.string().max(80).optional(),
});

exports.loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

exports.forgotPasswordSchema = z.object({
  email: z.string().email(),
});

exports.resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

exports.updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName:  z.string().min(1).max(50).trim().optional(),
  phone:     z.string().max(30).optional(),
  country:   z.string().max(80).optional(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
exports.createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().length(24),
    quantity:  z.number().int().min(1).max(10).optional(),
  })).min(1).max(20),
  customerInfo: z.object({
    firstName: z.string().min(1).max(50).trim(),
    lastName:  z.string().min(1).max(50).trim(),
    email:     z.string().email().max(200),
    phone:     z.string().max(30).optional(),
    country:   z.string().max(80).optional(),
  }),
});

exports.captureOrderSchema = z.object({
  paypalOrderId: z.string().min(1).max(100),
  orderId:       z.string().length(24),
});

// ─── Contact ──────────────────────────────────────────────────────────────────
exports.contactSchema = z.object({
  name:    z.string().min(1).max(100).trim(),
  email:   z.string().email().max(200),
  phone:   z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000).trim(),
});

// ─── Middleware factory ────────────────────────────────────────────────────────
/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure returns 400 with structured field errors.
 */
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  req.body = result.data; // replace with coerced/trimmed data
  next();
};
