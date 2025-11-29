import React, { useState, useEffect } from 'react';
import { educationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminEducationPage = () => {
  const { user } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content_type: 'article',
    content_body: '',
    media_url: '',
    language: 'vi',
    difficulty_level: 'beginner',
    is_published: false
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([
    { id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }
  ]);

  useEffect(() => {
    fetchContent();
  }, []);

  // Reset quiz questions when content type changes
  useEffect(() => {
    if (formData.content_type === 'quiz') {
      if (quizQuestions.length === 0) {
        setQuizQuestions([{ id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }]);
      }
    } else {
      // Clear quiz questions if switching away from quiz
      if (quizQuestions.length > 0 && !editing) {
        setQuizQuestions([]);
      }
    }
  }, [formData.content_type]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Admins can see all content including unpublished
      const response = await educationAPI.getContent({ limit: 100 });
      setContent(response.data.data.content || []);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If content type changes to quiz, initialize quiz questions
    if (name === 'content_type' && value === 'quiz' && quizQuestions.length === 0) {
      setQuizQuestions([{ id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }]);
    }
    
    // If content type changes away from quiz, clear quiz questions
    if (name === 'content_type' && value !== 'quiz') {
      setQuizQuestions([]);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateSlug = (title) => {
    if (!title || typeof title !== 'string') {
      return '';
    }
    // Remove URLs if accidentally included
    let cleanTitle = title.replace(/https?:\/\/[^\s]+/g, '').trim();
    if (!cleanTitle) {
      return '';
    }
    return cleanTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 200); // Limit length
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure slug is generated if empty
      const finalSlug = formData.slug || (formData.title ? generateSlug(formData.title) : '');
      
      // Validate required fields
      if (!formData.title || !finalSlug) {
        alert('Please enter a title. Slug will be automatically generated from the title.');
        return;
      }
      
      // Validate slug - ensure it's not a URL
      if (finalSlug.includes('://') || finalSlug.startsWith('http')) {
        alert('Invalid slug. Slug cannot be a URL. Please enter a valid slug (e.g., "my-article-title").');
        return;
      }
      
      // Prepare content_body - for quiz, use quizQuestions JSON
      let contentBody = formData.content_body;
      if (formData.content_type === 'quiz') {
        // Validate quiz questions
        const validQuestions = quizQuestions.filter(q => 
          q.question.trim() && 
          q.options.filter(opt => opt.trim()).length >= 2 &&
          q.correct >= 0 && 
          q.correct < q.options.filter(opt => opt.trim()).length
        );
        
        if (validQuestions.length === 0) {
          alert('Please add at least one valid quiz question with at least 2 options.');
          return;
        }
        
        // Map questions to include only non-empty options
        const formattedQuestions = validQuestions.map(q => ({
          id: q.id,
          question: q.question.trim(),
          options: q.options.filter(opt => opt.trim()),
          correct: q.correct,
          explanation: q.explanation.trim() || ''
        }));
        
        contentBody = JSON.stringify(formattedQuestions);
      }
      
      // Prepare data to send - use FormData if file is uploaded
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title);
      dataToSend.append('slug', finalSlug);
      dataToSend.append('content_type', formData.content_type);
      dataToSend.append('content_body', contentBody);
      dataToSend.append('language', formData.language);
      dataToSend.append('difficulty_level', formData.difficulty_level);
      dataToSend.append('is_published', formData.is_published);
      
      // Add file if uploaded, otherwise add media_url
      if (mediaFile) {
        dataToSend.append('media_file', mediaFile);
      } else if (formData.media_url) {
        dataToSend.append('media_url', formData.media_url);
      }
      
      if (editing) {
        const updateResponse = await educationAPI.updateContent(editing.content_id, dataToSend);
        console.log('Update response:', updateResponse.data);
      } else {
        const createResponse = await educationAPI.createContent(dataToSend);
        console.log('Create response:', createResponse.data);
      }
      
      // Close form and reset
      setShowForm(false);
      setEditing(null);
      setMediaFile(null);
      setQuizQuestions([{ id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }]);
      setFormData({
        title: '',
        slug: '',
        content_type: 'article',
        content_body: '',
        media_url: '',
        language: 'vi',
        difficulty_level: 'beginner',
        is_published: false
      });
      
      // Refresh content list after a short delay to ensure DB is updated
      setTimeout(() => {
        fetchContent();
      }, 300);
    } catch (err) {
      console.error('Failed to save content:', err);
      const errorMsg = err.response?.data?.error || 'Failed to save content';
      alert(errorMsg);
    }
  };

  const handleEdit = async (item) => {
    try {
      // Use the item directly since we already have all the data from the list
      // The list query includes all necessary fields for editing
      setEditing(item);
      
      // Check if slug is invalid (URL) and auto-fix it
      let slugToUse = item.slug || '';
      const hasInvalidSlug = !slugToUse || 
        slugToUse.includes('://') || 
        slugToUse.startsWith('http') ||
        slugToUse.includes('www.');
      
      if (hasInvalidSlug && item.title) {
        // Auto-generate a valid slug from title
        slugToUse = generateSlug(item.title);
        if (slugToUse) {
          alert(`⚠️ Invalid slug detected. Auto-generated new slug: "${slugToUse}". Please review and save.`);
        }
      }
      
      // Parse quiz questions if content type is quiz
      let questions = [{ id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }];
      if (item.content_type === 'quiz' && item.content_body) {
        try {
          const parsed = typeof item.content_body === 'string' 
            ? JSON.parse(item.content_body) 
            : item.content_body;
          if (Array.isArray(parsed) && parsed.length > 0) {
            questions = parsed.map((q, idx) => ({
              id: q.id || idx + 1,
              question: q.question || '',
              options: q.options || ['', ''],
              correct: q.correct || 0,
              explanation: q.explanation || ''
            }));
          }
        } catch (e) {
          console.error('Failed to parse quiz questions:', e);
        }
      }
      
      setQuizQuestions(questions);
      setMediaFile(null);
      setFormData({
        title: item.title || '',
        slug: slugToUse,
        content_type: item.content_type || 'article',
        content_body: item.content_body || '',
        media_url: item.media_url || '',
        language: item.language || 'vi',
        difficulty_level: item.difficulty_level || 'beginner',
        is_published: item.is_published !== undefined ? item.is_published : false
      });
      setShowForm(true);
    } catch (err) {
      console.error('Failed to prepare edit form:', err);
      alert('Failed to load content for editing');
    }
  };

  const handleDelete = async (contentId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await educationAPI.deleteContent(contentId);
      fetchContent();
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert(err.response?.data?.error || 'Unable to delete content');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setMediaFile(null);
    setQuizQuestions([{ id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }]);
    setFormData({
      title: '',
      slug: '',
      content_type: 'article',
      content_body: '',
      media_url: '',
      language: 'vi',
      difficulty_level: 'beginner',
      is_published: false
    });
  };

  // Quiz Question Editor Component
  const QuizQuestionEditor = ({ questions, setQuestions }) => {
    const addQuestion = () => {
      const newId = Math.max(...questions.map(q => q.id), 0) + 1;
      setQuestions([...questions, { id: newId, question: '', options: ['', ''], correct: 0, explanation: '' }]);
    };

    const removeQuestion = (id) => {
      if (questions.length > 1) {
        setQuestions(questions.filter(q => q.id !== id));
      } else {
        alert('At least one question is required');
      }
    };

    const updateQuestion = (id, field, value) => {
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      ));
    };

    const addOption = (questionId) => {
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...q.options, ''] }
          : q
      ));
    };

    const removeOption = (questionId, optionIndex) => {
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
          // Adjust correct answer if needed
          let newCorrect = q.correct;
          if (newCorrect >= newOptions.length) {
            newCorrect = Math.max(0, newOptions.length - 1);
          }
          return { ...q, options: newOptions, correct: newCorrect };
        }
        return q;
      }));
    };

    const updateOption = (questionId, optionIndex, value) => {
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
            }
          : q
      ));
    };

    return (
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Question {qIdx + 1}</h4>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-blue-100 text-xs font-medium mb-1">Question Text</label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-blue-100 text-xs font-medium mb-2">Answer Options</label>
                {q.options.map((option, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correct === optIdx}
                      onChange={() => updateQuestion(q.id, 'correct', optIdx)}
                      className="w-4 h-4 text-cyan-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(q.id, optIdx)}
                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-all"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(q.id)}
                  className="mt-2 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs transition-all"
                >
                  + Add Option
                </button>
              </div>

              <div>
                <label className="block text-blue-100 text-xs font-medium mb-1">Explanation (optional)</label>
                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(q.id, 'explanation', e.target.value)}
                  placeholder="Explain why this answer is correct..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addQuestion}
          className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl font-medium transition-all border border-cyan-500/30"
        >
          + Add Question
        </button>
      </div>
    );
  };

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
          <span className="text-5xl mb-4 block">🚫</span>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-blue-200/70">Only administrators can manage education content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Education material management</h1>
            <p className="text-blue-200/70">Create, edit and manage educational materials</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all"
          >
            + Create New Content
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editing ? 'Edit Content' : 'Create New Content'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-2">
                      Content Type *
                    </label>
                    <select
                      name="content_type"
                      value={formData.content_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="article" className="bg-slate-800 text-white">Article</option>
                      <option value="video" className="bg-slate-800 text-white">Video</option>
                      <option value="infographic" className="bg-slate-800 text-white">Infographic</option>
                      <option value="quiz" className="bg-slate-800 text-white">Quiz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-2">
                      Language
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
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

                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-2">
                      Difficulty Level
                    </label>
                    <select
                      name="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="beginner" className="bg-slate-800 text-white">Beginner</option>
                      <option value="intermediate" className="bg-slate-800 text-white">Intermediate</option>
                      <option value="advanced" className="bg-slate-800 text-white">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">
                    Media File (Image/Video/PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('File size must be less than 10MB');
                          e.target.value = '';
                          return;
                        }
                        setMediaFile(file);
                        setFormData(prev => ({ ...prev, media_url: '' })); // Clear URL if file is selected
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
                  />
                  {mediaFile && (
                    <p className="text-cyan-400 text-sm mt-2">
                      Selected: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <div className="mt-2">
                    <p className="text-blue-200/50 text-xs mb-2">Or enter URL:</p>
                    <input
                      type="url"
                      name="media_url"
                      value={formData.media_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.png"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                      disabled={!!mediaFile}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-2">
                    Content *
                  </label>
                  {formData.content_type === 'quiz' ? (
                    <QuizQuestionEditor 
                      questions={quizQuestions}
                      setQuestions={setQuizQuestions}
                    />
                  ) : (
                    <textarea
                      name="content_body"
                      value={formData.content_body}
                      onChange={handleInputChange}
                      required
                      rows={15}
                      placeholder="Enter HTML content or text..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    />
                  )}
                  <p className="text-blue-200/50 text-xs mt-2">
                    {formData.content_type === 'quiz' 
                      ? 'Add questions with multiple choice answers. Select the correct answer for each question.'
                      : 'HTML supported for rich formatting'}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <input
                    type="checkbox"
                    name="is_published"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="is_published" className="text-blue-100">
                    <span className="font-semibold">Publish now</span> (display to users)
                    {!formData.is_published && (
                      <span className="block text-amber-300 text-sm mt-1">
                        ⚠️ Unpublished content will not be displayed to regular users
                      </span>
                    )}
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all"
                  >
                    {editing ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-200">Loading...</p>
          </div>
        ) : (
          <>
            {/* Warning for invalid slugs */}
            {content.some((item) => {
              if (!item.slug) return true;
              return item.slug.includes('://') || item.slug.startsWith('http') || item.slug.includes('www.');
            }) && (
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
                <p className="text-amber-200 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Some content has invalid slugs (URLs instead of slugs). These items won't be viewable. Please edit them to fix the slug.
                </p>
              </div>
            )}
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Title</th>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Slug</th>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Type</th>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Language</th>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Status</th>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Views</th>
                      <th className="px-6 py-4 text-left text-blue-100 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {content.map((item) => {
                      const hasInvalidSlug = !item.slug || 
                        item.slug.includes('://') || 
                        item.slug.startsWith('http') ||
                        item.slug.includes('www.');
                      
                      return (
                      <tr key={item.content_id} className={`hover:bg-white/5 ${hasInvalidSlug ? 'bg-red-500/5' : ''}`}>
                        <td className="px-6 py-4 text-white font-medium">
                          {item.title}
                          {hasInvalidSlug && (
                            <span className="ml-2 text-xs text-red-400">⚠️ Invalid slug</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-blue-200 text-sm font-mono">
                          {item.slug ? (
                            <span className={hasInvalidSlug ? 'text-red-400' : ''}>
                              {item.slug.length > 30 ? `${item.slug.substring(0, 30)}...` : item.slug}
                            </span>
                          ) : (
                            <span className="text-gray-500">No slug</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-blue-200">{item.content_type}</td>
                        <td className="px-6 py-4 text-blue-200">{item.language}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.is_published 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-blue-200">{item.view_count || 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.content_id, item.title)}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminEducationPage;
