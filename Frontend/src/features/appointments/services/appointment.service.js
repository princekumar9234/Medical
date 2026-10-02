import apiClient from '../../../services/apiClient';

export const appointmentService = {
  book: (data) => apiClient.post('/appointments', data),
  getMyAppointments: (params) => apiClient.get('/appointments', { params }),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  updateStatus: (id, data) => apiClient.put(`/appointments/${id}/status`, data),
  cancel: (id, data) => apiClient.put(`/appointments/${id}/cancel`, data),
  getToday: () => apiClient.get('/appointments/today'),
};
