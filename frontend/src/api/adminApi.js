import api from './axiosInstance';

export const adminApi = {
  verify: () => api.get('/admin/verify'),
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: () => api.get('/admin/analytics'),
  getManifest: (tripId) => api.get(`/admin/manifest/${tripId}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params })
};

