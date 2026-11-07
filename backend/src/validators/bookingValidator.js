const { body } = require('express-validator');

const createBookingValidator = [
  body('tripId')
    .notEmpty().withMessage('Trip ID is required')
    .isMongoId().withMessage('Valid Trip ID is required'),
  body('passengers')
    .isArray({ min: 1 }).withMessage('At least one passenger must be specified'),
  body('passengers.*.name')
    .trim()
    .notEmpty().withMessage('Passenger name is required'),
  body('passengers.*.age')
    .isInt({ min: 1, max: 120 }).withMessage('Passenger age must be between 1 and 120'),
  body('passengers.*.gender')
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('passengers.*.seatNumber')
    .trim()
    .notEmpty().withMessage('Seat number is required'),
  body('boardingPoint')
    .notEmpty().withMessage('Boarding point is required'),
  body('boardingPoint.pointName')
    .trim()
    .notEmpty().withMessage('Boarding point name is required'),
  body('boardingPoint.time')
    .notEmpty().withMessage('Boarding point departure time is required'),
  body('droppingPoint')
    .notEmpty().withMessage('Dropping point is required'),
  body('droppingPoint.pointName')
    .trim()
    .notEmpty().withMessage('Dropping point name is required'),
  body('droppingPoint.time')
    .notEmpty().withMessage('Dropping point arrival time is required'),
  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Please provide a valid contact email')
    .normalizeEmail(),
  body('contactPhone')
    .trim()
    .notEmpty().withMessage('Contact phone number is required')
];

module.exports = {
  createBookingValidator
};

