import axios from 'axios';

// Ensure persistent client session token for real-time seat locks
export const getClientToken = () => {
  let token = localStorage.getItem('algions_client_token');
  if (!token) {
    token = 'client_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('algions_client_token', token);
  }
  return token;
};

// Clean base URL: ensure proper /api endpoint regardless of how env variable was entered
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || envUrl === '/') return '/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT Bearer token & client session token
api.interceptors.request.use(
  (config) => {
    config.headers['x-client-token'] = getClientToken();
    const token = localStorage.getItem('algions_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response payload or error message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorPayload = error.response?.data || {
      success: false,
      message: error.message || 'Network communication failed'
    };
    return Promise.reject(errorPayload);
  }
);

export default api;

