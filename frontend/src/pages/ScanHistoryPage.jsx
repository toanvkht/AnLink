import React, { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';
import { Link } from 'react-router-dom';

const ScanHistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await scanAPI.getHistory({ limit: 50 });
      setScans(response.data.data.checks || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter((scan) => {
    if (filter === 'all') return true;
    return scan.algorithm_result === filter;
  });

  const getResultStyles = (result) => {
    const styles = {
      safe: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        badge: 'bg-gradient-to-r from-emerald-500 to-green-600',
        icon: '✅'
      },
      suspicious: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-600',
        icon: '⚠️'
      },
      dangerous: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        badge: 'bg-gradient-to-r from-red-500 to-rose-600',
        icon: '🚫'
      },
    };
    return styles[result] || styles.safe;
  };

  const getScoreColor = (score) => {
    if (score < 0.3) return 'text-emerald-400';
    if (score < 0.6) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading scan history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <span className="mr-3">📜</span>
                Scan History
              </h1>
              <p className="text-blue-200/70">View all your previous URL checks</p>
            </div>
            <Link
              to="/check"
              className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-cyan-500/25"
            >
              <span className="mr-2">🔍</span>
              New Scan
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/10">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              All ({scans.length})
            </button>
            <button
              onClick={() => setFilter('safe')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                filter === 'safe'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              ✅ Safe ({scans.filter((s) => s.algorithm_result === 'safe').length})
            </button>
            <button
              onClick={() => setFilter('suspicious')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                filter === 'suspicious'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              ⚠️ Suspicious ({scans.filter((s) => s.algorithm_result === 'suspicious').length})
            </button>
            <button
              onClick={() => setFilter('dangerous')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                filter === 'dangerous'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              🚫 Dangerous ({scans.filter((s) => s.algorithm_result === 'dangerous').length})
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6">
            <p className="text-red-200 flex items-center">
              <span className="mr-2">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Scan List */}
        {filteredScans.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No scans found</h3>
            <p className="text-blue-200/60 mb-6">
              {filter === 'all' 
                ? "You haven't scanned any URLs yet" 
                : `No ${filter} URLs in your history`}
            </p>
            <Link
              to="/check"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
            >
              Check Your First URL
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScans.map((scan) => {
              const styles = getResultStyles(scan.algorithm_result);
              return (
                <div
                  key={scan.check_id}
                  className={`bg-white/5 backdrop-blur-lg rounded-2xl border ${styles.border} hover:bg-white/10 transition-all overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{styles.icon}</span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${styles.badge} text-white`}>
                            {scan.algorithm_result}
                          </span>
                          <span className="text-blue-200/50 text-sm">
                            {new Date(scan.checked_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-white font-mono text-sm break-all bg-white/5 rounded-lg px-4 py-2">
                          {scan.original_url}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(scan.algorithm_score)}`}>
                            {(scan.algorithm_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-blue-200/50 text-xs">Risk Score</div>
                        </div>
                        <Link
                          to={`/scan/${scan.check_id}`}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl font-medium text-sm transition-all flex items-center"
                        >
                          Details
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-blue-200/50 text-sm">
          <p>Showing {filteredScans.length} of {scans.length} scans</p>
        </div>
      </div>
    </div>
  );
};

export default ScanHistoryPage;
