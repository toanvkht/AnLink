const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

/**
 * @route   GET /api/education
 * @desc    Get all education content (published only for regular users)
 * @access  Public (optional auth - admins see all content)
 */
router.get('/', optionalAuth, educationController.getContent);

/**
 * @route   GET /api/education/id/:contentId
 * @desc    Get single education content by ID (for admin editing)
 * @access  Private (admin only)
 */
router.get('/id/:contentId', authenticateToken, requireRole(['admin']), educationController.getContentById);

/**
 * @route   GET /api/education/:slug
 * @desc    Get single education content by slug
 * @access  Public (optional auth - admins can view unpublished content)
 */
router.get('/:slug', optionalAuth, educationController.getContentBySlug);

/**
 * @route   POST /api/education
 * @desc    Create new education content
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, requireRole(['admin']), upload, (err, req, res, next) => {
  // Handle multer errors
  if (err) {
    return res.status(400).json({
      service: 'AnLink API',
      success: false,
      error: err.message || 'File upload error'
    });
  }
  next();
}, educationController.createContent);

/**
 * @route   PUT /api/education/:contentId
 * @desc    Update education content
 * @access  Private (admin only)
 */
router.put('/:contentId', authenticateToken, requireRole(['admin']), upload, (err, req, res, next) => {
  // Handle multer errors
  if (err) {
    return res.status(400).json({
      service: 'AnLink API',
      success: false,
      error: err.message || 'File upload error'
    });
  }
  next();
}, educationController.updateContent);

/**
 * @route   DELETE /api/education/:contentId
 * @desc    Delete education content
 * @access  Private (admin only)
 */
router.delete('/:contentId', authenticateToken, requireRole(['admin']), educationController.deleteContent);

/**
 * @route   POST /api/education/quiz/submit
 * @desc    Submit quiz attempt
 * @access  Public (optional auth - can be anonymous)
 */
router.post('/quiz/submit', optionalAuth, educationController.submitQuizAttempt);

/**
 * @route   GET /api/education/quiz/attempts
 * @desc    Get user's quiz attempts
 * @access  Private
 */
router.get('/quiz/attempts', authenticateToken, educationController.getQuizAttempts);

module.exports = router;