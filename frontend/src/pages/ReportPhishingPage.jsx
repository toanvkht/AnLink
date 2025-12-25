import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { scanAPI, reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportPhishingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const initialUrl = searchParams.get('url') || '';
  const initialReason = searchParams.get('reason') || '';

  const [formData, setFormData] = useState({
    url: initialUrl,
    report_reason: initialReason,
    incident_description: '',
    reporter_email: '', // For anonymous reporters
  });

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);

  const [preScanResult, setPreScanResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-scan URL if provided
  useEffect(() => {
    if (initialUrl && !preScanResult) {
      handlePreScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreScan = async () => {
    if (!formData.url) return;
    
    setScanLoading(true);
    setError('');
    setShowDetails(false);
    try {
      const response = await scanAPI.checkUrl({ url: formData.url });
      setPreScanResult(response.data.data);
    } catch (err) {
      setError('Failed to pre-scan URL. You can still submit the report.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count (max 5 files)
    if (evidenceFiles.length + files.length > 5) {
      setError('Maximum 5 evidence files allowed');
      return;
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images, videos (MP4/WebM), and PDFs are allowed.');
        return;
      }
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
    }

    // Add files and create preview URLs
    setEvidenceFiles(prev => [...prev, ...files]);
    
    // Generate preview URLs for images
    const newPreviewUrls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    
    setFilePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setError('');
  };

  const removeFile = (index) => {
    // Revoke preview URL to avoid memory leaks
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    // Simulate file input event
    const event = {
      target: {
        files: files
      }
    };
    handleFileChange(event);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitLoading(true);

    if (!formData.url || !formData.report_reason) {
      setError('URL and report reason are required');
      setSubmitLoading(false);
      return;
    }

    try {
      // Build FormData for file upload
      const submitData = new FormData();
      submitData.append('url', formData.url);
      submitData.append('report_reason', formData.report_reason);
      
      if (formData.incident_description) {
        submitData.append('incident_description', formData.incident_description);
      }
      
      // Add evidence files
      evidenceFiles.forEach(file => {
        submitData.append('evidence_files', file);
      });
      
      // Include email for anonymous reporters
      if (!isAuthenticated && formData.reporter_email) {
        submitData.append('reporter_email', formData.reporter_email);
      }

      const response = await reportsAPI.submitReport(submitData);
      
      setSuccess(response.data.message || 'Report submitted successfully! Thank you for helping keep the internet safe.');
      
      // Only redirect to /reports for authenticated users
      if (isAuthenticated) {
        setTimeout(() => {
          navigate('/reports');
        }, 2000);
      }
      
      // Reset form for anonymous users
      if (!isAuthenticated) {
        setFormData({
          url: '',
          report_reason: '',
          incident_description: '',
          reporter_email: ''
        });
        setEvidenceFiles([]);
        
        // Revoke all preview URLs
        filePreviewUrls.forEach(url => {
          if (url) URL.revokeObjectURL(url);
        });
        setFilePreviewUrls([]);
        setPreScanResult(null);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError('You have already reported this URL.');
      } else {
        setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const getResultStyles = (classification) => {
    switch (classification) {
      case 'safe':
        return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', icon: '✅' };
      case 'suspicious':
        return { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', icon: '⚠️' };
      case 'dangerous':
        return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: '🚫' };
      default:
        return { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400', icon: '❓' };
    }
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

  const reportReasons = [
    { value: 'phishing', label: 'Phishing - Fake login/credential stealing' },
    { value: 'scam', label: 'Scam - Fraudulent offers or schemes' },
    { value: 'malware', label: 'Malware - Downloads harmful software' },
    { value: 'impersonation', label: 'Impersonation - Pretends to be legitimate site' },
    { value: 'spam', label: 'Spam - Unsolicited advertising' },
    { value: 'other', label: 'Other suspicious activity' },
  ];

  // Detailed Scan Results Component
  const ScanDetailsSection = ({ result }) => {
    if (!result) return null;

    // Extract data from result - handle both direct properties and nested structures
    const urlInfo = result.url_info || {};
    const algorithm = result.algorithm || {};
    const componentDetails = algorithm.details || {};
    const breakdown = algorithm.breakdown || {};
    
    // Also check for algorithm.components as fallback for scores
    const componentScores = algorithm.components || {};

    // If no details but we have component scores, build details from scores
    const hasDetails = Object.keys(componentDetails).length > 0;
    const hasScores = Object.keys(componentScores).length > 0;
    const hasBreakdown = Object.keys(breakdown).length > 0;

    return (
      <div className="mt-4 space-y-4">
        {/* Domain & URL Information */}
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center text-sm">
            <span className="mr-2">🌐</span>
            Domain & URL information
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-blue-200/60 text-xs mb-1">Domain</div>
              <div className="text-white font-mono text-xs truncate">{urlInfo.domain || result.domain || 'N/A'}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-blue-200/60 text-xs mb-1">Subdomain</div>
              <div className="text-white font-mono text-xs truncate">{urlInfo.subdomain || 'None'}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-blue-200/60 text-xs mb-1">Scheme</div>
              <div className={`font-mono text-xs ${(urlInfo.scheme || '').includes('https') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {urlInfo.scheme || 'N/A'}
              </div>
            </div>
            {urlInfo.tld && (
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-blue-200/60 text-xs mb-1">TLD</div>
                <div className="text-white font-mono text-xs">{urlInfo.tld}</div>
              </div>
            )}
            {urlInfo.is_ip && (
              <div className="bg-red-500/20 rounded-lg p-2 border border-red-500/30">
                <div className="text-red-300 text-xs mb-1">⚠️ IP address detected</div>
                <div className="text-red-400 font-mono text-xs">{urlInfo.domain}</div>
              </div>
            )}
            {(result.is_shortener || urlInfo.is_shortener) && (
              <div className="bg-amber-500/20 rounded-lg p-2 border border-amber-500/30">
                <div className="text-amber-300 text-xs mb-1">🔗 URL Shortener</div>
                <div className="text-amber-400 font-mono text-xs">{result.shortener || 'Detected'}</div>
              </div>
            )}
            {urlInfo.url_length && (
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-blue-200/60 text-xs mb-1">URL length</div>
                <div className="text-white font-mono text-xs">{urlInfo.url_length} chars</div>
              </div>
            )}
          </div>
        </div>

        {/* Component Scores - show if we have details or scores */}
        {(hasDetails || hasScores) && (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center text-sm">
              <span className="mr-2">📊</span>
              Component analysis
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {hasDetails ? (
                // Use full details if available
                Object.entries(componentDetails).map(([key, data]) => {
                  const score = data?.score || 0;
                  return (
                    <div key={key} className="bg-black/20 rounded-lg p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-blue-200/70 text-xs capitalize">{key}</span>
                        <span className={`text-xs font-bold ${getScoreColor(score)}`}>
                          {(score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${getProgressColor(score)}`}
                          style={{ width: `${Math.max(score * 100, 3)}%` }}
                        />
                      </div>
                      {data?.flags && data.flags.length > 0 && (
                        <div className="mt-1 text-xs text-blue-200/50">{data.flags.length} flags</div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Fallback to component scores
                Object.entries(componentScores).map(([key, score]) => (
                  <div key={key} className="bg-black/20 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-blue-200/70 text-xs capitalize">{key}</span>
                      <span className={`text-xs font-bold ${getScoreColor(score)}`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${getProgressColor(score)}`}
                        style={{ width: `${Math.max(score * 100, 3)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Detected Flags */}
        {hasDetails && Object.values(componentDetails).some(d => d?.flags?.length > 0) && (
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center text-sm">
              <span className="mr-2">🚩</span>
              Detected patterns
            </h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(componentDetails).flatMap(([comp, data]) => 
                (data?.flags || []).slice(0, 10).map((flag, idx) => (
                  <span
                    key={`${comp}-${idx}`}
                    className={`text-xs px-2 py-1 rounded ${
                      (data?.score || 0) >= 0.5 
                        ? 'bg-red-500/20 text-red-300' 
                        : (data?.score || 0) >= 0.3 
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/10 text-blue-200/70'
                    }`}
                  >
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        {hasBreakdown && (
          <div>
            <h4 className="text-white font-semibold mb-2 flex items-center text-sm">
              <span className="mr-2">🧮</span>
              Score Calculation
            </h4>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="space-y-1">
                {Object.entries(breakdown).map(([comp, data]) => (
                  <div key={comp} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-blue-200/70">{comp}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-200/50">
                        {((data.raw_score || 0) * 100).toFixed(0)}% × {((data.weight || 0) * 100).toFixed(0)}%
                      </span>
                      <span className="text-white font-medium w-12 text-right">
                        = {((data.weighted_score || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-1 mt-1 flex justify-between font-bold text-xs">
                  <span className="text-white">Total risk score</span>
                  <span className={getScoreColor(result.score || 0)}>
                    {((result.score || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
            <span className="text-4xl">🚨</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Report phishing site
          </h1>
          <p className="text-lg text-blue-200">
            Help protect the community by reporting suspicious websites
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <span className="text-3xl mr-4">✅</span>
              <div>
                <h3 className="text-emerald-400 font-bold text-lg">Success!</h3>
                <p className="text-emerald-200">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-2xl p-4 mb-6">
            <p className="text-red-200 flex items-center">
              <span className="mr-2">❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Anonymous User Notice */}
        {!isAuthenticated && (
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-2xl p-4 mb-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">👤</span>
              <div>
                <h3 className="text-blue-200 font-semibold mb-1">Reporting anonymously</h3>
                <p className="text-blue-200/70 text-sm">
                  You're submitting an anonymous report. 
                  <Link to="/login" className="text-cyan-400 hover:text-cyan-300 ml-1">
                    Log in
                  </Link> to track your reports and get updates.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* URL Input Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🌐</span>
              Suspicious URL
            </h2>

            <div className="flex gap-3">
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://suspicious-site.com"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={handlePreScan}
                disabled={scanLoading || !formData.url}
                className="px-6 py-3 bg-white/10 border border-white/20 text-blue-200 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scanning
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">🔍</span>
                    Pre-scan
                  </span>
                )}
              </button>
            </div>

            {/* Pre-Scan Results */}
            {preScanResult && (
              <div className={`mt-4 p-4 rounded-xl ${getResultStyles(preScanResult.classification).bg} ${getResultStyles(preScanResult.classification).border} border`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getResultStyles(preScanResult.classification).icon}</span>
                    <span className={`font-bold capitalize ${getResultStyles(preScanResult.classification).text}`}>
                      {preScanResult.classification}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${getResultStyles(preScanResult.classification).text}`}>
                      {(preScanResult.score * 100).toFixed(0)}% Risk
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs px-3 py-1 bg-black/20 rounded-lg text-blue-200 hover:bg-black/30 transition-all"
                    >
                      {showDetails ? '▲ Hide details' : '▼ Show details'}
                    </button>
                  </div>
                </div>
                <p className="text-blue-200/70 text-sm">{preScanResult.message}</p>
                
                {preScanResult.explanation && (
                  <p className="text-blue-200/50 text-xs mt-2 italic">{preScanResult.explanation}</p>
                )}

                {/* Expandable Details */}
                {showDetails && <ScanDetailsSection result={preScanResult} />}
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Report details
            </h2>

            {/* Report Reason */}
            <div className="mb-4">
              <label className="block text-blue-100 font-medium mb-2">
                Report reason <span className="text-red-400">*</span>
              </label>
              <select
                name="report_reason"
                value={formData.report_reason}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                required
              >
                <option value="" className="bg-slate-800">Select a reason...</option>
                {reportReasons.map(reason => (
                  <option key={reason.value} value={reason.value} className="bg-slate-800">
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Description */}
            <div className="mb-4">
              <label className="block text-blue-100 font-medium mb-2">
                Incident description
                <span className="text-blue-200/50 ml-2">(Optional)</span>
              </label>
              <textarea
                name="incident_description"
                value={formData.incident_description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe what happened or what makes this site suspicious..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all resize-none"
              />
            </div>

            {/* Email for Anonymous Users */}
            {!isAuthenticated && (
              <div className="mb-4">
                <label className="block text-blue-100 font-medium mb-2">
                  Your email
                  <span className="text-blue-200/50 ml-2">(Optional - for follow-up)</span>
                </label>
                <input
                  type="email"
                  name="reporter_email"
                  value={formData.reporter_email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <p className="text-blue-200/50 text-xs mt-1">
                  We'll only use this to notify you about the report status
                </p>
              </div>
            )}
          </div>

          {/* Evidence Files */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📎</span>
              Evidence files
              <span className="text-blue-200/50 text-sm font-normal ml-2">(Optional, max 5 files)</span>
            </h2>
            <p className="text-blue-200/70 text-sm mb-4">
              Upload screenshots, videos, or PDFs as evidence (10MB max per file)
            </p>

            {/* Drag and Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-cyan-400/50 transition-all bg-white/5"
            >
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-4">📁</span>
                <p className="text-blue-200 mb-2">Drag & drop files here</p>
                <p className="text-blue-200/50 text-sm mb-4">or</p>
                <label className="px-6 py-3 bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  Choose files
                </label>
                <p className="text-blue-200/40 text-xs mt-3">
                  Images, MP4/WebM videos, or PDFs • Max 10MB each • Up to 5 files
                </p>
              </div>
            </div>

            {/* File Previews */}
            {evidenceFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-black/20 rounded-xl p-3 border border-white/10">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {filePreviewUrls[index] ? (
                        <img
                          src={filePreviewUrls[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : file.type.startsWith('video/') ? (
                        <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🎥</span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📄</span>
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{file.name}</p>
                      <p className="text-blue-200/50 text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {file.type.startsWith('image/') && ' • Image'}
                        {file.type.startsWith('video/') && ' • Video'}
                        {file.type === 'application/pdf' && ' • PDF'}
                      </p>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <p className="text-blue-200/50 text-xs text-center">
                  {evidenceFiles.length}/5 files • {(evidenceFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitLoading || !formData.url || !formData.report_reason}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all transform ${
              submitLoading || !formData.url || !formData.report_reason
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-red-500/25 hover:scale-[1.02]'
            }`}
          >
            {submitLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting report...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">🚨</span>
                Submit report
              </span>
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">💡 Tips for a good report</h3>
          <ul className="space-y-2 text-blue-200/70 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Double-check the URL is correct before submitting
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Describe what made you suspicious of this site
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Upload clear screenshots or screen recordings as evidence when possible
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Report legitimate security concerns - false reports slow down review
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportPhishingPage;
