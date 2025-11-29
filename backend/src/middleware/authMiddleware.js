const jwt = require('jsonwebtoken');

// Verify JWT token (authenticateToken)
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
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'anlink_secret_key_change_in_production'
    );

    // Add user info to request
    req.user = {
      userId: decoded.userId,
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

// Check if user has required role
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

module.exports = {
  authenticateToken,
  verifyToken: authenticateToken, // Alias for backwards compatibility
  requireRole
};