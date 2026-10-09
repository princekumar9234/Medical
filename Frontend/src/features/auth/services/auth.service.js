import apiClient from '../../../services/apiClient';

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  verifyEmail: (token, email) => apiClient.get(`/auth/verify-email/${token}${email ? `?email=${encodeURIComponent(email)}` : ''}`),
  verifyEmailOtp: (otp, email) => apiClient.post('/auth/verify-email', { otp: String(otp).trim(), email: String(email).trim().toLowerCase() }),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email: String(email).trim().toLowerCase() }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => apiClient.post(`/auth/reset-password/${token}`, data),
  logoutAll: () => apiClient.post('/auth/logout-all'),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
};
