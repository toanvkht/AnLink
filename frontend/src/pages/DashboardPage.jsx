import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Welcome back, {user?.full_name}! 👋
        </h1>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/check"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Check URL</h3>
            <p className="text-gray-600">Scan a URL for phishing threats</p>
          </Link>

          <Link
            to="/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl mb-3">📢</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">My Reports</h3>
            <p className="text-gray-600">View your submitted reports</p>
          </Link>

          <Link
            to="/education"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Learn</h3>
            <p className="text-gray-600">Phishing awareness resources</p>
          </Link>
        </div>

        {/* Role-specific Links */}
        {(user?.role === 'moderator' || user?.role === 'admin') && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
            <h3 className="text-lg font-bold text-yellow-800 mb-4">Moderator Tools</h3>
            <div className="flex gap-4">
              <Link
                to="/moderator/queue"
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
              >
                Review Queue
              </Link>
              <Link
                to="/moderator/dashboard"
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
              >
                Moderator Dashboard
              </Link>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6">
            <h3 className="text-lg font-bold text-red-800 mb-4">Admin Tools</h3>
            <div className="flex gap-4">
              <Link
                to="/admin/users"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/stats"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                System Statistics
              </Link>
              <Link
                to="/admin/logs"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Activity Logs
              </Link>
            </div>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Account Information</h3>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Role:</span>{' '}
              <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
            </p>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="text-green-600 font-medium capitalize">{user?.status}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;