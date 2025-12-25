const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');
const { uploadEvidenceFiles } = require('../middleware/uploadMiddleware');

/**
 * @route   POST /api/reports
 * @desc    Submit a new phishing report with evidence file uploads (supports anonymous)
 * @access  Public (anonymous) or Private (authenticated)
 */
router.post('/', 
  (req, res, next) => {
    // Skip optionalAuth and go straight to multer for multipart data
    // Then apply auth after multer processes the body
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      console.log('🔍 Multipart detected, processing with multer first');
      uploadEvidenceFiles(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            service: 'AnLink API',
            success: false,
            error: err.message || 'File upload error'
          });
        }
        console.log('✅ After multer - req.body:', req.body);
        console.log('✅ After multer - req.files:', req.files ? req.files.length : 0);
        // Now apply auth
        optionalAuth(req, res, next);
      });
    } else {
      // Regular JSON request
      optionalAuth(req, res, next);
    }
  },
  reportController.submitReport
);

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