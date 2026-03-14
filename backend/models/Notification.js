const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['new_order', 'new_user', 'contact_message', 'order_status', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: String, // e.g. /admin/orders or /admin/orders/:id
    meta: mongoose.Schema.Types.Mixed, // extra data (orderId, userId, etc.)
  },
  { timestamps: true }
);

notificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
