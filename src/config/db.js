/**
 * src/config/db.js — MongoDB connection using Mongoose.
 *
 * WHY a separate file?
 * Centralizing the connection lets us easily swap databases (e.g., use a test
 * DB in tests) and handle retries or errors in one place.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  // Mongoose 6+ no longer needs useNewUrlParser / useUnifiedTopology — they're
  // now defaults. Keep your version in mind when reading older tutorials.
  const conn = await mongoose.connect(process.env.MONGO_URI);

  console.log(`✅ MongoDB connected: ${conn.connection.host}`);

  // Listen for connection events AFTER the initial connect.
  // These fire if the DB drops mid-runtime (e.g., network glitch).
  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
};

module.exports = connectDB;
