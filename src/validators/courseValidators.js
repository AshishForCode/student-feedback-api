/**
 * src/validators/courseValidators.js — Validation rules for Course routes
 */

const { body } = require('express-validator');

const courseRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),

  body('code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .matches(/^[A-Za-z]{2,6}\d{2,4}$/)
    .withMessage('Course code must be like CS101 or MATH202'),

  body('instructor')
    .trim()
    .notEmpty().withMessage('Instructor name is required')
    .isLength({ max: 100 }).withMessage('Instructor name cannot exceed 100 characters'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),
];

// Update rules — all fields optional (PATCH semantics)
const courseUpdateRules = [
  body('title').optional().trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),

  body('code').optional().trim()
    .matches(/^[A-Za-z]{2,6}\d{2,4}$/)
    .withMessage('Course code must be like CS101 or MATH202'),

  body('instructor').optional().trim()
    .isLength({ max: 100 }).withMessage('Instructor name cannot exceed 100 characters'),

  body('department').optional().trim()
    .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters'),
];

module.exports = { courseRules, courseUpdateRules };
