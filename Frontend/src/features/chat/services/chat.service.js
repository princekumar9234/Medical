import apiClient from '../../../services/apiClient';

export const chatService = {
  // ── Conversations ────────────────────────────────────────────────────────────
  /** GET /api/messages/conversations  →  list all conversations for current user */
  getConversations: () => apiClient.get('/messages/conversations'),

  /** POST /api/messages/conversations  →  create or retrieve conversation with another user */
  createOrGetConversation: (targetUserId) =>
    apiClient.post('/messages/conversations', { participantId: targetUserId }),

  /** PATCH /api/messages/conversations/:id/read  →  mark all messages in convo as read */
  markRead: (conversationId) =>
    apiClient.patch(`/messages/conversations/${conversationId}/read`),

  // ── Messages ─────────────────────────────────────────────────────────────────
  /** GET /api/messages/conversations/:id  →  fetch messages for a conversation */
  getMessages: (conversationId) =>
    apiClient.get(`/messages/conversations/${conversationId}`),

  /** POST /api/messages  →  send a new message */
  sendMessage: (conversationId, message) =>
    apiClient.post('/messages', { conversationId, message }),

  /** DELETE /api/messages/:messageId  →  delete a message */
  deleteMessage: (messageId) => apiClient.delete(`/messages/${messageId}`),

  // ── Doctors list (for patient to start a new conversation) ──────────────────
  getDoctors: (params) => apiClient.get('/doctors/search', { params }),
};
