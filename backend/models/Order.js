const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  coverImage: String,
  downloadToken: String,      // SHA-256 hash of the raw token
  downloadTokenHash: String,  // alias kept for clarity — same field
  downloadExpiry: Date,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    customerInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      country: String,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    payment: {
      method: {
        type: String,
        enum: ['paypal', 'card', 'mpesa'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      paypalOrderId: String,
      paypalCaptureId: String,
      paypalPayerId: String,
      transactionId: String,
      paidAt: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    downloadEmailSent: { type: Boolean, default: false },
    refundReason: String,
    notes: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// `orderNumber` is marked `unique: true` in the schema, so an additional index is redundant.
orderSchema.index({ 'customerInfo.email': 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.paypalOrderId': 1 });

// ─── Pre-save: generate order number ──────────────────────────────────────────
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const prefix = 'ACN';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// ─── Virtuals ──────────────────────────────────────────────────────────────────
orderSchema.virtual('isPaid').get(function () {
  return this.payment.status === 'completed';
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
