import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';
const api = axios.create({
  baseURL: BACKEND_URL || '/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const unprotectedPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/reset-password'
];

const cleanRequestUrl = (url) => {
  if (!url) return '';
  let normalizedUrl = url;
  if (BACKEND_URL && normalizedUrl.startsWith(BACKEND_URL)) {
    normalizedUrl = normalizedUrl.slice(BACKEND_URL.length);
  }
  return normalizedUrl.split('?')[0].replace(/\/+$/, '');
};

const isUnprotectedRequest = (url) => {
  const path = cleanRequestUrl(url);
  return unprotectedPaths.some((unprotectedPath) => path === unprotectedPath || path.startsWith(`${unprotectedPath}/`));
};

api.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  if (!isUnprotectedRequest(requestUrl)) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const safeMethods = ['get', 'head', 'options'];
    const method = (config.method || '').toLowerCase();
    const isRetryable = !config.__isRetryRequest && safeMethods.includes(method) && (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error'));

    if (isRetryable) {
      config.__isRetryRequest = true;
      try {
        return await api(config);
      } catch (retryError) {
        error = retryError;
      }
    }

    if (error.code === 'ECONNABORTED') {
      error.customMessage = 'Request timed out. Please try again.';
    } else if (!error.response) {
      error.customMessage = 'Network unavailable. Check your connection and try again.';
    } else {
      switch (error.response.status) {
        case 400:
          error.customMessage = error.response.data?.message || 'Bad request.';
          break;
        case 401:
          error.customMessage = error.response.data?.message || 'Unauthorized. Please login again.';
          break;
        case 403:
          error.customMessage = error.response.data?.message || 'Forbidden. You do not have access.';
          break;
        case 404:
          error.customMessage = error.response.data?.message || 'Resource not found.';
          break;
        case 429:
          error.customMessage = error.response.data?.message || 'Too many requests. Please wait and try again.';
          break;
        case 500:
          error.customMessage = error.response.data?.message || 'Server error. Please try again later.';
          break;
        default:
          error.customMessage = error.response.data?.message || error.message || 'An unexpected error occurred.';
      }
    }

    return Promise.reject(error);
  }
);

export { BACKEND_URL };
export default api;
