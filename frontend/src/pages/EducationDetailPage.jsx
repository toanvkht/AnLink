import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { educationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EducationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContent();
  }, [slug]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching content for slug:', slug, 'User role:', user?.role);
      const response = await educationAPI.getContentBySlug(slug);
      console.log('Content response:', response.data);
      
      if (response.data.success && response.data.data) {
        setContent(response.data.data);
      } else {
        setError('Content not found');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || 'Unable to load content';
      setError(errorMsg);
      
      // If it's a 404, provide more helpful message
      if (err.response?.status === 404) {
        const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
        if (isAdmin) {
          setError('Content not found. The slug may be incorrect or the content may have been deleted.');
        } else {
          setError('Content does not exist or has not been published. Please check the slug or ensure the content has been published.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'article': return '📄';
      case 'video': return '🎥';
      case 'infographic': return '📊';
      case 'quiz': return '❓';
      case 'audio': return '🎧';
      default: return '📚';
    }
  };

  const getDifficultyLabel = (level) => {
    const labels = {
      beginner: 'Cơ bản',
      intermediate: 'Trung bình',
      advanced: 'Nâng cao'
    };
    return labels[level] || level;
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 max-w-md mx-4">
          <span className="text-5xl mb-4 block">😕</span>
          <h1 className="text-2xl font-bold text-white mb-4">Content Not Found</h1>
          <p className="text-blue-200/70 mb-6">{error || 'This content does not exist'}</p>
          <Link
            to="/education"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            Back to Education
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is a quiz - redirect to quiz page
  if (content.content_type === 'quiz') {
    navigate(`/education/quiz/${slug}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/education"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl">{getContentTypeIcon(content.content_type)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-lg ${getDifficultyColor(content.difficulty_level)}`}>
                  {getDifficultyLabel(content.difficulty_level)}
                </span>
                <span className="text-blue-200/60 text-sm">
                  {new Date(content.created_at).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="text-blue-200/60 text-sm">
                  👁️ {content.view_count || 0} lượt xem
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">{content.title}</h1>
            </div>
          </div>
        </div>

        {/* Media */}
        {content.media_url && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
            {content.content_type === 'video' ? (
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={content.media_url}
                  className="w-full h-full"
                  allowFullScreen
                  title={content.title}
                />
              </div>
            ) : (
              <img
                src={content.media_url}
                alt={content.title}
                className="w-full rounded-xl"
              />
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/10">
          <div 
            className="education-content max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content_body || 'Content is being updated...' }}
          />
        </div>

        {/* Download Button (if downloadable) */}
        {content.media_url && (content.content_type === 'infographic' || content.content_type === 'article') && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">📥 Tải tài liệu</h3>
                <p className="text-blue-200/70">
                  Download this material to view offline or share with others
                </p>
              </div>
              <a
                href={content.media_url}
                download
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all"
              >
                Tải xuống
              </a>
            </div>
          </div>
        )}

        {/* Related Content */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Related Content</h2>
          <Link
            to="/education"
            className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
          >
            View All Materials
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EducationDetailPage;
