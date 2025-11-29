import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { educationAPI } from '../services/api';

const DownloadsPage = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      // Fetch infographics and articles that have downloadable media
      const response = await educationAPI.getContent({
        content_type: 'infographic',
        language: 'vi',
        limit: 50
      });
      
      const infographics = response.data.data.content || [];
      
      // Also fetch articles with media
      const articlesResponse = await educationAPI.getContent({
        content_type: 'article',
        language: 'vi',
        limit: 50
      });
      
      const articles = articlesResponse.data.data.content || [];
      
      // Combine and filter for items with media_url
      const allDownloads = [...infographics, ...articles].filter(item => item.media_url);
      setDownloads(allDownloads);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load download list');
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (url) => {
    if (!url) return 'file';
    if (url.includes('.pdf')) return 'pdf';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg')) return 'image';
    if (url.includes('.mp4') || url.includes('.webm')) return 'video';
    return 'file';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading download list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-6">
            <span className="text-5xl">📥</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Tải Tài Liệu
          </h1>
          <p className="text-xl text-blue-200/70 max-w-2xl mx-auto">
            Download PDFs, infographics and educational materials on online fraud prevention
          </p>
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

        {/* Downloads Grid */}
        {downloads.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No downloads available</h3>
            <p className="text-blue-200/60">
              Downloads will be updated soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {downloads.map((item) => {
              const fileType = getFileType(item.media_url);
              const fileIcon = getFileIcon(fileType);
              
              return (
                <div
                  key={item.content_id}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{fileIcon}</span>
                      <div>
                        <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg uppercase">
                          {fileType}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    
                    <p className="text-blue-200/60 text-sm mb-4">
                      {new Date(item.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    
                    <div className="flex gap-3">
                      <a
                        href={item.media_url}
                        download
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-medium text-center transition-all"
                      >
                        📥 Tải xuống
                      </a>
                      <Link
                        to={`/education/${item.slug}`}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                      >
                        Xem
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link
            to="/education"
            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to education page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;
