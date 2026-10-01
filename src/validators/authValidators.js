/**
 * src/validators/authValidators.js — Input validation rules for auth routes
 *
 * express-validator works in two steps:
 *  1. Define rules in an array (here)
 *  2. Call validate() in the controller to check results
 *
 * Keeping rules in a separate file keeps controllers clean.
 */

const { body } = require('express-validator');

// ── Register validation ────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(), // lowercases and trims the email

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['student', 'admin']).withMessage('Role must be student or admin'),
];

// ── Login validation ───────────────────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
