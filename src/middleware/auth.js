/**
 * src/middleware/auth.js — Authentication & Authorization middleware
 *
 * Two middleware functions exported:
 *
 *  1. protect      → verifies the JWT and attaches req.user
 *  2. authorize()  → checks req.user.role against allowed roles
 *
 * Usage in a route file:
 *   const { protect, authorize } = require('../middleware/auth');
 *
 *   router.get('/admin-only', protect, authorize('admin'), handler);
 *   router.get('/any-user',   protect, handler);
 */

const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');

// ── 1. protect ────────────────────────────────────────────────────────────────
// Extracts the JWT from the Authorization header, verifies it,
// then fetches the user from the DB and attaches them to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Standard format: "Authorization: Bearer eyJhbGci..."
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]; // grab the token part
  }

  // No token found — user is not logged in
  if (!token) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }

  // Verify the token (throws if expired or tampered with —
  // our global error handler converts those into clean 401 responses)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch the user fresh from DB each request.
  // WHY? The token could be valid but the account might have been deleted.
  // We also use `select('+password')` is NOT needed here — just the user doc.
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Attach user to the request — all downstream middleware can read it
  req.user = currentUser;
  next();
});

// ── 2. authorize ──────────────────────────────────────────────────────────────
// A factory function that returns a middleware.
// It MUST come after protect (so req.user is set).
//
// Usage: authorize('admin')           — admin only
//        authorize('admin','student') — either role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
          403 // 403 Forbidden (you're logged in but don't have permission)
        )
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
