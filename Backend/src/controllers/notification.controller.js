const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/response');

// ─────────────────────────────────────────────
// GET MY NOTIFICATIONS
// ─────────────────────────────────────────────
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    const notifications = await Notification.find(filter)
      .populate('sender', 'fullName profilePhoto')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return successResponse(res, 'Notifications fetched.', {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// MARK AS READ
// ─────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notif = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notif) return errorResponse(res, 'Notification not found.', 404);

    notif.isRead = true;
    await notif.save();

    return successResponse(res, 'Marked as read.', null);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    return successResponse(res, 'All notifications marked as read.', null);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE NOTIFICATION
// ─────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await Notification.findOneAndDelete({ _id: notificationId, recipient: req.user._id });
    return successResponse(res, 'Notification deleted.', null);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
