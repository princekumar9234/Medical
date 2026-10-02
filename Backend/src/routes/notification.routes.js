const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getMyNotifications, markAsRead, markAllAsRead, deleteNotification,
} = require('../controllers/notification.controller');

router.use(protect);

router.get('/', getMyNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:notificationId/read', markAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router;
