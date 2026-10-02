import apiClient from '../../../services/apiClient';

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => apiClient.post(`/auth/reset-password/${token}`, data),
  logoutAll: () => apiClient.post('/auth/logout-all'),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
};
