import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';
const ADMIN_TOKEN_KEY = 'adminToken';

const getStoredAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';
};

const adminApi = axios.create({
  baseURL: BACKEND_URL || '/',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

adminApi.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const adminToken = getStoredAdminToken();
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      error.customMessage = error.response?.data?.message || 'Admin access required.';
    } else if (status === 500) {
      error.customMessage = error.response?.data?.message || 'Server error.';
    } else if (!error.response) {
      error.customMessage = 'Network unavailable. Check your connection and try again.';
    } else {
      error.customMessage = error.response?.data?.message || error.message;
    }
    return Promise.reject(error);
  }
);

export default adminApi;
export { ADMIN_TOKEN_KEY };
