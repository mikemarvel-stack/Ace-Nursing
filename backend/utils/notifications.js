const Notification = require('../models/Notification');

async function createNotification({ type, title, message, link, meta }) {
  try {
    await Notification.create({ type, title, message, link, meta });
  } catch (err) {
    // Non-fatal — never crash the main request
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
