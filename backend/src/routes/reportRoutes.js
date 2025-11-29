const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/reports
 * @desc    Submit a new phishing report (supports anonymous)
 * @access  Public (anonymous) or Private (authenticated)
 */
router.post('/', optionalAuth, reportController.submitReport);

/**
 * @route   GET /api/reports
 * @desc    Get all reports (with filtering)
 * @access  Private (moderator, admin)
 */
router.get('/', authenticateToken, requireRole(['moderator', 'admin']), reportController.getReports);

/**
 * @route   GET /api/reports/my
 * @desc    Get current user's reports
 * @access  Private
 */
router.get('/my', authenticateToken, reportController.getMyReports);

/**
 * @route   GET /api/reports/:reportId
 * @desc    Get single report details
 * @access  Private
 */
router.get('/:reportId', authenticateToken, reportController.getReportDetails);

/**
 * @route   PUT /api/reports/:reportId
 * @desc    Update report (status, priority, assignment)
 * @access  Private (moderator, admin)
 */
router.put('/:reportId', authenticateToken, requireRole(['moderator', 'admin']), reportController.updateReport);

module.exports = router;