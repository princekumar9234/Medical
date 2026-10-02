const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  getOrCreateConversation, getMyConversations,
  getMessages, sendMessage, deleteMessage,
} = require('../controllers/chat.controller');

router.use(protect);

router.get('/conversations', getMyConversations);
router.get('/conversations/:otherUserId', getOrCreateConversation);
router.get('/:conversationId/messages', getMessages);
router.post(
  '/:conversationId/messages',
  [body('content').trim().notEmpty().withMessage('Message cannot be empty.').isLength({ max: 2000 }).withMessage('Message too long.')],
  validate,
  sendMessage
);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
