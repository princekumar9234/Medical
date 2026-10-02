import apiClient from '../../../services/apiClient';

export const chatService = {
  getConversations: () => apiClient.get('/chat/conversations'),
  getOrCreate: (otherUserId) => apiClient.get(`/chat/conversations/${otherUserId}`),
  getMessages: (conversationId, params) => apiClient.get(`/chat/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, content) => apiClient.post(`/chat/${conversationId}/messages`, { content }),
  deleteMessage: (messageId) => apiClient.delete(`/chat/messages/${messageId}`),
};
