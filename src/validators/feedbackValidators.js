/**
 * src/validators/feedbackValidators.js — Validation rules for Feedback routes
 */

const { body } = require('express-validator');

const feedbackRules = [
  body('course')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Course ID must be a valid MongoDB ObjectId'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['teaching', 'content', 'facilities', 'other'])
    .withMessage('Category must be one of: teaching, content, facilities, other'),
];

// Update rules — rating, comment, category can be updated; course cannot be changed
const feedbackUpdateRules = [
  body('rating').optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),

  body('comment').optional().trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),

  body('category').optional()
    .isIn(['teaching', 'content', 'facilities', 'other'])
    .withMessage('Category must be one of: teaching, content, facilities, other'),

  // Admins can update the status; students cannot (enforced in controller)
  body('status').optional()
    .isIn(['pending', 'reviewed', 'resolved'])
    .withMessage('Status must be one of: pending, reviewed, resolved'),
];

module.exports = { feedbackRules, feedbackUpdateRules };
