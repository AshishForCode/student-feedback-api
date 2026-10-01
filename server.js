/**
 * server.js — The entry point of the application.
 *
 * WHY a separate file from app.js?
 * app.js exports the configured Express app so that our tests (Supertest)
 * can import it WITHOUT actually starting a listening server.
 * This file is the only place we call app.listen().
 */

// Load environment variables FIRST — before importing anything else,
// so that all modules can safely read from process.env.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the server only on success.
// This prevents the API from accepting requests before the DB is ready.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((err) => {
    // If the DB connection fails, log the error and exit gracefully.
    console.error('❌ Failed to connect to database. Server not started.', err.message);
    process.exit(1); // Exit with a failure code (non-zero)
  });

// Handle unhandled promise rejections that bubble up anywhere in the app.
// Without this, Node would just print a warning and continue — dangerous in production.
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err.message);
  process.exit(1);
});
