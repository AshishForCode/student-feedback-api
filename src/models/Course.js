/**
 * src/models/Course.js — Course schema
 *
 * Courses are created by admins and referenced by feedback.
 * `code` is a unique identifier (e.g., "CS101") so students
 * can find a course without knowing its MongoDB _id.
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,                        // e.g., "CS101", "MATH202"
      uppercase: true,                     // always store codes in uppercase
      trim: true,
      match: [
        /^[A-Z]{2,6}\d{2,4}$/,
        'Course code must be like CS101 or MATH202 (2-6 letters + 2-4 digits)',
      ],
    },

    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
      maxlength: [100, 'Instructor name cannot exceed 100 characters'],
    },

    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
  },
  {
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

// ── Index ──────────────────────────────────────────────────────────────────────
// Compound index so admins can filter courses by department quickly.
// Mongoose creates an index for `code` automatically because unique:true,
// but explicit compound indexes on commonly-filtered fields boost performance.
courseSchema.index({ department: 1, title: 1 });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
