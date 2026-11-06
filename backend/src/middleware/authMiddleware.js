const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to authenticate requests using Bearer JWT tokens
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'Authentication required. No Bearer token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'algions_bus_booking_jwt_secret_key_prod_safe_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.unauthorized(res, 'The user belonging to this token no longer exists.');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Authentication token has expired. Please log in again.');
    }
    return ApiResponse.unauthorized(res, 'Invalid authentication token.');
  }
};

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'User identity not established.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      );
    }

    next();
  };
};

// Convenience shortcuts
const requireAdmin = requireRole('admin');
const requirePassenger = requireRole('passenger');
const requirePassengerOrAdmin = requireRole('passenger', 'admin');

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requirePassenger,
  requirePassengerOrAdmin
};

