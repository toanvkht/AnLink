const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderatorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

/**
 * All moderator routes require moderator or admin role
 */
router.use(authenticateToken);
router.use(requireRole(['moderator', 'admin']));

/**
 * @route   GET /api/moderator/dashboard
 * @desc    Get moderator dashboard statistics
 * @access  Private (moderator, admin)
 */
router.get('/dashboard', moderatorController.getDashboardStats);

/**
 * @route   GET /api/moderator/queue
 * @desc    Get moderation queue (pending and under_review reports)
 * @access  Private (moderator, admin)
 */
router.get('/queue', moderatorController.getQueue);

/**
 * @route   POST /api/moderator/assign/:reportId
 * @desc    Assign report to a moderator
 * @access  Private (moderator, admin)
 */
router.post('/assign/:reportId', moderatorController.assignReport);

/**
 * @route   POST /api/moderator/confirm/:reportId
 * @desc    Confirm report as phishing
 * @access  Private (moderator, admin)
 */
router.post('/confirm/:reportId', moderatorController.confirmPhishing);

/**
 * @route   POST /api/moderator/reject/:reportId
 * @desc    Reject report as false positive
 * @access  Private (moderator, admin)
 */
router.post('/reject/:reportId', moderatorController.rejectReport);

/**
 * @route   GET /api/moderator/moderators
 * @desc    Get list of all moderators for assignment
 * @access  Private (moderator, admin)
 */
router.get('/moderators', moderatorController.getModerators);

module.exports = router;