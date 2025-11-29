const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

/**
 * All admin routes require admin role
 */
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private (admin only)
 */
router.get('/stats', adminController.getSystemStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering
 * @access  Private (admin only)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user role or status
 * @access  Private (admin only)
 */
router.put('/users/:userId', adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete (suspend) user
 * @access  Private (admin only)
 */
router.delete('/users/:userId', adminController.deleteUser);

/**
 * @route   GET /api/admin/logs
 * @desc    Get activity logs
 * @access  Private (admin only)
 */
router.get('/logs', adminController.getActivityLogs);

module.exports = router;