import apiClient from '../../../services/apiClient';

export const patientService = {
  getMyProfile: () => apiClient.get('/patients/me/profile'),
  updateMyProfile: (data) => apiClient.put('/patients/me/profile', data),
  uploadPhoto: (formData) => apiClient.post('/patients/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSavedDoctors: () => apiClient.get('/patients/me/saved-doctors'),
  toggleSaveDoctor: (doctorId) => apiClient.post(`/patients/me/saved-doctors/${doctorId}`),
};
