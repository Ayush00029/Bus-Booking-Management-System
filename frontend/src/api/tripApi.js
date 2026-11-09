import api from './axiosInstance';

export const tripApi = {
  searchTrips: (params) => api.get('/trips/search', { params }),
  getTrips: (params) => api.get('/trips', { params }),
  getTripById: (id) => api.get(`/trips/${id}`),
  lockSeats: (id, seatNumbers, lockDurationMinutes = 10) =>
    api.post(`/trips/${id}/lock-seats`, { seatNumbers, lockDurationMinutes }),
  unlockSeats: (id, seatNumbers) =>
    api.post(`/trips/${id}/unlock-seats`, { seatNumbers }),
  createTrip: (data) => api.post('/trips', data),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`)
};

