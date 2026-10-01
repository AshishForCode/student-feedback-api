/**
 * src/models/User.js — User schema (Student & Admin)
 *
 * Stores both students and admins in one collection.
 * The `role` field determines what each user can do.
 * Passwords are NEVER stored as plain text — we hash them
 * in the pre-save hook below using bcryptjs.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,                          // removes leading/trailing spaces
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,                        // enforces uniqueness at DB level
      lowercase: true,                     // always store emails in lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // `select: false` means this field is EXCLUDED from query results by default.
      // You must explicitly ask for it: User.findOne().select('+password')
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      default: 'student',
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,

    // Controls what the document looks like when converted to JSON
    // (e.g., res.json(user) calls toJSON internally)
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password; // extra safety — never leak password in responses
        delete ret.__v;      // Mongoose internal version key — not useful to clients
        return ret;
      },
    },
  }
);

// ── Pre-save Hook: Hash password ──────────────────────────────────────────────
// This runs BEFORE every .save() call.
// `isModified('password')` ensures we only re-hash when the password changes,
// not on every profile update (e.g., changing name).
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // bcrypt cost factor of 12 means 2^12 = 4096 hashing rounds.
  // Higher = more secure but slower. 10-12 is the sweet spot for production.
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance Method: Compare passwords ────────────────────────────────────────
// Added to the schema so every User document has this method available.
// Usage: const isMatch = await user.comparePassword(candidatePassword);
userSchema.methods.comparePassword = async function (candidatePassword) {
  // `this.password` is available here even though select:false, because
  // we explicitly selected it in the login controller.
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
