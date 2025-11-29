import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles, requireRole }) => {
  const { user, loading } = useAuth();

  // Support both requiredRoles and requireRole props
  const roles = requiredRoles || requireRole;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 max-w-md mx-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🚫</span>
            </div>
            <h1 className="text-5xl font-bold text-red-400 mb-4">403</h1>
            <p className="text-xl text-white mb-2">Access Denied</p>
            <p className="text-blue-200/70 mb-6">
              You don't have permission to access this page.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
