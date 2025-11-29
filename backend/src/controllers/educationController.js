const { query } = require('../config/database');

/**
 * Get all education content (published only for regular users)
 */
exports.getContent = async (req, res) => {
  try {
    const { content_type, language = 'vi', difficulty_level, limit = 20, offset = 0 } = req.query;
    const userRole = req.user ? req.user.role : null;

    let queryText = `
      SELECT 
        content_id,
        title,
        slug,
        content_type,
        language,
        difficulty_level,
        view_count,
        created_at,
        updated_at
      FROM education_content
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Only show published content to non-admin users
    if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
      queryText += ` AND is_published = TRUE`;
    }

    if (content_type) {
      queryText += ` AND content_type = $${paramCount++}`;
      params.push(content_type);
    }

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
 * Get single education content by slug
 */
exports.getContentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await query(
      'SELECT * FROM education_content WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Content not found'
      });
    }

    // Increment view count
    await query(
      'UPDATE education_content SET view_count = view_count + 1 WHERE slug = $1',
      [slug]
    );

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

    // Validation
    if (!title || !slug || !content_type) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Title, slug, and content_type are required'
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
    `, [title, slug, content_type, content_body, media_url, language, difficulty_level, is_published]);

    res.status(201).json({
      service: 'AnLink API',
      success: true,
      message: 'Education content created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Create education content error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error creating education content'
    });
  }
};

/**
 * Update education content (admin only)
 */
exports.updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const {
      title,
      content_body,
      media_url,
      difficulty_level,
      is_published
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (content_body !== undefined) {
      updates.push(`content_body = $${paramCount++}`);
      values.push(content_body);
    }

    if (media_url !== undefined) {
      updates.push(`media_url = $${paramCount++}`);
      values.push(media_url);
    }

    if (difficulty_level) {
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
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error updating education content'
    });
  }
};

/**
 * Delete education content (admin only)
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