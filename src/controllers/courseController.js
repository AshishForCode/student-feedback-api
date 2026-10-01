/**
 * src/controllers/courseController.js — Course CRUD
 *
 * Permissions:
 *  GET  /api/courses       → any logged-in user (student or admin)
 *  GET  /api/courses/:id   → any logged-in user
 *  POST /api/courses       → admin only
 *  PUT  /api/courses/:id   → admin only
 *  DELETE /api/courses/:id → admin only
 */

const Course       = require('../models/Course');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// ── GET /api/courses ───────────────────────────────────────────────────────────
// @access  Private (any logged-in user)
const getAllCourses = asyncHandler(async (req, res) => {
  // Optional query-string search: /api/courses?department=CS&search=data
  const filter = {};

  if (req.query.department) {
    // Case-insensitive partial match on department
    filter.department = { $regex: req.query.department, $options: 'i' };
  }

  if (req.query.search) {
    // Search across title, code, and instructor fields
    filter.$or = [
      { title:      { $regex: req.query.search, $options: 'i' } },
      { code:       { $regex: req.query.search, $options: 'i' } },
      { instructor: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const courses = await Course.find(filter).sort({ title: 1 });

  sendSuccess(res, 200, `${courses.length} course(s) found`, courses);
});

// ── GET /api/courses/:id ───────────────────────────────────────────────────────
// @access  Private (any logged-in user)
const getCourseById = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    // AppError with 404 is caught by our global error handler
    return next(new AppError(`Course not found with id: ${req.params.id}`, 404));
  }

  sendSuccess(res, 200, 'Course fetched', course);
});

// ── POST /api/courses ──────────────────────────────────────────────────────────
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res, next) => {
  const { title, code, instructor, department } = req.body;

  // Course.create() triggers Mongoose validation + saves to DB
  const course = await Course.create({ title, code, instructor, department });

  sendSuccess(res, 201, 'Course created successfully', course);
});

// ── PUT /api/courses/:id ───────────────────────────────────────────────────────
// @access  Private/Admin
const updateCourse = asyncHandler(async (req, res, next) => {
  const { title, code, instructor, department } = req.body;

  // findByIdAndUpdate options:
  //   new: true   → return the updated document (not the old one)
  //   runValidators: true → run schema validators on the update fields
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { title, code, instructor, department },
    { new: true, runValidators: true }
  );

  if (!course) {
    return next(new AppError(`Course not found with id: ${req.params.id}`, 404));
  }

  sendSuccess(res, 200, 'Course updated successfully', course);
});

// ── DELETE /api/courses/:id ────────────────────────────────────────────────────
// @access  Private/Admin
const deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findByIdAndDelete(req.params.id);

  if (!course) {
    return next(new AppError(`Course not found with id: ${req.params.id}`, 404));
  }

  // 200 with a null data (some APIs use 204 No Content, but 200 is clearer for learners)
  sendSuccess(res, 200, 'Course deleted successfully', null);
});

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
