/**
 * Authentication Middleware
 * AnLink Anti-Phishing System
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'anlink_secret_key_change_in_production';

/**
 * Verify JWT token (required authentication)
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'No token provided. Please login first.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info to request
    req.user = {
      user_id: decoded.userId || decoded.user_id,
      userId: decoded.userId || decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'Token expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid token. Please login again.'
      });
    }

    console.error('❌ AnLink Auth middleware error:', error);
    return res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token, but adds user if present
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token - continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Try to verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info to request
    req.user = {
      user_id: decoded.userId || decoded.user_id,
      userId: decoded.userId || decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };

    next();

  } catch (error) {
    // Token invalid/expired - continue without user
    req.user = null;
    next();
  }
};

/**
 * Check if user has required role
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        service: 'AnLink API',
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        service: 'AnLink API',
        success: false,
        error: 'You do not have permission to access this resource',
        required_role: allowedRoles,
        your_role: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Check if user is moderator or admin
 */
const requireModerator = requireRole(['moderator', 'admin']);

module.exports = {
  authenticateToken,
  verifyToken: authenticateToken, // Alias for backwards compatibility
  optionalAuth,
  requireRole,
  requireAdmin,
  requireModerator
};
