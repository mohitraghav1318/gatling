const mongoose = require('mongoose');

// User schema covers profile data and authentication state.
// Note: organization-level roles should live in an organization membership model,
// not as a single global role on the user document.
const userSchema = new mongoose.Schema(
  {
    // Basic profile information.
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    // Login identifier. Stored normalized to avoid case/space duplicates.
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },

    // Public identity route key used for /dashboard/u/:username.
    // Kept optional at schema level to support existing users and backfill flow.
    username: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]{3,30}$/, 'Invalid username format'],
      default: null,
    },

    usernameUpdatedAt: {
      type: Date,
      default: null,
    },

    // Profile fields used by dashboard and account pages.
    bio: {
      type: String,
      trim: true,
      maxlength: 280,
      default: '',
    },

    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    // Authentication secret. Hidden by default in query results.
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // Email verification status. Gate sensitive actions until verified.
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Login OTP fields.
    // These are only used when user chooses OTP-based login.
    loginOtpHash: {
      type: String,
      select: false,
      default: null,
    },

    loginOtpExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },

    loginOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    loginOtpResendAvailableAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    // createdAt and updatedAt are managed automatically by Mongoose.
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);
