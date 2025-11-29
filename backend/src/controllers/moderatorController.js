const { query } = require('../config/database');

/**
 * Get moderator dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Pending reports count
    const pendingResult = await query(
      "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"
    );

    // Under review count
    const reviewingResult = await query(
      "SELECT COUNT(*) as count FROM reports WHERE status = 'under_review'"
    );

    // Assigned to me (current moderator)
    const assignedResult = await query(
      "SELECT COUNT(*) as count FROM reports WHERE assigned_to = $1 AND status NOT IN ('confirmed', 'rejected')",
      [req.user.userId]
    );

    // Reports by priority
    const priorityResult = await query(`
      SELECT priority, COUNT(*) as count 
      FROM reports 
      WHERE status IN ('pending', 'under_review')
      GROUP BY priority
    `);

    const priorityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    priorityResult.rows.forEach(row => {
      priorityBreakdown[row.priority] = parseInt(row.count);
    });

    // Recent activity (last 7 days)
    const activityResult = await query(`
      SELECT 
        DATE(reported_at) as date,
        COUNT(*) as reports_count
      FROM reports
      WHERE reported_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(reported_at)
      ORDER BY date DESC
    `);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        pending_reports: parseInt(pendingResult.rows[0].count),
        under_review: parseInt(reviewingResult.rows[0].count),
        assigned_to_me: parseInt(assignedResult.rows[0].count),
        priority_breakdown: priorityBreakdown,
        recent_activity: activityResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Get moderator dashboard error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching dashboard statistics'
    });
  }
};

/**
 * Get moderation queue (pending and under_review reports)
 */
exports.getQueue = async (req, res) => {
  try {
    const { priority, assigned_to_me, limit = 50, offset = 0 } = req.query;
    const userId = req.user.userId;

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
        assigned.full_name as assigned_name,
        COUNT(cf.feedback_id) as feedback_count,
        SUM(CASE WHEN cf.feedback_type = 'vote_phishing' THEN 1 ELSE 0 END) as phishing_votes,
        SUM(CASE WHEN cf.feedback_type = 'vote_safe' THEN 1 ELSE 0 END) as safe_votes
      FROM reports r
      JOIN suspicious_urls su ON r.url_id = su.url_id
      JOIN users u ON r.reported_by = u.user_id
      LEFT JOIN users assigned ON r.assigned_to = assigned.user_id
      LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
      WHERE r.status IN ('pending', 'under_review')
    `;

    const params = [];
    let paramCount = 1;

    if (priority) {
      queryText += ` AND r.priority = $${paramCount++}`;
      params.push(priority);
    }

    if (assigned_to_me === 'true') {
      queryText += ` AND r.assigned_to = $${paramCount++}`;
      params.push(userId);
    }

    queryText += `
      GROUP BY r.report_id, su.original_url, su.domain, u.full_name, assigned.full_name
      ORDER BY 
        CASE r.priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        r.reported_at ASC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM reports WHERE status IN ('pending', 'under_review')";
    const countParams = [];
    let countParamNum = 1;

    if (priority) {
      countQuery += ` AND priority = $${countParamNum++}`;
      countParams.push(priority);
    }

    if (assigned_to_me === 'true') {
      countQuery += ` AND assigned_to = $${countParamNum++}`;
      countParams.push(userId);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        queue: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get moderation queue error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching moderation queue'
    });
  }
};

/**
 * Assign report to moderator
 */
exports.assignReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { assigned_to } = req.body;
    const userId = req.user.userId;

    // If no assigned_to specified, assign to self
    const assigneeId = assigned_to || userId;

    // Verify assignee is a moderator or admin
    const userCheck = await query(
      "SELECT role FROM users WHERE user_id = $1 AND role IN ('moderator', 'admin')",
      [assigneeId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Can only assign to moderators or admins'
      });
    }

    const result = await query(`
      UPDATE reports 
      SET assigned_to = $1, status = 'under_review'
      WHERE report_id = $2
      RETURNING *
    `, [assigneeId, reportId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Report not found'
      });
    }

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'assign_report', $2)
    `, [userId, JSON.stringify({ report_id: reportId, assigned_to: assigneeId })]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Report assigned successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Assign report error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error assigning report'
    });
  }
};

/**
 * Confirm report as phishing
 */
exports.confirmPhishing = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { severity = 'high', phishing_type = 'user_reported', notes } = req.body;
    const userId = req.user.userId;

    console.log('🔍 Confirming phishing:', { reportId, severity, phishing_type, userId });

    // Get report details
    const reportResult = await query(
      'SELECT url_id, status FROM reports WHERE report_id = $1',
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Report not found'
      });
    }

    const urlId = reportResult.rows[0].url_id;
    console.log('✅ Report found, URL ID:', urlId);

    // Update report status
    await query(`
      UPDATE reports 
      SET status = 'confirmed', 
          reviewed_by = $1, 
          reviewed_at = CURRENT_TIMESTAMP,
          review_notes = $2
      WHERE report_id = $3
    `, [userId, notes || 'Confirmed as phishing', reportId]);

    console.log('✅ Report status updated');

    // Get domain from suspicious_urls
    const urlResult = await query(
      'SELECT domain FROM suspicious_urls WHERE url_id = $1',
      [urlId]
    );

    if (urlResult.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'URL not found in database'
      });
    }

    const domain = urlResult.rows[0].domain;
    console.log('✅ Domain found:', domain);

    // Add to known_phishing_urls using ON CONFLICT (now that we have unique constraint)
    await query(`
      INSERT INTO known_phishing_urls 
      (url_id, domain_pattern, severity, phishing_type, confirmed_by, active, notes)
      VALUES ($1, $2, $3, $4, $5, TRUE, $6)
      ON CONFLICT (url_id) DO UPDATE
      SET severity = EXCLUDED.severity,
          phishing_type = EXCLUDED.phishing_type,
          confirmed_by = EXCLUDED.confirmed_by,
          confirmed_at = CURRENT_TIMESTAMP,
          active = TRUE,
          notes = EXCLUDED.notes
    `, [
      urlId,
      domain,
      severity,
      phishing_type,
      userId,
      notes || 'Confirmed by moderator'
    ]);

    console.log('✅ Added/Updated in known_phishing_urls');

    // Update suspicious_urls status
    await query(
      "UPDATE suspicious_urls SET status = 'confirmed_phishing' WHERE url_id = $1",
      [urlId]
    );

    console.log('✅ Suspicious URL status updated');

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'confirm_phishing', $2)
    `, [userId, JSON.stringify({ report_id: reportId, url_id: urlId, domain })]);

    console.log('✅ Activity logged');

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Report confirmed as phishing',
      data: {
        report_id: reportId,
        url_id: urlId,
        domain: domain,
        status: 'confirmed',
        severity: severity,
        phishing_type: phishing_type
      }
    });

  } catch (error) {
    console.error('❌ Confirm phishing error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error confirming phishing report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reject report as false positive
 */
exports.rejectReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    const result = await query(`
      UPDATE reports 
      SET status = 'rejected', 
          reviewed_by = $1, 
          reviewed_at = CURRENT_TIMESTAMP,
          review_notes = $2
      WHERE report_id = $3
      RETURNING *
    `, [userId, notes || 'Rejected - not phishing', reportId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Report not found'
      });
    }

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'reject_report', $2)
    `, [userId, JSON.stringify({ report_id: reportId })]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Report rejected',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Reject report error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error rejecting report'
    });
  }
};

/**
 * Get list of moderators for assignment
 */
exports.getModerators = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        user_id,
        full_name,
        email,
        role
      FROM users
      WHERE role IN ('moderator', 'admin')
      ORDER BY full_name
    `);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        moderators: result.rows
      }
    });

  } catch (error) {
    console.error('❌ Get moderators error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching moderators list'
    });
  }
};