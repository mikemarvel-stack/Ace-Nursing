import axios from 'axios';
import { useAuthStore } from './store';

const ALLOWED_API_ORIGINS = new Set([
  window.location.origin,
  'http://localhost:5000',
  'http://localhost:3000',
  'https://acenursing-backend.onrender.com',
  'https://ace-nursing.onrender.com',
]);

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Security: Validate baseURL origin against allowlist to prevent SSRF-style misconfiguration
// ALWAYS validate, even in development
try {
  const parsedBase = new URL(rawBaseURL, window.location.origin);
  if (!ALLOWED_API_ORIGINS.has(parsedBase.origin)) {
    throw new Error(`Blocked unsafe API base URL: ${rawBaseURL}. Origin ${parsedBase.origin} not in allowlist.`);
  }
} catch (err) {
  console.error('API URL validation failed:', err.message);
  throw err;
}

const api = axios.create({
  baseURL: rawBaseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: inject JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle 401 and retry on transient failures ────────
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 401 - always logout
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Retry logic for transient failures (5xx errors, timeouts, network errors)
    if (!config || config.retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    // Only retry on specific status codes or network errors
    const shouldRetry =
      !error.response || // Network error (no response)
      error.response?.status >= 500 || // Server errors
      error.response?.status === 408 || // Request timeout
      error.code === 'ECONNABORTED'; // Timeout

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;
    config.retryCount++;

    // Exponential backoff: delay increases with each retry
    const delayMs = RETRY_DELAY * Math.pow(2, config.retryCount - 1);
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return api(config);
  }
);

// ─── Product API ───────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params, options = {}) => 
    api.get('/products', { params, signal: options.signal }),
  getFeatured: (options = {}) => 
    api.get('/products/featured', { signal: options.signal }),
  getOne: (id, options = {}) => 
    api.get(`/products/${id}`, { signal: options.signal }),
  create: (data, options = {}) => 
    api.post('/products', data, { signal: options.signal }),
  update: (id, data, options = {}) => 
    api.patch(`/products/${id}`, data, { signal: options.signal }),
  delete: (id, options = {}) => 
    api.delete(`/products/${id}`, { signal: options.signal }),
  addReview: (id, data, options = {}) => 
    api.post(`/products/${id}/reviews`, data, { signal: options.signal }),
  adminGetAll: (options = {}) => 
    api.get('/products/admin/all', { signal: options.signal }),
};

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data, options = {}) => 
    api.post('/auth/register', data, { signal: options.signal }),
  login: (data, options = {}) => 
    api.post('/auth/login', data, { signal: options.signal }),
  adminLogin: (data, options = {}) => 
    api.post('/auth/admin-login', data, { signal: options.signal }),
  me: (options = {}) => 
    api.get('/auth/me', { signal: options.signal }),
  updateProfile: (data, options = {}) => 
    api.patch('/auth/update-profile', data, { signal: options.signal }),
  forgotPassword: (email, options = {}) => 
    api.post('/auth/forgot-password', { email }, { signal: options.signal }),
  resetPassword: (token, password, options = {}) =>
    api.post(`/auth/reset-password/${token}`, { password }, { signal: options.signal }),
};

// ─── Payment API ───────────────────────────────────────────────────────────────
export const paymentAPI = {
  createPayPalOrder: (data, options = {}) => 
    api.post('/payments/paypal/create-order', data, { signal: options.signal }),
  capturePayPalOrder: (data, options = {}) => 
    api.post('/payments/paypal/capture', data, { signal: options.signal }),
  createCustomPayPalOrder: (data, options = {}) => 
    api.post('/payments/paypal/create-custom-order', data, { signal: options.signal }),
  captureCustomPayPalOrder: (data, options = {}) => 
    api.post('/payments/paypal/capture-custom-order', data, { signal: options.signal }),
  redownloadCustomOrder: (id, options = {}) => 
    api.get(`/payments/custom-order/${id}/download`, { signal: options.signal }),
  getMyOrders: (options = {}) => 
    api.get('/payments/orders', { signal: options.signal }),
};

// ─── Upload API ────────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadProductFull: (formData, options = {}) =>
    api.post('/upload/product-full', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      signal: options.signal,
      onUploadProgress: options.onProgress,
    }),
  uploadCustomOrderFile: (formData, options = {}) =>
    api.post('/upload/custom-order-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      signal: options.signal,
      onUploadProgress: options.onProgress,
    }),
  uploadPdf: (formData, options = {}) =>
    api.post('/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      signal: options.signal,
    }),
  uploadImage: (formData, options = {}) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
      signal: options.signal,
    }),
  deleteFile: (key, options = {}) => 
    api.delete('/upload/file', { data: { key }, signal: options.signal }),
};

// ─── Orders Admin API ──────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (params, options = {}) => 
    api.get('/orders', { params, signal: options.signal }),
  getStats: (options = {}) => 
    api.get('/orders/stats', { signal: options.signal }),
  getOne: (id, options = {}) => 
    api.get(`/orders/${id}`, { signal: options.signal }),
  update: (id, data, options = {}) => 
    api.patch(`/orders/${id}`, data, { signal: options.signal }),
};

// ─── Notifications API ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (options = {}) => 
    api.get('/notifications', { signal: options.signal }),
  markRead: (id, options = {}) => 
    api.patch(`/notifications/${id}/read`, {}, { signal: options.signal }),
  markAllRead: (options = {}) => 
    api.patch('/notifications/read-all', {}, { signal: options.signal }),
  delete: (id, options = {}) => 
    api.delete(`/notifications/${id}`, { signal: options.signal }),
  // User-facing
  getMine: (options = {}) => 
    api.get('/notifications/mine', { signal: options.signal }),
  markMineRead: (id, options = {}) => 
    api.patch(`/notifications/mine/${id}/read`, {}, { signal: options.signal }),
  markAllMineRead: (options = {}) => 
    api.patch('/notifications/mine/read-all', {}, { signal: options.signal }),
};

// ─── Custom Orders API ────────────────────────────────────────────────────────
export const customOrdersAPI = {
  submit: (data, options = {}) => 
    api.post('/custom-orders', data, { signal: options.signal }),
  getMine: (options = {}) => 
    api.get('/custom-orders/mine', { signal: options.signal }),
  respond: (id, data, options = {}) => 
    api.post(`/custom-orders/${id}/respond`, data, { signal: options.signal }),
  confirmReceipt: (id, options = {}) => 
    api.post(`/custom-orders/${id}/confirm-receipt`, {}, { signal: options.signal }),
  requestRevision: (id, data, options = {}) => 
    api.post(`/custom-orders/${id}/revision`, data, { signal: options.signal }),
  // Admin
  getAll: (params, options = {}) => 
    api.get('/custom-orders', { params, signal: options.signal }),
  getStats: (options = {}) => 
    api.get('/custom-orders/stats', { signal: options.signal }),
  getOne: (id, options = {}) => 
    api.get(`/custom-orders/${id}`, { signal: options.signal }),
  sendQuote: (id, data, options = {}) => 
    api.post(`/custom-orders/${id}/quote`, data, { signal: options.signal }),
  update: (id, data, options = {}) => 
    api.patch(`/custom-orders/${id}`, data, { signal: options.signal }),
};

export default api;
