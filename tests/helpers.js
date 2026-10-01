/**
 * tests/helpers.js — Shared test utilities
 *
 * Contains:
 *  - DB connect/disconnect helpers
 *  - Data factory functions (create test users, courses, etc.)
 *  - Login helper that returns a ready-to-use auth header
 *
 * WHY factories?
 * Instead of copy-pasting user creation in every test file, we call
 * createStudent() or createAdmin() and get back the document + token.
 * This keeps tests DRY and readable.
 */

// Load TEST environment FIRST — before app.js reads process.env
require('dotenv').config({ path: '.env.test' });

const mongoose  = require('mongoose');
const request   = require('supertest');
const app       = require('../app');
const User      = require('../src/models/User');
const Course    = require('../src/models/Course');
const Feedback  = require('../src/models/Feedback');

// ── DB Lifecycle ───────────────────────────────────────────────────────────────

/**
 * Connect to the test database.
 * Call this in beforeAll() of each test suite.
 */
const connectTestDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

/**
 * Drop all collections (clean slate between suites) and disconnect.
 * Call this in afterAll() of each test suite.
 */
const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

/**
 * Clear all documents from all collections.
 * Call this in beforeEach() so each test starts fresh.
 */
const clearDB = async () => {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Feedback.deleteMany({}),
  ]);
};

// ── Data Factories ─────────────────────────────────────────────────────────────

/**
 * Register a user via the API and return { user, token, authHeader }.
 * Using the API (not direct DB insert) tests the real registration flow.
 */
const registerUser = async (overrides = {}) => {
  const data = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test1234',
    role: 'student',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(data);

  return {
    user: res.body.data?.user,
    token: res.body.data?.token,
    // Pre-built header string for use in .set('Authorization', authHeader)
    authHeader: `Bearer ${res.body.data?.token}`,
    statusCode: res.statusCode,
    body: res.body,
  };
};

/**
 * Create a student user for testing.
 */
const createStudent = (overrides = {}) =>
  registerUser({ role: 'student', email: 'student@test.com', ...overrides });

/**
 * Create an admin user for testing.
 */
const createAdmin = (overrides = {}) =>
  registerUser({ role: 'admin', email: 'admin@test.com', name: 'Test Admin', ...overrides });

/**
 * Create a sample course via the API (requires admin token).
 */
const createCourse = async (adminAuthHeader, overrides = {}) => {
  const data = {
    title: 'Test Course',
    code: 'TC101',
    instructor: 'Dr. Test',
    department: 'Testing',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/courses')
    .set('Authorization', adminAuthHeader)
    .send(data);

  return res.body.data;
};

/**
 * Create feedback for a student on a course.
 */
const createFeedback = async (studentAuthHeader, courseId, overrides = {}) => {
  const data = {
    course: courseId,
    rating: 4,
    comment: 'This is a test feedback comment with enough characters.',
    category: 'teaching',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/feedback')
    .set('Authorization', studentAuthHeader)
    .send(data);

  return res.body.data;
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearDB,
  createStudent,
  createAdmin,
  createCourse,
  createFeedback,
  app,
  request,
};
