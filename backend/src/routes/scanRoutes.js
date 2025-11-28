const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public endpoint - anyone can scan
router.post('/check', scanController.scanURL);

// Protected endpoints - require authentication
router.get('/history', verifyToken, scanController.getScanHistory);
router.get('/details/:checkId', verifyToken, scanController.getScanDetails);

module.exports = router;