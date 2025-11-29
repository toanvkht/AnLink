import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    user_id: '',
    action_type: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    has_more: false
  });

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.offset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...filters
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });
      const response = await adminAPI.getActivityLogs(params);
      setLogs(response.data.data.logs || []);
      setPagination(response.data.data.pagination || pagination);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.response?.data?.error || 'Unable to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const getActionTypeBadge = (actionType) => {
    const styles = {
      login: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      logout: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      url_scan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      report_submit: 'bg-red-500/20 text-red-400 border-red-500/30',
      admin_update_user: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      admin_delete_user: 'bg-red-500/20 text-red-400 border-red-500/30',
      password_change: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return styles[actionType] || 'bg-white/10 text-white border-white/20';
  };

  const formatActionDetails = (details) => {
    if (!details) return 'N/A';
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <span className="mr-3">📝</span>
            Activity Logs
          </h1>
          <p className="text-blue-200/70">Monitor system activity and user actions</p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Filter by User ID</label>
              <input
                type="text"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Filter by Action Type</label>
              <select
                value={filters.action_type}
                onChange={(e) => handleFilterChange('action_type', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" className="bg-slate-800 text-white">All Actions</option>
                <option value="login" className="bg-slate-800 text-white">Login</option>
                <option value="logout" className="bg-slate-800 text-white">Logout</option>
                <option value="url_scan" className="bg-slate-800 text-white">URL Scan</option>
                <option value="report_submit" className="bg-slate-800 text-white">Report Submit</option>
                <option value="admin_update_user" className="bg-slate-800 text-white">Admin Update User</option>
                <option value="admin_delete_user" className="bg-slate-800 text-white">Admin Delete User</option>
                <option value="password_change" className="bg-slate-800 text-white">Password Change</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ user_id: '', action_type: '' });
                  setPagination(prev => ({ ...prev, offset: 0 }));
                }}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6">
            <p className="text-red-200 flex items-center">
              <span className="mr-2">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-200">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-blue-200/60">No activity logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Timestamp</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">User</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Action</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">IP Address</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.log_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="text-white text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white font-medium text-sm">{log.full_name || 'N/A'}</p>
                          <p className="text-blue-200/60 text-xs">{log.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getActionTypeBadge(log.action_type)}`}>
                          {log.action_type?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-blue-200/60 text-sm font-mono">{log.ip_address || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <details className="cursor-pointer">
                          <summary className="text-cyan-400 hover:text-cyan-300 text-sm">View Details</summary>
                          <pre className="mt-2 p-3 bg-slate-900 rounded-lg text-xs text-blue-200 overflow-x-auto max-w-md">
                            {formatActionDetails(log.action_details)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-blue-200/60 text-sm">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-xl text-white transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={!pagination.has_more}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-xl text-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogsPage;
