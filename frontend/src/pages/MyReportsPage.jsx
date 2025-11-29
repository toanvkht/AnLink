import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, feedbackAPI } from '../services/api';

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReport, setExpandedReport] = useState(null);
  const [reportDetails, setReportDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState({});

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

  const toggleReportDetails = async (reportId) => {
    if (expandedReport === reportId) {
      setExpandedReport(null);
      return;
    }

    setExpandedReport(reportId);

    // Check if we already have the details cached
    if (reportDetails[reportId]) {
      return;
    }

    setDetailsLoading(true);
    try {
      // Fetch report details (which includes feedback)
      const detailsRes = await reportsAPI.getReportDetails(reportId);
      
      // Backend returns: { data: { report: {...}, feedback: [...] } }
      const reportData = detailsRes.data.data;
      
      setReportDetails(prev => ({
        ...prev,
        [reportId]: {
          ...reportData.report,
          feedback: reportData.feedback || []
        }
      }));
    } catch (err) {
      console.error('Failed to fetch report details:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load report details';
      setDetailsError(prev => ({
        ...prev,
        [reportId]: errorMsg
      }));
    } finally {
      setDetailsLoading(false);
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
              const isExpanded = expandedReport === report.report_id;
              const details = reportDetails[report.report_id];
              
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
                      
                      <button
                        onClick={() => toggleReportDetails(report.report_id)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl font-medium text-sm transition-all flex items-center"
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                        <svg 
                          className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Expandable Details Section */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        {detailsLoading && !details ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-blue-200/70">Loading details...</span>
                          </div>
                        ) : detailsError[report.report_id] ? (
                          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
                            <p className="text-red-200 flex items-center">
                              <span className="mr-2">❌</span>
                              {detailsError[report.report_id]}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Report Details */}
                            <div>
                              <h4 className="text-white font-semibold mb-3 flex items-center">
                                <span className="mr-2">📋</span>
                                Report Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-4">
                                  <div className="text-blue-200/60 text-xs mb-1">Description</div>
                                  <div className="text-white text-sm">
                                    {details?.incident_description || report.incident_description || 'No description provided'}
                                  </div>
                                </div>
                                {details?.review_notes && (
                                  <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-blue-200/60 text-xs mb-1">Moderator Notes</div>
                                    <div className="text-white text-sm">{details.review_notes}</div>
                                  </div>
                                )}
                                {details?.reviewed_at && (
                                  <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-blue-200/60 text-xs mb-1">Reviewed At</div>
                                    <div className="text-white text-sm">
                                      {new Date(details.reviewed_at).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                                {details?.domain && (
                                  <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-blue-200/60 text-xs mb-1">Domain</div>
                                    <div className="text-white font-mono text-sm">{details.domain}</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Evidence URLs */}
                            {(() => {
                              const evidenceUrls = typeof details?.evidence_urls === 'string' 
                                ? JSON.parse(details.evidence_urls) 
                                : details?.evidence_urls;
                              
                              return evidenceUrls && evidenceUrls.length > 0 ? (
                                <div>
                                  <h4 className="text-white font-semibold mb-3 flex items-center">
                                    <span className="mr-2">🔗</span>
                                    Evidence URLs
                                  </h4>
                                  <div className="space-y-2">
                                    {evidenceUrls.map((url, idx) => (
                                      <div key={idx} className="bg-white/5 rounded-lg px-4 py-2">
                                        <a 
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-cyan-400 hover:text-cyan-300 text-sm font-mono break-all"
                                        >
                                          {url}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null;
                            })()}

                            {/* Feedback Section */}
                            <div>
                              <h4 className="text-white font-semibold mb-3 flex items-center">
                                <span className="mr-2">💬</span>
                                Community Feedback
                                {details?.feedback?.length > 0 && (
                                  <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                                    {details.feedback.length}
                                  </span>
                                )}
                              </h4>
                              
                              {!details?.feedback || details.feedback.length === 0 ? (
                                <div className="bg-white/5 rounded-lg p-6 text-center">
                                  <span className="text-4xl mb-3 block">💭</span>
                                  <p className="text-blue-200/60 text-sm">No feedback yet on this report</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {details.feedback.map((fb, idx) => {
                                    // Backend uses feedback_type: 'vote_phishing', 'vote_safe', 'comment'
                                    const isConfirm = fb.feedback_type === 'vote_phishing';
                                    const isReject = fb.feedback_type === 'vote_safe';
                                    const isComment = fb.feedback_type === 'comment';
                                    
                                    return (
                                      <div 
                                        key={fb.feedback_id || idx}
                                        className={`rounded-lg p-4 ${
                                          isConfirm
                                            ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                            : isReject
                                              ? 'bg-red-500/10 border border-red-500/30'
                                              : 'bg-white/5 border border-white/10'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                              {isConfirm ? '✅' : isReject ? '❌' : '💭'}
                                            </span>
                                            <span className={`text-sm font-medium ${
                                              isConfirm
                                                ? 'text-emerald-400' 
                                                : isReject
                                                  ? 'text-red-400'
                                                  : 'text-blue-200'
                                            }`}>
                                              {isConfirm ? 'Confirmed as phishing' : 
                                               isReject ? 'Marked as safe' : 'Comment'}
                                            </span>
                                            {(fb.full_name || fb.email) && (
                                              <span className="text-blue-200/50 text-xs">
                                                by {fb.full_name || fb.email}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-blue-200/40 text-xs">
                                            {fb.created_at && new Date(fb.created_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                        {fb.comment_text && (
                                          <p className="text-blue-100/80 text-sm pl-7">{fb.comment_text}</p>
                                        )}
                                        {fb.helpful_count > 0 && (
                                          <div className="mt-2 pl-7">
                                            <span className="text-blue-200/50 text-xs">
                                              👍 {fb.helpful_count} found this helpful
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
