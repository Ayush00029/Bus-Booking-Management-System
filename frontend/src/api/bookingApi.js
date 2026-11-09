import api from './axiosInstance';

export const bookingApi = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getBookingByPnr: (pnr) => api.get(`/bookings/pnr/${pnr}`),
  lookupTicket: (pnr, contact = '') => api.get('/bookings/lookup', { params: { pnr, contact } }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id, data) => api.post(`/bookings/${id}/cancel`, data),
  getAllBookings: (params) => api.get('/bookings', { params })
};

