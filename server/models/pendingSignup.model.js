const mongoose = require('mongoose');

// PendingSignup stores temporary signup state before final account creation.
// This keeps partial signups out of the main User collection.
const pendingSignupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },

    // OTP fields for signup email verification.
    signupOtpHash: {
      type: String,
      select: false,
      default: null,
    },

    signupOtpExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },

    signupOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    signupOtpResendAvailableAt: {
      type: Date,
      default: null,
      select: false,
    },

    isOtpVerified: {
      type: Boolean,
      default: false,
    },

    // Auto-cleanup: pending signup is deleted after 24 hours.
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('PendingSignup', pendingSignupSchema);
