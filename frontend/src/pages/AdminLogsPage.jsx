/**
 * AdminLogsPage Component
 * 
 * Admin interface for viewing system activity logs. Allows admins to:
 * - View all user activity logs
 * - Filter logs by user ID and action type
 * - View detailed action information
 * 
 * @component
 */
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminLogsPage = () => {
  // State management
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

  // User search state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch all users for search
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch more users for search - set high limit
        const response = await adminAPI.getUsers({ limit: 1000 });
        console.log('👥 Fetched users:', response.data);
        setUsers(response.data.data.users || []);
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  // Fetch logs when filters or pagination changes
  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.offset]);

  /**
   * Fetches activity logs from the API with current filters and pagination
   */
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

  /**
   * Handles filter changes and resets pagination
   * @param {string} field - Filter field name
   * @param {string} value - Filter value
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  /**
   * Filter users based on search input
   */
  const filteredUsers = users.filter(user => {
    if (!userSearch) return false;
    const searchLower = userSearch.toLowerCase();
    const emailMatch = user.email?.toLowerCase().includes(searchLower);
    const nameMatch = user.full_name?.toLowerCase().includes(searchLower);
    return emailMatch || nameMatch;
  });

  // Debug log
  useEffect(() => {
    console.log('🔍 User search:', userSearch);
    console.log('👥 Total users:', users.length);
    console.log('✅ Filtered users:', filteredUsers.length);
  }, [userSearch, users]);

  /**
   * Handle user selection from dropdown
   */
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFilters(prev => ({ ...prev, user_id: user.user_id }));
    setUserSearch(`${user.full_name} (${user.email})`);
    setShowUserDropdown(false);
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  /**
   * Clear user selection
   */
  const clearUserSelection = () => {
    setSelectedUser(null);
    setUserSearch('');
    setFilters(prev => ({ ...prev, user_id: '' }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  /**
   * Returns badge styling based on action type
   * @param {string} actionType - Action type
   * @returns {string} Tailwind CSS classes
   */
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

  /**
   * Formats action details JSON for display
   * @param {Object|string} details - Action details
   * @returns {string} Formatted JSON string
   */
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 relative">
      <div className="container mx-auto px-4 relative z-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <span className="mr-3">📝</span>
            Activity logs
          </h1>
          <p className="text-blue-200/70">Monitor system activity and user actions</p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10 relative z-40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Search with Dropdown */}
            <div className="relative user-search-container">
              <label className="block text-blue-100 text-sm font-medium mb-2">Filter by user</label>
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                    if (!e.target.value) {
                      clearUserSelection();
                    }
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white placeholder-blue-200/40 focus:outline-none focus:border-cyan-400"
                />
                
                {/* Clear button */}
                {selectedUser && (
                  <button
                    onClick={clearUserSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
                
                {/* User dropdown */}
                {showUserDropdown && filteredUsers.length > 0 && userSearch && (
                  <div 
                    className="absolute w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                    style={{ zIndex: 9999 }}
                  >
                    {filteredUsers.slice(0, 10).map(user => (
                      <div
                        key={user.user_id}
                        onClick={() => handleUserSelect(user)}
                        className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-white">{user.full_name}</div>
                        <div className="text-sm text-blue-200/70">{user.email}</div>
                        <div className="text-xs text-blue-200/40 mt-1 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'moderator' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {user.role}
                          </span>
                          <span>ID: {user.user_id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {showUserDropdown && userSearch && filteredUsers.length === 0 && (
                  <div 
                    className="absolute w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-2xl p-4"
                    style={{ zIndex: 9999 }}
                  >
                    <p className="text-blue-200/60 text-sm text-center">No users found</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Filter by action type</label>
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
                <option value="" className="bg-slate-800 text-white">All actions</option>
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
                  clearUserSelection();
                }}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
              >
                Clear filters
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
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden relative z-10">
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
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">IP address</th>
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
                          <summary className="text-cyan-400 hover:text-cyan-300 text-sm">View details</summary>
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
