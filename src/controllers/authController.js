/**
 * src/controllers/authController.js — Register, Login, and Me
 *
 * Controllers contain the actual business logic.
 * They are called by the router after middleware has run.
 *
 * Pattern: receive validated input → interact with DB → send response
 */

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError      = require('../utils/AppError');
const asyncHandler  = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// ── Helper: send token response ───────────────────────────────────────────────
// Centralizing this avoids repeating token generation in register and login.
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user);

  sendSuccess(res, statusCode, 'Success', {
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

// ── POST /api/auth/register ────────────────────────────────────────────────────
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if email is already taken
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email is already registered', 400));
  }

  // Create the user — password gets hashed by the pre-save hook in User.js
  const user = await User.create({ name, email, password, role });

  // 201 Created — a new resource was made
  sendTokenResponse(user, 201, res);
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user AND include password field (it's excluded by default via select:false)
  const user = await User.findOne({ email }).select('+password');

  // IMPORTANT: Check both user existence and password in ONE step.
  // Checking separately (user not found vs wrong password) leaks information
  // to attackers about which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  sendTokenResponse(user, 200, res);
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// @access  Private (requires protect middleware)
// Returns the currently logged-in user's profile.
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware — no DB call needed
  // (protect already fetched the user from DB)
  sendSuccess(res, 200, 'User profile fetched', req.user);
});

module.exports = { register, login, getMe };
