const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
} = require('../controllers/message.controller');

router.use(protect);

// Conversation management
router.post('/conversations', createOrGetConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:conversationId', getConversationMessages);
router.patch('/conversations/:conversationId/read', markConversationRead);

// Direct message creation & deletion
router.post('/', sendMessage);
router.delete('/:messageId', deleteMessage);

// Backwards-compatible aliases
router.get('/:conversationId/messages', getConversationMessages);
router.post('/:conversationId/messages', sendMessage);

module.exports = router;
