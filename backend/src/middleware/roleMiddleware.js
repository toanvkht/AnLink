// Check if user has required role
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by authMiddleware
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

// Specific role checkers
exports.requireAdmin = exports.requireRole('admin');

exports.requireModerator = exports.requireRole('admin', 'moderator');

exports.requireCommunityUser = exports.requireRole('admin', 'moderator', 'community_user');