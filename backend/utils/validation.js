const { z } = require('zod');

// Strong password validation
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must contain lowercase letters')
  .regex(/[A-Z]/, 'Password must contain uppercase letters')
  .regex(/\d/, 'Password must contain numbers')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain special characters');

// ─── Auth ──────────────────────────────────────────────────────────────────────
exports.registerSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName:  z.string().min(1).max(50).trim(),
  email:     z.string().email().max(200).toLowerCase(),
  password:  passwordSchema,
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
  password: passwordSchema,
});

exports.changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
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

exports.createCustomOrderSchema = z.object({
  customOrderId: z.string().length(24),
});

exports.captureCustomOrderSchema = z.object({
  paypalOrderId: z.string().min(1).max(100),
  customOrderId: z.string().length(24),
});

// ─── Contact ──────────────────────────────────────────────────────────────────
exports.contactSchema = z.object({
  name:    z.string().min(1).max(100).trim(),
  email:   z.string().email().max(200),
  phone:   z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000).trim(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
exports.createProductSchema = z.object({
  title:       z.string().min(1).max(120).trim(),
  slug:        z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).trim().optional(),
  price:       z.number().min(0.01).max(10000),
  category:    z.string().min(1).max(100),
  coverImage:  z.object({
    url:      z.string().url().max(2048).optional(),
    key:      z.string().max(500).optional(),
    srcSet:   z.string().max(2048).optional(),
  }).optional(),
  fileKey:     z.string().max(500).optional(),
  badge:       z.string().max(50).optional().nullable(),
  featured:    z.boolean().optional(),
  seo:         z.object({
    metaTitle:       z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords:        z.array(z.string().max(100)).max(10).optional(),
  }).optional(),
});

exports.updateProductSchema = exports.createProductSchema.partial();

// ─── Middleware factory ────────────────────────────────────────────────────────
/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure returns 400 with structured field errors.
 */
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error?.issues ?? result.error?.errors ?? [];
    const errors = issues.map(e => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  req.body = result.data;
  next();
};

// ─── Pagination & Query Validation ─────────────────────────────────────────────
/**
 * Safely parse pagination parameters with strict limits to prevent DoS
 */
exports.parsePagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Validate ObjectId string format
 */
exports.isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

/**
 * Whitelist allowed sort fields to prevent NoSQL injection
 */
exports.validateSortParam = (sort, allowedFields = ['price', 'featured', 'rating.average', 'createdAt']) => {
  const ALLOWED_SORTS = [
    ...allowedFields,
    ...allowedFields.map(f => `-${f}`), // Descending variants
  ];
  
  if (!ALLOWED_SORTS.includes(String(sort))) {
    return '-featured'; // Default safe sort
  }
  
  return sort;
};
