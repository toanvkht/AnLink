import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { scanAPI, reportsAPI } from '../services/api';

const ReportPhishingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUrl = searchParams.get('url') || '';
  const initialClassification = searchParams.get('classification') || '';

  const [formData, setFormData] = useState({
    url: initialUrl,
    report_reason: '',
    incident_description: '',
    evidence_urls: [''],
  });

  const [preScanResult, setPreScanResult] = useState(null);
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
    try {
      const response = await scanAPI.quickCheck({ url: formData.url });
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

  const handleEvidenceChange = (index, value) => {
    const newEvidenceUrls = [...formData.evidence_urls];
    newEvidenceUrls[index] = value;
    setFormData(prev => ({
      ...prev,
      evidence_urls: newEvidenceUrls
    }));
  };

  const addEvidenceField = () => {
    if (formData.evidence_urls.length < 5) {
      setFormData(prev => ({
        ...prev,
        evidence_urls: [...prev.evidence_urls, '']
      }));
    }
  };

  const removeEvidenceField = (index) => {
    if (formData.evidence_urls.length > 1) {
      const newEvidenceUrls = formData.evidence_urls.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        evidence_urls: newEvidenceUrls
      }));
    }
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
      const evidenceUrls = formData.evidence_urls.filter(url => url.trim() !== '');
      
      const reportData = {
        url: formData.url,
        report_reason: formData.report_reason,
        incident_description: formData.incident_description,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : undefined
      };

      const response = await reportsAPI.submitReport(reportData);
      
      setSuccess('Report submitted successfully! Thank you for helping keep the internet safe.');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/reports');
      }, 2000);
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

  const reportReasons = [
    { value: 'phishing', label: 'Phishing - Fake login/credential stealing' },
    { value: 'scam', label: 'Scam - Fraudulent offers or schemes' },
    { value: 'malware', label: 'Malware - Downloads harmful software' },
    { value: 'impersonation', label: 'Impersonation - Pretends to be legitimate site' },
    { value: 'spam', label: 'Spam - Unsolicited advertising' },
    { value: 'other', label: 'Other suspicious activity' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
            <span className="text-4xl">🚨</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Report Phishing Site
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
                    Pre-Scan
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
                  <span className={`font-bold ${getResultStyles(preScanResult.classification).text}`}>
                    {(preScanResult.score * 100).toFixed(0)}% Risk
                  </span>
                </div>
                <p className="text-blue-200/70 text-sm">{preScanResult.message}</p>
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Report Details
            </h2>

            {/* Report Reason */}
            <div className="mb-4">
              <label className="block text-blue-100 font-medium mb-2">
                Report Reason <span className="text-red-400">*</span>
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
                Incident Description
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
          </div>

          {/* Evidence URLs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📎</span>
              Evidence Links
              <span className="text-blue-200/50 text-sm font-normal ml-2">(Optional)</span>
            </h2>
            <p className="text-blue-200/70 text-sm mb-4">
              Add links to screenshots, archived pages, or other evidence
            </p>

            {formData.evidence_urls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleEvidenceChange(index, e.target.value)}
                  placeholder="https://example.com/screenshot.png"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                {formData.evidence_urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEvidenceField(index)}
                    className="px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {formData.evidence_urls.length < 5 && (
              <button
                type="button"
                onClick={addEvidenceField}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                + Add another evidence link
              </button>
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
                Submitting Report...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">🚨</span>
                Submit Report
              </span>
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">💡 Tips for a Good Report</h3>
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
              Include screenshots or archived links as evidence when possible
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
