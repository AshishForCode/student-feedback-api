/**
 * src/models/Feedback.js — Feedback schema
 *
 * This is the core model of the app. Each feedback document belongs to
 * one student and one course (referenced by ObjectId).
 * Ownership is enforced at the middleware/controller level using `student` field.
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    // `ref: 'User'` creates a relationship — this field stores a User's _id.
    // Use .populate('student') later to replace the id with the full User object.
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Feedback must belong to a student'],
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Feedback must belong to a course'],
    },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['teaching', 'content', 'facilities', 'other'],
        message: 'Category must be one of: teaching, content, facilities, other',
      },
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'reviewed', 'resolved'],
        message: 'Status must be one of: pending, reviewed, resolved',
      },
      default: 'pending',  // New feedback starts as pending review
    },
  },
  {
    // timestamps:true adds createdAt (submission time) and updatedAt (last edit).
    // updatedAt is important so admins can see when a student last edited.
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// These dramatically speed up the admin's filter/search queries.

// Filter feedback by course (most common admin query)
feedbackSchema.index({ course: 1 });

// Filter by status (e.g., show all "pending" feedback)
feedbackSchema.index({ status: 1 });

// ── One feedback per student per course ───────────────────────────────────────
// A student can only submit ONE feedback per course.
// The { unique: true } option enforces this at the database level.
// This also creates an index automatically, so no need for a separate .index() call.
feedbackSchema.index({ student: 1, course: 1 }, { unique: true });

// ── Static Method: Average rating per course ──────────────────────────────────
// Used for the admin stats endpoint: GET /api/feedback/stats
// MongoDB's aggregation pipeline is the right tool for this calculation.
feedbackSchema.statics.getAverageRatings = async function () {
  return this.aggregate([
    {
      // $group groups documents by course and computes the average rating
      $group: {
        _id: '$course',          // group by course ObjectId
        averageRating: { $avg: '$rating' },
        totalFeedback: { $sum: 1 },
      },
    },
    {
      // $lookup is MongoDB's JOIN — fetches matching Course documents
      $lookup: {
        from: 'courses',         // the actual MongoDB collection name (lowercase + plural)
        localField: '_id',       // field in feedback (the course ObjectId)
        foreignField: '_id',     // field in courses collection
        as: 'courseDetails',     // name of the resulting array field
      },
    },
    {
      // $unwind turns the courseDetails array [ {...} ] into a plain object {...}
      $unwind: '$courseDetails',
    },
    {
      // $project shapes the final output — only include what we need
      $project: {
        _id: 0,
        course: '$courseDetails.title',
        code: '$courseDetails.code',
        instructor: '$courseDetails.instructor',
        averageRating: { $round: ['$averageRating', 2] }, // round to 2 decimal places
        totalFeedback: 1,
      },
    },
    {
      // Sort by highest rated first
      $sort: { averageRating: -1 },
    },
  ]);
};

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
