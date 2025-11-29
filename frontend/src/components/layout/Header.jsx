import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition">
            🛡️ AnLink
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition">
              Home
            </Link>
            <Link to="/check" className="hover:text-blue-200 transition">
              Check URL
            </Link>
            <Link to="/education" className="hover:text-blue-200 transition">
              Education
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/reports" className="hover:text-blue-200 transition">
                  My Reports
                </Link>
                {user?.role === 'moderator' || user?.role === 'admin' ? (
                  <Link to="/moderator" className="hover:text-blue-200 transition">
                    Moderator
                  </Link>
                ) : null}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hover:text-blue-200 transition">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:block text-sm">
                  <p className="font-medium">{user?.full_name}</p>
                  <p className="text-blue-200 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;