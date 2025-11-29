const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/feedback
 * @desc    Submit feedback on a report (vote or comment)
 * @access  Private
 */
router.post('/', authenticateToken, feedbackController.submitFeedback);

/**
 * @route   GET /api/feedback/report/:reportId
 * @desc    Get all feedback for a specific report
 * @access  Public (can be viewed by anyone)
 */
router.get('/report/:reportId', feedbackController.getReportFeedback);

/**
 * @route   PUT /api/feedback/:feedbackId/helpful
 * @desc    Mark feedback as helpful
 * @access  Public
 */
router.put('/:feedbackId/helpful', feedbackController.markHelpful);

module.exports = router;