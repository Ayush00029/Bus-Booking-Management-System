const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Validates request schema and returns formatted 422 errors if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    const primaryMessage = formatted[0]?.message || 'Input validation failed';
    return ApiResponse.unprocessable(res, primaryMessage, formatted);
  }
  next();
};

module.exports = validate;

