const mongoose = require('mongoose');
const crypto = require('crypto');

const customOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },

    // ── Who submitted it ──────────────────────────────────────────────────────
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerInfo: {
      firstName: { type: String, required: true },
      lastName:  { type: String, required: true },
      email:     { type: String, required: true },
      phone:     String,
    },

    // ── Assignment details ────────────────────────────────────────────────────
    subject:      { type: String, required: true },
    assignmentType: {
      type: String,
      enum: ['Essay', 'Case Study', 'Care Plan', 'Research Paper', 'Presentation', 'Exam Prep', 'Other'],
      required: true,
    },
    pages:        { type: Number, min: 1 },
    deadline:     { type: Date, required: true },
    requirements: { type: String, required: true, maxlength: 5000 },
    attachmentNotes: { type: String, maxlength: 1000 }, // user describes files they'll send via email
    academicLevel: {
      type: String,
      enum: ['Certificate', 'Diploma', 'Undergraduate', 'Postgraduate', 'Other'],
      default: 'Undergraduate',
    },
    citationStyle: {
      type: String,
      enum: ['APA', 'MLA', 'Harvard', 'Chicago', 'None', 'Other'],
      default: 'APA',
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['submitted', 'reviewing', 'quoted', 'accepted', 'declined', 'in_progress', 'delivered', 'completed', 'revision_requested', 'cancelled'],
      default: 'submitted',
    },

    // ── Admin quote ───────────────────────────────────────────────────────────
    quote: {
      price:       Number,
      currency:    { type: String, default: 'USD' },
      daysToComplete: Number,
      adminNotes:  String,
      quotedAt:    Date,
      expiresAt:   Date, // auto-expire 48h after quoting
    },

    // ── User response ─────────────────────────────────────────────────────────
    userResponse: {
      action:      { type: String, enum: ['accepted', 'declined'] },
      respondedAt: Date,
      declineReason: String,
    },

    // ── Delivery ──────────────────────────────────────────────────────────────
    delivery: {
      dueAt:        Date,
      deliveredAt:  Date,
      confirmedAt:  Date,    // set when user clicks "Confirm Receipt"
      fileKey:      String,
      originalName: String,
      downloadUrl:  String,
      notes:        String,
    },

    // ── Revision tracking ──────────────────────────────────────────────
    revisionsUsed: { type: Number, default: 0 }, // max 3

    // ── Revision ─────────────────────────────────────────────────────────────
    revisionRequests: [{
      requestedAt: { type: Date, default: Date.now },
      notes:       String,
      resolvedAt:  Date,
    }],

    // ── Payment ───────────────────────────────────────────────────────────────
    payment: {
      status:   { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
      method:   String,
      paidAt:   Date,
      paypalOrderId: String,
    },

    adminNotes: String, // internal only
    ipAddress:  String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── Auto order number ─────────────────────────────────────────────────────────
customOrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const ts  = Date.now().toString(36).toUpperCase();
    const rnd = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `ACN-C-${ts}-${rnd}`;
  }
  next();
});

// ── Virtuals ──────────────────────────────────────────────────────────────────
customOrderSchema.virtual('isQuoteExpired').get(function () {
  return this.quote?.expiresAt && new Date() > new Date(this.quote.expiresAt);
});

customOrderSchema.virtual('timeRemainingMs').get(function () {
  if (!this.delivery?.dueAt) return null;
  return Math.max(0, new Date(this.delivery.dueAt) - new Date());
});

// ── Indexes ───────────────────────────────────────────────────────────────────
customOrderSchema.index({ user: 1, createdAt: -1 });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ 'customerInfo.email': 1 });

module.exports = mongoose.model('CustomOrder', customOrderSchema);
