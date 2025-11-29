/**
 * Scan Routes
 * AnLink Anti-Phishing System
 */

const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// Public endpoints - anyone can scan
router.post('/check', optionalAuth, scanController.scanURL);
router.post('/quick', scanController.quickCheck);

// Protected endpoints - require authentication
router.get('/history', verifyToken, scanController.getScanHistory);
router.get('/details/:checkId', verifyToken, scanController.getScanDetails);

module.exports = router;
