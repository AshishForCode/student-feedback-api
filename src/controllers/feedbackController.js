/**
 * src/controllers/feedbackController.js — Feedback CRUD
 *
 * Ownership rules enforced here:
 *  - Students can only view/edit/delete THEIR OWN feedback
 *  - Admins can view/edit/delete ANY feedback
 *  - Only admins can change feedback `status`
 *  - A student can only submit ONE feedback per course (DB index enforces this too)
 */

const Feedback     = require('../models/Feedback');
const Course       = require('../models/Course');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// ── GET /api/feedback ──────────────────────────────────────────────────────────
// @access  Private/Admin — view ALL feedback with pagination, filter, sort
const getAllFeedback = asyncHandler(async (req, res) => {
  // ── Pagination ──────────────────────────────────────────────────────────────
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10); // cap at 50
  const skip  = (page - 1) * limit;

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status; // e.g., ?status=pending
  }

  if (req.query.rating) {
    filter.rating = parseInt(req.query.rating); // e.g., ?rating=5
  }

  if (req.query.course) {
    filter.course = req.query.course; // e.g., ?course=<courseId>
  }

  if (req.query.category) {
    filter.category = req.query.category; // e.g., ?category=teaching
  }

  // ── Sorting ─────────────────────────────────────────────────────────────────
  // ?sort=rating     → ascending by rating
  // ?sort=-createdAt → descending by date (default)
  const sortBy = req.query.sort || '-createdAt';

  // ── Query ───────────────────────────────────────────────────────────────────
  const [feedbacks, total] = await Promise.all([
    Feedback.find(filter)
      .populate('student', 'name email')    // replace ObjectId with { name, email }
      .populate('course',  'title code')    // replace ObjectId with { title, code }
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Feedback.countDocuments(filter),        // total count for pagination metadata
  ]);

  sendSuccess(res, 200, 'Feedback fetched', {
    feedbacks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ── GET /api/feedback/stats ────────────────────────────────────────────────────
// @access  Private/Admin — average rating per course
const getFeedbackStats = asyncHandler(async (req, res) => {
  // Delegates to the static aggregation method defined in the Feedback model
  const stats = await Feedback.getAverageRatings();
  sendSuccess(res, 200, 'Feedback statistics', stats);
});

// ── GET /api/feedback/my ──────────────────────────────────────────────────────
// @access  Private/Student — a student views only their own feedback
const getMyFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ student: req.user._id })
    .populate('course', 'title code instructor')
    .sort('-createdAt');

  sendSuccess(res, 200, `${feedbacks.length} feedback(s) found`, feedbacks);
});

// ── GET /api/feedback/:id ──────────────────────────────────────────────────────
// @access  Private — students see their own; admins see any
const getFeedbackById = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate('student', 'name email')
    .populate('course',  'title code');

  if (!feedback) {
    return next(new AppError(`Feedback not found with id: ${req.params.id}`, 404));
  }

  // Ownership check — students can only read their own
  if (
    req.user.role !== 'admin' &&
    feedback.student._id.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to view this feedback', 403));
  }

  sendSuccess(res, 200, 'Feedback fetched', feedback);
});

// ── POST /api/feedback ─────────────────────────────────────────────────────────
// @access  Private/Student
const createFeedback = asyncHandler(async (req, res, next) => {
  const { course, rating, comment, category } = req.body;

  // Verify the course actually exists before creating feedback for it
  const courseExists = await Course.findById(course);
  if (!courseExists) {
    return next(new AppError(`Course not found with id: ${course}`, 404));
  }

  // Create feedback — student is taken from req.user (not from the request body!)
  // Never trust the client to send their own user id — always use the JWT.
  const feedback = await Feedback.create({
    student: req.user._id,   // from protect middleware — tamper-proof
    course,
    rating,
    comment,
    category,
  });

  // Populate references before sending response
  await feedback.populate('course', 'title code');

  sendSuccess(res, 201, 'Feedback submitted successfully', feedback);
});

// ── PUT /api/feedback/:id ──────────────────────────────────────────────────────
// @access  Private — students edit their own; admins can edit status
const updateFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError(`Feedback not found with id: ${req.params.id}`, 404));
  }

  // Ownership check
  if (
    req.user.role !== 'admin' &&
    feedback.student.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to update this feedback', 403));
  }

  // ── Role-based field restriction ────────────────────────────────────────────
  // Students can update: rating, comment, category
  // Admins can additionally update: status
  const allowedFields = { rating: req.body.rating, comment: req.body.comment, category: req.body.category };

  if (req.user.role === 'admin' && req.body.status) {
    allowedFields.status = req.body.status;
  } else if (req.body.status) {
    // Student trying to change status — silently ignore or warn
    return next(new AppError('Students cannot change feedback status', 403));
  }

  // Remove undefined fields so we don't accidentally blank out fields
  Object.keys(allowedFields).forEach(
    (key) => allowedFields[key] === undefined && delete allowedFields[key]
  );

  const updated = await Feedback.findByIdAndUpdate(
    req.params.id,
    allowedFields,
    { new: true, runValidators: true }
  ).populate('student', 'name email').populate('course', 'title code');

  sendSuccess(res, 200, 'Feedback updated successfully', updated);
});

// ── DELETE /api/feedback/:id ───────────────────────────────────────────────────
// @access  Private — students delete their own; admins delete any
const deleteFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return next(new AppError(`Feedback not found with id: ${req.params.id}`, 404));
  }

  // Ownership check
  if (
    req.user.role !== 'admin' &&
    feedback.student.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to delete this feedback', 403));
  }

  await Feedback.findByIdAndDelete(req.params.id);

  sendSuccess(res, 200, 'Feedback deleted successfully', null);
});

module.exports = {
  getAllFeedback,
  getFeedbackStats,
  getMyFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
