import api from './axiosInstance';

export const routeApi = {
  getRoutes: (params) => api.get('/routes', { params }),
  getRouteById: (id) => api.get(`/routes/${id}`),
  getCities: () => api.get('/routes/cities'),
  createRoute: (data) => api.post('/routes', data),
  updateRoute: (id, data) => api.put(`/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/routes/${id}`)
};

