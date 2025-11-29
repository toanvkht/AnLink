const { query } = require('../config/database');

/**
 * Get system statistics for admin dashboard
 */
exports.getSystemStats = async (req, res) => {
  try {
    // Total users by role
    const usersResult = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    const usersByRole = {
      admin: 0,
      moderator: 0,
      community_user: 0
    };

    usersResult.rows.forEach(row => {
      usersByRole[row.role] = parseInt(row.count);
    });

    // Total scans
    const scansResult = await query('SELECT COUNT(*) as total FROM url_checks');

    // Scans by result
    const scansByResultResult = await query(`
      SELECT algorithm_result, COUNT(*) as count 
      FROM url_checks 
      WHERE algorithm_result IS NOT NULL
      GROUP BY algorithm_result
    `);

    const scansByResult = {
      safe: 0,
      suspicious: 0,
      dangerous: 0
    };

    scansByResultResult.rows.forEach(row => {
      scansByResult[row.algorithm_result] = parseInt(row.count);
    });

    // Total reports
    const reportsResult = await query('SELECT COUNT(*) as total FROM reports');

    // Reports by status
    const reportsByStatusResult = await query(`
      SELECT status, COUNT(*) as count 
      FROM reports 
      GROUP BY status
    `);

    const reportsByStatus = {
      pending: 0,
      under_review: 0,
      confirmed: 0,
      rejected: 0,
      duplicate: 0
    };

    reportsByStatusResult.rows.forEach(row => {
      reportsByStatus[row.status] = parseInt(row.count);
    });

    // Known phishing URLs
    const phishingResult = await query(
      'SELECT COUNT(*) as total FROM known_phishing_urls WHERE active = TRUE'
    );

    // Today's activity
    const todayScansResult = await query(
      "SELECT COUNT(*) as count FROM url_checks WHERE DATE(checked_at) = CURRENT_DATE"
    );

    const todayReportsResult = await query(
      "SELECT COUNT(*) as count FROM reports WHERE DATE(reported_at) = CURRENT_DATE"
    );

    // Average response time
    const avgResponseResult = await query(
      'SELECT AVG(response_time_ms) as avg_time FROM url_checks WHERE response_time_ms IS NOT NULL'
    );

    // Recent activity (last 7 days)
    const activityResult = await query(`
      SELECT 
        DATE(checked_at) as date,
        COUNT(*) as scans_count
      FROM url_checks
      WHERE checked_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(checked_at)
      ORDER BY date DESC
    `);

    // Top targeted brands
    const brandsResult = await query(`
      SELECT 
        target_brand,
        COUNT(*) as count
      FROM known_phishing_urls
      WHERE target_brand IS NOT NULL AND active = TRUE
      GROUP BY target_brand
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        users: {
          total: Object.values(usersByRole).reduce((a, b) => a + b, 0),
          by_role: usersByRole
        },
        scans: {
          total: parseInt(scansResult.rows[0].total),
          by_result: scansByResult,
          today: parseInt(todayScansResult.rows[0].count),
          avg_response_time_ms: Math.round(parseFloat(avgResponseResult.rows[0].avg_time) || 0)
        },
        reports: {
          total: parseInt(reportsResult.rows[0].total),
          by_status: reportsByStatus,
          today: parseInt(todayReportsResult.rows[0].count)
        },
        phishing: {
          known_urls: parseInt(phishingResult.rows[0].total),
          top_brands: brandsResult.rows
        },
        recent_activity: activityResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Get system stats error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching system statistics'
    });
  }
};

/**
 * Get all users with filtering
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, status, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT user_id, email, full_name, role, status, created_at, last_login FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND role = $${paramCount++}`;
      params.push(role);
    }

    if (status) {
      queryText += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    let countParamNum = 1;

    if (role) {
      countQuery += ` AND role = $${countParamNum++}`;
      countParams.push(role);
    }

    if (status) {
      countQuery += ` AND status = $${countParamNum++}`;
      countParams.push(status);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        users: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching users'
    });
  }
};

/**
 * Update user role or status
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status } = req.body;
    const adminId = req.user.userId;

    // Cannot modify self
    if (userId === adminId) {
      return res.status(403).json({
        service: 'AnLink API',
        success: false,
        error: 'Cannot modify your own account'
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (role) {
      const validRoles = ['community_user', 'moderator', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          service: 'AnLink API',
          success: false,
          error: 'Invalid role. Must be: community_user, moderator, or admin'
        });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (status) {
      const validStatuses = ['active', 'suspended', 'pending'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          service: 'AnLink API',
          success: false,
          error: 'Invalid status. Must be: active, suspended, or pending'
        });
      }
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(userId);

    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING user_id, email, full_name, role, status
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'User not found'
      });
    }

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'admin_update_user', $2)
    `, [adminId, JSON.stringify({ target_user_id: userId, role, status })]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error updating user'
    });
  }
};

/**
 * Delete user (soft delete by setting status to suspended)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    // Cannot delete self
    if (userId === adminId) {
      return res.status(403).json({
        service: 'AnLink API',
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const result = await query(`
      UPDATE users 
      SET status = 'suspended'
      WHERE user_id = $1
      RETURNING user_id, email, full_name
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'User not found'
      });
    }

    // Log activity
    await query(`
      INSERT INTO user_activity_logs (user_id, action_type, action_details)
      VALUES ($1, 'admin_delete_user', $2)
    `, [adminId, JSON.stringify({ deleted_user_id: userId })]);

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'User suspended successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error deleting user'
    });
  }
};

/**
 * Get activity logs
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { user_id, action_type, limit = 100, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        l.log_id,
        l.action_type,
        l.action_details,
        l.ip_address,
        l.timestamp,
        u.email,
        u.full_name
      FROM user_activity_logs l
      JOIN users u ON l.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (user_id) {
      queryText += ` AND l.user_id = $${paramCount++}`;
      params.push(user_id);
    }

    if (action_type) {
      queryText += ` AND l.action_type = $${paramCount++}`;
      params.push(action_type);
    }

    queryText += ` ORDER BY l.timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM user_activity_logs WHERE 1=1';
    const countParams = [];
    let countParamNum = 1;

    if (user_id) {
      countQuery += ` AND user_id = $${countParamNum++}`;
      countParams.push(user_id);
    }

    if (action_type) {
      countQuery += ` AND action_type = $${countParamNum++}`;
      countParams.push(action_type);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get activity logs error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching activity logs'
    });
  }
};