const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer(val => (typeof val === 'string' ? val.replace(/[\s\-\(\)]/g, '') : val))
    .isMobilePhone('any').withMessage('Please provide a valid phone number (e.g., +91 98765 43210 or 10 digits)'),
  body('role')
    .optional()
    .isIn(['passenger', 'admin']).withMessage('Role must be either passenger or admin')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};

