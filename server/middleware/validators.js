// FILE: middleware/validators.js
//
// Centralized input validation rules using express-validator.
// Each export is an array of checks applied as route middleware.

const { body, validationResult } = require('express-validator');

// Runs after the check(...) rules above it in a route's middleware chain,
// and stops the request with a 400 if any rule failed.
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg, // show the first, clearest error
      details: errors.array(),
    });
  }
  next();
}

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('phoneNumber').trim().matches(/^0[71]\d{8}$/).withMessage('Please provide a valid Kenyan phone number (e.g. 0712345678).'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters.'),
  body('role').optional().isIn(['BUYER', 'ORGANIZER']).withMessage('Invalid role.'),
  handleValidationErrors,
];

const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or phone number is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors,
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidation = [
  body('token').trim().notEmpty().withMessage('Reset token is required.'),
  body('newPassword').isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters.'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};