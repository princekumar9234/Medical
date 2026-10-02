import apiClient from '../../../services/apiClient';

export const medicineService = {
  getAllMedicines: () => apiClient.get('/medicines'),
  searchByName: (name) => apiClient.get('/medicines/search', { params: { name } }),
  searchByBarcode: (barcode) => apiClient.post('/medicines/barcode', { barcode }),
  getScanHistory: (params) => apiClient.get('/medicines/scan-history', { params }),
  getScanHistoryById: (id) => apiClient.get(`/medicines/scan-history/${id}`),
  createScanHistory: (data) => apiClient.post('/medicines/scan-history', data),
  deleteScanHistory: (id) => apiClient.delete(`/medicines/scan-history/${id}`),
};

export const medicineApi = medicineService;
export default medicineService;
