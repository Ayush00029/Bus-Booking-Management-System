const ApiResponse = require('../utils/apiResponse');

/**
 * Handle 404 Not Found for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  return ApiResponse.notFound(res, `Endpoint not found: ${req.method} ${req.originalUrl}`);
};

/**
 * Global Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, `Invalid resource identifier: ${err.value}`);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return ApiResponse.unprocessable(res, 'Validation error occurred', errorDetails);
  }

  // Handle MongoDB Duplicate Key (code 11000 or bulk write duplicate error)
  const isDuplicateKey = err.code === 11000 ||
    (err.writeErrors && err.writeErrors.some(e => e.code === 11000)) ||
    (err.message && err.message.includes('E11000'));

  if (isDuplicateKey) {
    const duplicateFields = Object.keys(err.keyValue || {});
    const message = duplicateFields.length > 0
      ? `A record with the specified ${duplicateFields.join(', ')} already exists`
      : 'A database unique constraint conflict occurred. One or more selected items are already reserved.';
    return ApiResponse.conflict(
      res,
      message,
      err.keyValue || err.writeErrors
    );
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Authentication token has expired. Please log in again.');
  }

  // Default to 500 or err.statusCode
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  return ApiResponse.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
};

module.exports = {
  notFoundHandler,
  errorHandler
};
