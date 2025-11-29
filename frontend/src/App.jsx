import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './utils/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CheckUrlPage from './pages/CheckUrlPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import ReportPhishingPage from './pages/ReportPhishingPage';
import MyReportsPage from './pages/MyReportsPage';
import ModeratorQueuePage from './pages/ModeratorQueuePage';
import EducationPage from './pages/EducationPage';
import EducationDetailPage from './pages/EducationDetailPage';
import QuizPage from './pages/QuizPage';
import DownloadsPage from './pages/DownloadsPage';
import AdminEducationPage from './pages/AdminEducationPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminStatsPage from './pages/AdminStatsPage';
import AdminLogsPage from './pages/AdminLogsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public URL Check Route - Anyone can scan URLs */}
            <Route path="/check" element={<CheckUrlPage />} />

            {/* Education Routes - Public */}
            <Route path="/education" element={<EducationPage />} />
            <Route path="/education/downloads" element={<DownloadsPage />} />
            <Route path="/education/quiz" element={<QuizPage />} />
            <Route path="/education/quiz/:slug" element={<QuizPage />} />
            <Route path="/education/:slug" element={<EducationDetailPage />} />

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <ScanHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Report Routes - Report submission is public (anonymous allowed) */}
            <Route path="/reports/new" element={<ReportPhishingPage />} />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <MyReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Moderator Routes */}
            <Route
              path="/moderator/queue"
              element={
                <ProtectedRoute requiredRoles={['moderator', 'admin']}>
                  <ModeratorQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderator/dashboard"
              element={
                <ProtectedRoute requiredRoles={['moderator', 'admin']}>
                  <ModeratorQueuePage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/education"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminEducationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stats"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminStatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
