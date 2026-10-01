/**
 * src/middleware/asyncHandler.js — Wraps async route handlers.
 *
 * WHY do we need this?
 * If an async function throws (or a rejected Promise goes unhandled),
 * Express won't catch it automatically — your server will crash with an
 * UnhandledPromiseRejection. This wrapper catches all errors and passes
 * them to next(), which routes them to our global error handler.
 *
 * USAGE:
 *   router.get('/something', asyncHandler(async (req, res) => {
 *     const data = await SomeModel.find(); // if this throws, it's caught!
 *     res.json(data);
 *   }));
 *
 * WITHOUT this wrapper you'd need try/catch in every single controller.
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
