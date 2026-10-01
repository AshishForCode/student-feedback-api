/**
 * src/middleware/validate.js — Validation result checker
 *
 * express-validator rules only *collect* errors; they don't stop the request.
 * This middleware reads those collected errors and returns a 400 if any exist.
 *
 * Usage:
 *   router.post('/register', registerRules, validate, registerController);
 *                                           ^^^^^^^^ this middleware runs after rules
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors to a clean array: [{ field: 'email', message: '...' }]
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next(); // All good — proceed to the controller
};

module.exports = validate;
