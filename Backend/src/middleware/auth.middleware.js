const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');

/**
 * Protect routes — requires valid JWT
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const decoded = verifyToken(token);

    // Fetch user and verify token version (for logout from all devices)
    const user = await User.findById(decoded.id).select('+tokenVersion');
    if (!user) {
      return errorResponse(res, 'User not found. Please log in again.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated.', 403);
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token. Please log in again.', 401);
    }
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

/**
 * Restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. This route is restricted to: ${roles.join(', ')}.`,
        403
      );
    }
    next();
  };
};

/**
 * Verify email is confirmed (optional check for sensitive routes)
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return errorResponse(res, 'Please verify your email address to access this feature.', 403);
  }
  next();
};

/**
 * Optional authentication — sets req.user if valid token provided, otherwise proceeds
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('+tokenVersion');
      if (user && user.isActive && user.tokenVersion === decoded.tokenVersion) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid/expired tokens for optional auth
  }
  next();
};

module.exports = { protect, authorize, requireEmailVerified, optionalAuth };
