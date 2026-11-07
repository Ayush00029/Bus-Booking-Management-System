const { body } = require('express-validator');

const createOperatorValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Operator name is required')
    .isLength({ max: 120 }).withMessage('Operator name cannot exceed 120 characters'),
  body('code')
    .trim()
    .notEmpty().withMessage('Operator code is required')
    .isLength({ min: 2, max: 10 }).withMessage('Operator code must be between 2 and 10 characters'),
  body('contactEmail')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please provide a valid contact email')
];

const createBusValidator = [
  body('operator')
    .notEmpty().withMessage('Operator ID is required')
    .isMongoId().withMessage('Valid Operator ID is required'),
  body('busNumber')
    .trim()
    .notEmpty().withMessage('Bus registration number is required'),
  body('busType')
    .notEmpty().withMessage('Bus type is required')
    .isIn([
      'AC Sleeper (2+1)',
      'Non-AC Sleeper (2+1)',
      'AC Seater (2+2)',
      'Non-AC Seater (2+2)',
      'Volvo Multi-Axle AC'
    ]).withMessage('Invalid bus type'),
  body('layoutType')
    .optional()
    .isIn(['2+2_seater', '2+1_sleeper']).withMessage('Invalid layout type'),
  body('totalSeats')
    .isInt({ min: 10, max: 60 }).withMessage('Total seats must be between 10 and 60')
];

module.exports = {
  createOperatorValidator,
  createBusValidator
};

