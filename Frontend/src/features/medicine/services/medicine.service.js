import apiClient from '../../../services/apiClient';

export const medicineService = {
  searchByName: (name) => apiClient.get('/medicine/search', { params: { name } }),
  searchByBarcode: (barcode) => apiClient.get('/medicine/barcode', { params: { barcode } }),
  uploadImage: (formData) => apiClient.post('/medicine/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: (params) => apiClient.get('/medicine/history', { params }),
  deleteHistory: (historyId) => apiClient.delete(`/medicine/history/${historyId}`),
};
