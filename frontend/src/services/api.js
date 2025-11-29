/**
 * API Service
 * AnLink Anti-Phishing System
 * 
 * Handles all API communication with the backend.
 */

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if not on public pages
      const publicPaths = ['/', '/check', '/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ============================================
// SCAN API
// ============================================
export const scanAPI = {
  // Full URL check with database storage
  checkUrl: (urlData) => api.post('/scan/check', urlData),
  checkURL: (urlData) => api.post('/scan/check', urlData), // Alias for compatibility
  
  // Quick check without database storage
  quickCheck: (urlData) => api.post('/scan/quick', urlData),
  
  // Get scan history (requires auth)
  getHistory: (params) => api.get('/scan/history', { params }),
  
  // Get detailed scan results (requires auth)
  getDetails: (checkId) => api.get(`/scan/details/${checkId}`),
};

// ============================================
// REPORTS API
// ============================================
export const reportsAPI = {
  submitReport: (reportData) => api.post('/reports', reportData),
  getReports: (params) => api.get('/reports', { params }),
  getMyReports: (params) => api.get('/reports/my', { params }),
  getReportDetails: (reportId) => api.get(`/reports/${reportId}`),
  updateReport: (reportId, data) => api.put(`/reports/${reportId}`, data),
};

// ============================================
// FEEDBACK API
// ============================================
export const feedbackAPI = {
  submitFeedback: (feedbackData) => api.post('/feedback', feedbackData),
  getReportFeedback: (reportId) => api.get(`/feedback/report/${reportId}`),
  markHelpful: (feedbackId) => api.put(`/feedback/${feedbackId}/helpful`),
};

// ============================================
// MODERATOR API
// ============================================
export const moderatorAPI = {
  getDashboardStats: () => api.get('/moderator/dashboard'),
  getQueue: (params) => api.get('/moderator/queue', { params }),
  assignReport: (reportId, data) => api.post(`/moderator/assign/${reportId}`, data),
  confirmPhishing: (reportId, data) => api.post(`/moderator/confirm/${reportId}`, data),
  rejectReport: (reportId, data) => api.post(`/moderator/reject/${reportId}`, data),
  getModerators: () => api.get('/moderator/moderators'),
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
  getSystemStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getActivityLogs: (params) => api.get('/admin/logs', { params }),
};

// ============================================
// EDUCATION API
// ============================================
export const educationAPI = {
  getContent: (params) => api.get('/education', { params }),
  getContentBySlug: (slug) => api.get(`/education/${slug}`),
  createContent: (data) => {
    // FormData is handled automatically by axios - no special headers needed
    return api.post('/education', data);
  },
  updateContent: (contentId, data) => {
    // FormData is handled automatically by axios - no special headers needed
    return api.put(`/education/${contentId}`, data);
  },
  deleteContent: (contentId) => api.delete(`/education/${contentId}`),
  submitQuizAttempt: (data) => api.post('/education/quiz/submit', data),
  getQuizAttempts: (params) => api.get('/education/quiz/attempts', { params }),
};

export default api;
