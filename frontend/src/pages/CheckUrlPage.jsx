/**
 * Check URL Page
 * AnLink Anti-Phishing System
 * 
 * Main page for URL scanning and analysis results display.
 */

import React, { useState } from 'react';
import { scanAPI } from '../services/api';

const CheckUrlPage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setShowDetails(false);

    try {
      const response = await scanAPI.checkUrl({ url });
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResultStyles = (classification) => {
    switch (classification) {
      case 'safe':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          text: 'text-emerald-700',
          accent: 'bg-emerald-500',
          icon: '✅',
          gradient: 'from-emerald-400 to-green-500'
        };
      case 'suspicious':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-700',
          accent: 'bg-amber-500',
          icon: '⚠️',
          gradient: 'from-amber-400 to-orange-500'
        };
      case 'dangerous':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-700',
          accent: 'bg-red-500',
          icon: '🚫',
          gradient: 'from-red-400 to-rose-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
          accent: 'bg-gray-500',
          icon: '❓',
          gradient: 'from-gray-400 to-slate-500'
        };
    }
  };

  const getScoreColor = (score) => {
    if (score < 0.3) return 'text-emerald-600';
    if (score < 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score) => {
    if (score < 0.3) return 'bg-emerald-500';
    if (score < 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const ComponentCard = ({ name, data }) => {
    const score = data?.score || 0;
    const flags = data?.flags || [];
    
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700 capitalize">{name}</span>
          <span className={`font-bold ${getScoreColor(score)}`}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score)}`}
            style={{ width: `${Math.max(score * 100, 2)}%` }}
          />
        </div>
        {flags.length > 0 && (
          <div className="mt-2 space-y-1">
            {flags.slice(0, 3).map((flag, idx) => (
              <span
                key={idx}
                className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mr-1 mb-1"
              >
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
            {flags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{flags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            URL Safety Scanner
          </h1>
          <p className="text-lg text-blue-200">
            Analyze URLs for phishing threats using advanced pattern detection
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8 border border-white/20">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-blue-100 font-medium mb-3">
                Enter URL to analyze:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or example.com"
                  className="w-full px-5 py-4 bg-white/90 border-2 border-transparent rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 text-gray-800 text-lg placeholder-gray-400 transition-all"
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🌐
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all transform ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-6 w-6 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing URL...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">🔍</span>
                  Scan URL
                </span>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl">
              <p className="text-red-200 font-medium flex items-center">
                <span className="mr-2">❌</span>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-6 animate-fadeIn">
            {/* Overall Result Card */}
            {(() => {
              const styles = getResultStyles(result.classification);
              return (
                <div className={`rounded-2xl shadow-2xl overflow-hidden border-2 ${styles.border}`}>
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${styles.gradient} px-8 py-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-5xl mr-4">{styles.icon}</span>
                        <div>
                          <h2 className="text-3xl font-bold capitalize">
                            {result.classification}
                          </h2>
                          <p className="text-white/80 text-sm mt-1">
                            Confidence: {result.confidence}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold">
                          {(result.score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-white/80">Risk Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className={`${styles.bg} px-8 py-6`}>
                    <p className={`text-lg ${styles.text}`}>
                      {result.message}
                    </p>
                    
                    {result.explanation && (
                      <p className="mt-2 text-gray-600 text-sm">
                        {result.explanation}
                      </p>
                    )}

                    {/* URL Info */}
                    <div className="mt-4 p-4 bg-white/50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Analyzed URL:</p>
                      <p className="font-mono text-sm text-gray-700 break-all">
                        {result.url}
                      </p>
                    </div>

                    {/* Response Time */}
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <span className="mr-2">⚡</span>
                      Analysis completed in {result.response_time_ms}ms
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Algorithm Analysis */}
            {result.algorithm && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="mr-2">📊</span>
                    Component Analysis
                  </h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {/* Component Scores Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  {result.algorithm.details && Object.entries(result.algorithm.details).map(([key, data]) => (
                    <ComponentCard key={key} name={key} data={data} />
                  ))}
                </div>

                {/* Weights Explanation */}
                {result.algorithm.breakdown && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Score Breakdown:</h4>
                    <div className="space-y-2">
                      {Object.entries(result.algorithm.breakdown).map(([comp, data]) => (
                        <div key={comp} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-600">{comp}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400">
                              {(data.raw_score * 100).toFixed(0)}% × {(data.weight * 100).toFixed(0)}%
                            </span>
                            <span className="font-medium text-gray-700">
                              = {(data.weighted_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                        <span>Total Score</span>
                        <span className={getScoreColor(result.score)}>
                          {(result.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Flags */}
                {showDetails && result.algorithm.details && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="font-medium text-gray-700 mb-4">All Detected Patterns:</h4>
                    <div className="space-y-4">
                      {Object.entries(result.algorithm.details).map(([comp, data]) => (
                        data.flags && data.flags.length > 0 && (
                          <div key={comp} className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-medium text-gray-700 capitalize mb-2">{comp}:</h5>
                            <div className="flex flex-wrap gap-2">
                              {data.flags.map((flag, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-1 rounded ${
                                    data.score >= 0.5 
                                      ? 'bg-red-100 text-red-700' 
                                      : data.score >= 0.3 
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {flag.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shortener Warning */}
            {result.is_shortener && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🔗</span>
                  <div>
                    <h4 className="font-bold text-amber-800 mb-2">URL Shortener Detected</h4>
                    <p className="text-amber-700">
                      This URL uses a shortener service ({result.shortener}). 
                      We cannot verify the final destination without expanding it.
                    </p>
                    {result.recommendation && (
                      <p className="mt-2 text-amber-600 text-sm italic">
                        💡 {result.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phishing Info (if known phishing) */}
            {result.phishing_info && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                <h4 className="font-bold text-red-800 mb-4 flex items-center">
                  <span className="mr-2">🚨</span>
                  Known Phishing Alert
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-600">Severity:</span>
                    <span className="ml-2 font-medium text-red-800 capitalize">
                      {result.phishing_info.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600">Type:</span>
                    <span className="ml-2 font-medium text-red-800">
                      {result.phishing_info.type}
                    </span>
                  </div>
                  {result.phishing_info.target_brand && (
                    <div className="col-span-2">
                      <span className="text-red-600">Target Brand:</span>
                      <span className="ml-2 font-medium text-red-800">
                        {result.phishing_info.target_brand}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setUrl('');
                  setShowDetails(false);
                }}
                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-all"
              >
                🔄 Check Another URL
              </button>
              <button
                onClick={() => {
                  const reportUrl = `/reports/new?url=${encodeURIComponent(url)}&classification=${result.classification}`;
                  window.location.href = reportUrl;
                }}
                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all"
              >
                🚨 Report This Site
              </button>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="mr-2">💡</span>
            How Our Scanner Works
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mr-4 flex-shrink-0">
                <span>🔍</span>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Domain Analysis</h4>
                <p className="text-blue-200 text-sm">
                  Detects typosquatting, homoglyphs, and brand impersonation using similarity algorithms.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mr-4 flex-shrink-0">
                <span>🎯</span>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Pattern Detection</h4>
                <p className="text-blue-200 text-sm">
                  Identifies suspicious keywords, unusual structures, and known phishing patterns.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mr-4 flex-shrink-0">
                <span>🛡️</span>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Heuristic Analysis</h4>
                <p className="text-blue-200 text-sm">
                  Checks for suspicious TLDs, IP addresses, URL shorteners, and encoding tricks.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mr-4 flex-shrink-0">
                <span>📊</span>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Risk Scoring</h4>
                <p className="text-blue-200 text-sm">
                  Combines all factors into a weighted score with clear safe/suspicious/dangerous classification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-blue-300 text-sm">
          <p>AnLink Anti-Phishing System • Protecting users from malicious websites</p>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CheckUrlPage;
