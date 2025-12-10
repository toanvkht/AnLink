/**
 * Education Controller
 * 
 * Handles all education-related API endpoints including:
 * - Content CRUD operations
 * - Quiz submission and attempts
 * - Content filtering and access control
 * 
 * @module controllers/educationController
 */
const { query } = require('../config/database');

/**
 * Get all education content
 * Published content only for regular users, all content for admins/moderators
 * 
 * @route GET /api/education
 * @param {string} content_type - Filter by content type (article, video, infographic, quiz)
 * @param {string} language - Filter by language (vi, en)
 * @param {string} difficulty_level - Filter by difficulty (beginner, intermediate, advanced)
 * @param {number} limit - Number of results to return
 * @param {number} offset - Pagination offset
 * @returns {Object} Education content array with pagination
 */
exports.getContent = async (req, res) => {
  try {
    const { content_type, language, difficulty_level, limit = 20, offset = 0 } = req.query;
    const userRole = req.user?.role || null;
    
    // Debug logging
    console.log('Education getContent - userRole:', userRole, 'language param:', language);

    let queryText = `
      SELECT 
        content_id,
        title,
        slug,
        content_type,
        content_body,
        media_url,
        language,
        difficulty_level,
        view_count,
        created_at,
        updated_at,
        is_published
      FROM education_content
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Only show published content to non-admin users
    const isAdminOrModerator = userRole === 'admin' || userRole === 'moderator';
    
    if (!isAdminOrModerator) {
      queryText += ` AND is_published = TRUE`;
      // For non-admin users, default to 'vi' language if not specified
      if (!language) {
        queryText += ` AND language = $${paramCount++}`;
        params.push('vi');
      }
    }

    if (content_type) {
      queryText += ` AND content_type = $${paramCount++}`;
      params.push(content_type);
    }

    // Only apply language filter if explicitly provided
    // Admins and moderators can see all languages by not specifying language
    if (language) {
      queryText += ` AND language = $${paramCount++}`;
      params.push(language);
    }

    if (difficulty_level) {
      queryText += ` AND difficulty_level = $${paramCount++}`;
      params.push(difficulty_level);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        content: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get education content error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching education content'
    });
  }
};

/**
 * Get single education content by ID (admin only)
 * Used for editing content in admin panel
 * 
 * @route GET /api/education/id/:contentId
 * @param {string} contentId - Content ID
 * @returns {Object} Education content details
 */
exports.getContentById = async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await query(
      'SELECT * FROM education_content WHERE content_id = $1',
      [contentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      service: 'AnLink API',
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Get content by ID error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching content'
    });
  }
};

/**
 * Get single education content by slug
 * Admins and moderators can view unpublished content
 * 
 * @route GET /api/education/:slug
 * @param {string} slug - Content slug (URL-friendly identifier)
 * @returns {Object} Education content details
 */
exports.getContentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userRole = req.user?.role || null;
    const isAdminOrModerator = userRole === 'admin' || userRole === 'moderator';

    console.log('GetContentBySlug - slug:', slug, 'userRole:', userRole, 'isAdminOrModerator:', isAdminOrModerator);

    let queryText = 'SELECT * FROM education_content WHERE slug = $1';
    
    // Only show published content to non-admin users
    if (!isAdminOrModerator) {
      queryText += ' AND is_published = TRUE';
    }

    console.log('Query:', queryText, 'Params:', [slug]);

    const result = await query(queryText, [slug]);
    
    console.log('Query result rows:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Content not found'
      });
    }

    // Increment view count (only for published content viewed by non-admins)
    if (!isAdminOrModerator) {
      await query(
        'UPDATE education_content SET view_count = view_count + 1 WHERE slug = $1',
        [slug]
      );
    }

    res.json({
      service: 'AnLink API',
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Get content by slug error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching content'
    });
  }
};

/**
 * Create new education content (admin only)
 * Supports file uploads for media files
 * 
 * @route POST /api/education
 * @param {string} title - Content title
 * @param {string} slug - URL-friendly slug (auto-generated if not provided)
 * @param {string} content_type - Type: article, video, infographic, quiz
 * @param {string} content_body - Content body (HTML or JSON for quizzes)
 * @param {File} media_file - Optional uploaded media file
 * @param {string} media_url - Optional media URL (if no file uploaded)
 * @param {string} language - Language code (vi, en)
 * @param {string} difficulty_level - Difficulty: beginner, intermediate, advanced
 * @param {boolean} is_published - Whether content is published
 * @returns {Object} Created content object
 */
exports.createContent = async (req, res) => {
  try {
    const {
      title,
      slug,
      content_type,
      content_body,
      media_url,
      language = 'vi',
      difficulty_level = 'beginner',
      is_published = false
    } = req.body;

    // Handle file upload
    let finalMediaUrl = media_url;
    if (req.file) {
      // File was uploaded - use the uploaded file URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      finalMediaUrl = `${baseUrl}/uploads/education/${req.file.filename}`;
    }

    // Validation
    if (!title || !slug || !content_type) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Title, slug, and content_type are required'
      });
    }

    // Validate slug format - cannot be a URL
    if (slug.includes('://') || slug.startsWith('http') || slug.includes('www.')) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid slug. Slug cannot be a URL. It should be a URL-friendly string (e.g., "my-article-title")'
      });
    }

    // Validate slug length and characters
    if (slug.length > 255 || slug.length < 1) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Slug must be between 1 and 255 characters'
      });
    }

    // Check if slug already exists
    const existingSlug = await query(
      'SELECT content_id FROM education_content WHERE slug = $1',
      [slug]
    );

    if (existingSlug.rows.length > 0) {
      return res.status(409).json({
        service: 'AnLink API',
        success: false,
        error: 'Content with this slug already exists'
      });
    }

    const result = await query(`
      INSERT INTO education_content 
      (title, slug, content_type, content_body, media_url, language, difficulty_level, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, slug, content_type, content_body, finalMediaUrl, language, difficulty_level, is_published]);

    res.status(201).json({
      service: 'AnLink API',
      success: true,
      message: 'Education content created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Create education content error:', error);
    
    // If multer error (file upload)
    if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          service: 'AnLink API',
          success: false,
          error: 'File size too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'File upload error: ' + error.message
      });
    }
    
    // If file filter error
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error creating education content',
      details: error.message
    });
  }
};

/**
 * Update education content (admin only)
 * Supports file uploads for media files
 * 
 * @route PUT /api/education/:contentId
 * @param {string} contentId - Content ID to update
 * @param {Object} body - Fields to update (same as createContent)
 * @returns {Object} Updated content object
 */
exports.updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const {
      title,
      slug,
      content_type,
      content_body,
      media_url,
      language,
      difficulty_level,
      is_published
    } = req.body;

    // Handle file upload
    let finalMediaUrl = media_url;
    if (req.file) {
      // File was uploaded - use the uploaded file URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      finalMediaUrl = `${baseUrl}/uploads/education/${req.file.filename}`;
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined && title !== null && title !== '') {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (slug !== undefined && slug !== null && slug !== '') {
      // Validate slug format - cannot be a URL
      if (slug.includes('://') || slug.startsWith('http') || slug.includes('www.')) {
        return res.status(400).json({
          service: 'AnLink API',
          success: false,
          error: 'Invalid slug. Slug cannot be a URL. It should be a URL-friendly string (e.g., "my-article-title")'
        });
      }

      // Validate slug length
      if (slug.length > 255 || slug.length < 1) {
        return res.status(400).json({
          service: 'AnLink API',
          success: false,
          error: 'Slug must be between 1 and 255 characters'
        });
      }

      // Check if slug already exists (excluding current content)
      const existingSlug = await query(
        'SELECT content_id FROM education_content WHERE slug = $1 AND content_id != $2',
        [slug, contentId]
      );

      if (existingSlug.rows.length > 0) {
        return res.status(409).json({
          service: 'AnLink API',
          success: false,
          error: 'Content with this slug already exists'
        });
      }

      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }

    if (content_type) {
      updates.push(`content_type = $${paramCount++}`);
      values.push(content_type);
    }

    if (content_body !== undefined) {
      updates.push(`content_body = $${paramCount++}`);
      values.push(content_body);
    }

    if (finalMediaUrl !== undefined) {
      updates.push(`media_url = $${paramCount++}`);
      values.push(finalMediaUrl);
    } else if (media_url !== undefined) {
      updates.push(`media_url = $${paramCount++}`);
      values.push(media_url);
    }

    if (language !== undefined && language !== null) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (difficulty_level !== undefined && difficulty_level !== null) {
      updates.push(`difficulty_level = $${paramCount++}`);
      values.push(difficulty_level);
    }

    if (is_published !== undefined) {
      updates.push(`is_published = $${paramCount++}`);
      values.push(is_published);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'No fields to update'
      });
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(contentId);

    const result = await query(`
      UPDATE education_content 
      SET ${updates.join(', ')}
      WHERE content_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Education content updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Update education content error:', error);
    
    // If multer error (file upload)
    if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          service: 'AnLink API',
          success: false,
          error: 'File size too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'File upload error: ' + error.message
      });
    }
    
    // If file filter error
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error updating education content',
      details: error.message
    });
  }
};

/**
 * Delete education content (admin only)
 * 
 * @route DELETE /api/education/:contentId
 * @param {string} contentId - Content ID to delete
 * @returns {Object} Success message
 */
exports.deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await query(
      'DELETE FROM education_content WHERE content_id = $1 RETURNING title',
      [contentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Education content deleted successfully',
      data: {
        deleted_title: result.rows[0].title
      }
    });

  } catch (error) {
    console.error('❌ Delete education content error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error deleting education content'
    });
  }
};

/**
 * Submit quiz attempt
 * Allows anonymous submissions (userId can be null)
 * 
 * @route POST /api/education/quiz/submit
 * @param {string} content_id - Quiz content ID
 * @param {number} score - Score achieved
 * @param {number} max_score - Maximum possible score
 * @param {number} time_taken_seconds - Time taken in seconds
 * @param {Object} answers - User answers (JSON)
 * @returns {Object} Created quiz attempt record
 */
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { content_id, score, max_score, time_taken_seconds, answers } = req.body;
    const userId = req.user?.userId || null;

    // Validation
    if (!content_id || score === undefined || !max_score) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'content_id, score, and max_score are required'
      });
    }

    // Verify content exists and is a quiz
    const contentCheck = await query(
      'SELECT content_id, content_type FROM education_content WHERE content_id = $1',
      [content_id]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Quiz not found'
      });
    }

    if (contentCheck.rows[0].content_type !== 'quiz') {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Content is not a quiz'
      });
    }

    // Insert quiz attempt (user_id can be null for anonymous)
    const result = await query(`
      INSERT INTO quiz_attempts 
      (user_id, content_id, score, max_score, time_taken_seconds, answers)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING attempt_id, completed_at
    `, [
      userId,
      content_id,
      score,
      max_score,
      time_taken_seconds || null,
      answers ? JSON.stringify(answers) : null
    ]);

    res.status(201).json({
      service: 'AnLink API',
      success: true,
      message: 'Quiz attempt submitted successfully',
      data: {
        attempt_id: result.rows[0].attempt_id,
        score,
        max_score,
        percentage: Math.round((score / max_score) * 100),
        completed_at: result.rows[0].completed_at
      }
    });

  } catch (error) {
    console.error('❌ Submit quiz attempt error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error submitting quiz attempt'
    });
  }
};

/**
 * Get user's quiz attempts
 * Returns all quiz attempts for the authenticated user
 * 
 * @route GET /api/education/quiz/attempts
 * @param {number} limit - Number of results to return
 * @param {number} offset - Pagination offset
 * @returns {Object} Quiz attempts array with pagination
 */
exports.getQuizAttempts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(`
      SELECT 
        qa.*,
        ec.title as quiz_title,
        ec.slug as quiz_slug
      FROM quiz_attempts qa
      JOIN education_content ec ON qa.content_id = ec.content_id
      WHERE qa.user_id = $1
      ORDER BY qa.completed_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await query(
      'SELECT COUNT(*) as total FROM quiz_attempts WHERE user_id = $1',
      [userId]
    );

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        attempts: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get quiz attempts error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching quiz attempts'
    });
  }
};