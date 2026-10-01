/**
 * app.js — Express application configuration.
 *
 * This file wires together all middleware and routes.
 * It does NOT start the server (that's server.js's job).
 * Keeping it separate lets tests import the app cleanly.
 */

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./src/config/swagger');
const errorHandler   = require('./src/middleware/errorHandler');

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────────
// helmet() sets ~15 HTTP headers to protect against common attacks
// (XSS, clickjacking, sniffing, etc.). Always add this early.
app.use(helmet());

// cors() allows your front-end (running on a different port/domain) to call this API.
// In production, replace the origin with your actual front-end URL.
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// ── Body Parsers ───────────────────────────────────────────────────────────────
// Parses incoming requests with JSON bodies (e.g., { "email": "a@b.com" })
app.use(express.json());
// Parses URL-encoded form data (e.g., from HTML forms)
app.use(express.urlencoded({ extended: true }));

// ── Malformed JSON interceptor ─────────────────────────────────────────────────
// When express.json() receives invalid JSON (e.g. {"name":} ), it calls next(err)
// with a SyntaxError. This middleware catches ONLY that specific error and
// forwards it to our global error handler. Other errors pass through via next(err).
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return next(err); // Let errorHandler.js format the response
  }
  next(err);
});

// ── Health Check ───────────────────────────────────────────────────────────────
// A simple route to verify the API is alive — useful for deployment checks.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Student Feedback API is running' });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./src/routes/authRoutes'));
app.use('/api/courses',  require('./src/routes/courseRoutes'));
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));

// ── Swagger UI ─────────────────────────────────────────────────────────────────
// Available at http://localhost:5000/api/docs
// We skip it in test mode — it's not needed and adds noise.
if (process.env.NODE_ENV !== 'test') {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Feedback API Docs',
      swaggerOptions: {
        persistAuthorization: true, // keeps your token after page refresh
      },
    })
  );
  // Also expose the raw JSON spec for tools like Postman import
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// ── 404 Handler ───────────────────────────────────────────────────────────────
// If a request reaches here, no route matched — send a clean 404.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
// MUST be last. Errors thrown with next(err) anywhere in the app land here.
app.use(errorHandler);

module.exports = app;
