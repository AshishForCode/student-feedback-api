/**
 * src/utils/apiResponse.js — Consistent JSON response helpers.
 *
 * WHY standardize responses?
 * Every endpoint returns the same shape: { success, message, data }.
 * This makes your front-end code simpler and your API predictable.
 * Without this, different endpoints might return wildly different formats.
 */

/**
 * Send a success response.
 * @param {object} res     - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Human-readable success message
 * @param {*}      data    - The payload to return (object, array, etc.)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = { success: true, message };
  // Only include 'data' key if there's actually data to send
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {object} res     - Express response object
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {string} message - Human-readable error message
 * @param {*}      errors  - Validation errors or additional details
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = { success: false, message };
  if (errors !== null && errors !== undefined) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
