import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response from server. Is the backend running?', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

// Scan API
export const scanAPI = {
  checkURL: (url) => api.post('/scan/check', { url }),
  getHistory: () => api.get('/scan/history'),
  getDetails: (checkId) => api.get(`/scan/details/${checkId}`),
};

// Reports API
export const reportsAPI = {
  submitReport: (reportData) => api.post('/reports', reportData),
  getReports: (params) => api.get('/reports', { params }),
  getMyReports: (params) => api.get('/reports/my', { params }),
  getReportDetails: (reportId) => api.get(`/reports/${reportId}`),
  updateReport: (reportId, data) => api.put(`/reports/${reportId}`, data),
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: (feedbackData) => api.post('/feedback', feedbackData),
  getReportFeedback: (reportId) => api.get(`/feedback/report/${reportId}`),
  markHelpful: (feedbackId) => api.put(`/feedback/${feedbackId}/helpful`),
};

// Moderator API
export const moderatorAPI = {
  getDashboardStats: () => api.get('/moderator/dashboard'),
  getQueue: (params) => api.get('/moderator/queue', { params }),
  assignReport: (reportId, data) => api.post(`/moderator/assign/${reportId}`, data),
  confirmPhishing: (reportId, data) => api.post(`/moderator/confirm/${reportId}`, data),
  rejectReport: (reportId, data) => api.post(`/moderator/reject/${reportId}`, data),
  getModerators: () => api.get('/moderator/moderators'),
};

// Admin API
export const adminAPI = {
  getSystemStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getActivityLogs: (params) => api.get('/admin/logs', { params }),
};

// Education API
export const educationAPI = {
  getContent: (params) => api.get('/education', { params }),
  getContentBySlug: (slug) => api.get(`/education/${slug}`),
  createContent: (data) => api.post('/education', data),
  updateContent: (contentId, data) => api.put(`/education/${contentId}`, data),
  deleteContent: (contentId) => api.delete(`/education/${contentId}`),
};

export default api;

