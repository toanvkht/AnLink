import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './services/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Temporary placeholders - we'll build these in Week 9 */}
            <Route
              path="/check"
              element={
                <ProtectedRoute>
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold">URL Check Page</h1>
                    <p className="text-gray-600 mt-4">Coming in Week 9...</p>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold">My Reports</h1>
                    <p className="text-gray-600 mt-4">Coming in Week 9...</p>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/education"
              element={
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Education</h1>
                  <p className="text-gray-600 mt-4">Coming in Week 9...</p>
                </div>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;