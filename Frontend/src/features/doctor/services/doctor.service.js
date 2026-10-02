import apiClient from '../../../services/apiClient';

export const doctorService = {
  // Public
  searchDoctors: (params) => apiClient.get('/doctors/search', { params }),
  getPublicProfile: (doctorId) => apiClient.get(`/doctors/${doctorId}/profile`),
  getAvailableSlots: (doctorId, date) => apiClient.get(`/doctors/${doctorId}/slots`, { params: { date } }),

  // Doctor's own profile
  getMyProfile: () => apiClient.get('/doctors/me/profile'),
  updateMyProfile: (data) => apiClient.put('/doctors/me/profile', data),
  uploadPhoto: (formData) => apiClient.post('/doctors/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Experience
  addExperience: (data) => apiClient.post('/doctors/me/experience', data),
  updateExperience: (expId, data) => apiClient.put(`/doctors/me/experience/${expId}`, data),
  deleteExperience: (expId) => apiClient.delete(`/doctors/me/experience/${expId}`),

  // Education
  addEducation: (data) => apiClient.post('/doctors/me/education', data),
  updateEducation: (eduId, data) => apiClient.put(`/doctors/me/education/${eduId}`, data),
  deleteEducation: (eduId) => apiClient.delete(`/doctors/me/education/${eduId}`),

  // Workplaces
  addWorkplace: (data) => apiClient.post('/doctors/me/workplaces', data),
  getMyWorkplaces: () => apiClient.get('/doctors/me/workplaces'),
  updateWorkplace: (id, data) => apiClient.put(`/doctors/me/workplaces/${id}`, data),
  deleteWorkplace: (id) => apiClient.delete(`/doctors/me/workplaces/${id}`),
};
