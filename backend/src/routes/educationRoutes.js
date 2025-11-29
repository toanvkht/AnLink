const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/education
 * @desc    Get all education content (published only for regular users)
 * @access  Public
 */
router.get('/', educationController.getContent);

/**
 * @route   GET /api/education/:slug
 * @desc    Get single education content by slug
 * @access  Public
 */
router.get('/:slug', educationController.getContentBySlug);

/**
 * @route   POST /api/education
 * @desc    Create new education content
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, requireRole(['admin']), educationController.createContent);

/**
 * @route   PUT /api/education/:contentId
 * @desc    Update education content
 * @access  Private (admin only)
 */
router.put('/:contentId', authenticateToken, requireRole(['admin']), educationController.updateContent);

/**
 * @route   DELETE /api/education/:contentId
 * @desc    Delete education content
 * @access  Private (admin only)
 */
router.delete('/:contentId', authenticateToken, requireRole(['admin']), educationController.deleteContent);

module.exports = router;