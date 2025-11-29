import React, { useState, useEffect } from 'react';
import { moderatorAPI } from '../services/api';

const ModeratorQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ priority: '', assigned_to_me: false });
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, type: '', reportId: null });
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueRes, statsRes] = await Promise.all([
        moderatorAPI.getQueue({
          priority: filter.priority || undefined,
          assigned_to_me: filter.assigned_to_me ? 'true' : undefined
        }),
        moderatorAPI.getDashboardStats()
      ]);
      setQueue(queueRes.data.data.queue || []);
      setStats(statsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async (reportId) => {
    setActionLoading(reportId);
    try {
      await moderatorAPI.assignReport(reportId, {});
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async () => {
    if (!actionModal.reportId) return;
    setActionLoading(actionModal.reportId);
    try {
      await moderatorAPI.confirmPhishing(actionModal.reportId, {
        severity: 'high',
        notes: actionNotes || 'Confirmed as phishing by moderator'
      });
      setActionModal({ show: false, type: '', reportId: null });
      setActionNotes('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!actionModal.reportId) return;
    setActionLoading(actionModal.reportId);
    try {
      await moderatorAPI.rejectReport(actionModal.reportId, {
        notes: actionNotes || 'Rejected - not phishing'
      });
      setActionModal({ show: false, type: '', reportId: null });
      setActionNotes('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject report');
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' };
      case 'high':
        return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' };
      case 'medium':
        return { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-500' };
      case 'low':
        return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' };
      default:
        return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' };
    }
  };

  const getReasonLabel = (reason) => {
    const labels = {
      phishing: '🎣 Phishing',
      scam: '💰 Scam',
      malware: '🦠 Malware',
      impersonation: '🎭 Impersonation',
      spam: '📧 Spam',
      other: '❓ Other'
    };
    return labels[reason] || reason;
  };

  if (loading && !queue.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading moderation queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <span className="mr-3">👮</span>
            Moderation Queue
          </h1>
          <p className="text-blue-200/70">Review and moderate reported phishing sites</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-amber-500/10 backdrop-blur-lg rounded-xl p-4 border border-amber-500/30">
              <div className="text-3xl font-bold text-amber-400 mb-1">{stats.pending_reports}</div>
              <div className="text-amber-200/60 text-sm">Pending</div>
            </div>
            <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.under_review}</div>
              <div className="text-blue-200/60 text-sm">Under Review</div>
            </div>
            <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
              <div className="text-3xl font-bold text-purple-400 mb-1">{stats.assigned_to_me}</div>
              <div className="text-purple-200/60 text-sm">Assigned to Me</div>
            </div>
            <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-4 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.priority_breakdown?.urgent || 0}</div>
              <div className="text-red-200/60 text-sm">Urgent</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-200/70 text-sm">Priority:</span>
              <select
                value={filter.priority}
                onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="" className="bg-slate-800">All</option>
                <option value="urgent" className="bg-slate-800">Urgent</option>
                <option value="high" className="bg-slate-800">High</option>
                <option value="medium" className="bg-slate-800">Medium</option>
                <option value="low" className="bg-slate-800">Low</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.assigned_to_me}
                onChange={(e) => setFilter(f => ({ ...f, assigned_to_me: e.target.checked }))}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-blue-200/70 text-sm">Only my assignments</span>
            </label>
            <button
              onClick={fetchData}
              className="ml-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl text-sm transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6">
            <p className="text-red-200 flex items-center">
              <span className="mr-2">❌</span>
              {error}
            </p>
            <button
              onClick={() => setError('')}
              className="text-red-300 underline text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Queue List */}
        {queue.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Queue is Empty</h3>
            <p className="text-blue-200/60">
              {filter.priority || filter.assigned_to_me
                ? 'No reports match your current filters'
                : 'All reports have been reviewed'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((report) => {
              const priorityStyles = getPriorityStyles(report.priority);
              const isSelected = selectedReport === report.report_id;
              
              return (
                <div
                  key={report.report_id}
                  className={`bg-white/5 backdrop-blur-lg rounded-2xl border transition-all overflow-hidden ${
                    isSelected ? 'border-cyan-500/50 bg-white/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${priorityStyles.bg} ${priorityStyles.text}`}>
                        {report.priority}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-blue-200">
                        {report.status === 'pending' ? '⏳ Pending' : '🔍 Under Review'}
                      </span>
                      <span className="text-blue-200/50 text-sm">
                        {new Date(report.reported_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {report.assigned_name && (
                        <span className="text-purple-400 text-sm">
                          📌 Assigned to: {report.assigned_name}
                        </span>
                      )}
                    </div>

                    {/* URL */}
                    <p className="text-white font-mono text-sm break-all bg-white/5 rounded-lg px-4 py-2 mb-4">
                      {report.original_url}
                    </p>

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <span className="text-blue-200/60">
                        {getReasonLabel(report.report_reason)}
                      </span>
                      <span className="text-blue-200/60">
                        Reported by: <span className="text-blue-200">{report.reporter_name}</span>
                      </span>
                      <span className="text-blue-200/60">
                        Domain: <span className="text-cyan-400">{report.domain}</span>
                      </span>
                      {(report.phishing_votes > 0 || report.safe_votes > 0) && (
                        <span className="text-blue-200/60">
                          Votes: <span className="text-red-400">🚫 {report.phishing_votes || 0}</span>
                          {' / '}
                          <span className="text-emerald-400">✅ {report.safe_votes || 0}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {!report.assigned_name && (
                        <button
                          onClick={() => handleAssignToMe(report.report_id)}
                          disabled={actionLoading === report.report_id}
                          className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading === report.report_id ? '...' : '📌 Assign to Me'}
                        </button>
                      )}
                      <button
                        onClick={() => setActionModal({ show: true, type: 'confirm', reportId: report.report_id })}
                        disabled={actionLoading === report.report_id}
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-500/30 transition-all text-sm font-medium disabled:opacity-50"
                      >
                        ✅ Confirm Phishing
                      </button>
                      <button
                        onClick={() => setActionModal({ show: true, type: 'reject', reportId: report.report_id })}
                        disabled={actionLoading === report.report_id}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => setSelectedReport(isSelected ? null : report.report_id)}
                        className="px-4 py-2 bg-white/10 border border-white/20 text-blue-200 rounded-xl hover:bg-white/20 transition-all text-sm font-medium ml-auto"
                      >
                        {isSelected ? '▲ Less' : '▼ More Details'}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-200/60">Report ID:</span>
                            <span className="text-white ml-2">#{report.report_id}</span>
                          </div>
                          <div>
                            <span className="text-blue-200/60">Reporter Email:</span>
                            <span className="text-white ml-2">{report.reporter_email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-blue-200/60">Feedback Count:</span>
                            <span className="text-white ml-2">{report.feedback_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionModal.type === 'confirm' ? '✅ Confirm as Phishing' : '❌ Reject Report'}
            </h3>
            <p className="text-blue-200/70 mb-4">
              {actionModal.type === 'confirm'
                ? 'This will add the URL to the known phishing database.'
                : 'This will mark the report as a false positive.'}
            </p>
            <div className="mb-4">
              <label className="block text-blue-200 text-sm mb-2">Notes (optional)</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about your decision..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModal({ show: false, type: '', reportId: null });
                  setActionNotes('');
                }}
                className="flex-1 px-4 py-3 bg-white/10 text-blue-200 rounded-xl hover:bg-white/20 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={actionModal.type === 'confirm' ? handleConfirm : handleReject}
                disabled={actionLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                  actionModal.type === 'confirm'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                }`}
              >
                {actionLoading ? 'Processing...' : (actionModal.type === 'confirm' ? 'Confirm' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorQueuePage;
