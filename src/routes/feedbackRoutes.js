/**
 * src/routes/feedbackRoutes.js — Feedback route definitions with Swagger docs
 *
 * NOTE: /stats and /my MUST be defined BEFORE /:id
 */

const express = require('express');
const {
  getAllFeedback, getFeedbackStats, getMyFeedback,
  getFeedbackById, createFeedback, updateFeedback, deleteFeedback,
} = require('../controllers/feedbackController');
const { feedbackRules, feedbackUpdateRules } = require('../validators/feedbackValidators');
const validate               = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// SWAGGER DOCUMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Feedback submission and management
 */

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Get all feedback with pagination, filter, and sort (admin only)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *         example: 10
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, resolved] }
 *         example: pending
 *       - in: query
 *         name: rating
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *         example: 5
 *       - in: query
 *         name: course
 *         schema: { type: string }
 *         description: Filter by course ObjectId
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [teaching, content, facilities, other] }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: Sort field (prefix with - for descending)
 *         example: -createdAt
 *     responses:
 *       200:
 *         description: Paginated feedback list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     feedbacks:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Feedback' }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:      { type: integer, example: 25 }
 *                         page:       { type: integer, example: 1 }
 *                         limit:      { type: integer, example: 10 }
 *                         totalPages: { type: integer, example: 3 }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   post:
 *     summary: Submit feedback on a course (student only)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course, rating, comment, category]
 *             properties:
 *               course:
 *                 type: string
 *                 description: MongoDB ObjectId of the course
 *                 example: 6abda2922c5c31441b80178d
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: Great course, very informative and well structured.
 *               category:
 *                 type: string
 *                 enum: [teaching, content, facilities, other]
 *                 example: teaching
 *     responses:
 *       201:
 *         description: Feedback submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Feedback' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/',    authorize('admin'),   getAllFeedback);
router.post('/',   authorize('student'), feedbackRules, validate, createFeedback);

/**
 * @swagger
 * /api/feedback/stats:
 *   get:
 *     summary: Get average ratings per course (admin only)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics per course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       course:        { type: string, example: Introduction to Computer Science }
 *                       code:          { type: string, example: CS101 }
 *                       instructor:    { type: string, example: Dr. Alan Turing }
 *                       averageRating: { type: number, example: 4.5 }
 *                       totalFeedback: { type: integer, example: 12 }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', authorize('admin'), getFeedbackStats);

/**
 * @swagger
 * /api/feedback/my:
 *   get:
 *     summary: Get the logged-in student's own feedback (student only)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student's feedback list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Feedback' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/my', authorize('student'), getMyFeedback);

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     summary: Get a single feedback by ID (owner or admin)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: 6abda2b003f9a3cb9f257c30
 *     responses:
 *       200:
 *         description: Feedback details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Feedback' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update feedback (owner edits content; admin can change status)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:   { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               comment:  { type: string, example: Updated review after re-reading. }
 *               category: { type: string, enum: [teaching, content, facilities, other] }
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved]
 *                 description: Admin only — students cannot change this
 *                 example: reviewed
 *     responses:
 *       200:
 *         description: Feedback updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Feedback' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete feedback (owner or admin)
 *     tags: [Feedback]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feedback deleted
 *         content:
 *           application/json:
 *             example: { success: true, message: Feedback deleted successfully }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router
  .route('/:id')
  .get(getFeedbackById)
  .put(feedbackUpdateRules, validate, updateFeedback)
  .delete(deleteFeedback);

module.exports = router;
