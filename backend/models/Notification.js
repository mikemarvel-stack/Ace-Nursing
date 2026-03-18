const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['new_order', 'new_user', 'contact_message', 'order_status', 'new_review', 'custom_order', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: String,
    meta: mongoose.Schema.Types.Mixed,
    // If set, this notification belongs to a specific user (customer-facing).
    // If null, it is an admin-only notification.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
