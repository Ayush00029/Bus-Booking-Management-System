import api from './axiosInstance';

export const busApi = {
  getOperators: () => api.get('/buses/operators'),
  createOperator: (data) => api.post('/buses/operators', data),
  getBuses: (params) => api.get('/buses', { params }),
  getBusById: (id) => api.get(`/buses/${id}`),
  createBus: (data) => api.post('/buses', data),
  updateBus: (id, data) => api.put(`/buses/${id}`, data),
  deleteBus: (id) => api.delete(`/buses/${id}`)
};

