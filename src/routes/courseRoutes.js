/**
 * src/routes/courseRoutes.js — Course route definitions with Swagger docs
 */

const express = require('express');
const {
  getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse,
} = require('../controllers/courseController');
const { courseRules, courseUpdateRules } = require('../validators/courseValidators');
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
 *   name: Courses
 *   description: Course management (admin write, any user read)
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses (with optional filters)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *         description: Filter by department (partial, case-insensitive)
 *         example: Computer Science
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search across title, code, and instructor
 *         example: data
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 4 course(s) found }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Course' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Create a new course (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, code, instructor, department]
 *             properties:
 *               title:      { type: string, example: Introduction to Computer Science }
 *               code:       { type: string, example: CS101 }
 *               instructor: { type: string, example: Dr. Alan Turing }
 *               department: { type: string, example: Computer Science }
 *     responses:
 *       201:
 *         description: Course created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Course' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router
  .route('/')
  .get(getAllCourses)
  .post(authorize('admin'), courseRules, validate, createCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a single course by ID
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Course MongoDB ObjectId
 *         example: 6abda2922c5c31441b80178d
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Course' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update a course (admin only)
 *     tags: [Courses]
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
 *               title:      { type: string, example: Updated Title }
 *               code:       { type: string, example: CS102 }
 *               instructor: { type: string, example: Prof. Updated }
 *               department: { type: string, example: Computer Science }
 *     responses:
 *       200:
 *         description: Course updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Course' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a course (admin only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Course deleted
 *         content:
 *           application/json:
 *             example: { success: true, message: Course deleted successfully }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router
  .route('/:id')
  .get(getCourseById)
  .put(authorize('admin'), courseUpdateRules, validate, updateCourse)
  .delete(authorize('admin'), deleteCourse);

module.exports = router;
