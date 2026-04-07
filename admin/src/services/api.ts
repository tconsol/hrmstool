import axios from 'axios';

// API base URL: uses /api for Vite proxy (dev) or direct URL (production)
const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      // Redirect superadmin to their login page
      const isSuperAdminRoute = window.location.pathname.startsWith('/superadmin');
      window.location.href = isSuperAdminRoute ? '/superadmin/login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
