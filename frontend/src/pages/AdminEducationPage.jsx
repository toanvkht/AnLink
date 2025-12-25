/**
 * AdminEducationPage Component
 * 
 * Admin interface for managing educational content. Allows admins to:
 * - Create, edit, and delete educational materials
 * - Upload media files (images, videos, PDFs)
 * - Create and manage quiz content with interactive question editor
 * - Manage content types: articles, videos, infographics, quizzes
 * 
 * @component
 */
import React, { useState, useEffect } from 'react';
import { educationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Block-based Content Editor Component
 * 
 * Allows creating structured content with different block types
 * @component
 * @param {Array} blocks - Array of content blocks
 * @param {Function} setBlocks - Function to update blocks
 */
const BlockEditor = ({ blocks, setBlocks }) => {
  const addBlock = (type) => {
    const newId = Math.max(...blocks.map(b => b.id), 0) + 1;
    const newBlock = { id: newId, type, content: '' };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id, content) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  const moveBlock = (id, direction) => {
    const index = blocks.findIndex(b => b.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < blocks.length - 1)) {
      const newBlocks = [...blocks];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const getBlockIcon = (type) => {
    switch (type) {
      case 'heading': return '📌';
      case 'subheading': return '📍';
      case 'paragraph': return '📝';
      case 'list': return '📋';
      case 'callout': return '💡';
      case 'warning': return '⚠️';
      default: return '📄';
    }
  };

  const getBlockPlaceholder = (type) => {
    switch (type) {
      case 'heading': return 'Enter main section heading (e.g., "1. URL Inspection")';
      case 'subheading': return 'Enter subsection heading';
      case 'paragraph': return 'Enter paragraph text...';
      case 'list': return 'Enter list items (one per line)';
      case 'callout': return 'Enter helpful tip or important information...';
      case 'warning': return 'Enter warning or caution message...';
      default: return 'Enter content...';
    }
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <div key={block.id} className="bg-slate-800/60 rounded-lg border-2 border-slate-700/50 p-4 hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getBlockIcon(block.type)}</span>
              <span className="text-xs font-medium text-blue-200/70 uppercase tracking-wide">
                {block.type}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveBlock(block.id, 'up')}
                disabled={index === 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed text-blue-200"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveBlock(block.id, 'down')}
                disabled={index === blocks.length - 1}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed text-blue-200"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                title="Remove block"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            placeholder={getBlockPlaceholder(block.type)}
            rows={block.type === 'heading' || block.type === 'subheading' ? 2 : 4}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/30 rounded-lg text-white placeholder-blue-200/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 resize-none"
          />
        </div>
      ))}

      {/* Add Block Buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => addBlock('heading')}
          className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-all"
        >
          + Heading
        </button>
        <button
          type="button"
          onClick={() => addBlock('subheading')}
          className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-all"
        >
          + Subheading
        </button>
        <button
          type="button"
          onClick={() => addBlock('paragraph')}
          className="px-3 py-2 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 text-slate-300 rounded-lg text-xs font-medium transition-all"
        >
          + Paragraph
        </button>
        <button
          type="button"
          onClick={() => addBlock('list')}
          className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition-all"
        >
          + List
        </button>
        <button
          type="button"
          onClick={() => addBlock('callout')}
          className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-all"
        >
          + Callout
        </button>
        <button
          type="button"
          onClick={() => addBlock('warning')}
          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-all"
        >
          + Warning
        </button>
      </div>
    </div>
  );
};

/**
 * Quiz Question Editor Component
 * 
 * Interactive editor for creating and managing quiz questions
 * Allows adding/removing questions and options, setting correct answers
 * 
 * @component
 * @param {Array} questions - Array of question objects
 * @param {Function} setQuestions - Function to update questions array
 */
const QuizQuestionEditor = ({ questions, setQuestions }) => {
  /**
   * Adds a new question to the quiz
   */
  const addQuestion = () => {
    const newId = Math.max(...questions.map(q => q.id), 0) + 1;
    setQuestions([...questions, { id: newId, question: '', options: ['', ''], correct: 0, explanation: '' }]);
  };

  /**
   * Removes a question from the quiz
   * @param {number} id - Question ID to remove
   */
  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    } else {
      alert('At least one question is required');
    }
  };

  /**
   * Updates a question field
   * @param {number} id - Question ID
   * @param {string} field - Field name to update
   * @param {*} value - New value
   */
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  /**
   * Adds an option to a question
   * @param {number} questionId - Question ID
   */
  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ''] }
        : q
    ));
  };

  /**
   * Removes an option from a question
   * Adjusts correct answer index if needed
   * @param {number} questionId - Question ID
   * @param {number} optionIndex - Option index to remove
   */
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

  /**
   * Updates an option value
   * @param {number} questionId - Question ID
   * @param {number} optionIndex - Option index
   * @param {string} value - New option value
   */
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
              <label className="block text-blue-100 text-xs font-medium mb-1">Question text</label>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                placeholder="Enter your question..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-blue-100 text-xs font-medium mb-2">Answer options</label>
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
                + Add option
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
        + Add question
      </button>
    </div>
  );
};

const AdminEducationPage = () => {
  const { user } = useAuth();
  
  // State management
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [contentBlocks, setContentBlocks] = useState([
    { id: 1, type: 'paragraph', content: '' }
  ]);
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

  // Fetch content on component mount
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.content_type]);

  /**
   * Fetches all education content from the API
   */
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

  /**
   * Handles input field changes
   * @param {Event} e - Input change event
   */
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

  /**
   * Generates a URL-friendly slug from a title
   * Removes URLs, normalizes text, and creates a clean slug
   * @param {string} title - Title to convert to slug
   * @returns {string} Generated slug
   */
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

  /**
   * Converts content blocks to HTML
   */
  const blocksToHTML = (blocks) => {
    return blocks.map(block => {
      const content = block.content.trim();
      if (!content) return '';
      
      switch (block.type) {
        case 'heading':
          return `<h2>${content}</h2>`;
        case 'subheading':
          return `<h3>${content}</h3>`;
        case 'paragraph':
          return `<p>${content}</p>`;
        case 'list':
          const items = content.split('\n').filter(item => item.trim());
          return `<ol>${items.map(item => `<li>${item.trim()}</li>`).join('')}</ol>`;
        case 'callout':
          return `<blockquote class="callout">${content}</blockquote>`;
        case 'warning':
          return `<blockquote class="warning">⚠️ ${content}</blockquote>`;
        default:
          return `<p>${content}</p>`;
      }
    }).filter(html => html).join('\n\n');
  };

  /**
   * Parses HTML to content blocks (simple parser)
   */
  const htmlToBlocks = (html) => {
    if (!html) return [{ id: 1, type: 'paragraph', content: '' }];
    
    const blocks = [];
    let id = 1;
    
    // Simple parsing - split by tags
    const parts = html.split(/(<h2>|<\/h2>|<h3>|<\/h3>|<p>|<\/p>|<ol>|<\/ol>|<blockquote[^>]*>|<\/blockquote>)/);
    let currentType = null;
    let buffer = '';
    
    for (const part of parts) {
      if (part === '<h2>') currentType = 'heading';
      else if (part === '</h2>' && currentType === 'heading') {
        blocks.push({ id: id++, type: 'heading', content: buffer.trim() });
        buffer = '';
        currentType = null;
      }
      else if (part === '<h3>') currentType = 'subheading';
      else if (part === '</h3>' && currentType === 'subheading') {
        blocks.push({ id: id++, type: 'subheading', content: buffer.trim() });
        buffer = '';
        currentType = null;
      }
      else if (part === '<p>') currentType = 'paragraph';
      else if (part === '</p>' && currentType === 'paragraph') {
        blocks.push({ id: id++, type: 'paragraph', content: buffer.trim() });
        buffer = '';
        currentType = null;
      }
      else if (part.startsWith('<blockquote')) {
        currentType = part.includes('warning') ? 'warning' : 'callout';
      }
      else if (part === '</blockquote>') {
        const content = buffer.replace(/^⚠️\s*/, '').trim();
        blocks.push({ id: id++, type: currentType, content });
        buffer = '';
        currentType = null;
      }
      else if (currentType) {
        buffer += part;
      }
    }
    
    return blocks.length > 0 ? blocks : [{ id: 1, type: 'paragraph', content: '' }];
  };

  /**
   * Handles title input changes and auto-generates slug
   * @param {Event} e - Input change event
   */
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  /**
   * Handles form submission for creating or updating content
   * @param {Event} e - Form submit event
   */
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
      
      // Prepare content_body - for quiz, use quizQuestions JSON; for other types, convert blocks to HTML
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
      } else {
        // For article and video types, convert blocks to HTML
        contentBody = blocksToHTML(contentBlocks);
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

  /**
   * Prepares the edit form with content data
   * Auto-fixes invalid slugs and parses quiz questions
   * @param {Object} item - Content item to edit
   */
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
      
      // Parse HTML content back to blocks for non-quiz types
      if (item.content_type !== 'quiz' && item.content_body) {
        setContentBlocks(htmlToBlocks(item.content_body));
      } else {
        setContentBlocks([{ id: 1, type: 'paragraph', content: '' }]);
      }
      
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

  /**
   * Deletes a content item after confirmation
   * @param {string} contentId - Content ID to delete
   * @param {string} title - Content title for confirmation message
   */
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

  /**
   * Cancels the form and resets all form state
   */
  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setMediaFile(null);
    setPreviewMode(false);
    setMetadataCollapsed(false);
    setContentBlocks([{ id: 1, type: 'paragraph', content: '' }]);
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

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
          <span className="text-5xl mb-4 block">🚫</span>
          <h1 className="text-2xl font-bold text-white mb-4">Access denied</h1>
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
            onClick={() => {
              setShowForm(true);
              setContentBlocks([{ id: 1, type: 'paragraph', content: '' }]);
              setQuizQuestions([{ id: 1, question: '', options: ['', ''], correct: 0, explanation: '' }]);
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all"
          >
            + Create new content
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editing ? 'Edit content' : 'Create new content'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Metadata Section - Collapsible */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMetadataCollapsed(!metadataCollapsed)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div className="text-left">
                        <h3 className="text-white font-semibold">Content Metadata</h3>
                        <p className="text-blue-200/60 text-sm">
                          {metadataCollapsed 
                            ? `${formData.title || 'Untitled'} • ${formData.content_type} • ${formData.language}`
                            : 'Basic information and settings'}
                        </p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-blue-200 transition-transform ${metadataCollapsed ? '' : 'rotate-180'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {!metadataCollapsed && (
                    <div className="px-6 pb-6 space-y-4">
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
                            Content type *
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
                            Difficulty level
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
                          Media file (image/video/PDF)
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
                            placeholder="https://example.com/image.png or YouTube URL"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                            disabled={!!mediaFile}
                          />
                        </div>
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
                    </div>
                  )}
                </div>

                {/* Content Editor Section - Visually Dominant */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border-2 border-cyan-500/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-xl">✍️</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Content Editor</h3>
                        <p className="text-blue-200/70 text-sm">
                          {formData.content_type === 'quiz' 
                            ? 'Create interactive quiz questions' 
                            : 'Write your educational content here'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Edit/Preview Toggle - Only for non-quiz content */}
                    {formData.content_type !== 'quiz' && (
                      <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewMode(false)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            !previewMode
                              ? 'bg-cyan-500 text-white shadow-lg'
                              : 'text-blue-200 hover:text-white'
                          }`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode(true)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            previewMode
                              ? 'bg-cyan-500 text-white shadow-lg'
                              : 'text-blue-200 hover:text-white'
                          }`}
                        >
                          👁️ Preview
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {formData.content_type === 'quiz' ? (
                    <QuizQuestionEditor 
                      questions={quizQuestions}
                      setQuestions={setQuizQuestions}
                    />
                  ) : (
                    <div className="space-y-3">
                      {!previewMode ? (
                        <BlockEditor 
                          blocks={contentBlocks}
                          setBlocks={setContentBlocks}
                        />
                      ) : (
                        <div className="bg-slate-800/80 border-2 border-cyan-500/20 rounded-xl p-6 min-h-[500px]">
                          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                            <h4 className="text-cyan-400 text-sm font-semibold mb-4 flex items-center gap-2">
                              <span>👁️</span>
                              Preview - How users will see this content
                            </h4>
                            {contentBlocks.some(b => b.content.trim()) ? (
                              <div 
                                className="education-content max-w-none"
                                dangerouslySetInnerHTML={{ __html: blocksToHTML(contentBlocks) }}
                              />
                            ) : (
                              <p className="text-blue-200/50 text-center py-12">No content to preview. Start typing in Edit mode to see preview.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-blue-200/50 text-xs mt-3">
                    {formData.content_type === 'quiz' 
                      ? '💡 Tip: Add detailed explanations to help users learn from their mistakes'
                      : '💡 Tip: Use numbered lists for step-by-step instructions'}
                  </p>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {editing ? '✓ Update Content' : '✓ Create Content'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content list */}
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
