const { body } = require('express-validator');

const createRouteValidator = [
  body('sourceCity')
    .trim()
    .notEmpty().withMessage('Source city is required'),
  body('destinationCity')
    .trim()
    .notEmpty().withMessage('Destination city is required'),
  body('distanceKm')
    .isFloat({ min: 1 }).withMessage('Distance must be a positive number (minimum 1 km)'),
  body('estimatedDurationMinutes')
    .isInt({ min: 15 }).withMessage('Estimated duration must be at least 15 minutes')
];

module.exports = {
  createRouteValidator
};

