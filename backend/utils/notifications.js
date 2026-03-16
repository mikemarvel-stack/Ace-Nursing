const Notification = require('../models/Notification');

async function createNotification({ type, title, message, link, meta, userId = null }) {
  try {
    await Notification.create({ type, title, message, link, meta, userId });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
