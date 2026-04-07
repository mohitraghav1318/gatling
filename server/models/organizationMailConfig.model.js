const mongoose = require('mongoose');

// OrganizationMailConfig stores SMTP credentials at organization level.
// Members never need to know credentials; they only trigger send actions.
const organizationMailConfigSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },

    smtpHost: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    smtpPort: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
    },

    smtpSecure: {
      type: Boolean,
      required: true,
      default: true,
    },

    smtpUser: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    // Encrypted at application layer before write.
    smtpPassEncrypted: {
      type: String,
      required: true,
      select: false,
    },

    smtpFrom: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  'OrganizationMailConfig',
  organizationMailConfigSchema,
);
