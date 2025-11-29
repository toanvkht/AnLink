import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanAPI, reportsAPI, moderatorAPI } from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalScans: 0,
    safeUrls: 0,
    suspiciousUrls: 0,
    dangerousUrls: 0,
    totalReports: 0,
    pendingReports: 0,
  });
  const [recentScans, setRecentScans] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [modStats, setModStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch scan history
      const scansResponse = await scanAPI.getHistory({ limit: 10 });
      const scans = scansResponse.data.data.checks || [];
      setRecentScans(scans);

      // Calculate scan stats
      const totalScans = scans.length;
      const safeUrls = scans.filter(s => s.algorithm_result === 'safe').length;
      const suspiciousUrls = scans.filter(s => s.algorithm_result === 'suspicious').length;
      const dangerousUrls = scans.filter(s => s.algorithm_result === 'dangerous').length;

      // Fetch reports
      const reportsResponse = await reportsAPI.getMyReports({ limit: 5 });
      const reports = reportsResponse.data.data.reports || [];
      setRecentReports(reports);

      const totalReports = reports.length;
      const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'under_review').length;

      setStats({
        totalScans,
        safeUrls,
        suspiciousUrls,
        dangerousUrls,
        totalReports,
        pendingReports,
      });

      // Fetch moderator stats if user is mod/admin
      if (user?.role === 'moderator' || user?.role === 'admin') {
        try {
          const modResponse = await moderatorAPI.getDashboardStats();
          setModStats(modResponse.data.data);
        } catch (e) {
          console.log('Could not fetch moderator stats');
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'from-red-500 to-rose-600',
      moderator: 'from-amber-500 to-orange-600',
      registered_user: 'from-blue-500 to-cyan-600',
    };
    return styles[role] || styles.registered_user;
  };

  const getResultStyles = (result) => {
    switch (result) {
      case 'safe':
        return { text: 'text-emerald-400', icon: '✅' };
      case 'suspicious':
        return { text: 'text-amber-400', icon: '⚠️' };
      case 'dangerous':
        return { text: 'text-red-400', icon: '🚫' };
      default:
        return { text: 'text-gray-400', icon: '❓' };
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400' };
      case 'under_review':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
      case 'confirmed':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'rejected':
        return { bg: 'bg-red-500/20', text: 'text-red-400' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Welcome back, {user?.full_name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-blue-200/70">Here's your activity overview</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r ${getRoleBadge(user?.role)} text-white text-sm font-medium shadow-lg`}>
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📊</span> Your Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.totalScans}</div>
              <div className="text-blue-200/60 text-sm">URLs Scanned</div>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-lg rounded-2xl p-5 border border-emerald-500/30 text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.safeUrls}</div>
              <div className="text-emerald-200/60 text-sm">Safe URLs</div>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-lg rounded-2xl p-5 border border-amber-500/30 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-1">{stats.suspiciousUrls}</div>
              <div className="text-amber-200/60 text-sm">Suspicious</div>
            </div>
            <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-5 border border-red-500/30 text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.dangerousUrls}</div>
              <div className="text-red-200/60 text-sm">Dangerous</div>
            </div>
            <div className="bg-purple-500/10 backdrop-blur-lg rounded-2xl p-5 border border-purple-500/30 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalReports}</div>
              <div className="text-purple-200/60 text-sm">Reports Filed</div>
            </div>
            <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-5 border border-blue-500/30 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.pendingReports}</div>
              <div className="text-blue-200/60 text-sm">Pending</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">⚡</span> Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/check"
              className="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check URL</h3>
              <p className="text-blue-200/60">Scan a URL for phishing threats</p>
            </Link>

            <Link
              to="/reports/new"
              className="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-red-500/50 hover:bg-white/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-2xl">🚨</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Report Site</h3>
              <p className="text-blue-200/60">Report a suspicious website</p>
            </Link>

            <Link
              to="/history"
              className="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-2xl">📜</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Scan History</h3>
              <p className="text-blue-200/60">View your previous URL scans</p>
            </Link>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">🕐</span> Recent Scans
            </h2>
            <Link to="/history" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-blue-200/60">Loading...</p>
              </div>
            ) : recentScans.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-blue-200/60">No scans yet. <Link to="/check" className="text-cyan-400 hover:underline">Check your first URL</Link></p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">URL</th>
                      <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Result</th>
                      <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Score</th>
                      <th className="text-left py-4 px-6 text-blue-200/70 font-medium text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.slice(0, 5).map((scan) => {
                      const resultStyle = getResultStyles(scan.algorithm_result);
                      return (
                        <tr key={scan.check_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <p className="text-white text-sm font-mono truncate max-w-xs" title={scan.original_url}>
                              {scan.original_url}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`flex items-center ${resultStyle.text}`}>
                              <span className="mr-2">{resultStyle.icon}</span>
                              <span className="capitalize">{scan.algorithm_result}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={resultStyle.text}>
                              {(scan.algorithm_score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-blue-200/60 text-sm">
                            {new Date(scan.checked_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">📢</span> Recent Reports
              </h2>
              <Link to="/reports" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            
            <div className="grid gap-3">
              {recentReports.slice(0, 3).map((report) => {
                const statusStyle = getStatusStyles(report.status);
                return (
                  <div key={report.report_id} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-white text-sm font-mono truncate max-w-xs">{report.original_url}</p>
                        <p className="text-blue-200/50 text-xs mt-1">
                          {new Date(report.reported_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Moderator Section */}
        {(user?.role === 'moderator' || user?.role === 'admin') && modStats && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">👮</span> Moderator Dashboard
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="bg-amber-500/10 backdrop-blur-lg rounded-xl p-4 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-400 mb-1">{modStats.pending_reports}</div>
                <div className="text-amber-200/60 text-sm">Pending Review</div>
              </div>
              <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400 mb-1">{modStats.under_review}</div>
                <div className="text-blue-200/60 text-sm">Under Review</div>
              </div>
              <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400 mb-1">{modStats.assigned_to_me}</div>
                <div className="text-purple-200/60 text-sm">Assigned to Me</div>
              </div>
              <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-4 border border-red-500/30">
                <div className="text-2xl font-bold text-red-400 mb-1">{modStats.priority_breakdown?.urgent || 0}</div>
                <div className="text-red-200/60 text-sm">Urgent</div>
              </div>
            </div>

            <Link
              to="/moderator/queue"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-amber-500/25"
            >
              <span className="mr-2">📋</span>
              Go to Review Queue
            </Link>
          </div>
        )}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">👑</span> Admin Tools
            </h2>
            <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/admin/users"
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-red-500/25"
                >
                  <span className="mr-2">👥</span>
                  Manage Users
                </Link>
                <Link
                  to="/admin/stats"
                  className="flex items-center px-6 py-3 bg-white/10 border border-red-500/30 text-red-200 rounded-xl font-medium hover:bg-white/20 transition-all"
                >
                  <span className="mr-2">📈</span>
                  System Statistics
                </Link>
                <Link
                  to="/admin/logs"
                  className="flex items-center px-6 py-3 bg-white/10 border border-red-500/30 text-red-200 rounded-xl font-medium hover:bg-white/20 transition-all"
                >
                  <span className="mr-2">📝</span>
                  Activity Logs
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Account Information */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">👤</span> Account Information
          </h2>
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-blue-200/70">Full Name</span>
                <span className="text-white font-medium">{user?.full_name}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-blue-200/70">Email</span>
                <span className="text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-blue-200/70">Role</span>
                <span className="text-white font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <span className="text-blue-200/70">Status</span>
                <span className="flex items-center text-emerald-400 font-medium">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
