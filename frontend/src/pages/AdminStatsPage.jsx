import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AdminStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getSystemStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.error || 'Unable to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-6">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <span className="mr-3">📈</span>
            System Statistics
          </h1>
          <p className="text-blue-200/70">Overview of system performance and usage</p>
        </div>

        {stats && (
          <>
            {/* Users Statistics */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Users
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-2">{stats.users.total}</div>
                  <div className="text-blue-200/60 text-sm">Total Users</div>
                </div>
                <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
                  <div className="text-3xl font-bold text-red-400 mb-2">{stats.users.by_role.admin || 0}</div>
                  <div className="text-red-200/60 text-sm">Admins</div>
                </div>
                <div className="bg-amber-500/10 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
                  <div className="text-3xl font-bold text-amber-400 mb-2">{stats.users.by_role.moderator || 0}</div>
                  <div className="text-amber-200/60 text-sm">Moderators</div>
                </div>
                <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {stats.users.by_role.community_user || 0}
                  </div>
                  <div className="text-blue-200/60 text-sm">Community Users</div>
                </div>
              </div>
            </div>

            {/* Scans Statistics */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🔍</span>
                URL Scans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-2">{stats.scans.total.toLocaleString()}</div>
                  <div className="text-blue-200/60 text-sm">Total Scans</div>
                </div>
                <div className="bg-emerald-500/10 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.scans.by_result.safe.toLocaleString()}</div>
                  <div className="text-emerald-200/60 text-sm">Safe</div>
                </div>
                <div className="bg-amber-500/10 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
                  <div className="text-3xl font-bold text-amber-400 mb-2">{stats.scans.by_result.suspicious.toLocaleString()}</div>
                  <div className="text-amber-200/60 text-sm">Suspicious</div>
                </div>
                <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
                  <div className="text-3xl font-bold text-red-400 mb-2">{stats.scans.by_result.dangerous.toLocaleString()}</div>
                  <div className="text-red-200/60 text-sm">Dangerous</div>
                </div>
                <div className="bg-cyan-500/10 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">{stats.scans.today}</div>
                  <div className="text-cyan-200/60 text-sm">Today</div>
                </div>
              </div>
              {stats.scans.avg_response_time_ms > 0 && (
                <div className="mt-4 bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200/70">Average Response Time</span>
                    <span className="text-white font-medium">{stats.scans.avg_response_time_ms}ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reports Statistics */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">📢</span>
                Reports
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-white mb-2">{stats.reports.total.toLocaleString()}</div>
                  <div className="text-blue-200/60 text-sm">Total Reports</div>
                </div>
                <div className="bg-amber-500/10 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30">
                  <div className="text-3xl font-bold text-amber-400 mb-2">{stats.reports.by_status.pending.toLocaleString()}</div>
                  <div className="text-amber-200/60 text-sm">Pending</div>
                </div>
                <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.reports.by_status.under_review.toLocaleString()}</div>
                  <div className="text-blue-200/60 text-sm">Under Review</div>
                </div>
                <div className="bg-emerald-500/10 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.reports.by_status.confirmed.toLocaleString()}</div>
                  <div className="text-emerald-200/60 text-sm">Confirmed</div>
                </div>
                <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
                  <div className="text-3xl font-bold text-red-400 mb-2">{stats.reports.by_status.rejected.toLocaleString()}</div>
                  <div className="text-red-200/60 text-sm">Rejected</div>
                </div>
                <div className="bg-cyan-500/10 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">{stats.reports.today}</div>
                  <div className="text-cyan-200/60 text-sm">Today</div>
                </div>
              </div>
            </div>

            {/* Phishing Database */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🛡️</span>
                Phishing Database
              </h2>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-white mb-2">{stats.phishing.known_urls.toLocaleString()}</div>
                  <div className="text-blue-200/60 text-sm">Known Phishing URLs</div>
                </div>
                {stats.phishing.top_brands && stats.phishing.top_brands.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-3">Top Targeted Brands</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {stats.phishing.top_brands.map((brand, idx) => (
                        <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="text-xl font-bold text-white mb-1">{brand.target_brand || 'Unknown'}</div>
                          <div className="text-blue-200/60 text-sm">{brand.count} URLs</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Chart */}
            {stats.recent_activity && stats.recent_activity.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Recent Activity (Last 7 Days)
                </h2>
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <div className="space-y-3">
                    {stats.recent_activity.map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-blue-200/70">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-white/10 rounded-full h-4 relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (day.scans_count / Math.max(...stats.recent_activity.map(d => d.scans_count))) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-medium w-16 text-right">{day.scans_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminStatsPage;
