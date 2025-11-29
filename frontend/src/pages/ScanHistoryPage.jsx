import React, { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';
import { Link } from 'react-router-dom';

const ScanHistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedScan, setExpandedScan] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(null);
  const [scanDetails, setScanDetails] = useState({});

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

  const fetchScanDetails = async (checkId) => {
    if (scanDetails[checkId]) {
      setExpandedScan(expandedScan === checkId ? null : checkId);
      return;
    }

    setDetailsLoading(checkId);
    try {
      const response = await scanAPI.getDetails(checkId);
      setScanDetails(prev => ({
        ...prev,
        [checkId]: response.data.data
      }));
      setExpandedScan(checkId);
    } catch (err) {
      console.error('Failed to fetch scan details:', err);
    } finally {
      setDetailsLoading(null);
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

  const getProgressColor = (score) => {
    if (score < 0.3) return 'bg-emerald-500';
    if (score < 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Detail Section Component
  const ScanDetailSection = ({ details }) => {
    if (!details) return null;

    const urlInfo = details.url_info || {};
    const algorithm = details.algorithm || {};
    const componentDetails = algorithm.details || {};
    const breakdown = algorithm.breakdown || {};
    
    const hasComponentDetails = Object.keys(componentDetails).length > 0;
    const hasBreakdown = Object.keys(breakdown).length > 0;

    return (
      <div className="mt-4 pt-4 border-t border-white/10 space-y-6">
        {/* Domain & URL Information */}
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <span className="mr-2">🌐</span>
            Domain & URL Information
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-blue-200/60 text-xs mb-1">Domain</div>
              <div className="text-white font-mono text-sm truncate">{urlInfo.domain || details.check?.domain || 'N/A'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-blue-200/60 text-xs mb-1">Subdomain</div>
              <div className="text-white font-mono text-sm truncate">{urlInfo.subdomain || details.check?.subdomain || 'None'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-blue-200/60 text-xs mb-1">Scheme</div>
              <div className={`font-mono text-sm ${(urlInfo.scheme || '').includes('https') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {urlInfo.scheme || details.check?.scheme || 'N/A'}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-blue-200/60 text-xs mb-1">TLD</div>
              <div className="text-white font-mono text-sm">{urlInfo.tld || 'N/A'}</div>
            </div>
            {urlInfo.is_ip && (
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                <div className="text-red-300 text-xs mb-1">⚠️ IP Address</div>
                <div className="text-red-400 font-mono text-sm">{urlInfo.domain}</div>
              </div>
            )}
            {(urlInfo.path || details.check?.path) && (urlInfo.path || details.check?.path) !== '/' && (
              <div className="bg-white/5 rounded-lg p-3 col-span-2">
                <div className="text-blue-200/60 text-xs mb-1">Path</div>
                <div className="text-white font-mono text-sm truncate">{urlInfo.path || details.check?.path}</div>
              </div>
            )}
            {(urlInfo.query || details.check?.query_params) && (
              <div className="bg-white/5 rounded-lg p-3 col-span-2">
                <div className="text-blue-200/60 text-xs mb-1">Query Parameters</div>
                <div className="text-white font-mono text-sm truncate">{urlInfo.query || details.check?.query_params}</div>
              </div>
            )}
          </div>
        </div>

        {/* Component Scores */}
        {hasComponentDetails ? (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <span className="mr-2">📊</span>
              Component Analysis
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(componentDetails).map(([key, data]) => {
                const score = data?.score || 0;
                return (
                  <div key={key} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-200/70 text-xs capitalize">{key}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getProgressColor(score)}`}
                        style={{ width: `${Math.max(score * 100, 3)}%` }}
                      />
                    </div>
                    {data?.flags && data.flags.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-blue-200/50">{data.flags.length} flag(s)</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-blue-200/50 text-sm">
              ℹ️ Detailed component analysis not available for this scan.
            </p>
            <p className="text-blue-200/40 text-xs mt-1">
              Try scanning the URL again for full analysis details.
            </p>
          </div>
        )}

        {/* Detected Flags */}
        {hasComponentDetails && Object.values(componentDetails).some(d => d?.flags?.length > 0) && (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <span className="mr-2">🚩</span>
              Detected Patterns
            </h4>
            <div className="space-y-2">
              {Object.entries(componentDetails).map(([comp, data]) => {
                if (!data?.flags || data.flags.length === 0) return null;
                return (
                  <div key={comp} className="bg-white/5 rounded-lg p-3">
                    <div className="text-blue-200/70 text-xs capitalize mb-2">{comp}:</div>
                    <div className="flex flex-wrap gap-1">
                      {data.flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded ${
                            data.score >= 0.5 
                              ? 'bg-red-500/20 text-red-300' 
                              : data.score >= 0.3 
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-white/10 text-blue-200/70'
                          }`}
                        >
                          {flag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        {hasBreakdown ? (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <span className="mr-2">🧮</span>
              Score Calculation
            </h4>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="space-y-2">
                {Object.entries(breakdown).map(([comp, data]) => (
                  <div key={comp} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-blue-200/70">{comp}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-200/50 text-xs">
                        {((data.raw_score || 0) * 100).toFixed(0)}% × {((data.weight || 0) * 100).toFixed(0)}%
                      </span>
                      <span className="text-white font-medium w-16 text-right">
                        = {((data.weighted_score || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-bold">
                  <span className="text-white">Total Risk Score</span>
                  <span className={getScoreColor(details.score || 0)}>
                    {((details.score || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <span className="mr-2">🧮</span>
              Score Calculation
            </h4>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between font-bold">
                <span className="text-white">Total Risk Score</span>
                <span className={getScoreColor(details.score || details.check?.algorithm_score || 0)}>
                  {((details.score || details.check?.algorithm_score || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
              const isExpanded = expandedScan === scan.check_id;
              const details = scanDetails[scan.check_id];

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
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(scan.algorithm_score)}`}>
                            {(scan.algorithm_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-blue-200/50 text-xs">Risk Score</div>
                        </div>
                        <button
                          onClick={() => fetchScanDetails(scan.check_id)}
                          disabled={detailsLoading === scan.check_id}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl font-medium text-sm transition-all flex items-center disabled:opacity-50"
                        >
                          {detailsLoading === scan.check_id ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <>
                              {isExpanded ? '▲ Hide' : '▼ Details'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && details && (
                      <ScanDetailSection details={details} />
                    )}
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
