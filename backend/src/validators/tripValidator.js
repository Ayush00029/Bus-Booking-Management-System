const { body } = require('express-validator');

const createTripValidator = [
  body('route')
    .notEmpty().withMessage('Route ID is required')
    .isMongoId().withMessage('Valid Route ID is required'),
  body('bus')
    .notEmpty().withMessage('Bus ID is required')
    .isMongoId().withMessage('Valid Bus ID is required'),
  body('departureDateTime')
    .notEmpty().withMessage('Departure date and time is required')
    .isISO8601().withMessage('Departure date must be a valid ISO 8601 date string'),
  body('arrivalDateTime')
    .notEmpty().withMessage('Arrival date and time is required')
    .isISO8601().withMessage('Arrival date must be a valid ISO 8601 date string'),
  body('baseFare')
    .isFloat({ min: 50 }).withMessage('Base fare must be at least 50')
];

module.exports = {
  createTripValidator
};

