import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.offset]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...filters
      };
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data.users || []);
      setPagination(response.data.data.pagination || pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      status: user.status
    });
  };

  const handleUpdateUser = async () => {
    try {
      await adminAPI.updateUser(editingUser.user_id, editForm);
      alert('User updated successfully!');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to suspend user "${email}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteUser(userId);
      alert('User suspended successfully!');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.error || 'Failed to suspend user');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      moderator: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      community_user: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return styles[role] || styles.community_user;
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };
    return styles[status] || styles.active;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <span className="mr-3">👥</span>
            Manage Users
          </h1>
          <p className="text-blue-200/70">View and manage all system users</p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Filter by Role</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" className="bg-slate-800 text-white">All Roles</option>
                <option value="admin" className="bg-slate-800 text-white">Admin</option>
                <option value="moderator" className="bg-slate-800 text-white">Moderator</option>
                <option value="community_user" className="bg-slate-800 text-white">Community User</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" className="bg-slate-800 text-white">All Statuses</option>
                <option value="active" className="bg-slate-800 text-white">Active</option>
                <option value="suspended" className="bg-slate-800 text-white">Suspended</option>
                <option value="pending" className="bg-slate-800 text-white">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ role: '', status: '' });
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

        {/* Users Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-200">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-blue-200/60">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">User</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Role</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Status</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Created</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Last Login</th>
                    <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-white font-medium">{user.full_name || 'N/A'}</p>
                          <p className="text-blue-200/60 text-sm">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleBadge(user.role)}`}>
                          {user.role?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(user.status)}`}>
                          {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-blue-200/60 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-blue-200/60 text-sm">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-all"
                          >
                            Edit
                          </button>
                          {user.user_id !== currentUser?.user_id && (
                            <button
                              onClick={() => handleDeleteUser(user.user_id, user.email)}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
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
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} users
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

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Edit User</h2>
              <div className="mb-4">
                <p className="text-blue-200/70 text-sm mb-1">Email</p>
                <p className="text-white font-medium">{editingUser.email}</p>
              </div>
              <div className="mb-4">
                <label className="block text-blue-100 text-sm font-medium mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="community_user">Community User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-blue-100 text-sm font-medium mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpdateUser}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
