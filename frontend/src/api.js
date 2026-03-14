import axios from 'axios';
import { useAuthStore } from './store';

const ALLOWED_API_ORIGINS = new Set([
  window.location.origin,
  'http://localhost:5000',
  'http://localhost:3000',
]);

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Validate baseURL origin against allowlist to prevent SSRF-style misconfiguration
const parsedBase = new URL(rawBaseURL, window.location.origin);
if (!ALLOWED_API_ORIGINS.has(parsedBase.origin) && import.meta.env.PROD) {
  throw new Error(`Blocked unsafe API base URL: ${rawBaseURL}`);
}

const api = axios.create({
  baseURL: rawBaseURL,
  timeout: 30000,
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

// ─── Response Interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ─── Product API ───────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  adminGetAll: () => api.get('/products/admin/all'),
};

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/update-profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

// ─── Payment API ───────────────────────────────────────────────────────────────
export const paymentAPI = {
  createPayPalOrder: (data) => api.post('/payments/paypal/create-order', data),
  capturePayPalOrder: (data) => api.post('/payments/paypal/capture', data),
  getMyOrders: () => api.get('/payments/orders'),
};

// ─── Upload API ────────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadProductFull: (formData) =>
    api.post('/upload/product-full', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadPdf: (formData) =>
    api.post('/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadImage: (formData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile: (key) => api.delete('/upload/file', { data: { key } }),
};

// ─── Orders Admin API ──────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getStats: () => api.get('/orders/stats'),
  getOne: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.patch(`/orders/${id}`, data),
};

export default api;
