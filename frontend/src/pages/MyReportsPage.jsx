import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await reportsAPI.getMyReports({ limit: 50 });
      setReports(response.data.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '⏳' };
      case 'under_review':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🔍' };
      case 'confirmed':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: '✅' };
      case 'rejected':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: '❌' };
      case 'duplicate':
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '📋' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '❓' };
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      phishing: 'Phishing',
      scam: 'Scam',
      malware: 'Malware',
      impersonation: 'Impersonation',
      spam: 'Spam',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <span className="mr-3">📢</span>
              My Reports
            </h1>
            <p className="text-blue-200/70">Track the status of your submitted reports</p>
          </div>
          <Link
            to="/reports/new"
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-red-500/25"
          >
            <span className="mr-2">🚨</span>
            Report New Site
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white mb-1">{reports.length}</div>
            <div className="text-blue-200/60 text-sm">Total Reports</div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-amber-400 mb-1">
              {reports.filter(r => r.status === 'pending' || r.status === 'under_review').length}
            </div>
            <div className="text-blue-200/60 text-sm">Pending</div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {reports.filter(r => r.status === 'confirmed').length}
            </div>
            <div className="text-blue-200/60 text-sm">Confirmed</div>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              {reports.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-blue-200/60 text-sm">Rejected</div>
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

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Reports Yet</h3>
            <p className="text-blue-200/60 mb-6">
              You haven't submitted any reports yet. Help protect the community by reporting suspicious websites.
            </p>
            <Link
              to="/reports/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium transition-all shadow-lg"
            >
              <span className="mr-2">🚨</span>
              Report Your First Site
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const statusStyles = getStatusStyles(report.status);
              return (
                <div
                  key={report.report_id}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:bg-white/10 transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-xl">{statusStyles.icon}</span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${statusStyles.bg} ${statusStyles.text}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPriorityStyles(report.priority)}`}>
                            {report.priority}
                          </span>
                          <span className="text-blue-200/50 text-sm">
                            {new Date(report.reported_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-white font-mono text-sm break-all bg-white/5 rounded-lg px-4 py-2 mb-3">
                          {report.original_url}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-200/60">
                            Reason: <span className="text-blue-200">{getReasonLabel(report.report_reason)}</span>
                          </span>
                          {report.feedback_count > 0 && (
                            <span className="text-blue-200/60">
                              <span className="mr-1">💬</span>
                              {report.feedback_count} feedback
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Link
                        to={`/reports/${report.report_id}`}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl font-medium text-sm transition-all flex items-center"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;
