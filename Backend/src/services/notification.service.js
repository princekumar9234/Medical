const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 */
const createNotification = async ({ recipient, sender = null, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data,
    });
    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};

module.exports = { createNotification };
