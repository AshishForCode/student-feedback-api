/**
 * src/utils/generateToken.js — JWT creation helper
 *
 * Keeps all JWT logic in one place. If you ever need to change
 * the signing algorithm or add claims, you only edit this file.
 */

const jwt = require('jsonwebtoken');

/**
 * Signs and returns a JWT containing the user's id and role.
 * @param {object} user - Mongoose User document
 * @returns {string}    - Signed JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    // Payload — data embedded in the token (keep it small!)
    { id: user._id, role: user.role },

    // Secret — used to sign + verify the token (from .env)
    process.env.JWT_SECRET,

    // Options
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
