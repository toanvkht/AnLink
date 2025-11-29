const { query } = require('../config/database');
const { parseURL, isValidURL } = require('../algorithms/urlParser');

/**
 * Submit a new phishing report (supports anonymous reports)
 */
exports.submitReport = async (req, res) => {
  try {
    const { url, report_reason, incident_description, evidence_urls, reporter_email } = req.body;
    // User can be null for anonymous reports
    const userId = req.user?.userId || null;
    const isAnonymous = !userId;

    // Validation
    if (!url || !report_reason) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'URL and report reason are required'
      });
    }

    if (!isValidURL(url)) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Parse URL
    const components = parseURL(url);

    // Check if URL exists, if not create it
    let urlRecord = await query(
      'SELECT url_id FROM suspicious_urls WHERE url_hash = $1',
      [components.url_hash]
    );

    let urlId;

    if (urlRecord.rows.length > 0) {
      urlId = urlRecord.rows[0].url_id;
    } else {
      const insertResult = await query(`
        INSERT INTO suspicious_urls 
        (original_url, normalized_url, url_hash, scheme, domain, subdomain, path, query_params, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING url_id
      `, [
        components.original_url,
        components.normalized_url,
        components.url_hash,
        components.scheme,
        components.domain,
        components.subdomain || null,
        components.path,
        components.query || null
      ]);
      urlId = insertResult.rows[0].url_id;
    }

    // Check for duplicate reports from same user (only if authenticated)
    if (userId) {
      const duplicateCheck = await query(`
        SELECT report_id FROM reports 
        WHERE url_id = $1 AND reported_by = $2 AND status NOT IN ('rejected', 'duplicate')
      `, [urlId, userId]);

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          service: 'AnLink API',
          success: false,
          error: 'You have already reported this URL',
          existing_report_id: duplicateCheck.rows[0].report_id
        });
      }
    }

    // Insert report (reported_by can be NULL for anonymous)
    const reportResult = await query(`
      INSERT INTO reports 
      (url_id, reported_by, report_reason, incident_description, evidence_urls, status, priority, reporter_email)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
      RETURNING report_id, reported_at
    `, [
      urlId,
      userId, // NULL for anonymous
      report_reason,
      incident_description || null,
      evidence_urls ? JSON.stringify(evidence_urls) : null,
      isAnonymous ? 'low' : 'medium', // Anonymous reports start with lower priority
      isAnonymous ? (reporter_email || null) : null // Optional email for anonymous reporters
    ]);

    const reportId = reportResult.rows[0].report_id;

    // Log activity (only if authenticated)
    if (userId) {
      await query(`
        INSERT INTO user_activity_logs (user_id, action_type, action_details)
        VALUES ($1, 'report', $2)
      `, [userId, JSON.stringify({ report_id: reportId, url: components.original_url })]);
    }

    res.status(201).json({
      service: 'AnLink API',
      success: true,
      message: isAnonymous 
        ? 'Anonymous report submitted successfully. Thank you for helping keep the web safe!'
        : 'Report submitted successfully',
      data: {
        report_id: reportId,
        url: components.original_url,
        status: 'pending',
        reported_at: reportResult.rows[0].reported_at,
        anonymous: isAnonymous
      }
    });

  } catch (error) {
    console.error('❌ Submit report error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error message
    let errorMessage = 'Error submitting report';
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      errorMessage = 'Database schema error. Please run the migration script: database/add_reporter_email.sql';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: errorMessage
    });
  }
};

/**
 * Get all reports (with filtering)
 */
exports.getReports = async (req, res) => {
  try {
    const { status, priority, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        r.report_id,
        r.reported_at,
        r.status,
        r.priority,
        r.report_reason,
        su.original_url,
        su.domain,
        u.full_name as reporter_name,
        u.email as reporter_email,
        r.reporter_email as anonymous_reporter_email,
        COUNT(cf.feedback_id) as feedback_count
      FROM reports r
      JOIN suspicious_urls su ON r.url_id = su.url_id
      LEFT JOIN users u ON r.reported_by = u.user_id
      LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND r.status = $${paramCount++}`;
      params.push(status);
    }

    if (priority) {
      queryText += ` AND r.priority = $${paramCount++}`;
      params.push(priority);
    }

    queryText += `
      GROUP BY r.report_id, su.original_url, su.domain, u.full_name, u.email, r.reporter_email
      ORDER BY r.priority DESC, r.reported_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM reports WHERE 1=1';
    const countParams = [];
    let countParamNum = 1;

    if (status) {
      countQuery += ` AND status = $${countParamNum++}`;
      countParams.push(status);
    }

    if (priority) {
      countQuery += ` AND priority = $${countParamNum++}`;
      countParams.push(priority);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching reports'
    });
  }
};

/**
 * Get single report details
 */
exports.getReportDetails = async (req, res) => {
  try {
    const { reportId } = req.params;
    // User can be null for anonymous access
    const userId = req.user?.userId || null;
    const userRole = req.user?.role || null;

    // Get report details
    const reportResult = await query(`
      SELECT 
        r.*,
        su.original_url,
        su.normalized_url,
        su.domain,
        su.subdomain,
        su.path,
        u.full_name as reporter_name,
        u.email as reporter_email,
        r.reporter_email as anonymous_reporter_email,
        reviewer.full_name as reviewer_name,
        assigned.full_name as assigned_name
      FROM reports r
      JOIN suspicious_urls su ON r.url_id = su.url_id
      LEFT JOIN users u ON r.reported_by = u.user_id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.user_id
      LEFT JOIN users assigned ON r.assigned_to = assigned.user_id
      WHERE r.report_id = $1
    `, [reportId]);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Report not found'
      });
    }

    const report = reportResult.rows[0];

    // Check permissions (only if user is authenticated and is a regular user)
    if (userId && userRole === 'community_user' && report.reported_by !== userId) {
      return res.status(403).json({
        service: 'AnLink API',
        success: false,
        error: 'You can only view your own reports'
      });
    }

    // Get community feedback
    const feedbackResult = await query(`
      SELECT 
        cf.*,
        u.full_name,
        u.email
      FROM community_feedback cf
      JOIN users u ON cf.user_id = u.user_id
      WHERE cf.report_id = $1
      ORDER BY cf.created_at DESC
    `, [reportId]);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        report: report,
        feedback: feedbackResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Get report details error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching report details'
    });
  }
};

/**
 * Get user's own reports
 */
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT 
        r.report_id,
        r.reported_at,
        r.status,
        r.priority,
        r.report_reason,
        su.original_url,
        su.domain,
        COUNT(cf.feedback_id) as feedback_count
      FROM reports r
      JOIN suspicious_urls su ON r.url_id = su.url_id
      LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
      WHERE r.reported_by = $1
      GROUP BY r.report_id, su.original_url, su.domain
      ORDER BY r.reported_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await query(
      'SELECT COUNT(*) as total FROM reports WHERE reported_by = $1',
      [userId]
    );

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        reports: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get my reports error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching your reports'
    });
  }
};

/**
 * Update report (moderator/admin only)
 */
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, priority, assigned_to, review_notes } = req.body;
    const userId = req.user.userId;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (priority) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(assigned_to);
    }

    if (review_notes) {
      updates.push(`review_notes = $${paramCount++}`);
      values.push(review_notes);
    }

    if (status === 'confirmed' || status === 'rejected') {
      updates.push(`reviewed_by = $${paramCount++}`);
      values.push(userId);
      updates.push(`reviewed_at = CURRENT_TIMESTAMP`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(reportId);

    const result = await query(`
      UPDATE reports 
      SET ${updates.join(', ')}
      WHERE report_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Report not found'
      });
    }

    // If confirmed, add to known_phishing_urls
    if (status === 'confirmed') {
      const reportData = result.rows[0];
      
      await query(`
        INSERT INTO known_phishing_urls 
        (url_id, domain_pattern, severity, phishing_type, confirmed_by, active)
        SELECT 
          $1,
          domain,
          'high',
          'user_reported',
          $2,
          TRUE
        FROM suspicious_urls
        WHERE url_id = $1
        ON CONFLICT DO NOTHING
      `, [reportData.url_id, userId]);

      // Update suspicious_urls status
      await query(
        "UPDATE suspicious_urls SET status = 'confirmed_phishing' WHERE url_id = $1",
        [reportData.url_id]
      );
    }

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'update_report', $2)
    `, [userId, JSON.stringify({ report_id: reportId, status, priority })]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Report updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Update report error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error updating report'
    });
  }
};