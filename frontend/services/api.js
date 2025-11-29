import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH ENDPOINTS


export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// SCAN ENDPOINTS


export const scanAPI = {
  checkUrl: (data) => api.post('/scan/check', data),
  getHistory: (params) => api.get('/scan/history', { params }),
  getDetails: (checkId) => api.get(`/scan/details/${checkId}`),
};

// REPORT ENDPOINTS

export const reportAPI = {
  submit: (data) => api.post('/reports', data),
  getAll: (params) => api.get('/reports', { params }),
  getMy: (params) => api.get('/reports/my', { params }),
  getDetails: (reportId) => api.get(`/reports/${reportId}`),
  update: (reportId, data) => api.put(`/reports/${reportId}`, data),
};

// FEEDBACK ENDPOINTS

export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getByReport: (reportId) => api.get(`/feedback/report/${reportId}`),
  markHelpful: (feedbackId) => api.put(`/feedback/${feedbackId}/helpful`),
};

// MODERATOR ENDPOINTS

export const moderatorAPI = {
  getDashboard: () => api.get('/moderator/dashboard'),
  getQueue: (params) => api.get('/moderator/queue', { params }),
  assign: (reportId, data) => api.post(`/moderator/assign/${reportId}`, data),
  confirm: (reportId, data) => api.post(`/moderator/confirm/${reportId}`, data),
  reject: (reportId, data) => api.post(`/moderator/reject/${reportId}`, data),
  getModerators: () => api.get('/moderator/moderators'),
};

// ADMIN ENDPOINTS

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
};

// EDUCATION ENDPOINTS

export const educationAPI = {
  getAll: (params) => api.get('/education', { params }),
  getBySlug: (slug) => api.get(`/education/${slug}`),
  create: (data) => api.post('/education', data),
  update: (contentId, data) => api.put(`/education/${contentId}`, data),
  delete: (contentId) => api.delete(`/education/${contentId}`),
};

export default api;