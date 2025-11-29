import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { educationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EducationPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    content_type: '',
    difficulty_level: '',
    language: 'vi'
  });

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        language: filter.language,
        limit: 50
      };
      
      if (filter.content_type) params.content_type = filter.content_type;
      if (filter.difficulty_level) params.difficulty_level = filter.difficulty_level;

      const response = await educationAPI.getContent(params);
      const fetchedContent = response.data.data.content || [];
      setContent(fetchedContent);
      
      // Log for debugging
      if (fetchedContent.length === 0) {
        console.log('No content found with filters:', filter);
      }
    } catch (err) {
      console.error('Error fetching education content:', err);
      setError(err.response?.data?.error || 'Unable to load education content');
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
      default: return '📚';
    }
  };

  const getContentTypeLabel = (type) => {
    const labels = {
      article: 'Article',
      video: 'Video',
      infographic: 'Infographic',
      quiz: 'Quiz',
    };
    return labels[type] || type;
  };

  const getDifficultyLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-6">
            <span className="text-5xl">📚</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Education Materials
          </h1>
          <p className="text-xl text-blue-200/70 max-w-2xl mx-auto">
            Learn how to identify and prevent online phishing scams. Educational materials with real examples and easy-to-understand illustrations.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">
                Content Type
              </label>
              <select
                value={filter.content_type}
                onChange={(e) => setFilter({ ...filter, content_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" className="bg-slate-800 text-white">All</option>
                <option value="article" className="bg-slate-800 text-white">Article</option>
                <option value="video" className="bg-slate-800 text-white">Video</option>
                <option value="infographic" className="bg-slate-800 text-white">Infographic</option>
                <option value="quiz" className="bg-slate-800 text-white">Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <select
                value={filter.difficulty_level}
                onChange={(e) => setFilter({ ...filter, difficulty_level: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="" className="bg-slate-800 text-white">Tất cả</option>
                <option value="beginner" className="bg-slate-800 text-white">Beginner</option>
                <option value="intermediate" className="bg-slate-800 text-white">Intermediate</option>
                <option value="advanced" className="bg-slate-800 text-white">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">
                Language
              </label>
              <select
                value={filter.language}
                onChange={(e) => setFilter({ ...filter, language: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="vi" className="bg-slate-800 text-white">Tiếng Việt</option>
                <option value="en" className="bg-slate-800 text-white">English</option>
              </select>
            </div>
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

        {/* Content Grid */}
        {(() => {
          // Filter out items with invalid slugs (URLs)
          const validContent = content.filter((item) => {
            if (!item.slug) return false;
            return !item.slug.includes('://') && 
                   !item.slug.startsWith('http') &&
                   !item.slug.includes('www.') &&
                   item.slug.length > 0 &&
                   item.slug.length < 255;
          });

          const invalidContent = content.filter((item) => {
            if (!item.slug) return true;
            return item.slug.includes('://') || 
                   item.slug.startsWith('http') ||
                   item.slug.includes('www.') ||
                   item.slug.length === 0 ||
                   item.slug.length >= 255;
          });

          if (validContent.length === 0 && content.length > 0) {
            return (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Invalid Content Slugs</h3>
                <p className="text-blue-200/60 mb-4">
                  Some content has invalid slugs (URLs instead of slugs). Please fix them in the admin panel.
                </p>
                {invalidContent.length > 0 && (
                  <div className="mt-4 text-left max-w-md mx-auto">
                    <p className="text-amber-300 text-sm mb-2">Affected content:</p>
                    <ul className="text-blue-200/70 text-sm space-y-1">
                      {invalidContent.slice(0, 5).map((item) => (
                        <li key={item.content_id}>• {item.title} (slug: {item.slug?.substring(0, 50)}...)</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          }

          if (validContent.length === 0) {
            return (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📭</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No materials available</h3>
                <p className="text-blue-200/60">
                  Educational content will be updated soon.
                </p>
              </div>
            );
          }

          return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validContent.map((item) => (
              <Link
                key={item.content_id}
                to={`/education/${item.slug}`}
                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:bg-white/10 hover:border-cyan-400/50 transition-all overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getContentTypeIcon(item.content_type)}</span>
                      <div>
                        <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg">
                          {getContentTypeLabel(item.content_type)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg ${getDifficultyColor(item.difficulty_level)}`}>
                      {getDifficultyLabel(item.difficulty_level)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-blue-200/60">
                    <span>👁️ {item.view_count || 0} views</span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          );
        })()}
      </div>
    </div>
  );
};

export default EducationPage;
