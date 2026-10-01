/**
 * src/middleware/errorHandler.js — Global error handling middleware
 *
 * This is the LAST middleware registered in app.js.
 * Any error passed to next(err) anywhere in the app lands here.
 *
 * We handle two categories:
 *  1. Operational errors  — predictable, have a user-friendly message (AppError)
 *  2. Programmer errors   — unexpected bugs (we log them + send generic 500)
 */

const AppError = require('../utils/AppError');

// ── Specific error converters ──────────────────────────────────────────────────
// Each function takes the raw error and returns an AppError with a clean message.

/**
 * Mongoose bad ObjectId: GET /api/courses/not-valid-id
 * Mongoose throws CastError when it can't cast a string to ObjectId.
 */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: "${err.value}". Please provide a valid ID.`, 404);

/**
 * Mongoose duplicate key: POST /api/courses with a code that already exists.
 * err.keyValue = { code: 'CS101' }
 */
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `Duplicate value "${value}" for field "${field}". Please use a different value.`,
    400
  );
};

/**
 * Mongoose schema validation: required field missing, enum mismatch, etc.
 * err.errors = { rating: ValidatorError, comment: ValidatorError }
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

/**
 * JWT tampered or malformed token.
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

/**
 * JWT valid but expired.
 */
const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

/**
 * Body-parser SyntaxError: client sent malformed JSON like {"name":}
 */
const handleSyntaxError = () =>
  new AppError('Invalid JSON in request body. Please check your request format.', 400);

// ── Main error handler ────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars

  // Start with the raw error, then replace with a clean AppError if we recognise the type
  let error = err;

  // Log every error in development — crucial for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
  }

  // ── Convert known error types to AppErrors ─────────────────────────────────
  if (err.name === 'CastError')          error = handleCastError(err);
  if (err.code === 11000)                error = handleDuplicateKey(err);
  if (err.name === 'ValidationError')    error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError')  error = handleJWTError();
  if (err.name === 'TokenExpiredError')  error = handleJWTExpiredError();
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err)
                                         error = handleSyntaxError();

  // ── Operational errors: send clean user-facing message ────────────────────
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      // Stack traces only in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // ── Programmer/unknown errors: don't leak details to client ───────────────
  // Log the full error so we can fix it
  console.error('UNHANDLED ERROR 💥', err);

  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    // Only expose in dev for debugging
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
