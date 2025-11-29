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

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
