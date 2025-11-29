const { query } = require('../config/database');

/**
 * Submit feedback on a report
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { report_id, feedback_type, comment_text } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!report_id || !feedback_type) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Report ID and feedback type are required'
      });
    }

    const validTypes = ['vote_phishing', 'vote_safe', 'comment'];
    if (!validTypes.includes(feedback_type)) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid feedback type. Must be: vote_phishing, vote_safe, or comment'
      });
    }

    if (feedback_type === 'comment' && !comment_text) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Comment text is required for comment feedback'
      });
    }

    // Check if report exists
    const reportCheck = await query(
      'SELECT report_id FROM reports WHERE report_id = $1',
      [report_id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Report not found'
      });
    }

    // Check for duplicate feedback (only for votes)
    if (feedback_type !== 'comment') {
      const duplicateCheck = await query(`
        SELECT feedback_id FROM community_feedback 
        WHERE report_id = $1 AND user_id = $2 AND feedback_type = $3
      `, [report_id, userId, feedback_type]);

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          service: 'AnLink API',
          success: false,
          error: 'You have already submitted this type of feedback for this report'
        });
      }
    }

    // Insert feedback
    const result = await query(`
      INSERT INTO community_feedback 
      (report_id, user_id, feedback_type, comment_text)
      VALUES ($1, $2, $3, $4)
      RETURNING feedback_id, created_at
    `, [report_id, userId, feedback_type, comment_text || null]);

    res.status(201).json({
      service: 'AnLink API',
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback_id: result.rows[0].feedback_id,
        report_id: report_id,
        feedback_type: feedback_type,
        created_at: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('❌ Submit feedback error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error submitting feedback'
    });
  }
};

/**
 * Get feedback for a report
 */
exports.getReportFeedback = async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await query(`
      SELECT 
        cf.feedback_id,
        cf.feedback_type,
        cf.comment_text,
        cf.helpful_count,
        cf.created_at,
        u.full_name,
        u.email
      FROM community_feedback cf
      JOIN users u ON cf.user_id = u.user_id
      WHERE cf.report_id = $1
      ORDER BY cf.created_at DESC
    `, [reportId]);

    // Get vote summary
    const summaryResult = await query(`
      SELECT 
        feedback_type,
        COUNT(*) as count
      FROM community_feedback
      WHERE report_id = $1 AND feedback_type IN ('vote_phishing', 'vote_safe')
      GROUP BY feedback_type
    `, [reportId]);

    const summary = {
      vote_phishing: 0,
      vote_safe: 0,
      comments: 0
    };

    summaryResult.rows.forEach(row => {
      summary[row.feedback_type] = parseInt(row.count);
    });

    const commentsCount = await query(
      "SELECT COUNT(*) as count FROM community_feedback WHERE report_id = $1 AND feedback_type = 'comment'",
      [reportId]
    );
    summary.comments = parseInt(commentsCount.rows[0].count);

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        feedback: result.rows,
        summary: summary
      }
    });

  } catch (error) {
    console.error('❌ Get feedback error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching feedback'
    });
  }
};

/**
 * Mark feedback as helpful
 */
exports.markHelpful = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const result = await query(`
      UPDATE community_feedback 
      SET helpful_count = helpful_count + 1 
      WHERE feedback_id = $1
      RETURNING helpful_count
    `, [feedbackId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      service: 'AnLink API',
      success: true,
      message: 'Marked as helpful',
      data: {
        helpful_count: result.rows[0].helpful_count
      }
    });

  } catch (error) {
    console.error('❌ Mark helpful error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error marking feedback as helpful'
    });
  }
};