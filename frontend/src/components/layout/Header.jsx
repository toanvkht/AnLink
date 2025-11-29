import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <nav className="container mx-auto px-3 py-3">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/25 transition-all">
              <span className="text-lg">🛡️</span>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition whitespace-nowrap">
              AnLink
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-0.5 flex-shrink-0">
            <Link 
              to="/" 
              className="px-2.5 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap text-sm"
            >
              Home
            </Link>
            <Link 
              to="/check" 
              className="px-2.5 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap text-sm"
            >
              Check URL
            </Link>
            <Link 
              to="/education" 
              className="px-2.5 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap text-sm"
            >
              Education
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  to="/history" 
                  className="px-2.5 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap text-sm"
                >
                  History
                </Link>
                <Link 
                  to="/reports" 
                  className="px-2.5 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap text-sm"
                >
                  Reports
                </Link>
                {(user?.role === 'moderator' || user?.role === 'admin') && (
                  <Link 
                    to="/moderator/queue" 
                    className="px-2.5 py-2 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-all whitespace-nowrap text-sm"
                  >
                    Mod Queue
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/education" 
                    className="px-2.5 py-2 rounded-lg text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-all whitespace-nowrap text-sm"
                  >
                    Manage Content
                  </Link>
                )}
                <Link 
                  to="/dashboard" 
                  className="px-2.5 py-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap text-sm"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{user?.full_name}</p>
                    <p className="text-blue-300 text-xs capitalize">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-red-500/25"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-100 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-cyan-500/25"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
              >
                Home
              </Link>
              <Link 
                to="/check" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
              >
                Check URL
              </Link>
              <Link 
                to="/education" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
              >
                Education
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    to="/history" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
                  >
                    History
                  </Link>
                  <Link 
                    to="/reports" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
                  >
                    My Reports
                  </Link>
                  {(user?.role === 'moderator' || user?.role === 'admin') && (
                    <Link 
                      to="/moderator/queue" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-all"
                    >
                      Mod Queue
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin/education" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-all"
                    >
                      Manage Content
                    </Link>
                  )}
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
