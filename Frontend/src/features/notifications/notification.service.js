import apiClient from '../../services/apiClient';

export const notificationService = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/mark-all-read'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};
