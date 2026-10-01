/**
 * src/utils/AppError.js — Custom error class.
 *
 * WHY a custom error class?
 * JavaScript's built-in Error has no statusCode. By extending it, we can
 * throw errors like: throw new AppError('Not found', 404)
 * and our global error handler will automatically pick up the status code.
 */

class AppError extends Error {
  /**
   * @param {string} message    - Error message shown to the client
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404)
   */
  constructor(message, statusCode) {
    super(message);          // Call Error's constructor with the message
    this.statusCode = statusCode;
    this.isOperational = true; // Marks this as a "known" error (not a bug)

    // Captures where the error was thrown, excluding the constructor itself
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
